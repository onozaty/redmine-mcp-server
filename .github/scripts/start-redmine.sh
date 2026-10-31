#!/usr/bin/env bash
# Start a disposable Redmine for the integration tests and print the admin API key.
set -euo pipefail

REDMINE_IMAGE="${REDMINE_IMAGE:-redmine:7.0}"
POSTGRES_IMAGE="${POSTGRES_IMAGE:-postgres:18}"
REDMINE_PORT="${REDMINE_PORT:-3000}"
NETWORK=redmine-test
DB_CONTAINER=redmine-test-db
REDMINE_CONTAINER=redmine-test

docker network create "$NETWORK" >/dev/null

docker run -d --quiet --name "$DB_CONTAINER" --network "$NETWORK" \
  -e POSTGRES_PASSWORD=test -e POSTGRES_DB=redmine \
  "$POSTGRES_IMAGE" >/dev/null

# The image's init step runs a temporary server on the Unix socket only,
# so waiting on TCP avoids starting Redmine before the real server is up
for _ in $(seq 1 60); do
  docker exec "$DB_CONTAINER" pg_isready -h 127.0.0.1 -U postgres >/dev/null 2>&1 && break
  sleep 1
done

docker run -d --quiet --name "$REDMINE_CONTAINER" --network "$NETWORK" -p "$REDMINE_PORT:3000" \
  -e REDMINE_DB_POSTGRES="$DB_CONTAINER" -e REDMINE_DB_PASSWORD=test \
  -e REDMINE_SECRET_KEY_BASE=test-secret-key-base \
  -e SECRET_KEY_BASE=test-secret-key-base \
  "$REDMINE_IMAGE" >/dev/null

# Redmine runs the database migrations before it starts serving
ready=false
for _ in $(seq 1 60); do
  if curl -sf -o /dev/null "http://localhost:$REDMINE_PORT/"; then
    ready=true
    break
  fi
  sleep 5
done
if [ "$ready" != true ]; then
  echo "Redmine did not start" >&2
  docker logs "$REDMINE_CONTAINER" >&2
  exit 1
fi

# SECRET_KEY_BASE above lets these commands run outside the image entrypoint.
# Trackers, statuses and priorities are needed to create issues
docker exec -e REDMINE_LANG=en "$REDMINE_CONTAINER" bin/rake redmine:load_default_data >/dev/null

docker exec "$REDMINE_CONTAINER" bin/rails runner '
  Setting.rest_api_enabled = "1"
  admin = User.find_by_login("admin")
  admin.update!(must_change_passwd: false)
  puts admin.api_key
' | tail -n 1
