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

*** Keywords ***
Login to cluster-admin
    New Page    https://${NODE_ADDR}/cluster-admin/
    Fill Text    text="Username"    ${ADMIN_USER}
    Click    button >> text="Continue"
    Fill Text    text="Password"    ${ADMIN_PASSWORD}
    Click    button >> text="Log in"
    Wait For Elements State    css=#main-content    visible    timeout=10s

Sign in to the app
    [Arguments]    ${user}    ${expected_status}
    ${status} =    Execute Command    curl -s -o /dev/null -w '\%{http_code}' -H 'Host: ${host}' -H 'Content-Type: application/json' -d '{"username":"${user}","password":"${user_password}"}' http://127.0.0.1/api/auth/login
    Should Be Equal As Strings    ${status}    ${expected_status}

The login page answers
    ${rc} =    Execute Command    curl -f -H 'Host: ${host}' http://127.0.0.1/login
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
    Run task    module/${module_id}/configure-module    {"host":"${host}","http2https":false,"lets_encrypt":false,"ldap_domain":"${user_domain}","admin_group":"visitors-admin"}
    ...    decode_json=${FALSE}

Check if visitors works as expected
    # The application needs a few seconds to start after configure-module
    Wait Until Keyword Succeeds    60s    3s    The login page answers

Check if admins can sign in
    Sign in to the app    reception    200

Check if users outside the admin group cannot sign in
    Sign in to the app    guest    403

Check if visitors is removed correctly
    ${rc} =    Execute Command    remove-module --no-preserve ${module_id}
    ...    return_rc=True  return_stdout=False
    Should Be Equal As Integers    ${rc}  0
