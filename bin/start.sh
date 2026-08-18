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
deno task start-db

cd "$REPO/src/api"

echo "API - Start"
go run .

# TODO: update the app start command
# TODO: fix the app build command

echo "App - Start"
# cd "$REPO"
# deno task build
echo 'ERROR not implemented'
