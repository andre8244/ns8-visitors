# ns8-visitors

Visitor register for [NethServer 8](https://github.com/NethServer/ns8-core),
used on a tablet at the office entrance.

- **tablet**: the visitor reads the privacy notice, enters name, surname and
  company and signs with a finger. Guests of an event, prepared in advance,
  search their name and sign. The tablet is paired by an admin and can only
  register check-ins and check-outs.
- **admin**: members of an LDAP group manage events and guest lists, the
  privacy notice versions, the paired tablets and the register.

Data older than the retention period (12 months by default) is deleted
automatically. Every admin action is recorded in an audit log.

## Tablet setup

1. In the admin pages, open Tablets and add the tablet: a pairing code
   appears, valid for 10 minutes.
2. On the tablet, open `https://<host>/kiosk/pair` and enter the code.
3. Lock the browser on the page with the kiosk mode of the tablet
   (Guided Access on iPad, screen pinning on Android).

The tablet stays paired until an admin revokes it. After a minute without
touches it goes back to its home page.

## Repository layout

- `webapp/`: the web application, built with Nuxt, pnpm, Drizzle ORM on
  SQLite, Tailwind CSS and `@nethesis/vue-components`. See `webapp/Containerfile`.
- `imageroot/`: NS8 module actions, systemd unit and helper scripts.
- `ui/`: the module settings page shown in the NS8 cluster-admin UI.
- `build-images.sh`: builds both the module image and the
  `visitors-app` image.

## Install

Instantiate the module with:

    add-module ghcr.io/nethserver/visitors:latest 1

The output of the command will return the instance name.
Output example:

    {"module_id": "visitors1", "image_name": "visitors", "image_url": "ghcr.io/nethserver/visitors:latest"}

## Configure

Let's assume that the visitors instance is named `visitors1`.

Launch `configure-module`, by setting the following parameters:
- `host`: virtual host name of the web application
- `ldap_domain`: user domain used to authenticate admins; it must exist in
  the cluster
- `admin_group`: members of this LDAP group get the admin view
- `ip_allowlist`: optional list of IP addresses or CIDR networks allowed
  to reach the web application; empty means no restriction
- `http2https`, `lets_encrypt`: optional Traefik route settings

Example:

    api-cli run module/visitors1/configure-module --data '{
      "host": "visitors.example.org",
      "http2https": true,
      "lets_encrypt": false,
      "ldap_domain": "ad.example.org",
      "admin_group": "visitors-admin",
      "ip_allowlist": ["192.168.1.0/24"]
    }'

The above command will:
- bind the module to the user domain
- configure the Traefik route, with the optional IP allowlist
- start the web application

## Backup

Before each backup `bin/module-dump-state` writes a consistent copy of the
SQLite database to `state/visitors-dump.sqlite`. The restore procedure
copies it back into the `visitors-data` volume.

## Application development

Requirements: Node.js 26 (see `webapp/.nvmrc`, e.g. `nvm use` or `fnm use`)
and pnpm. Node.js 26 does not ship Corepack, so install pnpm once with npm:

    npm install -g pnpm

Any recent pnpm works: inside `webapp/` it switches automatically to the
version pinned in the `packageManager` field of `package.json`.

    cd webapp
    cp .env.example .env
    pnpm install
    pnpm dev:ldap           # test LDAP server, needs Podman or Docker
    pnpm dev

Open http://localhost:3000 and sign in as `reception`, password
`visitors`: a member of the `visitors-admin` group. The user `guest`, same
password, is not an admin and cannot sign in. Users and group are in
`webapp/dev/ldap/seed.ldif`; stop the server with `podman stop
visitors-dev-ldap`, and restart it with `pnpm dev:ldap` to reset the
data. To try the tablet pages from a tablet in the same network, start
the application with `pnpm dev --host` and open
`http://<computer address>:3000/kiosk`.

To try the pages with some data, fill the development database with
`pnpm dev:seed`: visits of the last three months, some still in the
office, a course in progress, past and upcoming events, tablets and two
versions of the privacy notice. Names and companies are made up. The
script refuses a database that already has visits: to start again, stop
`pnpm dev`, delete `webapp/.data/visitors.sqlite` and run it again. Pair
your tablet as usual: the seeded tablets are only listed.

Checks, all run by the "Test app" GitHub workflow:

    pnpm typecheck
    pnpm test             # unit tests
    pnpm build
    pnpm test:api         # API tests, on the built server

The API tests start `.output/server/index.mjs` on a temporary database,
sign in as an admin with a session cookie sealed by the test, and pair
tablets through the API. LDAP is not involved: the module tests on NS8
cover the LDAP login.

After changing `webapp/server/database/schema.ts`, generate a migration with
`pnpm db:generate`. Migrations run when the application starts.

## Uninstall

To uninstall the instance:

    remove-module --no-preserve visitors1

## Running tests locally

This module uses the NS8 standard testing infrastructure. For instructions on how to run the test suite locally, refer to the [Running tests locally](https://github.com/NethServer/ns8-github-actions/blob/v1/README.md#running-tests-locally) section of the ns8-github-actions README.

## UI translation

Translated with [Weblate](https://hosted.weblate.org/projects/ns8/).

To setup the translation process:

- add [GitHub Weblate app](https://docs.weblate.org/en/latest/admin/code-hosting.html#code-hosting-github-notifications) to your repository
- add your repository to [hosted.weblate.org](https://hosted.weblate.org) or ask a NethServer developer to add it to ns8 Weblate project
