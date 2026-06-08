import { build } from "esbuild";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));

await build({
  entryPoints: [path.resolve(dir, "generate-course.ts")],
  platform: "node",
  bundle: true,
  format: "esm",
  outfile: path.resolve(dir, "generate-course.mjs"),
  external: ["*.node", "pg-native"],
  banner: {
    js: `import { createRequire as __cr } from 'node:module';
globalThis.require = __cr(import.meta.url);`,
  },
  logLevel: "info",
});
