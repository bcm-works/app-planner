#!/usr/bin/env bash
#
#
# Run tests
#
#

REPO="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO"

bash "$REPO/bin/setup.sh"

echo "Starting the database"
docker compose up -d db

# TODO: update the API test command

echo "Running API tests"
echo 'ERROR not implemented'

echo "Running App checks"
deno task check

echo "Running App tests"
deno test --quiet --allow-all --unstable-kv --clean --coverage=coverage --coverage-threshold=85 src
