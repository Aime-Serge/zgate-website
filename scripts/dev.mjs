#!/usr/bin/env node
/**
 * Starts the website's dev servers (docs/DEVELOPMENT_LOW_MEMORY.md at the
 * repository root). Run inside website/:
 *
 *   pnpm dev      CMS :3004 + public site :3002
 *
 * Runs `pnpm --filter ... --parallel run dev` with the pnpm that launched
 * this script, so it works whether or not pnpm is on PATH (e.g.
 * `corepack pnpm dev`). Node built-ins only.
 */
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const packages = ["@zgate/website-backend", "@zgate/website-frontend"];

const args = [...packages.flatMap((name) => ["--filter", name]), "--parallel", "run", "dev"];
const pnpm = process.env["npm_execpath"];
const [command, commandArgs] =
  pnpm && /\.c?js$/.test(pnpm) ? [process.execPath, [pnpm, ...args]] : ["pnpm", args];

const child = spawn(command, commandArgs, {
  cwd: fileURLToPath(new URL("..", import.meta.url)),
  stdio: "inherit",
  shell: command === "pnpm" && process.platform === "win32",
});
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
child.on("exit", (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
