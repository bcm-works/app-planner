#!/usr/bin/env bash
#
#
# Update dependencies
#
#

REPO="$(cd "$(dirname "$0")/.." && pwd)"

cd "$REPO"
deno outdated --update --compatible

cd "$REPO/src/api"
go get -u ./...
go mod tidy
