import express from "express";
import { pool } from "./db.js";
import { addAcademicTerm, saveAcademicRound } from "./academic-data.js";
import { listContactRequests, updateContactRequest } from "./contact-requests.js";
import { readAdminProposalFile } from "./admin-catalog-data.js";
import { sendFile } from "./shared-files.js";
import {
  AuthError, createToken, fingerprint, hashPassword, isUuid, normalizeUsername, requiredRole,
  requireValidPassword, systemDemoEnabled, transaction, validUsername,
} from "./auth-security.js";

export const adminRouter = express.Router();
adminRouter.use(requiredRole("admin"));

adminRouter.post("/academic/terms", async (request, response) => {
  response.status(201).json(await addAcademicTerm(request.body ?? {}));
});
adminRouter.post("/academic/rounds", async (request, response) => {
  response.status(201).json(await saveAcademicRound(request.body ?? {}));
});
adminRouter.patch("/academic/rounds/:id", async (request, response) => {
  response.json(await saveAcademicRound(request.body ?? {}, request.params.id));
});
adminRouter.get("/contacts", async (_request, response) => {
  response.json({ requests: await listContactRequests() });
});
adminRouter.patch("/contacts/:id", async (request, response) => {
  await updateContactRequest(request.params.id, request.body ?? {});
  response.status(204).end();
});
adminRouter.get("/catalog/proposals/:id/file", async (request, response) => {
  sendFile(response, await readAdminProposalFile(request.params.id));
});

const accountList = `
  SELECT a.id, a.username, a.email, COALESCE(p.full_name, a.display_name) AS display_name,
    a.account_code, a.is_locked, a.admin_revision, COALESCE(p.revision, 0) AS profile_revision,
    a.is_demo, a.role, a.status, a.created_at, (a.password_hash IS NOT NULL) AS can_reset,
    EXISTS (SELECT 1 FROM google_identities AS g WHERE g.account_id = a.id) AS google_linked
  FROM accounts AS a
  LEFT JOIN account_profiles AS p ON p.account_id = a.id
  WHERE a.role IN ('student', 'lecturer')
`;

function accountId(request) {
  const id = request.params.id;
  if (!isUuid(id)) throw new AuthError(400, "Tài khoản không hợp lệ.");
  return id;
}

const changedAccount = () => new AuthError(409, "Tài khoản đã thay đổi. Hãy tải lại danh sách và thử lại.");
const fieldError = (status, error, field) => Object.assign(new AuthError(status, error), { field });
const validRevision = (value) => Number.isInteger(value) && value >= 0 && value < 2147483647;

function accountFields(input, { editing = false, hasUsername = true, googleLinked = false } = {}) {
  const fullName = typeof input.fullName === "string" ? input.fullName.trim() : "";
  const code = typeof input.code === "string" ? input.code.trim() : null;
  if (!fullName || fullName.length > 100 || fullName.includes("\0")) {
    throw fieldError(400, "Nhập họ tên từ 1 đến 100 ký tự.", "fullName");
  }
  if (code === null || (!editing && !code) || code.length > 32 || code.includes("\0")) {
    throw fieldError(400, "Nhập MSSV hoặc mã giảng viên hợp lệ, tối đa 32 ký tự.", "code");
  }
  const username = hasUsername ? normalizeUsername(input.username) : null;
  if (hasUsername && !validUsername(username)) {
    throw fieldError(400, "Tên đăng nhập cần 3–32 ký tự, dùng chữ không dấu, số, dấu chấm, gạch dưới hoặc gạch ngang.", "username");
  }
  const requestedEmail = googleLinked ? "" : input.email ?? "";
  const email = typeof requestedEmail === "string" ? requestedEmail.trim() : null;
  if (email === null || (email && (email.length > 254 || !/^[^\s@\0]+@[^\s@\0]+\.[^\s@\0]+$/.test(email)))) {
    throw fieldError(400, "Nhập địa chỉ email hợp lệ.", "email");
  }
  return { fullName, code: code || null, username, email: email || null };
}

async function readAccount(client, id) {
  const { rows } = await client.query(accountList + " AND a.id = $1", [id]);
  return rows[0];
}

async function saveAccount(work) {
  try {
    return await transaction(work);
  } catch (error) {
    if (error.constraint === "accounts_username_key") {
      throw fieldError(409, "Tên đăng nhập này đã được sử dụng.", "username");
    }
    if (error.constraint === "accounts_role_account_code_key") {
      throw fieldError(409, "Mã này đã được sử dụng cho vai trò đã chọn.", "code");
    }
    throw error;
  }
}

