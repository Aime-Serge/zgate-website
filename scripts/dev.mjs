#!/usr/bin/env node
/**
 * Starts the website's dev servers (docs/DEVELOPER_GUIDE.md at the
 * repository root). Run inside website/:
 *
 *   pnpm dev      CMS (Django + Wagtail) :3004 + public site (Next.js) :3002
 *
 * The CMS runs with backend/.venv's Python; the public site with the pnpm
 * that launched this script, so it works whether or not pnpm is on PATH.
 * Node built-ins only.
 */
import { spawn } from "node:child_process";
import { backendDir, backendPython, root } from "./python.mjs";

const pnpm = process.env["npm_execpath"];
const frontendArgs = ["--filter", "@zgate/website-frontend", "run", "dev"];
const [pnpmCommand, pnpmArgs] =
  pnpm && /\.c?js$/.test(pnpm)
    ? [process.execPath, [pnpm, ...frontendArgs]]
    : ["pnpm", frontendArgs];

const children = [
  spawn(backendPython(), ["manage.py", "runserver", "127.0.0.1:3004"], {
    cwd: backendDir,
    stdio: "inherit",
  }),
  spawn(pnpmCommand, pnpmArgs, {
    cwd: root,
    stdio: "inherit",
    shell: pnpmCommand === "pnpm" && process.platform === "win32",
  }),
];

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => children.forEach((child) => child.kill(signal)));
}
// If either server stops, stop the other and exit with its code.
for (const child of children) {
  child.on("exit", (code, signal) => {
    children.forEach((other) => other !== child && other.kill());
    process.exit(code ?? (signal ? 1 : 0));
  });
}
