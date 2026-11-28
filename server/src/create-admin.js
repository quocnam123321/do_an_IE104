import { pool } from "./db.js";
import { hashPassword, normalizeUsername, requireValidPassword, validUsername } from "./auth-security.js";

try {
  const username = normalizeUsername(process.argv[2]);
  const password = process.env.IE104_ADMIN_PASSWORD;
  if (!validUsername(username)) throw new Error("Tên đăng nhập cần 3–32 ký tự hợp lệ.");
  requireValidPassword(password);

  const result = await pool.query(`
    INSERT INTO accounts (username, password_hash, role, status)
    VALUES ($1, $2, 'admin', 'active')
    ON CONFLICT (username) DO NOTHING
  `, [username, await hashPassword(password)]);

  if (!result.rowCount) throw new Error("Tên đăng nhập đã được sử dụng.");
  console.log("Đã tạo tài khoản quản trị viên:", username);
} catch (error) {
  console.error("Không thể tạo quản trị viên:", error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
