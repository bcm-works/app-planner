## Prompt

create a Deno Typescript backend API in `src/api` for a Sunsama like system with the following features.

1. use Deno KV as the data store
2. ensure solution is deployable to Deno Deploy
3. task schema - id, title, description, start_date, end_date, status, project_id, owner_id, status, created_date, updated_date
4. basic task CRUD, using soft-deletes via `status=deleted`

## Result

---

**`src/api/`**

| File | Role |
|---|---|
| `types.ts` | `Task`, `TaskStatus`, `CreateTaskBody`, `UpdateTaskBody` |
| `kv.ts` | Thin Deno KV wrapper — `kvGetTask`, `kvListTasks`, `kvSaveTask` |
| `handlers.ts` | One function per route action |
| `router.ts` | URL pattern matching → dispatch to handler |
| `mod.ts` | `Deno.serve(route)` — entry point for local dev & Deno Deploy |

**`deno.json`** — added `deno task serve`

**API surface**

| Method | Path | Action |
|---|---|---|
| `GET` | `/tasks` | List tasks (excludes deleted by default) |
| `POST` | `/tasks` | Create task |
| `GET` | `/tasks/:id` | Get task |
| `PATCH` | `/tasks/:id` | Partial update |
| `DELETE` | `/tasks/:id` | Soft-delete (`status=deleted`) |
| `GET` | `/health` | Health check |

**Query params on `GET /tasks`:**
- `owner_id=` — filter by owner
- `project_id=` — filter by project
- `include_deleted=true` — include soft-deleted tasks

**Partial update semantics:** omitting a field leaves it unchanged; passing `"field": null` explicitly clears nullable fields (`start_date`, `end_date`, `project_id`, `owner_id`).

**Running locally**

```sh
deno task serve
```

**Deploying to Deno Deploy**

Point the project entry point at `src/api/mod.ts`. Deno KV works out of the box on Deploy with no additional config.
