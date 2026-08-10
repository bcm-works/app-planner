import type { Task } from "./types.ts";

let _kv: Deno.Kv | null = null;
const _envDenoKvDatabaseId: string = Deno.env.get("DENO_KV_DATABASE_ID") || "";
const _envDenoKvAccessToken: string = Deno.env.get("DENO_KV_ACCESS_TOKEN") || "";

// Allow tests to use their own mocked KV instance.
export function setKv(kv: Deno.Kv): void {
  _kv = kv;
}

async function db(): Promise<Deno.Kv> {
  if (!_kv) {
    if (_envDenoKvDatabaseId && _envDenoKvAccessToken) {
      console.log("Connecting to remote Deno KV instance");

      _kv = await Deno.openKv(
        `https://api.deno.com/v2/databases/${_envDenoKvDatabaseId}/connect`
      );
    } else {
      console.log("Using built-in local Deno KV instance");

      _kv = await Deno.openKv();
    }
  }

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
