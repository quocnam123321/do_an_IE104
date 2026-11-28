import { isIP } from "node:net";
import express from "express";
import { ipKeyGenerator, rateLimit } from "express-rate-limit";
import { pool } from "./db.js";
import { AuthError, activeAccount } from "./auth-security.js";
import { sameOrigin } from "./auth-routes.js";

const columns = 'id, name, email, phone, subject, message, role, status, revision, sent_at AS "sentAt"';
const statuses = ["new", "processing", "resolved"];
const renderHostname = process.env.RENDER_EXTERNAL_HOSTNAME;

export const contactRouter = express.Router();
contactRouter.post("/", sameOrigin, rateLimit({
  windowMs: 15 * 60000, limit: 12, standardHeaders: "draft-8", legacyHeaders: false,
  keyGenerator: request => {
    // Cloudflare xác thực header này trên miền công khai của Render.
    const publicIp = renderHostname && request.hostname === renderHostname && request.get("cf-connecting-ip");
    return ipKeyGenerator(publicIp && isIP(publicIp) ? publicIp : request.ip);
  },
  message: { error: "Bạn đã gửi quá nhiều lời nhắn. Hãy thử lại sau." },
}), express.json({ limit: "32kb" }), async (request, response) => {
  const fields = [["name", 120], ["email", 254], ["phone", 32], ["subject", 160], ["message", 5000]];
  const values = fields.map(([key, limit]) => {
    const value = request.body?.[key] ?? "";
    if (typeof value !== "string" || value.length > limit || value.includes("\0") || (key !== "phone" && !value.trim())) {
      throw new AuthError(400, "Thông tin liên hệ không hợp lệ.");
    }
    return value.trim();
  });
  if (!/^[^\s@]+@[^\s@]+$/.test(values[1])) throw new AuthError(400, "Nhập địa chỉ email hợp lệ.");
  const account = await activeAccount(request);
  const { rows: [item] } = await pool.query(`
    INSERT INTO contact_requests (name,email,phone,subject,message,account_id,role)
    VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id
  `, [...values, account?.id ?? null, account?.role ?? "guest"]);
  response.status(201).json(item);
});

export async function listContactRequests() {
  const { rows } = await pool.query("SELECT " + columns + " FROM contact_requests ORDER BY sent_at DESC,id DESC");
  return rows;
}

export async function updateContactRequest(id, { revision, status } = {}) {
  if (!/^\d+$/.test(id) || Number(id) > 2147483647 || !Number.isInteger(revision) ||
      revision < 0 || revision >= 2147483647 || !statuses.includes(status)) {
    throw new AuthError(400, "Trạng thái xử lý không hợp lệ.");
  }
  const result = await pool.query(`
    UPDATE contact_requests SET status=$1,revision=revision+1 WHERE id=$2 AND revision=$3
  `, [status, id, revision]);
  if (!result.rowCount) throw new AuthError(409, "Trạng thái đã thay đổi. Hãy đóng và mở lại lời nhắn.");
}
