#!/usr/bin/env node
/**
 * Best-effort cleanup for .next and public content. Non-fatal if files cannot be removed.
 */

import fs from "fs/promises";
import path from "path";

const root = process.cwd();
const targets = [path.join(root, ".next"), path.join(root, "public")];

async function rmForce(p) {
  try {
    await fs.rm(p, { recursive: true, force: true });
    console.log(`Removed ${p}`);
  } catch (err) {
    console.warn(`Could not remove ${p}: ${err.code || err.message}`);
  }
}

async function main() {
  for (const t of targets) {
    await rmForce(t);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});