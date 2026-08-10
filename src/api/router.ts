import { handleCreateTask, handleDeleteTask, handleGetTask, handleListTasks, handleUpdateTask } from "./handlers.ts";

// URLPattern is available as a global in Deno and Deno Deploy.
const TASKS_COLLECTION = new URLPattern({ pathname: "/tasks" });
const TASKS_ITEM = new URLPattern({ pathname: "/tasks/:id" });

function methodNotAllowed(): Response {
  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: { "Content-Type": "application/json" }
  });
}

function notFound(): Response {
  return new Response(JSON.stringify({ error: "Not found" }), {
    status: 404,
    headers: { "Content-Type": "application/json" }
  });
}

export function route(req: Request): Response | Promise<Response> {
  const itemMatch = TASKS_ITEM.exec(req.url);
  if (itemMatch) {
    const id = itemMatch.pathname.groups["id"]!;
    switch (req.method) {
      case "GET":
        return handleGetTask(req, id);
      case "PATCH":
        return handleUpdateTask(req, id);
      case "DELETE":
        return handleDeleteTask(req, id);
      default:
        return methodNotAllowed();
    }
  }

  if (TASKS_COLLECTION.exec(req.url)) {
    switch (req.method) {
      case "GET":
        return handleListTasks(req);
      case "POST":
        return handleCreateTask(req);
      default:
        return methodNotAllowed();
    }
  }

  if (new URL(req.url).pathname === "/health") {
    return new Response(JSON.stringify({ status: "ok" }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  return notFound();
}
