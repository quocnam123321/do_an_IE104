import express from "express";
import { rateLimit } from "express-rate-limit";
import { OAuth2Client } from "google-auth-library";
import { pool } from "./db.js";
import {
  AuthError, adminDemoEnabled, cookieOptions, createToken, endSession, fingerprint, hashPassword, isToken,
  normalizeUsername, publicAccount, readCookie, requiredRole, requireValidPassword,
  startSession, systemDemoEnabled, transaction, validUsername, verifyPassword,
} from "./auth-security.js";

const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim() || "";
const google = new OAuth2Client(googleClientId);
const googleCookie = "ie104_google_nonce";
const demoRecoveryCookie = "ie104_demo_recovery";
const demoRecoveryCookieAge = 30 * 24 * 60 * 60 * 1000;


export const authRouter = express.Router();

export function assertWebsiteOrigin(request) {
  const configured = process.env.APP_ORIGIN?.trim();
  const expected = configured || request.protocol + "://" + request.get("host");
  if (request.get("origin") !== expected) throw new AuthError(403, "Yêu cầu phải được gửi từ website IE104.");
}

export function sameOrigin(request, _response, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return next();
  assertWebsiteOrigin(request);
  if (!request.is("application/json")) throw new AuthError(415, "Yêu cầu cần có nội dung JSON.");
  next();
}

function authRateLimit(limit) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Bạn đã thực hiện quá nhiều yêu cầu. Vui lòng thử lại sau." },
  });
}

function roleForSignup(role) {
  if (role !== "student" && role !== "lecturer") {
    throw new AuthError(400, "Chọn vai trò Sinh viên hoặc Giảng viên.");
  }
  return role;
}

function rejectInactive(account) {
  if (account.is_locked) throw new AuthError(403, "Tài khoản đã bị khóa.");
  if (account.status !== "active") throw new AuthError(403, "Tài khoản hiện chưa hoạt động.");
}

function validDemoEmail(email) {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+$/.test(email);
}

function demoRecoveryKey(browser, email) {
  return [fingerprint(browser), fingerprint(`${browser}:${email}`)];
}

async function startDemoSession(request, response, role) {
  const { rows: [account] } = await pool.query(
    "SELECT * FROM accounts WHERE role = $1 AND is_demo AND status = 'active'", [role],
  );
  if (!account) throw new AuthError(503, "Tài khoản minh họa chưa khả dụng.");
  await startSession(request, response, account);
  response.json({ account: publicAccount(account) });
}

authRouter.use((_request, response, next) => {
  response.set("Cache-Control", "no-store");
  next();
});
authRouter.use(sameOrigin, express.json({ limit: "16kb" }));

authRouter.get("/config", (_request, response) => response.json({
  mode: "database", googleClientId: googleClientId || null, systemDemo: systemDemoEnabled, adminDemo: adminDemoEnabled,
}));

authRouter.post("/demo/login", authRateLimit(30), async (request, response) => {
  if (!systemDemoEnabled) throw new AuthError(404, "Bản này chưa bật tài khoản minh họa.");
  const role = request.body?.role;
  if (role === "admin" && !adminDemoEnabled) throw new AuthError(404, "Tài khoản quản trị minh họa chưa được bật.");
  if (role !== "admin" && role !== "student" && role !== "lecturer") {
    throw new AuthError(400, "Chọn vai trò minh họa hợp lệ.");
  }
  await startDemoSession(request, response, role);
});

authRouter.post("/demo/password/reset", authRateLimit(15), async (request, response) => {
  if (!systemDemoEnabled) throw new AuthError(404, "Bản này chưa bật tài khoản minh họa.");
  const { email: rawEmail, password } = request.body ?? {};
  const email = normalizeUsername(rawEmail);
  if (!validDemoEmail(email)) throw new AuthError(400, "Email không hợp lệ.");
  requireValidPassword(password);
  if (Array.from(password).length < 8 || !/\p{L}/u.test(password) || !/\p{Nd}/u.test(password)) {
    throw new AuthError(400, "Tối thiểu 8 ký tự, có cả chữ và số.");
  }

  const cookie = readCookie(request, demoRecoveryCookie);
  const browser = isToken(cookie) ? cookie : createToken();
  const passwordHash = await hashPassword(password);
  await pool.query(`
    INSERT INTO demo_recovery_passwords (browser_hash, email_hash, password_hash)
    VALUES ($1, $2, $3)
    ON CONFLICT (browser_hash, email_hash) DO UPDATE SET password_hash = EXCLUDED.password_hash
  `, [...demoRecoveryKey(browser, email), passwordHash]);
  response.cookie(demoRecoveryCookie, browser, {
    ...cookieOptions(request), path: "/api/auth", maxAge: demoRecoveryCookieAge,
  });
  response.status(204).end();
});

