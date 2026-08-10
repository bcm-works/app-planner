import type { CreateTaskBody, Task, UpdateTaskBody } from "./types.ts";
import { kvGetTask, kvListTasks, kvSaveTask } from "./kv.ts";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

function err(message: string, status: number): Response {
  return json({ error: message }, status);
}

// Resolve a task that isn't soft-deleted, or return null.
async function resolveActive(id: string): Promise<Task | null> {
  const task = await kvGetTask(id);
  return task && task.status !== "deleted" ? task : null;
}

export async function handleListTasks(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const tasks = await kvListTasks({
    includeDeleted: searchParams.get("include_deleted") === "true",
    owner_id: searchParams.get("owner_id"),
    project_id: searchParams.get("project_id")
  });
  return json(tasks);
}

export async function handleGetTask(_req: Request, id: string): Promise<Response> {
  const task = await resolveActive(id);
  if (!task) return err("Task not found", 404);
  return json(task);
}

export async function handleCreateTask(req: Request): Promise<Response> {
  let body: CreateTaskBody;

  try {
    body = (await req.json()) as CreateTaskBody;
  } catch {
    return err("Invalid JSON body", 400);
  }

  if (!body.title?.trim()) return err("title is required", 400);

  const now = new Date().toISOString();
  const task: Task = {
    id: crypto.randomUUID(),
    title: body.title.trim(),
    description: body.description?.trim() ?? "",
    start_date: body.start_date ?? null,
    end_date: body.end_date ?? null,
    status: body.status ?? "pending",
    project_id: body.project_id ?? null,
    owner_id: body.owner_id ?? null,
    created_date: now,
    updated_date: now
  };

  await kvSaveTask(task);
  return json(task, 201);
}

export async function handleUpdateTask(req: Request, id: string): Promise<Response> {
  const existing = await resolveActive(id);
  if (!existing) return err("Task not found", 404);

  let body: UpdateTaskBody;

  try {
    body = (await req.json()) as UpdateTaskBody;
  } catch {
    return err("Invalid JSON body", 400);
  }

  const updated: Task = {
    ...existing,
    title: body.title?.trim() ?? existing.title,
    description: body.description?.trim() ?? existing.description,
    // Explicit null resets the field; omitted key leaves it unchanged.
    start_date: "start_date" in body ? (body.start_date ?? null) : existing.start_date,
    end_date: "end_date" in body ? (body.end_date ?? null) : existing.end_date,
    status: body.status ?? existing.status,
    project_id: "project_id" in body ? (body.project_id ?? null) : existing.project_id,
    owner_id: "owner_id" in body ? (body.owner_id ?? null) : existing.owner_id,
    updated_date: new Date().toISOString()
  };

  await kvSaveTask(updated);
  return json(updated);
}

// Soft-delete by setting status=deleted.
export async function handleDeleteTask(_req: Request, id: string): Promise<Response> {
  const existing = await resolveActive(id);
  if (!existing) return err("Task not found", 404);

  await kvSaveTask({ ...existing, status: "deleted", updated_date: new Date().toISOString() });
  return json({ success: true });
}
