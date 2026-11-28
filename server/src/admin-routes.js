import express from "express";
import { pool } from "./db.js";
import { AuthError, createToken, fingerprint, requiredRole } from "./auth-security.js";

export const adminRouter = express.Router();
adminRouter.use(requiredRole("admin"));

const validAccountId = (id) => /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(id);

adminRouter.get("/accounts", async (_request, response) => {
  const result = await pool.query(`
    SELECT id, username, email, display_name, is_demo, role, status, created_at, (password_hash IS NOT NULL) AS can_reset
    FROM accounts
    WHERE role IN ('student', 'lecturer')
    ORDER BY created_at DESC, id DESC
  `);
  response.json({ accounts: result.rows });
});

adminRouter.post("/accounts/:id/reset-codes", async (request, response) => {
  const id = request.params.id;
  if (!validAccountId(id)) throw new AuthError(400, "Tài khoản không hợp lệ.");
  const code = createToken();
  const result = await pool.query(`
    INSERT INTO password_reset_codes (account_id, code_hash, issued_by_account_id, expires_at)
    SELECT id, $2, $3, now() + interval '20 minutes' FROM accounts
    WHERE id = $1 AND role IN ('student', 'lecturer') AND status = 'active' AND password_hash IS NOT NULL
    ON CONFLICT (account_id) DO UPDATE SET
      code_hash = EXCLUDED.code_hash,
      issued_by_account_id = EXCLUDED.issued_by_account_id,
      expires_at = EXCLUDED.expires_at
    RETURNING expires_at
  `, [id, fingerprint(code), response.locals.account.id]);
  if (!result.rowCount) throw new AuthError(409, "Tài khoản này chưa thể đặt lại mật khẩu.");
  response.status(201).json({ code, expiresAt: result.rows[0].expires_at });
});
