import express from "express";
import { assertWebsiteOrigin } from "./auth-routes.js";
import { AuthError, requiredRole, requireSameAccount, transaction } from "./auth-security.js";
import { pool } from "./db.js";
import { readMultipartForm } from "./multipart-upload.js";
import { insertFile, readImage, sendFile } from "./shared-files.js";

export const profileAvatarRouter = express.Router();
profileAvatarRouter.use((_request, response, next) => {
  response.set("Cache-Control", "no-store");
  next();
}, requiredRole(), requireSameAccount, (_request, response, next) => {
  if (!["student", "lecturer"].includes(response.locals.account.role)) {
    throw new AuthError(403, "Bạn không có quyền cập nhật ảnh đại diện.");
  }
  next();
});

profileAvatarRouter.get("/", async (_request, response) => {
  const { rows: [file] } = await pool.query(`
    SELECT f.content_type, f.content, f.file_name FROM accounts AS account
    JOIN files AS f ON f.id = account.avatar_file_id WHERE account.id = $1
  `, [response.locals.account.id]);
  if (!file) return response.status(204).end();
  sendFile(response, file, { inline: true });
});

profileAvatarRouter.put("/", (request, _response, next) => {
  assertWebsiteOrigin(request);
  if (!request.is("multipart/form-data")) throw new AuthError(415, "Yêu cầu cần có tệp ảnh đại diện.");
  next();
}, express.raw({ type: "multipart/form-data", limit: 2 * 1024 * 1024 + 64 * 1024, inflate: false }), async (request, response) => {
  const { id, role } = response.locals.account;
  const form = await readMultipartForm(request);
  const avatars = form.getAll("avatar");
  if (avatars.length !== 1) throw new AuthError(400, "Chọn một ảnh đại diện.");
  const types = role === "student" ? ["image/png", "image/jpeg", "image/webp"] : ["image/png", "image/jpeg"];
  const avatar = await readImage(avatars[0], 2, types);
  await transaction(async client => {
    const { rows: [account] } = await client.query("SELECT avatar_file_id FROM accounts WHERE id = $1 FOR UPDATE", [id]);
    const fileId = await insertFile(client, avatar);
    await client.query("UPDATE accounts SET avatar_file_id = $1 WHERE id = $2", [fileId, id]);
    if (account.avatar_file_id) await client.query("DELETE FROM files WHERE id = $1", [account.avatar_file_id]);
  });
  response.status(204).end();
});
