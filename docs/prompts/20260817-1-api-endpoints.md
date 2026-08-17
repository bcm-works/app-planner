## Prompt

add API features in `src/api` so that it covers all items in the tech spec at `docs/API.md`

## Result

**`store.go`** (new) — `Task` struct, `TaskStatus` type with validation, global in-memory `TaskStore` (mutex-protected), and a stdlib UUID generator using `crypto/rand`.

**`api_tasks.go`** (new) — All task handlers:
- `GET /api/tasks` — lists non-deleted tasks with `include_deleted`, `owner_id`, and `project_id` query filters
- `POST /api/tasks` — creates a task with required `title` validation, defaults status to `pending`
- `GET /api/tasks/{id}` — returns a task, 404 if deleted
- `PATCH /api/tasks/{id}` — partial update via `map[string]json.RawMessage` to distinguish omitted vs. explicit `null` for nullable fields; blocks setting `status: deleted` (use DELETE instead)
- `DELETE /api/tasks/{id}` — soft-deletes by setting `status: deleted`

**`api_health.go`** — Updated to return proper `{"status": "ok"}` JSON.

**`main.go`** — Added all task routes, updated CORS to include `POST`, `PATCH`, `DELETE`, added `NotFound`/`MethodNotAllowed` JSON handlers, removed the placeholder `/item/{slug}` route.

**`api_tasks_test.go`** (new) — 6 tests covering health, create/get, list with filters, soft-delete, patch, 404/405, and input validation.

**Note:** The store is in-memory only — data is lost on restart. If you need persistence, a database layer would be the natural next step.
