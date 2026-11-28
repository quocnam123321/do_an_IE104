import { readdir, readFile } from "node:fs/promises";
import { pool } from "./db.js";

const migrationsDir = new URL("../migrations/", import.meta.url);

async function migrate() {
  const names = await readdir(migrationsDir);
  const migrations = names.filter((name) => /^\d{3}-.+\.(sql|js)$/.test(name)).sort();
  const client = await pool.connect();
  const applied = [];

  try {
    await client.query("BEGIN");
    // Khóa đến hết giao dịch để hai tiến trình không chạy cùng một migration.
    await client.query("SELECT pg_advisory_xact_lock(104, 1)");
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    const alreadyApplied = await client.query("SELECT name FROM schema_migrations");
    const appliedNames = new Set(alreadyApplied.rows.map((row) => row.name));

    for (const name of migrations) {
      if (appliedNames.has(name)) continue;

      const file = new URL(name, migrationsDir);
      if (name.endsWith(".sql")) await client.query(await readFile(file, "utf8"));
      else await (await import(file.href)).default(client);
      await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [name]);
      applied.push(name);
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }

  console.log(applied.length ? "Đã áp dụng: " + applied.join(", ") : "Database đã cập nhật.");
}

try {
  await migrate();
} catch (error) {
  console.error("Chạy migration thất bại:", error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
