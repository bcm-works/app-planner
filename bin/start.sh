#!/usr/bin/env bash
#
#
# Start the server
#
#

REPO="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO"

echo "Starting the database"
docker compose up -d db

echo "API - Install"
cd "$REPO/src/api"
go mod tidy

echo "API - Start"
go run .

echo "App - Install and build"
cd "$REPO"
deno task install

# TODO: fix the app build command

deno task build

# TODO: update the app start command

echo "App - Start"
echo 'ERROR not implemented'
