import { App } from "@fresh/core";
import { serveDir } from "@std/http/file-server";
import { route as apiRoute } from "@/api/router.ts";
import { kvListTasks } from "@/api/kv.ts";
import type { Task } from "@/api/types.ts";
import AppWrapper from "@/app/components/AppWrapper.tsx";
import HomePage from "@/app/pages/Home.tsx";
import TasksPage from "@/app/pages/Tasks.tsx";

const STATIC_DIR = new URL("../app/static", import.meta.url).pathname;

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
  });

if (import.meta.main) {
  await app.listen();
}
