/* ==========================================================================
   Ultra Hotel — reset the local store

   Wipes reservations, enquiries and subscribers so a demo or a test run starts
   from a clean slate. Pass --yes to skip the prompt (used by CI and scripts).

   This only touches data/. Nothing under public/, shared/ or server/ is read
   or written, so it is safe to run while the site is up — but stop the server
   first if you are on Windows, where SQLite holds a lock on the file.
   ========================================================================== */

import { existsSync, rmSync } from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");
const TARGETS = ["reservations.db", "reservations.db-journal", "reservations.db-wal", "reservations.db-shm", "reservations.json"];

const found = TARGETS.map((f) => path.join(DATA_DIR, f)).filter((f) => existsSync(f));

if (!found.length) {
  console.log("Nothing to reset — no store found in " + DATA_DIR);
  process.exit(0);
}

if (!process.argv.includes("--yes")) {
  console.log("This will permanently delete:");
  for (const f of found) console.log("  " + path.relative(process.cwd(), f));
  console.log("\nRe-run with --yes to confirm.");
  process.exit(1);
}

for (const f of found) {
  rmSync(f, { force: true });
  console.log("removed  " + path.relative(process.cwd(), f));
}

console.log("\nStore reset. The next start recreates it empty.");
