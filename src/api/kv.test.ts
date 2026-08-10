import { assertEquals, assertNotEquals } from "@std/assert";
import { kvGetTask, kvListTasks, kvSaveTask, setKv } from "./kv.ts";

const kv = await Deno.openKv(":memory:");
setKv(kv);
import type { Task } from "./types.ts";

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

const opts = { sanitizeResources: false, sanitizeOps: false };

Deno.test("kvGetTask returns null for unknown id", opts, async () => {
  const result = await kvGetTask(crypto.randomUUID());
  assertEquals(result, null);
});

Deno.test("kvSaveTask persists a task; kvGetTask retrieves it", opts, async () => {
  const task = makeTask();
  await kvSaveTask(task);
  const result = await kvGetTask(task.id);
  assertEquals(result, task);
});

Deno.test("kvSaveTask overwrites an existing task", opts, async () => {
  const task = makeTask();
  await kvSaveTask(task);
  const updated = { ...task, title: "Updated", updated_date: new Date().toISOString() };
  await kvSaveTask(updated);
  const result = await kvGetTask(task.id);
  assertEquals(result?.title, "Updated");
});

Deno.test("kvListTasks excludes deleted tasks by default", opts, async () => {
  const active = makeTask({ title: "active-list-test" });
  const deleted = makeTask({ title: "deleted-list-test", status: "deleted" });
  await kvSaveTask(active);
  await kvSaveTask(deleted);

  const results = await kvListTasks({});
  const ids = results.map((t) => t.id);
  assertEquals(ids.includes(active.id), true);
  assertEquals(ids.includes(deleted.id), false);
});

Deno.test("kvListTasks includes deleted tasks when includeDeleted=true", opts, async () => {
  const task = makeTask({ status: "deleted" });
  await kvSaveTask(task);

  const results = await kvListTasks({ includeDeleted: true });
  const ids = results.map((t) => t.id);
  assertEquals(ids.includes(task.id), true);
});

Deno.test("kvListTasks filters by owner_id", opts, async () => {
  const ownerId = crypto.randomUUID();
  const owned = makeTask({ owner_id: ownerId });
  const other = makeTask({ owner_id: crypto.randomUUID() });
  await kvSaveTask(owned);
  await kvSaveTask(other);

  const results = await kvListTasks({ owner_id: ownerId });
  const ids = results.map((t) => t.id);
  assertEquals(ids.includes(owned.id), true);
  assertEquals(ids.includes(other.id), false);
});

Deno.test("kvListTasks filters by project_id", opts, async () => {
  const projectId = crypto.randomUUID();
  const inProject = makeTask({ project_id: projectId });
  const outProject = makeTask({ project_id: crypto.randomUUID() });
  await kvSaveTask(inProject);
  await kvSaveTask(outProject);

  const results = await kvListTasks({ project_id: projectId });
  const ids = results.map((t) => t.id);
  assertEquals(ids.includes(inProject.id), true);
  assertEquals(ids.includes(outProject.id), false);
});

Deno.test("kvListTasks returns array (no filters)", opts, async () => {
  const task = makeTask();
  await kvSaveTask(task);
  const results = await kvListTasks({});
  assertNotEquals(results.length, 0);
});
