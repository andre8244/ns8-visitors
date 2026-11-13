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

## Repository layout

- `app/`: the web application, built with Nuxt, pnpm, Drizzle ORM on
  SQLite, Tailwind CSS and `@nethesis/vue-components`. See `app/Containerfile`.
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
- `ldap_domain`: user domain used to authenticate admins
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

Requirements: Node.js 26 (see `app/.nvmrc`, e.g. `nvm use` or `fnm use`)
and pnpm. Node.js 26 does not ship Corepack, so install pnpm once with npm:

    npm install -g pnpm

Any recent pnpm works: inside `app/` it switches automatically to the
version pinned in the `packageManager` field of `package.json`.

    cd app
    cp .env.example .env    # adjust LDAP settings
    pnpm install
    pnpm dev

Run the unit tests with `pnpm test` and the type check with `pnpm
typecheck`.

After changing `app/server/database/schema.ts`, generate a migration with
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
