## Prompt

add UI features in `src/app` including:

1. add task form
2. fix task list page when there are no tasks
3. when task list page has tasks, list them all on one page, along with edit task features for each item
4. don't duplicate code, use Deno Fresh component features

## Result

**New: `src/app/components/TaskForm.tsx`**  
Reusable form for both create and edit. Accepts `action`, optional `task` (pre-fills all fields), and `submitLabel`. Fields: title, description, status (select), start/end dates.

**New: `src/app/components/TaskItem.tsx`**  
Each task renders as a `<details>`/`<summary>` disclosure widget — summary shows title + status, expanded body contains `TaskForm` (pre-filled) and a separate delete form. No JavaScript required.

**Updated: `src/app/pages/Tasks.tsx`**  
- Always shows an "Add Task" `<details>` (auto-expanded when list is empty)
- Empty state now has a helpful message pointing to the form above
- Task list uses `TaskItem` — no code duplication

**Updated: `src/server/mod.tsx`**  
Added three POST handlers:
- `POST /tasks` — creates task from form data, redirects back
- `POST /tasks/:id` — updates task, redirects back
- `POST /tasks/:id/delete` — soft-deletes task, redirects back

**Updated: `src/app/static/styles.css`**  
Added styles for `.task-form`, `.task-list`, `.task-item`, `.add-task`, buttons, `.btn-danger`, and `.empty` — all using `currentColor` to stay theme-neutral.