authRouter.post("/register", authRateLimit(12), async (request, response) => {
  const { username: rawUsername, password, email: rawEmail, role: selectedRole } = request.body ?? {};
  const username = normalizeUsername(rawUsername);
  const role = roleForSignup(selectedRole);
  if (!validUsername(username)) {
    throw new AuthError(400, "Tên đăng nhập cần 3–32 ký tự, dùng chữ không dấu, số, dấu chấm, gạch dưới hoặc gạch ngang.");
  }

  requireValidPassword(password);
  if (rawEmail != null && typeof rawEmail !== "string") throw new AuthError(400, "Email không hợp lệ.");
  const email = rawEmail?.trim() || null;
  if (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    throw new AuthError(400, "Email không hợp lệ.");
  }

  const passwordHash = await hashPassword(password);
  const result = await pool.query(`
    INSERT INTO accounts (username, password_hash, email, role, status)
    VALUES ($1, $2, $3, $4, 'active')
    ON CONFLICT (username) DO NOTHING
    RETURNING id, username, email, role, status
  `, [username, passwordHash, email, role]);
  if (!result.rowCount) throw new AuthError(409, "Tên đăng nhập đã được sử dụng.");
  response.status(201).json({ account: publicAccount(result.rows[0]) });
});

authRouter.post("/login", authRateLimit(20), async (request, response) => {
  const { username: rawUsername, password } = request.body ?? {};
  const username = normalizeUsername(rawUsername);
  const demoEmail = systemDemoEnabled && validDemoEmail(username);
  if ((!demoEmail && !validUsername(username)) || typeof password !== "string" || !password || password.length > 128) {
    throw new AuthError(401, "Tên đăng nhập hoặc mật khẩu không đúng.");
  }

  if (demoEmail) {
    const browser = readCookie(request, demoRecoveryCookie);
    let passwordHash;
    if (isToken(browser)) {
      const { rows: [credential] } = await pool.query(`
        SELECT password_hash FROM demo_recovery_passwords WHERE browser_hash = $1 AND email_hash = $2
      `, demoRecoveryKey(browser, username));
      passwordHash = credential?.password_hash;
    }
    const matches = await verifyPassword(password, passwordHash);
    if (!matches || !passwordHash) throw new AuthError(401, "Email demo hoặc mật khẩu không đúng.");
    return startDemoSession(request, response, "student");
  }

  const result = await pool.query("SELECT * FROM accounts WHERE username = $1", [username]);
  const account = result.rows[0];
  const matches = await verifyPassword(password, account?.password_hash);
  if (!matches || !account?.password_hash) throw new AuthError(401, "Tên đăng nhập hoặc mật khẩu không đúng.");

  rejectInactive(account);
  await startSession(request, response, account, account.password_hash);
  response.json({ account: publicAccount(account) });
});

authRouter.get("/session", requiredRole(), (_request, response) => {
  const account = response.locals.account;
  response.json({ account: { ...publicAccount(account), googleLinked: account.google_linked } });
});

authRouter.post("/logout", async (request, response) => {
  await endSession(request, response);
  response.status(204).end();
});

authRouter.post("/password/reset", authRateLimit(15), async (request, response) => {
  if (systemDemoEnabled) throw new AuthError(404, "Bản demo chỉ mô phỏng đặt lại mật khẩu.");
  const { username: rawUsername, code, password } = request.body ?? {};
  const username = normalizeUsername(rawUsername);
  if (!validUsername(username) || !isToken(code)) throw new AuthError(400, "Mã đặt lại không hợp lệ hoặc đã hết hạn.");
  requireValidPassword(password);

  const passwordHash = await hashPassword(password);
  await transaction(async (client) => {
    const { rows: [account] } = await client.query(`
      SELECT id FROM accounts WHERE username = $1 AND status = 'active' AND NOT is_locked FOR UPDATE
    `, [username]);
    if (!account) throw new AuthError(400, "Mã đặt lại không hợp lệ hoặc đã hết hạn.");
    const result = await client.query(`
      DELETE FROM password_reset_codes WHERE account_id = $1 AND code_hash = $2 AND expires_at > now()
    `, [account.id, fingerprint(code)]);
    if (!result.rowCount) throw new AuthError(400, "Mã đặt lại không hợp lệ hoặc đã hết hạn.");
    await client.query("UPDATE accounts SET password_hash = $1 WHERE id = $2", [passwordHash, account.id]);
    await client.query("DELETE FROM sessions WHERE account_id = $1", [account.id]);
  });
  response.status(204).end();
});

function requireGoogle() {
  if (!googleClientId) throw new AuthError(503, "Đăng nhập Google chưa được cấu hình.");
}

