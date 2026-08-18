#!/usr/bin/env bash
#
#
# Start the database
#
#

REPO="$(cd "$(dirname "$0")/.." && pwd)"

source "$REPO/.env"

cd "$REPO"

docker compose down || true

docker compose up \
	--pull always \
	--quiet-pull \
	--build \
	--yes \
	--detach
