#!/usr/bin/env bash
#
#
# Run tests
#
#

REPO="$(cd "$(dirname "$0")/.." && pwd)"

source "$REPO/.env"

echo "Database - Start"
deno task start-db

echo "API - Test"
cd "$REPO/src/api"
TEST_APP_DB_URL="$TEST_APP_DB_URL" \
	GOCACHE="$REPO/data/gocache" \
	go test ./...

echo "App - Check"
cd "$REPO"
deno lint
deno fmt
deno check

echo "App - Test"
deno test --quiet --allow-all \
	--no-check --clean \
	--coverage=coverage --coverage-threshold=85 \
	src
