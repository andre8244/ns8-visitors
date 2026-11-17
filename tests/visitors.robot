*** Settings ***
Library    SSHLibrary
Resource    api.resource

*** Variables ***
${ADMIN_USER}    admin
${ADMIN_PASSWORD}    Nethesis,1234
${module_id}    ${EMPTY}
${user_domain}    ldap.dom.test
${user_password}    Nethesis,1234
${host}    visitors.dom.test
${cookies}    /tmp/visitors-test.cookies

*** Keywords ***
Login to cluster-admin
    New Page    https://${NODE_ADDR}/cluster-admin/
    Fill Text    text="Username"    ${ADMIN_USER}
    Click    button >> text="Continue"
    Fill Text    text="Password"    ${ADMIN_PASSWORD}
    Click    button >> text="Log in"
    Wait For Elements State    css=#main-content    visible    timeout=10s

Sign in to the app
    [Arguments]    ${user}    ${expected_status}    ${password}=${user_password}
    ${status} =    Execute Command    curl -s -o /dev/null -w '\%{http_code}' -H 'Host: ${host}' -H 'Content-Type: application/json' -d '{"username":"${user}","password":"${password}"}' http://127.0.0.1/api/auth/login
    Should Be Equal As Strings    ${status}    ${expected_status}

The login page answers
    [Arguments]    ${expected_status}=200
    ${status} =    Execute Command    curl -s -o /dev/null -w '\%{http_code}' -H 'Host: ${host}' http://127.0.0.1/login
    Should Be Equal As Strings    ${status}    ${expected_status}

Configure the module
    [Arguments]    ${ip_allowlist}=[]
    Run task    module/${module_id}/configure-module    {"host":"${host}","http2https":false,"lets_encrypt":false,"ldap_domain":"${user_domain}","admin_group":"visitors-admin","ip_allowlist":${ip_allowlist}}
    ...    decode_json=${FALSE}

# The session cookie is Secure: these calls use HTTPS
Call the admin API
    [Arguments]    ${method}    ${path}    ${data}={}
    ${output} =    Execute Command    curl -sk -b ${cookies} -c ${cookies} --resolve ${host}:443:127.0.0.1 -X ${method} -H 'Content-Type: application/json' -d '${data}' https://${host}${path}
    RETURN    ${output}

Sign in as admin
    ${status} =    Execute Command    curl -sk -o /dev/null -w '\%{http_code}' -c ${cookies} --resolve ${host}:443:127.0.0.1 -H 'Content-Type: application/json' -d '{"username":"reception","password":"${user_password}"}' https://${host}/api/auth/login
    Should Be Equal As Strings    ${status}    200

Run in the module
    [Arguments]    ${command}
    ${rc} =    Execute Command    runagent -m ${module_id} sh -c '${command}'
    ...    return_rc=True  return_stdout=False
    Should Be Equal As Integers    ${rc}  0

*** Test Cases ***
Configure the LDAP user domain
    ${response} =    Run task    cluster/add-internal-provider    {"image":"openldap","node":1}
    Set Suite Variable    ${mid_ldap}    ${response['module_id']}
    Run task    module/${mid_ldap}/configure-module    {"domain":"${user_domain}","admuser":"admin","admpass":"${user_password}","provision":"new-domain"}
    Run task    module/${mid_ldap}/add-user    {"user":"reception","display_name":"Reception","password":"${user_password}"}
    Run task    module/${mid_ldap}/add-user    {"user":"guest","display_name":"Guest","password":"${user_password}"}
    Run task    module/${mid_ldap}/add-group    {"group":"visitors-admin","description":"Visitor register admins","users":["reception"]}

Check if visitors is installed correctly
    ${output}  ${rc} =    Execute Command    add-module ${IMAGE_URL} 1
    ...    return_rc=True
    Should Be Equal As Integers    ${rc}  0
    &{output} =    Evaluate    ${output}
    Set Global Variable    ${module_id}    ${output.module_id}

Take screenshots
    [Tags]    ui
    Import Library    Browser
    New Browser    chromium    headless=True
    New Context    ignoreHTTPSErrors=True
    Login to cluster-admin
    Go To    https://${NODE_ADDR}/cluster-admin/#/apps/${module_id}
    Wait For Elements State    iframe >>> h2 >> text="Status"    visible    timeout=10s
    Sleep    5s
    Take Screenshot    filename=${OUTPUT DIR}/browser/screenshot/1._Status.png
    Go To    https://${NODE_ADDR}/cluster-admin/#/apps/${module_id}?page=settings
    Wait For Elements State    iframe >>> h2 >> text="Settings"    visible    timeout=10s
    Sleep    5s
    Take Screenshot    filename=${OUTPUT DIR}/browser/screenshot/2._Settings.png
    Close Browser

Check if a missing user domain is rejected
    Run task    module/${module_id}/configure-module    {"host":"${host}","http2https":false,"lets_encrypt":false,"ldap_domain":"missing.dom.test","admin_group":"visitors-admin"}
    ...    rc_expected=3    decode_json=${FALSE}

Check if visitors can be configured
    Configure the module

Check if visitors works as expected
    # The application needs a few seconds to start after configure-module
    Wait Until Keyword Succeeds    60s    3s    The login page answers

Check if admins can sign in
    Sign in to the app    reception    200

Check if users outside the admin group cannot sign in
    Sign in to the app    guest    403

Check if the IP allowlist blocks the other networks
    Configure the module    ["192.0.2.0/24"]
    Wait Until Keyword Succeeds    60s    3s    The login page answers    403
    Configure the module    ["127.0.0.1"]
    Wait Until Keyword Succeeds    60s    3s    The login page answers

Check if the database is backed up and restored
    Sign in as admin
    Call the admin API    POST    /api/admin/notice    {"bodyMd":"Robot backup test"}
    # The backup runs module-dump-state in state/
    Run in the module    module-dump-state && test -s visitors-dump.sqlite
    # A restore-module starts with no data volume and the dump in state/
    Run in the module    systemctl --user stop visitors && podman volume rm visitors-data && "$AGENT_INSTALL_DIR/actions/restore-module/40restore_db" && test ! -e visitors-dump.sqlite && systemctl --user start visitors
    Wait Until Keyword Succeeds    60s    3s    The login page answers
    ${notices} =    Call the admin API    GET    /api/admin/notice
    Should Contain    ${notices}    Robot backup test

# Last before the removal: the failures block this address for 15 minutes
Check if repeated wrong passwords are blocked
    FOR    ${i}    IN RANGE    10
        Sign in to the app    guest    401    wrong-password
    END
    Sign in to the app    guest    429    wrong-password
    # Until the window ends, the right password too
    Sign in to the app    guest    429

Check if visitors is removed correctly
    ${rc} =    Execute Command    remove-module --no-preserve ${module_id}
    ...    return_rc=True  return_stdout=False
    Should Be Equal As Integers    ${rc}  0
