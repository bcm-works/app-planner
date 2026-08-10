import { assertEquals, assertExists } from "@std/assert";
import { route } from "./router.ts";
import { kvSaveTask, setKv } from "./kv.ts";

const kv = await Deno.openKv(":memory:");
setKv(kv);
import type { Task } from "./types.ts";

const opts = { sanitizeResources: false, sanitizeOps: false };

function makeTask(overrides: Partial<Task> = {}): Task {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: "Router test task",
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

// --- /health ---

Deno.test("GET /health returns 200 with status ok", opts, async () => {
  const res = await route(new Request("http://localhost/health"));
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.status, "ok");
});

// --- unknown routes ---

Deno.test("GET /unknown returns 404", opts, async () => {
  const res = await route(new Request("http://localhost/unknown"));
  assertEquals(res.status, 404);
  const body = await res.json();
  assertExists(body.error);
});

Deno.test("GET /tasks/id/extra returns 404", opts, async () => {
  const res = await route(new Request("http://localhost/tasks/abc/extra"));
  assertEquals(res.status, 404);
});

// --- GET /tasks ---

Deno.test("GET /tasks returns 200 with array", opts, async () => {
  const res = await route(new Request("http://localhost/tasks"));
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(Array.isArray(body), true);
});

// --- POST /tasks ---

Deno.test("POST /tasks creates a task and returns 201", opts, async () => {
  const res = await route(
    new Request("http://localhost/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Via router" })
    })
  );
  assertEquals(res.status, 201);
  const body = await res.json();
  assertExists(body.id);
  assertEquals(body.title, "Via router");
});

Deno.test("PUT /tasks returns 405 method not allowed", opts, async () => {
  const res = await route(new Request("http://localhost/tasks", { method: "PUT" }));
  assertEquals(res.status, 405);
  const body = await res.json();
  assertExists(body.error);
});

Deno.test("DELETE /tasks returns 405 method not allowed", opts, async () => {
  const res = await route(new Request("http://localhost/tasks", { method: "DELETE" }));
  assertEquals(res.status, 405);
});

// --- GET /tasks/:id ---

Deno.test("GET /tasks/:id returns task", opts, async () => {
  const task = makeTask();
  await kvSaveTask(task);

  const res = await route(new Request(`http://localhost/tasks/${task.id}`));
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.id, task.id);
});

Deno.test("GET /tasks/:id returns 404 for unknown id", opts, async () => {
  const res = await route(new Request(`http://localhost/tasks/${crypto.randomUUID()}`));
  assertEquals(res.status, 404);
});

// --- PATCH /tasks/:id ---

Deno.test("PATCH /tasks/:id updates task", opts, async () => {
  const task = makeTask();
  await kvSaveTask(task);

  const res = await route(
    new Request(`http://localhost/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Patched via router" })
    })
  );
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.title, "Patched via router");
});

// --- DELETE /tasks/:id ---

Deno.test("DELETE /tasks/:id soft-deletes task", opts, async () => {
  const task = makeTask();
  await kvSaveTask(task);

  const res = await route(new Request(`http://localhost/tasks/${task.id}`, { method: "DELETE" }));
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.success, true);
});

Deno.test("POST /tasks/:id returns 405 method not allowed", opts, async () => {
  const task = makeTask();
  await kvSaveTask(task);

  const res = await route(
    new Request(`http://localhost/tasks/${task.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "x" })
    })
  );
  assertEquals(res.status, 405);
});

Deno.test("PUT /tasks/:id returns 405 method not allowed", opts, async () => {
  const task = makeTask();
  await kvSaveTask(task);

  const res = await route(
    new Request(`http://localhost/tasks/${task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "x" })
    })
  );
  assertEquals(res.status, 405);
});
