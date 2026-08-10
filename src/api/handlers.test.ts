import { assertEquals, assertExists } from "@std/assert";
import { handleCreateTask, handleDeleteTask, handleGetTask, handleListTasks, handleUpdateTask } from "./handlers.ts";
import { kvSaveTask, setKv } from "./kv.ts";

const kv = await Deno.openKv(":memory:");
setKv(kv);
import type { Task } from "./types.ts";

const opts = { sanitizeResources: false, sanitizeOps: false };

function makeTask(overrides: Partial<Task> = {}): Task {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: "Test task",
    description: "",
    start_date: null,
    end_date: null,
    status: "pending",
    project_id: null,
    owner_id: null,
    created_date: now,
    updated_date: now,
    ...overrides
  };
}

// --- handleListTasks ---

Deno.test("handleListTasks returns 200 with an array", opts, async () => {
  const req = new Request("http://localhost/tasks");
  const res = await handleListTasks(req);
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(Array.isArray(body), true);
});

Deno.test("handleListTasks returns saved tasks", opts, async () => {
  const task = makeTask();
  await kvSaveTask(task);
  const req = new Request("http://localhost/tasks");
  const res = await handleListTasks(req);
  const body: Task[] = await res.json();
  const found = body.find((t) => t.id === task.id);
  assertExists(found);
});

Deno.test("handleListTasks filters by owner_id", opts, async () => {
  const ownerId = crypto.randomUUID();
  const owned = makeTask({ owner_id: ownerId });
  const other = makeTask({ owner_id: crypto.randomUUID() });
  await kvSaveTask(owned);
  await kvSaveTask(other);

  const req = new Request(`http://localhost/tasks?owner_id=${ownerId}`);
  const res = await handleListTasks(req);
  const body: Task[] = await res.json();
  assertEquals(body.every((t) => t.owner_id === ownerId), true);
  assertExists(body.find((t) => t.id === owned.id));
});

Deno.test("handleListTasks filters by project_id", opts, async () => {
  const projectId = crypto.randomUUID();
  const inProject = makeTask({ project_id: projectId });
  await kvSaveTask(inProject);

  const req = new Request(`http://localhost/tasks?project_id=${projectId}`);
  const res = await handleListTasks(req);
  const body: Task[] = await res.json();
  assertEquals(body.every((t) => t.project_id === projectId), true);
  assertExists(body.find((t) => t.id === inProject.id));
});

Deno.test("handleListTasks omits deleted by default", opts, async () => {
  const deleted = makeTask({ status: "deleted" });
  await kvSaveTask(deleted);

  const req = new Request("http://localhost/tasks");
  const res = await handleListTasks(req);
  const body: Task[] = await res.json();
  assertEquals(body.find((t) => t.id === deleted.id), undefined);
});

Deno.test("handleListTasks includes deleted when include_deleted=true", opts, async () => {
  const deleted = makeTask({ status: "deleted" });
  await kvSaveTask(deleted);

  const req = new Request("http://localhost/tasks?include_deleted=true");
  const res = await handleListTasks(req);
  const body: Task[] = await res.json();
  assertExists(body.find((t) => t.id === deleted.id));
});

// --- handleGetTask ---

Deno.test("handleGetTask returns 200 with task", opts, async () => {
  const task = makeTask();
  await kvSaveTask(task);

  const req = new Request(`http://localhost/tasks/${task.id}`);
  const res = await handleGetTask(req, task.id);
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.id, task.id);
  assertEquals(body.title, task.title);
});

Deno.test("handleGetTask returns 404 for unknown id", opts, async () => {
  const req = new Request(`http://localhost/tasks/${crypto.randomUUID()}`);
  const res = await handleGetTask(req, crypto.randomUUID());
  assertEquals(res.status, 404);
});

Deno.test("handleGetTask returns 404 for soft-deleted task", opts, async () => {
  const task = makeTask({ status: "deleted" });
  await kvSaveTask(task);

  const req = new Request(`http://localhost/tasks/${task.id}`);
  const res = await handleGetTask(req, task.id);
  assertEquals(res.status, 404);
});

// --- handleCreateTask ---

Deno.test("handleCreateTask returns 201 with new task", opts, async () => {
  const req = new Request("http://localhost/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "New task" })
  });
  const res = await handleCreateTask(req);
  assertEquals(res.status, 201);
  const body = await res.json();
  assertExists(body.id);
  assertEquals(body.title, "New task");
  assertEquals(body.status, "pending");
});

Deno.test("handleCreateTask trims title and description", opts, async () => {
  const req = new Request("http://localhost/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "  Trimmed  ", description: "  desc  " })
  });
  const res = await handleCreateTask(req);
  const body = await res.json();
  assertEquals(body.title, "Trimmed");
  assertEquals(body.description, "desc");
});

Deno.test("handleCreateTask accepts all optional fields", opts, async () => {
  const req = new Request("http://localhost/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Full task",
      description: "desc",
      start_date: "2025-01-01",
      end_date: "2025-12-31",
      status: "in_progress",
      project_id: "proj-1",
      owner_id: "user-1"
    })
  });
  const res = await handleCreateTask(req);
  assertEquals(res.status, 201);
  const body = await res.json();
  assertEquals(body.start_date, "2025-01-01");
  assertEquals(body.end_date, "2025-12-31");
  assertEquals(body.status, "in_progress");
  assertEquals(body.project_id, "proj-1");
  assertEquals(body.owner_id, "user-1");
});

