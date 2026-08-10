import { assertEquals, assertExists, assertStringIncludes } from "@std/assert";
import { setKv } from "@/api/kv.ts";
import { app } from "@/server/mod.tsx";

const kv = await Deno.openKv(":memory:");
setKv(kv);

const handler = app.handler();
const opts = { sanitizeResources: false, sanitizeOps: false };

Deno.test("GET /api/health is routed to API handler", opts, async () => {
  const res = await handler(new Request("http://localhost/api/health"));
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.status, "ok");
});

Deno.test("GET /api/tasks is routed to API handler", opts, async () => {
  const res = await handler(new Request("http://localhost/api/tasks"));
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(Array.isArray(body), true);
});

Deno.test("GET /api/unknown returns 404 from API router", opts, async () => {
  const res = await handler(new Request("http://localhost/api/unknown"));
  assertEquals(res.status, 404);
  const body = await res.json();
  assertExists(body.error);
});

Deno.test("PUT /api/tasks returns 405 from API router", opts, async () => {
  const res = await handler(new Request("http://localhost/api/tasks", { method: "PUT" }));
  assertEquals(res.status, 405);
});

Deno.test("POST /api/tasks creates task and returns 201", opts, async () => {
  const res = await handler(
    new Request("http://localhost/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Middleware route test" })
    })
  );
  assertEquals(res.status, 201);
  const body = await res.json();
  assertExists(body.id);
  assertEquals(body.title, "Middleware route test");
});

Deno.test("GET / returns HTML response", opts, async () => {
  const res = await handler(new Request("http://localhost/"));
  assertEquals(res.status, 200);
  assertStringIncludes(res.headers.get("content-type") ?? "", "text/html");
});

Deno.test("GET /tasks returns HTML response", opts, async () => {
  const res = await handler(new Request("http://localhost/tasks"));
  assertEquals(res.status, 200);
  assertStringIncludes(res.headers.get("content-type") ?? "", "text/html");
});
