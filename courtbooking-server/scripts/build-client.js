#!/usr/bin/env node
import { spawnSync } from "child_process";
import path from "path";
import fs from "fs";

const clientDir = path.resolve(process.cwd(), "../courtbooking-client");
const viteBin = path.join(clientDir, "node_modules", ".bin", "vite");

function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, { stdio: "inherit", shell: true, ...opts });
  if (res.error) throw res.error;
  if (res.status !== 0) throw new Error(`Command failed: ${cmd} ${args.join(" ")}`);
}

function exists(p) {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
}

try {
  console.log("-> npm ci (client)");
  // Try a clean CI install first
  try {
    run("npm", ["--prefix", clientDir, "ci"]);
  } catch (ciErr) {
    console.warn("npm ci failed, falling back to npm install --include=dev:", ciErr.message);
    run("npm", ["--prefix", clientDir, "install", "--include=dev"]);
  }

  // If vite binary does not exist, install dev deps explicitly
  if (!exists(viteBin)) {
    console.log("vite binary not found after npm ci — installing devDependencies for client");
    run("npm", ["--prefix", clientDir, "install", "--include=dev"]);
  } else {
    console.log("vite binary found.");
  }

  console.log("-> npm run build (client)");
  run("npm", ["--prefix", clientDir, "run", "build"]);
  console.log("Client build succeeded.");
  process.exit(0);
} catch (err) {
  console.error("Client build failed:", err.message || err);
  process.exit(1);
}