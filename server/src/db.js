import pg from "pg";

const connectionString = process.env.DATABASE_URL?.trim();
const protocol = URL.parse(connectionString ?? "")?.protocol;

if (protocol !== "postgresql:" && protocol !== "postgres:") {
  throw new Error("Cần cấu hình DATABASE_URL bằng URL kết nối PostgreSQL.");
}

export const pool = new pg.Pool({
  connectionString,
  connectionTimeoutMillis: 3000,
});

pool.on("error", (error) => {
  console.error("Mất kết nối PostgreSQL:", error.code ?? error.name);
});
