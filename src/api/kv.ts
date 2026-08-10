import type { Task } from "./types.ts";

let _kv: Deno.Kv | null = null;

// Allow tests to use their own mocked KV instance.
export function setKv(kv: Deno.Kv): void {
  _kv = kv;
}

async function db(): Promise<Deno.Kv> {
  if (!_kv) _kv = await Deno.openKv();
  return _kv;
}

export async function kvGetTask(id: string): Promise<Task | null> {
  const kv = await db();
  const { value } = await kv.get<Task>(["tasks", id]);
  return value;
}

export async function kvListTasks(opts: {
  includeDeleted?: boolean;
  owner_id?: string | null;
  project_id?: string | null;
}): Promise<Task[]> {
  const kv = await db();
  const tasks: Task[] = [];

  for await (const { value } of kv.list<Task>({ prefix: ["tasks"] })) {
    if (!opts.includeDeleted && value.status === "deleted") continue;
    if (opts.owner_id && value.owner_id !== opts.owner_id) continue;
    if (opts.project_id && value.project_id !== opts.project_id) continue;
    tasks.push(value);
  }

  return tasks;
}

export async function kvSaveTask(task: Task): Promise<void> {
  const kv = await db();
  await kv.set(["tasks", task.id], task);
}
