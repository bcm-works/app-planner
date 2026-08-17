# Database

The API uses a SQLite database stored at `data/database.sqlite.db` (relative to the project root). Migrations are SQL files in `src/api/migrations/` and are applied automatically on startup.

## Common Commands

All commands are run from `src/api/` unless noted.

### Run the API (applies migrations on startup)

```bash
go run .
```

### Run tests (uses an in-memory SQLite database)

```bash
GOCACHE=/tmp/gocache go test ./...
```

### Inspect the database

```bash
sqlite3 ../../data/database.sqlite.db
```

Useful SQLite shell commands:

```sql
-- List tables
.tables

-- Show schema
.schema tasks

-- View applied migrations
SELECT * FROM schema_migrations;

-- Query tasks
SELECT id, title, status, created_date FROM tasks;
```

### Adding a new migration

1. Create a new file in `src/api/migrations/` using the next sequential prefix, e.g. `0002_add_projects.sql`.
2. Write the SQL for the migration in that file.
3. Start the API — the migration will be applied automatically and recorded in `schema_migrations`.

Migration filenames must end in `.sql` and are applied in alphabetical order. Each migration is applied exactly once.
