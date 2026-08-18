## Prompt

update database features in `src/api`, including:

1. move database from SQLite to PostgreSQL via the latest stable official Docker Image
2. persist the PostgreSQL database via a docker volume located in a new local directory at `data/postgres`
3. update database migration tooling that stores migrations as SQL files in `src/api/migrations`
4. update technical documentation in `docs/DATABASE.md`

## Result

What changed

**`src/api/` — Go API**

| File | Change |
|---|---|
| `go.mod` / `go.sum` | Removed `modernc.org/sqlite` (and all indirect deps); added `github.com/jackc/pgx/v5 v5.10.0` |
| `db.go` | Driver swapped to `pgx/stdlib`; `openDB` now takes a DSN string and pings on open; migration table uses `TIMESTAMPTZ`; placeholders updated to `$1` |
| `store.go` | All `?` placeholders → `$N`; `created_date`/`updated_date` now passed/scanned as native `time.Time` (no more manual RFC3339 string formatting); dynamic filter query tracks arg index |
| `main.go` | `DB_PATH` env var → `APP_DB_URL` |
| `.sample.env` | Updated to show a PostgreSQL DSN |
| `migrations/0001_initial.sql` | `created_date`/`updated_date` columns changed from `TEXT` to `TIMESTAMPTZ` |
| `api_tasks_test.go` | Uses `TEST_APP_DB_URL` env var; exits cleanly (skipping tests) when it's absent |

**Project root**

| File | Change |
|---|---|
| `docker-compose.yml` | New — starts `postgres:17`, mounts `./data/postgres` for persistence, exposes port 5432 |
| `data/postgres/.gitkeep` | New — tracks the volume directory in git |
| `.gitignore` | Added rules to track `data/postgres/` dir but ignore its contents |
| `docs/DATABASE.md` | Fully rewritten for PostgreSQL — Docker Compose startup, `psql` inspection, `TEST_APP_DB_URL` test instructions, migration workflow |

**To run locally**

```bash
# Start Postgres
docker compose up -d db

# Run API (applies migrations automatically)
cd src/api && go run .

# Run tests against live DB
TEST_APP_DB_URL=postgres://****:****@localhost:5432/planner
```
