## Prompt

add an initial basic frontend app using Deno Fresh, including:

1. `src/server` - Server entry point and router for both `api` and `app`, using Fresh built-in features. Convert and move all server logic currently in `api` to this. Update the `serve` task in `deno.json` as needed.
2. `src/app` - Deno Fresh frontend code. Start with basic layout styling only. Leave branding and theming out of your changes.
3. `src/app/*.test.ts` - Front-end Deno Tests similar in implementation to the current tests in `src/api`

## Result

Here's a summary of everything that was added or changed:

**New files**

| File | Purpose |
|---|---|
| `src/server/mod.tsx` | Unified entry point — `App` instance wiring API middleware + page routes, replaces `src/api/mod.ts` |
| `src/app/components/AppWrapper.tsx` | Outer HTML shell (`<html>/<head>/<body>`) applied to every rendered page |
| `src/app/components/Layout.tsx` | Shared in-page layout with header navigation |
| `src/app/pages/Home.tsx` | Home page component |
| `src/app/pages/Tasks.tsx` | Tasks list page component |
| `src/app/static/styles.css` | Basic structural CSS (reset, grid layout, nav, main, status) |
| `src/app/middleware.test.ts` | 7 tests — verifies API routing, app routing, and method enforcement through the unified server |
| `src/app/handlers.test.ts` | 6 tests — verifies page rendering: correct HTML, nav links, task visibility, deleted task exclusion |

**Modified files**

- **`deno.json`** — added `@fresh/core`, `@std/http/file-server`, `preact` imports; added `jsx`/`jsxImportSource` compiler options; updated `serve` task and deploy entrypoint to `src/server/mod.tsx`
- **`src/api/mod.ts`** — deleted (only contained `Deno.serve(route)`, now handled by `src/server`)

**Architecture notes**

- **Fresh 2.x** (`jsr:@fresh/core@^2.3.3`) is used with programmatic routing (`app.get()`, `app.use()`) rather than file-based routing — no Vite build step needed for SSR
- Static files are served via `@std/http/file-server`'s `serveDir` (Fresh's own `staticFiles()` requires a Vite build cache)
- All existing `src/api/` tests are untouched and still pass
