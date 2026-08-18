#!/usr/bin/env bash
#
#
# Initial setup
#
#

REPO="$(cd "$(dirname "$0")/.." && pwd)"

mkdir -p "$REPO/data/postgres"
mkdir -p "$REPO/data/gocache"

[ ! -f "$REPO/.env" ] && cp "$REPO/.env.example" "$REPO/.env"

deno install --quiet

cd "$REPO/src/api"
go mod tidy