function authoritativeEmail(profile) {
  const email = profile.email.trim().toLowerCase();
  const hosted = typeof profile.hd === "string" && profile.hd.trim();
  return email.endsWith("@gmail.com") || hosted ? email : null;
}

authRouter.post("/google/challenge", authRateLimit(40), async (request, response) => {
  requireGoogle();
  const nonce = createToken();
  const previous = readCookie(request, googleCookie);
  await transaction(async (client) => {
    await client.query("DELETE FROM google_auth_challenges WHERE expires_at <= now() OR nonce_hash = $1",
      [isToken(previous) ? fingerprint(previous) : null]);
    await client.query("INSERT INTO google_auth_challenges (nonce_hash, expires_at) VALUES ($1, now() + interval '10 minutes')",
      [fingerprint(nonce)]);
  });
  response.cookie(googleCookie, nonce, { ...cookieOptions(request), maxAge: 600000 });
  response.json({ nonce });
});

async function googleProfile(request, response) {
  requireGoogle();
  const credential = request.body?.credential;
  const nonce = readCookie(request, googleCookie);
  if (typeof credential !== "string" || !credential || !isToken(nonce)) {
    throw new AuthError(401, "Phiên xác thực Google đã hết hạn. Hãy thử lại.");
  }

  let payload;
  try {
    const ticket = await google.verifyIdToken({ idToken: credential, audience: googleClientId });
    payload = ticket.getPayload();
  } catch {
    throw new AuthError(401, "Không xác minh được tài khoản Google.");
  }

  if (!payload?.sub || typeof payload.email !== "string" || !payload.email.trim() ||
      payload.email_verified !== true || payload.nonce !== nonce) {
    throw new AuthError(401, "Không xác minh được tài khoản Google.");
  }
  const consumed = await pool.query(`
    DELETE FROM google_auth_challenges WHERE nonce_hash = $1 AND expires_at > now()
  `, [fingerprint(nonce)]);
  response.clearCookie(googleCookie, cookieOptions(request));
  if (!consumed.rowCount) throw new AuthError(401, "Phiên xác thực Google đã hết hạn. Hãy thử lại.");
  return payload;
}

authRouter.post("/google", authRateLimit(30), async (request, response) => {
  const profile = await googleProfile(request, response);

  const result = await pool.query(`
    SELECT accounts.* FROM google_identities
    JOIN accounts ON accounts.id = google_identities.account_id
    WHERE google_sub = $1
  `, [profile.sub]);
  const existing = result.rows[0];

  if (existing) {
    if (request.body?.role && request.body.role !== existing.role) {
      throw new AuthError(409, "Tài khoản Google đã được đăng ký với vai trò khác. Hãy đăng nhập để tiếp tục.");
    }
    rejectInactive(existing);
    await pool.query(`
      UPDATE google_identities SET authoritative_email = $2
      WHERE google_sub = $1 AND authoritative_email IS DISTINCT FROM $2
    `, [profile.sub, authoritativeEmail(profile)]);
    await startSession(request, response, existing);
    return response.json({ account: publicAccount(existing) });
  }

  if (!request.body?.role) throw new AuthError(404, "Tài khoản Google chưa được đăng ký. Hãy mở trang Đăng ký.");

  const role = roleForSignup(request.body.role);
  const account = await transaction(async (client) => {
    const inserted = await client.query(`
      INSERT INTO accounts (email, role, status)
      VALUES ($1, $2, 'active')
      RETURNING *
    `, [profile.email, role]);

    try {
      await client.query(`
        INSERT INTO google_identities (google_sub, account_id, authoritative_email) VALUES ($1, $2, $3)
      `, [profile.sub, inserted.rows[0].id, authoritativeEmail(profile)]);
    } catch (error) {
      if (error.code === "23505") throw new AuthError(409, "Tài khoản Google đã được đăng ký. Hãy thử đăng nhập.");
      throw error;
    }
    return inserted.rows[0];
  });

  await startSession(request, response, account);
  response.status(201).json({ account: publicAccount(account) });
});

authRouter.post("/google/link", authRateLimit(30), requiredRole(), async (request, response) => {
  const account = response.locals.account;
  if (account.is_demo) throw new AuthError(403, "Tài khoản minh họa dùng phiên đăng nhập riêng cho demo.");
  if (account.role === "admin") throw new AuthError(403, "Quản trị viên đăng nhập bằng tài khoản do nhóm cấp.");
  const profile = await googleProfile(request, response);

  const result = await pool.query(`
    INSERT INTO google_identities (google_sub, account_id, authoritative_email)
    VALUES ($1, $2, $3) ON CONFLICT DO NOTHING
  `, [profile.sub, account.id, authoritativeEmail(profile)]);
  if (!result.rowCount) throw new AuthError(409, "Google đã được liên kết với một tài khoản hoặc tài khoản này đã liên kết Google.");
  response.status(204).end();
});
