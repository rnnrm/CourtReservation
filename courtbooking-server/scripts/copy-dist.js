#!/usr/bin/env node
/**
 * Copy contents of ../courtbooking-client/dist -> ./public
 * Delete existing public contents first. Robust to permission errors.
 */

import fs from "fs/promises";
import path from "path";

const root = process.cwd();
const clientDist = path.resolve(root, "../courtbooking-client/dist");
const publicDir = path.resolve(root, "public");

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function rmrfDirContents(dir) {
  try {
    const entries = await fs.readdir(dir);
    await Promise.all(entries.map(async (name) => {
      const p = path.join(dir, name);
      try {
        await fs.rm(p, { recursive: true, force: true });
      } catch (err) {
        // ignore permission or other delete errors (be conservative)
        console.warn(`Warning: could not remove ${p}: ${err.code || err.message}`);
      }
    }));
  } catch (err) {
    // If dir doesn't exist, that's fine
    if (err.code !== "ENOENT") {
      console.warn(`Warning while clearing ${dir}: ${err.message}`);
    }
  }
}

async function copyRecursive(src, dest) {
  try {
    const stat = await fs.stat(src);
    if (stat.isDirectory()) {
      await fs.mkdir(dest, { recursive: true });
      const entries = await fs.readdir(src);
      for (const entry of entries) {
        await copyRecursive(path.join(src, entry), path.join(dest, entry));
      }
    } else {
      await fs.mkdir(path.dirname(dest), { recursive: true });
      await fs.copyFile(src, dest);
    }
  } catch (err) {
    console.error(`Copy error from ${src} to ${dest}: ${err.message}`);
    throw err;
  }
}

async function main() {
  if (!(await exists(clientDist))) {
    console.error(`Client dist not found at ${clientDist}. Did you build the client?`);
    process.exitCode = 1;
    return;
  }

  // Clear public folder contents (but keep folder)
  await fs.mkdir(publicDir, { recursive: true });
  await rmrfDirContents(publicDir);

  // Copy clientDist contents into public
  await copyRecursive(clientDist, publicDir);

  console.log("Copied client dist -> public");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});