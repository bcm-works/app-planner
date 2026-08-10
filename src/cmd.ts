import { Builder } from "@fresh/core/dev";

const builder = new Builder({ serverEntry: "./src/server.tsx" });

if (Deno.args.includes("build")) {
  await builder.build();
} else {
  await builder.listen(() => import("./server.tsx"));
}
