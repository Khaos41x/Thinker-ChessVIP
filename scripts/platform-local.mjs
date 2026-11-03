import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const workerDir = join(root, "apps", "commerce-worker");
const require = createRequire(join(workerDir, "package.json"));
const wrangler = join(dirname(require.resolve("wrangler/package.json")), "bin", "wrangler.js");
const key = createHash("sha256").update(workerDir).digest("hex").slice(0, 12);
const state = join(tmpdir(), `thinker-d1-${key}`);
const command = process.argv[2];

const commands = {
  dev: ["dev", "--local"],
  migrate: ["d1", "migrations", "apply", "thinker-ops-db", "--local"],
};

if (!(command in commands)) {
  throw new Error("Expected dev or migrate");
}

console.log(`Local-only D1 state: ${state}`);
const child = spawn(process.execPath, [wrangler, ...commands[command], "--persist-to", state], {
  cwd: workerDir,
  stdio: "inherit",
});
child.on("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
