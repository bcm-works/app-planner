# Database

The API uses a PostgreSQL database. Migrations are SQL files in `src/api/migrations/` and are applied automatically on startup.

## Running PostgreSQL

A `docker-compose.yml` is provided at the project root. It starts PostgreSQL 17 and persists data to `data/postgres/`.

```bash
docker compose up -d db
```

Override it by setting `DB_URL` in `src/api/.env` (copy from `src/api/.sample.env`).

## Common Commands

All commands are run from `src/api/` unless noted.

### Run the API (applies migrations on startup)

```bash
go run .
```

### Run tests

Tests require a running PostgreSQL instance. Set `TEST_DB_URL` to a connection string before running:

```bash
TEST_DB_URL=postgres://****:****@localhost:5432/planner GOCACHE=/tmp/gocache go test ./...
```

If `TEST_DB_URL` is not set, the test suite exits cleanly without running.

### Inspect the database

```bash
docker compose exec db psql -U planner -d planner
```

Useful psql commands:

```sql
-- List tables
\dt

-- Show schema
\d tasks

-- View applied migrations
SELECT * FROM migrations;

-- Query tasks
SELECT id, title, status, created_date FROM tasks;
```

### Adding a new migration

1. Create a new file in `src/api/migrations/` using the next sequential prefix, e.g. `0002_add_projects.sql`.
2. Write standard PostgreSQL SQL for the migration.
3. Start the API — the migration is applied automatically and recorded in `migrations`.

Migration filenames must end in `.sql` and are applied in alphabetical order. Each migration is applied exactly once.
