#!/bin/sh
# Build and start the development LDAP server on 127.0.0.1:3890.
# Stop it with: podman stop visitors-dev-ldap
set -e
cd "$(dirname "$0")"
engine=$(command -v podman || command -v docker)
"$engine" build --quiet --tag visitors-dev-ldap . >/dev/null
"$engine" rm --force visitors-dev-ldap >/dev/null 2>&1 || true
"$engine" run --rm --detach --name visitors-dev-ldap \
    --publish 127.0.0.1:3890:3890 visitors-dev-ldap >/dev/null
echo "LDAP server listening on 127.0.0.1:3890"
