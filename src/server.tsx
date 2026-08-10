import { App } from "@fresh/core";
import { serveDir } from "@std/http/file-server";
import { route as apiRoute } from "@/api/router.ts";
import { kvGetTask, kvListTasks, kvSaveTask } from "@/api/kv.ts";
import type { Task, TaskStatus } from "@/api/types.ts";
import AppWrapper from "@/app/components/AppWrapper.tsx";
import HomePage from "@/app/pages/Home.tsx";
import TasksPage from "@/app/pages/Tasks.tsx";

const STATIC_DIR = new URL("app/static", import.meta.url).pathname;

const EDITABLE_STATUSES = new Set<string>(["pending", "in_progress", "completed"]);

function parseStatus(val: string | null | undefined): Exclude<TaskStatus, "deleted"> {
  if (val && EDITABLE_STATUSES.has(val)) return val as Exclude<TaskStatus, "deleted">;
  return "pending";
}

// Unified server entry point for both API and frontend app.
// API routes are handled via the existing router; app routes are rendered with Fresh.
export const app = new App()
  .appWrapper(AppWrapper)
  // Static assets (CSS, images, fonts)
  .use((ctx) => {
    if (/\.(css|ico|png|svg|jpg|jpeg|gif|woff2?)$/.test(ctx.url.pathname)) {
      return serveDir(ctx.req, { fsRoot: STATIC_DIR });
    }
    return ctx.next();
  })
  // API routes
  .use((ctx) => {
    if (ctx.url.pathname.startsWith("/api/")) {
      return apiRoute(ctx.req);
    }
    return ctx.next();
  })
  .get("/", (ctx) => ctx.render(<HomePage />))
  .get("/tasks", async (ctx) => {
    const tasks: Task[] = await kvListTasks({});
    return ctx.render(<TasksPage tasks={tasks} />);
  })
  .post("/tasks", async (ctx) => {
    const form = await ctx.req.formData();
    const title = form.get("title")?.toString().trim() ?? "";
    if (title) {
      const now = new Date().toISOString();
      const task: Task = {
        id: crypto.randomUUID(),
        title,
        description: form.get("description")?.toString().trim() ?? "",
        start_date: form.get("start_date")?.toString() || null,
        end_date: form.get("end_date")?.toString() || null,
        status: parseStatus(form.get("status")?.toString()),
        project_id: null,
        owner_id: null,
        created_date: now,
        updated_date: now
      };
      await kvSaveTask(task);
    }
    return Response.redirect(ctx.url.origin + "/tasks", 303);
  })
  .post("/tasks/:id", async (ctx) => {
    const id = ctx.params["id"] ?? "";
    const existing = id ? await kvGetTask(id) : null;
    if (existing && existing.status !== "deleted") {
      const form = await ctx.req.formData();
      const title = form.get("title")?.toString().trim() ?? "";
      if (title) {
        await kvSaveTask({
          ...existing,
          title,
          description: form.get("description")?.toString().trim() ?? existing.description,
          start_date: form.get("start_date")?.toString() || null,
          end_date: form.get("end_date")?.toString() || null,
          status: parseStatus(form.get("status")?.toString()),
          updated_date: new Date().toISOString()
        });
      }
    }
    return Response.redirect(ctx.url.origin + "/tasks", 303);
  })
  .post("/tasks/:id/delete", async (ctx) => {
    const id = ctx.params["id"] ?? "";
    const existing = id ? await kvGetTask(id) : null;
    if (existing && existing.status !== "deleted") {
      await kvSaveTask({ ...existing, status: "deleted", updated_date: new Date().toISOString() });
    }
    return Response.redirect(ctx.url.origin + "/tasks", 303);
  });

if (import.meta.main) {
  await app.listen();
}