adminRouter.get("/accounts", async (_request, response) => {
  const result = await pool.query(accountList + " ORDER BY a.created_at DESC, a.id DESC");
  response.json({ accounts: result.rows });
});

adminRouter.post("/accounts", async (request, response) => {
  const input = request.body ?? {};
  if (!["student", "lecturer"].includes(input.role)) throw fieldError(400, "Hãy chọn vai trò hợp lệ.", "role");
  const { fullName, code, username, email } = accountFields(input);
  requireValidPassword(input.password);
  const passwordHash = await hashPassword(input.password);
  const account = await saveAccount(async (client) => {
    const { rows: [created] } = await client.query(`
      INSERT INTO accounts (display_name, account_code, username, email, password_hash, role, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'active')
      RETURNING id
    `, [fullName, code, username, email, passwordHash, input.role]);
    return readAccount(client, created.id);
  });
  response.status(201).json({ account });
});

adminRouter.patch("/accounts/:id", async (request, response) => {
  const id = accountId(request);
  const input = request.body ?? {};
  if (!validRevision(input.revision) || !validRevision(input.profileRevision)) throw changedAccount();
  const account = await saveAccount(async (client) => {
    const { rows: [target] } = await client.query(`
      SELECT role FROM accounts
      WHERE id = $1 AND role IN ('student', 'lecturer') AND status = 'active'
        AND NOT is_demo AND NOT is_locked AND admin_revision = $2
      FOR UPDATE
    `, [id, input.revision]);
    if (!target) throw changedAccount();
    if (input.role !== target.role) throw fieldError(400, "Vai trò hiện tại của tài khoản được giữ cố định.", "role");
    const current = await readAccount(client, id);
    const { rows: [profile] } = await client.query("SELECT revision FROM account_profiles WHERE account_id = $1 FOR UPDATE", [id]);
    if ((profile?.revision ?? 0) !== input.profileRevision) throw changedAccount();
    const { fullName, code, username, email } = accountFields(input, {
      editing: true, hasUsername: current.username !== null, googleLinked: current.google_linked,
    });
    await client.query(`
      UPDATE accounts SET display_name = $2, account_code = $3, username = $4,
        email = $5, admin_revision = admin_revision + 1 WHERE id = $1
    `, [id, fullName, code, username, current.google_linked ? current.email : email]);
    if (profile) {
      await client.query(`
        UPDATE account_profiles SET full_name = $2, revision = revision + 1
        WHERE account_id = $1 AND full_name IS DISTINCT FROM $2
      `, [id, fullName]);
    }
    return readAccount(client, id);
  });
  response.json({ account });
});

adminRouter.patch("/accounts/:id/lock", async (request, response) => {
  const id = accountId(request);
  const { locked, revision } = request.body ?? {};
  if (typeof locked !== "boolean" || !validRevision(revision)) throw new AuthError(400, "Thông tin khóa tài khoản không hợp lệ.");
  const account = await transaction(async (client) => {
    const updated = await client.query(`
      UPDATE accounts SET is_locked = $2, admin_revision = admin_revision + 1
      WHERE id = $1 AND role IN ('student', 'lecturer') AND status = 'active'
        AND NOT is_demo AND is_locked <> $2 AND admin_revision = $3
    `, [id, locked, revision]);
    if (!updated.rowCount) throw changedAccount();
    if (locked) {
      await client.query("DELETE FROM sessions WHERE account_id = $1", [id]);
      await client.query("DELETE FROM password_reset_codes WHERE account_id = $1", [id]);
    }
    return readAccount(client, id);
  });
  response.json({ account });
});

adminRouter.post("/accounts/:id/reset-codes", async (request, response) => {
  if (systemDemoEnabled) throw new AuthError(404, "Bản demo chỉ hiển thị mã minh họa.");
  const id = accountId(request);
  const code = createToken();
  const result = await pool.query(`
    INSERT INTO password_reset_codes (account_id, code_hash, issued_by_account_id, expires_at)
    SELECT id, $2, $3, now() + interval '20 minutes' FROM accounts
    WHERE id = $1 AND role IN ('student', 'lecturer') AND status = 'active' AND NOT is_locked AND password_hash IS NOT NULL
    FOR SHARE
    ON CONFLICT (account_id) DO UPDATE SET
      code_hash = EXCLUDED.code_hash,
      issued_by_account_id = EXCLUDED.issued_by_account_id,
      expires_at = EXCLUDED.expires_at
    RETURNING expires_at
  `, [id, fingerprint(code), response.locals.account.id]);
  if (!result.rowCount) throw new AuthError(409, "Tài khoản này chưa thể đặt lại mật khẩu.");
  response.status(201).json({ code, expiresAt: result.rows[0].expires_at });
});