Deno.test("handleCreateTask returns 400 for missing title", opts, async () => {
  const req = new Request("http://localhost/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description: "no title here" })
  });
  const res = await handleCreateTask(req);
  assertEquals(res.status, 400);
  const body = await res.json();
  assertExists(body.error);
});

Deno.test("handleCreateTask returns 400 for blank title", opts, async () => {
  const req = new Request("http://localhost/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "   " })
  });
  const res = await handleCreateTask(req);
  assertEquals(res.status, 400);
});

Deno.test("handleCreateTask returns 400 for invalid JSON", opts, async () => {
  const req = new Request("http://localhost/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "not json"
  });
  const res = await handleCreateTask(req);
  assertEquals(res.status, 400);
  const body = await res.json();
  assertExists(body.error);
});

// --- handleUpdateTask ---

Deno.test("handleUpdateTask returns 200 with updated task", opts, async () => {
  const task = makeTask();
  await kvSaveTask(task);

  const req = new Request(`http://localhost/tasks/${task.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Updated title" })
  });
  const res = await handleUpdateTask(req, task.id);
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.title, "Updated title");
});

Deno.test("handleUpdateTask only changes supplied fields", opts, async () => {
  const task = makeTask({ title: "Original", description: "Keep me", status: "pending" });
  await kvSaveTask(task);

  const req = new Request(`http://localhost/tasks/${task.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "in_progress" })
  });
  const res = await handleUpdateTask(req, task.id);
  const body = await res.json();
  assertEquals(body.title, "Original");
  assertEquals(body.description, "Keep me");
  assertEquals(body.status, "in_progress");
});

Deno.test("handleUpdateTask resets nullable fields to null when explicitly passed", opts, async () => {
  const task = makeTask({ start_date: "2025-01-01", project_id: "proj-x", owner_id: "user-x" });
  await kvSaveTask(task);

  const req = new Request(`http://localhost/tasks/${task.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ start_date: null, project_id: null, owner_id: null })
  });
  const res = await handleUpdateTask(req, task.id);
  const body = await res.json();
  assertEquals(body.start_date, null);
  assertEquals(body.project_id, null);
  assertEquals(body.owner_id, null);
});

Deno.test("handleUpdateTask bumps updated_date", opts, async () => {
  const task = makeTask();
  await kvSaveTask(task);

  await new Promise((r) => setTimeout(r, 5));
  const req = new Request(`http://localhost/tasks/${task.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Changed" })
  });
  const res = await handleUpdateTask(req, task.id);
  const body = await res.json();
  assertEquals(body.updated_date > task.updated_date, true);
});

Deno.test("handleUpdateTask returns 404 for unknown id", opts, async () => {
  const req = new Request(`http://localhost/tasks/${crypto.randomUUID()}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "x" })
  });
  const res = await handleUpdateTask(req, crypto.randomUUID());
  assertEquals(res.status, 404);
});

Deno.test("handleUpdateTask returns 404 for deleted task", opts, async () => {
  const task = makeTask({ status: "deleted" });
  await kvSaveTask(task);

  const req = new Request(`http://localhost/tasks/${task.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "x" })
  });
  const res = await handleUpdateTask(req, task.id);
  assertEquals(res.status, 404);
});

Deno.test("handleUpdateTask returns 400 for invalid JSON", opts, async () => {
  const task = makeTask();
  await kvSaveTask(task);

  const req = new Request(`http://localhost/tasks/${task.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: "bad json"
  });
  const res = await handleUpdateTask(req, task.id);
  assertEquals(res.status, 400);
});

// --- handleDeleteTask ---

Deno.test("handleDeleteTask returns 200 and soft-deletes the task", opts, async () => {
  const task = makeTask();
  await kvSaveTask(task);

  const req = new Request(`http://localhost/tasks/${task.id}`, { method: "DELETE" });
  const res = await handleDeleteTask(req, task.id);
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.success, true);
});

Deno.test("handleDeleteTask makes task unretrievable via handleGetTask", opts, async () => {
  const task = makeTask();
  await kvSaveTask(task);

  const delReq = new Request(`http://localhost/tasks/${task.id}`, { method: "DELETE" });
  await handleDeleteTask(delReq, task.id);

  const getReq = new Request(`http://localhost/tasks/${task.id}`);
  const getRes = await handleGetTask(getReq, task.id);
  assertEquals(getRes.status, 404);
});

Deno.test("handleDeleteTask returns 404 for unknown id", opts, async () => {
  const id = crypto.randomUUID();
  const req = new Request(`http://localhost/tasks/${id}`, { method: "DELETE" });
  const res = await handleDeleteTask(req, id);
  assertEquals(res.status, 404);
});

Deno.test("handleDeleteTask returns 404 for already-deleted task", opts, async () => {
  const task = makeTask({ status: "deleted" });
  await kvSaveTask(task);

  const req = new Request(`http://localhost/tasks/${task.id}`, { method: "DELETE" });
  const res = await handleDeleteTask(req, task.id);
  assertEquals(res.status, 404);
});
