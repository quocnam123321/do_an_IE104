import express from "express";
import { sameOrigin } from "./auth-routes.js";
import { AuthError, demoDisplayName, requiredRole, requireSameAccount } from "./auth-security.js";
import { pool } from "./db.js";

export const profileRouter = express.Router();
profileRouter.use((_request, response, next) => {
  response.set("Cache-Control", "no-store");
  next();
}, requiredRole(), requireSameAccount, (_request, response, next) => {
  if (!["student", "lecturer"].includes(response.locals.account.role)) {
    throw new AuthError(403, "Bạn không có quyền chỉnh sửa hồ sơ cá nhân.");
  }
  next();
});

const fields = "full_name AS name, contact_email AS email, phone, expertise, revision";
const fixedName = (account) => account.role === "lecturer" ? demoDisplayName(account.role) : undefined;

function profileInput(account, input) {
  const lecturer = account.role === "lecturer";
  if (![input.name, input.email, input.phone, lecturer ? input.expertise : ""].every(value => typeof value === "string")) {
    throw new AuthError(400, "Thông tin hồ sơ không hợp lệ.");
  }
  const name = fixedName(account) ?? input.name.trim();
  const email = input.email.trim();
  const phone = input.phone.trim().replace(/[\s().-]/g, "");
  const expertise = lecturer ? input.expertise.trim() : "";
  const { revision } = input;
  if (!Number.isInteger(revision) || revision < 0 || revision >= 2147483647) {
    throw new AuthError(400, "Phiên bản hồ sơ không hợp lệ. Vui lòng mở lại hộp thoại.");
  }
  if (!name || name.length > 100 || name.includes("\0")) throw new AuthError(400, "Nhập họ tên từ 1 đến 100 ký tự.");
  if ((lecturer || email) && (email.length > 254 || !/^[^\s@\0]+@[^\s@\0]+\.[^\s@\0]+$/.test(email))) {
    throw new AuthError(400, "Nhập email hợp lệ.");
  }
  if (phone && !/^\+?\d{7,15}$/.test(phone)) throw new AuthError(400, "Số điện thoại cần có 7 đến 15 chữ số.");
  if (expertise.length > 500 || expertise.includes("\0")) throw new AuthError(400, "Chuyên môn tối đa 500 ký tự.");
  return { name, email, phone, expertise, revision };
}

profileRouter.get("/", async (_request, response) => {
  const account = response.locals.account;
  const { rows: [profile] } = await pool.query(`SELECT ${fields} FROM account_profiles WHERE account_id = $1`, [account.id]);
  response.json({ profile: {
    email: "", phone: "", expertise: "", revision: 0, ...profile,
    name: fixedName(account) ?? profile?.name ?? account.display_name ?? account.username ?? "",
  } });
});

profileRouter.patch("/", sameOrigin, express.json({ limit: "8kb" }), async (request, response) => {
  const account = response.locals.account;
  const { name, email, phone, expertise, revision } = profileInput(account, request.body ?? {});
  const values = [account.id, name, email, phone, expertise];
  const result = revision === 0 ? await pool.query(`
    INSERT INTO account_profiles (account_id, full_name, contact_email, phone, expertise)
    VALUES ($1, $2, $3, $4, $5) ON CONFLICT (account_id) DO NOTHING
    RETURNING ${fields}
  `, values) : await pool.query(`
    UPDATE account_profiles
    SET full_name = $2, contact_email = $3, phone = $4, expertise = $5, revision = revision + 1
    WHERE account_id = $1 AND revision = $6
    RETURNING ${fields}
  `, [...values, revision]);
  if (!result.rowCount) throw new AuthError(409, "Hồ sơ đã thay đổi ở nơi khác. Hãy mở lại hộp thoại để tải thông tin mới.");
  response.json({ profile: result.rows[0] });
});
