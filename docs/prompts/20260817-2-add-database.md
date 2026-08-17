## Prompt

update `src/api/store.go`, including:

1. add data to be saved to a local SQLite file at `data/database.sqlite.db`
2. add database migration tooling that stores migrations as SQL files in `src/api/migrations`
3. create an initial database migration that creates the required tables based on the API endpoints and `store.go`
4. document common commands needed by the above items in `docs/DATABASE.md`

## Result

**New files:**

- `src/api/db.go` — `openDB()` opens the SQLite file and calls `runMigrations()`, which uses `//go:embed migrations/*.sql` to apply pending SQL files in order, tracking them in a `schema_migrations` table.
- `src/api/migrations/0001_initial.sql` — creates the `tasks` table matching the `Task` struct.
- `docs/DATABASE.md` — documents how to run the server, tests, inspect the DB with `sqlite3`, and add new migrations.

**Updated files:**

- `src/api/store.go` — replaced the `sync.RWMutex` + `map` with `*sql.DB` and four methods: `List`, `Create`, `Get`, `Update`. Includes a shared `scanTask` helper.
- `src/api/api_tasks.go` — handlers now call store methods instead of directly accessing the map; `sql.ErrNoRows` is used for 404 detection.
- `src/api/main.go` — opens the DB (path from `DB_PATH` env var, defaulting to `../../data/database.sqlite.db`) before starting the router.
- `src/api/api_tasks_test.go` — added `TestMain` to initialise the store with an in-memory SQLite DB (`:memory:`); `resetStore()` now runs `DELETE FROM tasks`.
- `src/api/.sample.env` — added the `DB_PATH` example.
- `src/api/go.mod` / `go.sum` — added `modernc.org/sqlite` (pure Go, no CGO) and its transitive dependencies.
