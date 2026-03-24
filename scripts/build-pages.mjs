import { existsSync, mkdirSync, renameSync, rmSync } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const root = process.cwd();
const cleanupTargets = [".next", "out", "tsconfig.tsbuildinfo"];
const hiddenDir = path.join(root, ".pages-build-temp");
const apiSource = path.join(root, "src", "app", "api");
const apiBackup = path.join(hiddenDir, "api");

for (const target of cleanupTargets) {
  rmSync(path.join(root, target), {
    force: true,
    recursive: true
  });
}

rmSync(hiddenDir, {
  force: true,
  recursive: true
});
mkdirSync(hiddenDir, { recursive: true });

if (existsSync(apiSource)) {
  renameSync(apiSource, apiBackup);
}

function restoreApiRoutes() {
  if (existsSync(apiBackup) && !existsSync(apiSource)) {
    renameSync(apiBackup, apiSource);
  }
  rmSync(hiddenDir, {
    force: true,
    recursive: true
  });
}

const child = spawn(process.execPath, [path.join(root, "node_modules", "next", "dist", "bin", "next"), "build"], {
  cwd: root,
  env: {
    ...process.env,
    STATIC_EXPORT: "true",
    NEXT_PUBLIC_STATIC_EXPORT: "true",
    CF_PAGES: process.env.CF_PAGES ?? "1"
  },
  stdio: "inherit"
});

child.on("exit", (code) => {
  restoreApiRoutes();
  process.exit(code ?? 1);
});

child.on("error", (error) => {
  restoreApiRoutes();
  console.error(error);
  process.exit(1);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    restoreApiRoutes();
    process.exit(1);
  });
}

