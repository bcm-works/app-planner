#!/usr/bin/env bash
#
#
# Run tests
#
#

REPO="$(cd "$(dirname "$0")/.." && pwd)"

bash "$REPO/bin/setup.sh"

source "$REPO/.env"

echo "Starting the database"
cd "$REPO"
docker compose up -d db

# TODO: update the API test command

echo "Running API tests"
cd "$REPO/src/api"
TEST_APP_DB_URL=postgres://****:****@localhost:5432/planner \
	GOCACHE="$REPO/data/gocache" \
	go test ./...

echo "Running App checks"
cd "$REPO"
deno task check

echo "Running App tests"
deno test --quiet --allow-all --unstable-kv --clean --coverage=coverage --coverage-threshold=85 src
