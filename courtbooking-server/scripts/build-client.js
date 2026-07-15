#!/usr/bin/env node
/**
 * Cross-platform script to ensure courtbooking-client dev deps are installed
 * and then run its build. Exits non-zero on failure.
 */

import { spawnSync } from "child_process";
import path from "path";

const clientDir = path.resolve(process.cwd(), "../courtbooking-client");

function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, { stdio: "inherit", shell: true, ...opts });
  if (res.error) throw res.error;
  if (res.status !== 0) throw new Error(`Command failed: ${cmd} ${args.join(" ")}`);
}

try {
  // Prefer a clean ci; if CI runs in production mode and doesn't install devDeps,
  // npm ci might still succeed but won't provide build tools. We try ci first,
  // then explicitly install with dev deps if needed.
  try {
    console.log("-> npm ci (client)");
    run("npm", ["--prefix", clientDir, "ci"]);
  } catch (ciErr) {
    console.warn("npm ci failed, falling back to install with dev deps:", ciErr.message);
    run("npm", ["--prefix", clientDir, "install", "--include=dev"]);
  }

  console.log("-> npm run build (client)");
  run("npm", ["--prefix", clientDir, "run", "build"]);
  console.log("Client build succeeded.");
  process.exit(0);
} catch (err) {
  console.error("Client build failed:", err.message || err);
  process.exit(1);
}