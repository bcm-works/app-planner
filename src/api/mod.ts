import { route } from "./router.ts";

// Entry point for `deno task serve` and Deno Deploy.
// Deno Deploy picks up the default export or a top-level Deno.serve() call.
Deno.serve(route);
