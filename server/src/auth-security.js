import { createHash, randomBytes } from "node:crypto";
import argon2 from "argon2";
import { pool } from "./db.js";

export const systemDemoEnabled = process.env.IE104_DEMO_MODE === "1";
export const demoStudentName = "Nguyễn Minh Anh";
const demoNames = { student: demoStudentName, lecturer: "ThS. Nguyễn Văn An" };

export function demoDisplayName(role) {
  return systemDemoEnabled ? demoNames[role] : undefined;
}
const sessionCookie = "ie104_session";
const sessionRoles = ["student", "lecturer", "admin"];
const sessionAge = 12 * 60 * 60 * 1000;
const passwordSettings = { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 };
const passwordMin = 6;

export class AuthError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const fingerprint = (token) => createHash("sha256").update(token).digest("hex");
export const createToken = () => randomBytes(32).toString("base64url");
export const isToken = (value) => typeof value === "string" && /^[a-zA-Z0-9_-]{43}$/.test(value);
export const isUuid = (value) => typeof value === "string" && /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(value);
export const normalizeUsername = (value) => typeof value === "string" ? value.trim().toLowerCase() : "";
export const validUsername = (value) => /^[a-z0-9][a-z0-9_.-]{2,31}$/.test(value);
export const hashPassword = (value) => argon2.hash(value, passwordSettings);
const dummyHash = await hashPassword(createToken());

export function requireValidPassword(value) {
  if (typeof value !== "string" || Array.from(value).length < passwordMin || value.length > 128) {
    throw new AuthError(400, "Mật khẩu phải dài từ 6 đến 128 ký tự.");
  }
}

export function verifyPassword(password, hash) {
  return argon2.verify(hash ?? dummyHash, password);
}

export function readCookie(request, name) {
  return request.get("cookie")?.split(";").map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(name + "="))?.slice(name.length + 1);
}

export function cookieOptions(request) {
  return { httpOnly: true, sameSite: "lax", secure: request.secure || process.env.APP_ORIGIN?.startsWith("https://"), path: "/" };
}

export function requireSameAccount(request, response, next) {
  const account = response.locals.account;
  if (request.get("x-ie104-account") && request.get("x-ie104-account") !== account.id) {
    throw new AuthError(409, "Tài khoản trong trình duyệt đã thay đổi. Vui lòng tải lại trang.");
  }
  next();
}

export function publicAccount(row) {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    displayName: demoDisplayName(row.role) || row.display_name || row.username || row.email || null,
    isDemo: row.is_demo === true,
    role: row.role,
    status: row.status,
  };
}

function roleCookie(role) {
  return systemDemoEnabled && sessionRoles.includes(role) ? sessionCookie + "_" + role : sessionCookie;
}

function requestedRole(request) {
  const role = request.get("x-ie104-role");
  return sessionRoles.includes(role) ? role : undefined;
}

export async function activeAccount(request, role) {
  const selectedRole = systemDemoEnabled && sessionRoles.includes(role) ? role : null;
  const names = selectedRole ? [roleCookie(selectedRole), sessionCookie] : [sessionCookie];
  if (systemDemoEnabled && !selectedRole) names.push(...sessionRoles.map(roleCookie));
  const tokens = [...new Set(names.map(name => readCookie(request, name)).filter(isToken))].map(fingerprint);
  if (!tokens.length) return null;

  const result = await pool.query(`
    SELECT accounts.*, sessions.token_hash AS session_token_hash,
      (google_identities.account_id IS NOT NULL) AS google_linked
    FROM sessions
    JOIN accounts ON accounts.id = sessions.account_id
    LEFT JOIN google_identities ON google_identities.account_id = accounts.id
    WHERE sessions.token_hash = ANY($1::text[]) AND sessions.expires_at > now() AND accounts.status = 'active'
      AND NOT accounts.is_locked
      AND (NOT accounts.is_demo OR $2) AND ($3::text IS NULL OR accounts.role = $3)
    ORDER BY array_position($1::text[], sessions.token_hash)
    LIMIT 1
  `, [tokens, systemDemoEnabled, selectedRole]);
  return result.rows[0] ?? null;
}

export function requiredRole(role) {
  return async (request, response, next) => {
    const account = await activeAccount(request, role ?? requestedRole(request));
    if (!account) throw new AuthError(401, "Bạn cần đăng nhập để tiếp tục.");
    if (role && account.role !== role) throw new AuthError(403, "Tài khoản của bạn không có quyền thực hiện thao tác này.");
    response.locals.account = account;
    next();
  };
}

export async function startSession(request, response, account, expectedPasswordHash = null) {
  const token = createToken();
  const name = roleCookie(account.role);
  const previous = [...new Set([readCookie(request, name), readCookie(request, sessionCookie)].filter(isToken))];
  const result = await pool.query(`
    INSERT INTO sessions (token_hash, account_id, expires_at)
    SELECT $1, id, now() + interval '12 hours'
    FROM accounts
    WHERE id = $2 AND status = 'active' AND NOT is_locked
      AND ($3::text IS NULL OR (password_hash = $3 AND username = $4))
    FOR SHARE
  `, [fingerprint(token), account.id, expectedPasswordHash, account.username]);
  if (!result.rowCount) throw new AuthError(409, "Thông tin tài khoản đã thay đổi. Vui lòng đăng nhập lại.");
  if (previous.length) {
    await pool.query(`
      DELETE FROM sessions USING accounts
      WHERE sessions.account_id = accounts.id AND sessions.token_hash = ANY($1::text[])
        AND ($2::text IS NULL OR accounts.role = $2)
    `, [previous.map(fingerprint), systemDemoEnabled ? account.role : null]);
  }
  const options = { ...cookieOptions(request), maxAge: sessionAge };
  const mainToken = readCookie(request, sessionCookie);
  if (systemDemoEnabled && isToken(mainToken) &&
      !sessionRoles.some(role => readCookie(request, roleCookie(role)) === mainToken)) {
    // Bảo toàn phiên được cấp trước khi trình duyệt có cookie riêng theo vai trò.
    const former = await activeAccount(request);
    if (former?.role !== account.role && former?.session_token_hash === fingerprint(mainToken) &&
        !isToken(readCookie(request, roleCookie(former.role)))) {
      response.cookie(roleCookie(former.role), mainToken, options);
    }
  }
  if (name !== sessionCookie) response.cookie(name, token, options);
  response.cookie(sessionCookie, token, options);
}

export async function endSession(request, response) {
  const mainToken = readCookie(request, sessionCookie);
  const options = cookieOptions(request);

  if (!systemDemoEnabled) {
    if (isToken(mainToken)) await pool.query("DELETE FROM sessions WHERE token_hash = $1", [fingerprint(mainToken)]);
    response.clearCookie(sessionCookie, options);
    return;
  }

  const hint = requestedRole(request);
  const account = await activeAccount(request, hint);
  if (account) await pool.query("DELETE FROM sessions WHERE token_hash = $1", [account.session_token_hash]);

  const name = roleCookie(hint ?? account?.role);
  if (name !== sessionCookie) response.clearCookie(name, options);
  if (name === sessionCookie || (isToken(mainToken) &&
      (mainToken === readCookie(request, name) || account?.session_token_hash === fingerprint(mainToken)))) {
    response.clearCookie(sessionCookie, options);
  }
}

export async function transaction(work) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}
