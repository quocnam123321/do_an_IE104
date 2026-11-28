import { readFile } from "node:fs/promises";
import { pool } from "./db.js";

try {
  const sql = await readFile(new URL("../seeds/development.sql", import.meta.url), "utf8");
  const result = await pool.query(sql);
  console.log("Số tài khoản mẫu mới:", result.rowCount);
} catch (error) {
  console.error("Tạo dữ liệu mẫu thất bại:", error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
