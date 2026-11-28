import express from "express";
import { AuthError } from "./auth-security.js";
import { assertWebsiteOrigin } from "./auth-routes.js";
import { pool } from "./db.js";
import { readMultipartForm, uploadedAttachment } from "./multipart-upload.js";

const mib = 1024 * 1024;
const topicDocumentTypes = /\.(pdf|docx?|txt)$/i;
const coverTypes = ["image/png", "image/jpeg"];
const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

export const recordUpload = [
  (request, _response, next) => {
    assertWebsiteOrigin(request);
    if (!request.is("application/json", "multipart/form-data")) {
      throw new AuthError(415, "Yêu cầu cần có biểu mẫu hợp lệ.");
    }
    next();
  },
  express.json({ limit: "256kb" }),
  express.raw({ type: "multipart/form-data", limit: 26 * mib, inflate: false }),
];

export async function parseRecordUpload(request, { lecturerTopic = false } = {}) {
  if (!request.is("multipart/form-data")) return { payload: request.body, files: {} };
  const form = await readMultipartForm(request);
  let payload;
  try {
    const values = form.getAll("payload");
    if (values.length === 1 && typeof values[0] === "string" && Buffer.byteLength(values[0]) <= 256 * 1024) {
      payload = JSON.parse(values[0]);
    }
  } catch {
    throw new AuthError(400, "Nội dung biểu mẫu không hợp lệ.");
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new AuthError(400, "Nội dung biểu mẫu không hợp lệ.");
  }
  const { removeFiles = [], ...data } = payload;
  if (!Array.isArray(removeFiles) || removeFiles.some(key => !["attachment", "cover"].includes(key)) ||
      [...form.keys()].some(key => !["payload", "attachment", "cover"].includes(key))) {
    throw new AuthError(400, "Thông tin tệp không hợp lệ.");
  }
  const files = {};
  for (const field of ["attachment", "cover"]) {
    const values = form.getAll(field);
    if (values.length > 1 || (values.length && removeFiles.includes(field))) {
      throw new AuthError(400, "Chỉ chọn một tệp cho mỗi mục.");
    }
    if (values.length) {
      if (field === "cover") files.cover = await readImage(values[0], 5, coverTypes);
      else {
        const file = values[0];
        if (!(file instanceof File) || !file.size || (lecturerTopic && !topicDocumentTypes.test(file.name))) {
          throw new AuthError(400, lecturerTopic ? "Chọn tài liệu PDF, DOC, DOCX hoặc TXT có nội dung." : "Chọn tệp đính kèm có nội dung.");
        }
        const max = lecturerTopic ? 10 : 20;
        if (file.size > max * mib) throw new AuthError(413, `Tệp đính kèm tối đa ${max} MiB.`);
        files.attachment = await uploadedAttachment(file);
      }
    } else if (removeFiles.includes(field)) files[field] = null;
  }
  return { payload: data, files };
}

export async function readImage(file, max, accepted = coverTypes) {
  if (!(file instanceof File) || !file.size || !accepted.includes(file.type)) {
    throw new AuthError(400, "Định dạng ảnh không hợp lệ.");
  }
  if (file.size > max * mib) throw new AuthError(413, `Ảnh tối đa ${max} MiB.`);
  const result = await uploadedAttachment(file);
  const content = result.content;
  const valid = {
    "image/png": content.length >= 24 && content.subarray(0, 8).equals(pngSignature) && content.toString("ascii", 12, 16) === "IHDR",
    "image/jpeg": content.length >= 4 && content[0] === 255 && content[1] === 216 && content[2] === 255,
    "image/gif": content.length >= 13 && ["GIF87a", "GIF89a"].includes(content.toString("ascii", 0, 6)),
    "image/avif": content.length >= 16 && content.toString("ascii", 4, 8) === "ftyp" &&
      ["avif", "avis"].includes(content.toString("ascii", 8, 12)),
    "image/webp": content.length >= 20 && content.toString("ascii", 0, 4) === "RIFF" && content.toString("ascii", 8, 12) === "WEBP" &&
      ["VP8 ", "VP8L", "VP8X"].includes(content.toString("ascii", 12, 16)),
  };
  if (!valid[file.type]) throw new AuthError(400, "Nội dung ảnh không khớp định dạng đã chọn.");
  return result;
}

export async function insertFile(client, file) {
  const { rows: [saved] } = await client.query(`
    INSERT INTO files (file_name, content_type, content) VALUES ($1, $2, $3) RETURNING id
  `, [file.name, file.type, file.content]);
  return saved.id;
}

export async function nextFileId(client, update, current = null) {
  if (update === undefined) return current;
  return update ? insertFile(client, update) : null;
}

export const fileMetadata = alias => `CASE WHEN ${alias}.id IS NOT NULL THEN jsonb_build_object(
  'name', ${alias}.file_name, 'size', ${alias}.size_bytes, 'type', ${alias}.content_type) END`;

export async function readFileContent(id) {
  const { rows: [file] } = await pool.query("SELECT file_name, content_type, content FROM files WHERE id = $1", [id]);
  if (!file) throw new AuthError(404, "Không tìm thấy tệp.");
  return file;
}

export function sendFile(response, file, { inline = false } = {}) {
  response.set("X-Content-Type-Options", "nosniff");
  if (inline && ["image/png", "image/jpeg", "image/gif", "image/webp", "image/avif"].includes(file.content_type)) response.type(file.content_type);
  else response.attachment(file.file_name).type("application/octet-stream");
  response.send(file.content);
}
