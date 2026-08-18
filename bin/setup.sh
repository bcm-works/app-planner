#!/usr/bin/env bash
#
#
# Initial setup
#
#

REPO="$(cd "$(dirname "$0")/.." && pwd)"
ENV="$REPO/.env"

[ ! -f "$ENV" ] && cp "$REPO/.env.example" "$ENV"

source "$ENV"

mkdir -p "$REPO/$APP_DB_DIR"
mkdir -p "$REPO/data/gocache"

deno install --quiet

cd "$REPO/src/api"
go mod tidy
