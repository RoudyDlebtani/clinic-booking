import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { pool } from "../db/client";

/**
 * Applies the authoritative schema in db/init.sql. The DDL is idempotent
 * (create ... if not exists, drop+add for the exclusion constraint), so it is
 * safe to re-run.
 */
async function main() {
  const here = dirname(fileURLToPath(import.meta.url));
  const sqlPath = join(here, "..", "db", "init.sql");
  const sql = await readFile(sqlPath, "utf8");

  console.log("Applying schema from db/init.sql…");
  await pool.query(sql);
  console.log("✓ Schema applied.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
