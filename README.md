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

## Architecture

```text
  Tablet (kiosk)                       Admin PC
  /kiosk/*  1-year session             /admin/*  LDAP, 14-day session
       │                                   │
       └──────────── HTTPS ────────────────┘
                       │
┌──────────────────────┼─────────────────────────── NS8 node ─────────┐
│                      ▼                                              │
│  ┌──────────────────────────────────────┐                           │
│  │ Traefik                              │  route: host, HTTPS,      │
│  │  IP allowlist (LAN and VPN)          │  Let's Encrypt            │
│  └──────────────────┬───────────────────┘                           │
│                     │ 127.0.0.1:TCP_PORT                            │
│  ┌──────────────────┼───────── visitors.service (podman, node) ──┐  │
│  │                  ▼                                            │  │
│  │  ┌────────────────────────────────────────────────────────┐   │  │
│  │  │ Nuxt 4                                                 │   │  │
│  │  │  ┌──────────────────────┐   ┌───────────────────────┐  │   │  │
│  │  │  │ Frontend SPA         │   │ Nitro backend         │  │   │  │
│  │  │  │ Vue 3, Tailwind 4    │──▶│ /api/admin/*          │  │   │  │
│  │  │  │ vue-components       │   │   requireAdmin        │  │   │  │
│  │  │  │ vue-i18n (it, en)    │   │ /api/kiosk/*          │  │   │  │
│  │  │  └──────────────────────┘   │   requireKiosk        │  │   │  │
│  │  │                             │ zod, rate limits, CSP │  │   │  │
│  │  │                             │ sealed cookies        │  │   │  │
│  │  │                             │ job every 15 minutes  │  │   │  │
│  │  │                             └───┬────────────┬──────┘  │   │  │
│  │  └─────────────────────────────────┼────────────┼─────────┘   │  │
│  │                                    │ Drizzle    │ ldapts      │  │
│  │                                    ▼            │             │  │
│  │  ┌───────────────── visitors-data volume ──┐    │             │  │
│  │  │ SQLite (WAL, secure_delete)             │    │             │  │
│  │  │ setting  notice_version  device         │    │             │  │
│  │  │ event  event_guest  visit (PNG sign.)   │    │             │  │
│  │  │ audit_log                               │    │             │  │
│  │  └──────────────────┬──────────────────────┘    │             │  │
│  └─────────────────────┼───────────────────────────┼─────────────┘  │
│                        │ VACUUM INTO               │ accountprovider│
│                        ▼                           ▼ (10.0.2.2)     │
│  ┌────────────────────────────┐   ┌───────────────────────────────┐ │
│  │ state/visitors-dump.sqlite │   │ LDAP user domain              │ │
│  │ restic backup (encrypted)  │   │ (found through Ldapproxy)     │ │
│  └────────────────────────────┘   └───────────────────────────────┘ │
│                                                                     │
│  Module actions (imageroot/), Vue 2 + Carbon UI (ui/):              │
│   create-module     session secret in passwords.env                 │
│   configure-module  LDAP domain, Traefik route, service start       │
│   discover-ldap     LDAP parameters before every start              │
│   restore-module    database restore and configuration              │
└─────────────────────────────────────────────────────────────────────┘
```

- **NS8 module** (`imageroot/`, `ui/`): Python and bash actions configure
  the Traefik route (host, HTTPS, optional IP allowlist), bind the module
  to the LDAP user domain and handle backup and restore. The settings page
  is built with Vue 2 and Carbon, as in the other NS8 modules.
- **Application container** (`webapp/`): one Nuxt 4 application on a
  pinned Node.js Alpine image, running as the `node` user under a systemd
  unit.
  - Frontend: a Vue 3 single-page application (no server-side rendering)
    with Tailwind CSS and `@nethesis/vue-components`, the components of the
    Nebula Design System.
  - Backend: the Nitro server of Nuxt, a REST API in TypeScript with input
    validated by `zod`.
- **Data**: SQLite through better-sqlite3 and Drizzle ORM, migrated at
  startup. Signatures are PNG images stored in the database. A job every
  15 minutes closes the visits still open after the automatic check-out
  time and deletes the data older than the retention period.
- **Access**:
  - Admins sign in against LDAP (`ldapts`) and must belong to the admin
    group. The session lasts 14 days.
  - A tablet is paired with a single-use code and can call only the tablet
    API. The pairing lasts until an admin revokes the tablet.
  - Both sessions are sealed cookies of `nuxt-auth-utils`. Logins and
    tablet searches are rate limited, the responses carry security headers
    with a Content Security Policy, and the audit log records changes,
    exports and viewed signatures.
- **Tests and CI**: unit tests and API tests on the built server with
  Vitest, module tests on NS8 with Robot Framework. GitHub Actions run the
  tests and publish both images to ghcr.io.

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
