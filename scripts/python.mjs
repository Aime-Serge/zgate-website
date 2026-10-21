/**
 * The CMS's Python: backend/.venv when it exists (docs/DEVELOPER_GUIDE.md,
 * "Get running"), otherwise `python` on PATH. Node built-ins only.
 */
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const root = fileURLToPath(new URL("..", import.meta.url));
export const backendDir = path.join(root, "backend");

export function backendPython() {
  const venv =
    process.platform === "win32"
      ? path.join(backendDir, ".venv", "Scripts", "python.exe")
      : path.join(backendDir, ".venv", "bin", "python");
  return existsSync(venv) ? venv : "python";
}
