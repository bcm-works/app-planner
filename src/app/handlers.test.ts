import { assertEquals, assertStringIncludes } from "@std/assert";
import { kvSaveTask, setKv } from "@/api/kv.ts";
import { app } from "@/server/mod.tsx";
import type { Task } from "@/api/types.ts";

const kv = await Deno.openKv(":memory:");
setKv(kv);

const handler = app.handler();
const opts = { sanitizeResources: false, sanitizeOps: false };

function makeTask(overrides: Partial<Task> = {}): Task {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: "App handler test task",
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

Deno.test("GET / renders home page content", opts, async () => {
  const res = await handler(new Request("http://localhost/"));
  assertEquals(res.status, 200);
  const html = await res.text();
  assertStringIncludes(html, "Personal Planner");
  assertStringIncludes(html, "/tasks");
});

Deno.test("GET / includes navigation links", opts, async () => {
  const res = await handler(new Request("http://localhost/"));
  const html = await res.text();
  assertStringIncludes(html, 'href="/"');
  assertStringIncludes(html, 'href="/tasks"');
});

Deno.test("GET /tasks renders tasks heading", opts, async () => {
  const res = await handler(new Request("http://localhost/tasks"));
  assertEquals(res.status, 200);
  const html = await res.text();
  assertStringIncludes(html, "Tasks");
});

Deno.test("GET /tasks shows task title in page", opts, async () => {
  const task = makeTask({ title: "Visible task in app" });
  await kvSaveTask(task);

  const res = await handler(new Request("http://localhost/tasks"));
  assertEquals(res.status, 200);
  const html = await res.text();
  assertStringIncludes(html, "Visible task in app");
});

Deno.test("GET /tasks does not show deleted tasks", opts, async () => {
  const title = `deleted-task-${crypto.randomUUID()}`;
  const deleted = makeTask({ title, status: "deleted" });
  await kvSaveTask(deleted);

  const res = await handler(new Request("http://localhost/tasks"));
  assertEquals(res.status, 200);
  const html = await res.text();
  assertEquals(html.includes(title), false);
});

Deno.test("GET /tasks renders full HTML document", opts, async () => {
  const res = await handler(new Request("http://localhost/tasks"));
  const html = await res.text();
  assertStringIncludes(html, "<html");
  assertStringIncludes(html, "<head");
  assertStringIncludes(html, "<body");
  assertStringIncludes(html, "styles.css");
});
