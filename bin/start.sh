#!/usr/bin/env bash
#
#
# Start the server
#
#

REPO="$(cd "$(dirname "$0")/.." && pwd)"

cd "$REPO"

echo "Run - Setup"
deno task setup

echo "Database - Start"
docker compose down || true > /dev/null 2>&1
docker compose up \
	--pull always \
	--quiet-pull \
	--build \
	--yes \
	--detach

cd "$REPO/src/api"

echo "API - Start"
go run .

# TODO: update the app start command
# TODO: fix the app build command

echo "App - Start"
# cd "$REPO"
# deno task build
echo 'ERROR not implemented'
