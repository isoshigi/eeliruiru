// frontend/src/main.ts を単一の public/js/main.js にバンドルする。
// --watch 付きで起動すると esbuild の watch モードになり、変更を検知して再ビルドする。
import { build, context } from "esbuild";
import { rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outdir = resolve(root, "public/js");
const watch = process.argv.includes("--watch");

/** @type {import("esbuild").BuildOptions} */
const options = {
  entryPoints: [resolve(root, "frontend/src/main.ts")],
  outfile: resolve(outdir, "main.js"),
  bundle: true,
  format: "esm",
  target: "es2022",
  platform: "browser",
  minify: !watch,
  sourcemap: watch ? "inline" : false,
  logLevel: "info",
};

rmSync(outdir, { recursive: true, force: true });

if (watch) {
  const ctx = await context(options);
  await ctx.watch();
  console.log("[build-frontend] watching frontend/src ...");
} else {
  await build(options);
}
