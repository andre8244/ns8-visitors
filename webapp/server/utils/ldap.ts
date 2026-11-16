import { AndFilter, Client, EqualityFilter } from 'ldapts'

export interface LdapUser {
  username: string
  name: string
  isAdmin: boolean
}

// Bind with the NS8 Ldapproxy credentials, find the user, then verify the
// password with a second bind as that user. Returns null on bad credentials.
export async function ldapAuthenticate(username: string, password: string): Promise<LdapUser | null> {
  const { ldap, adminGroup } = useRuntimeConfig()
  const url = `ldap://${ldap.host}:${ldap.port}`
  const isAd = ldap.schema === 'ad'
  const client = new Client({ url })

  try {
    await client.bind(ldap.bindDn, ldap.bindPassword)
    const { searchEntries } = await client.search(ldap.baseDn, {
      scope: 'sub',
      filter: new AndFilter({
        filters: [
          new EqualityFilter({ attribute: 'objectClass', value: isAd ? 'user' : 'posixAccount' }),
          new EqualityFilter({ attribute: isAd ? 'sAMAccountName' : 'uid', value: username })
        ]
      }),
      attributes: ['displayName', 'cn', 'memberOf']
    })
    const entry = searchEntries[0]
    if (searchEntries.length !== 1 || !entry) {
      return null
    }

    const userClient = new Client({ url })
    try {
      await userClient.bind(entry.dn, password)
    } catch {
      return null
    } finally {
      await userClient.unbind()
    }

    let isAdmin: boolean
    if (isAd) {
      const prefix = `cn=${adminGroup.toLowerCase()},`
      isAdmin = [entry.memberOf ?? []]
        .flat()
        .some((dn) => String(dn).toLowerCase().startsWith(prefix))
    } else {
      const groups = await client.search(ldap.baseDn, {
        scope: 'sub',
        filter: new AndFilter({
          filters: [
            new EqualityFilter({ attribute: 'objectClass', value: 'posixGroup' }),
            new EqualityFilter({ attribute: 'cn', value: adminGroup }),
            new EqualityFilter({ attribute: 'memberUid', value: username })
          ]
        }),
        attributes: ['cn']
      })
      isAdmin = groups.searchEntries.length > 0
    }

    return { username, name: String(entry.displayName || entry.cn || username), isAdmin }
  } finally {
    await client.unbind()
  }
}
