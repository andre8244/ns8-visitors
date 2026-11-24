import { AndFilter, Client, EqualityFilter, type Entry } from 'ldapts'

export interface LdapUser {
  username: string
  name: string
  isAdmin: boolean
}

// AD userAccountControl flag of a disabled account
const ACCOUNT_DISABLED = 0x2

// A server that does not answer must not hold the requests forever
function newClient() {
  const { ldap } = useRuntimeConfig()
  return new Client({ url: `ldap://${ldap.host}:${ldap.port}`, connectTimeout: 5_000, timeout: 10_000 })
}

// Bind with the NS8 Ldapproxy credentials, find the user, then verify the
// password with a second bind as that user. Returns null on bad credentials.
export async function ldapAuthenticate(username: string, password: string): Promise<LdapUser | null> {
  const client = newClient()
  try {
    const entry = await findUser(client, username)
    if (!entry) {
      return null
    }

    const userClient = newClient()
    try {
      await userClient.bind(entry.dn, password)
    } catch {
      return null
    } finally {
      await userClient.unbind()
    }

    return { username, name: String(entry.displayName || entry.cn || username), isAdmin: await isAdmin(client, entry, username) }
  } finally {
    await client.unbind()
  }
}

// Whether the user still exists, is enabled and belongs to the admin group:
// checked again while a session lasts. Throws when LDAP is unavailable
export async function ldapIsAdmin(username: string): Promise<boolean> {
  const client = newClient()
  try {
    const entry = await findUser(client, username)
    if (!entry || Number(entry.userAccountControl ?? 0) & ACCOUNT_DISABLED) {
      return false
    }
    return await isAdmin(client, entry, username)
  } finally {
    await client.unbind()
  }
}

// Binds the client with the Ldapproxy credentials. Null unless exactly one
// user has the name
async function findUser(client: Client, username: string): Promise<Entry | null> {
  const { ldap } = useRuntimeConfig()
  const isAd = ldap.schema === 'ad'
  await client.bind(ldap.bindDn, ldap.bindPassword)
  const { searchEntries } = await client.search(ldap.baseDn, {
    scope: 'sub',
    filter: new AndFilter({
      filters: [
        new EqualityFilter({ attribute: 'objectClass', value: isAd ? 'user' : 'posixAccount' }),
        new EqualityFilter({ attribute: isAd ? 'sAMAccountName' : 'uid', value: username })
      ]
    }),
    attributes: ['displayName', 'cn', 'memberOf', ...(isAd ? ['userAccountControl'] : [])]
  })
  return searchEntries.length === 1 ? (searchEntries[0] ?? null) : null
}

async function isAdmin(client: Client, entry: Entry, username: string) {
  const { ldap, adminGroup } = useRuntimeConfig()
  if (ldap.schema === 'ad') {
    const prefix = `cn=${adminGroup.toLowerCase()},`
    return [entry.memberOf ?? []]
      .flat()
      .some((dn) => String(dn).toLowerCase().startsWith(prefix))
  }
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
  return groups.searchEntries.length > 0
}
