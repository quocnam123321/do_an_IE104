import express from "express";
import { load } from "cheerio";
import { pool } from "./db.js";
import { AuthError, activeAccount, isUuid, requiredRole, systemDemoEnabled, transaction } from "./auth-security.js";
import { assertWebsiteOrigin, sameOrigin } from "./auth-routes.js";
import { vietnamMinute } from "./academic-data.js";
import { fileMetadata, insertFile, readFileContent, readImage, sendFile } from "./shared-files.js";
import { readMultipartForm, uploadedAttachment } from "./multipart-upload.js";

const categories = ["plan", "submissions", "defense"];
const audiences = ["student", "lecturer", "both"];
const imageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/avif"];
const imageId = /^[A-Za-z0-9_-]{1,80}$/;
const academicId = /^TB-\d{3,}$/;
const systemId = /^HT-\d{3,}$/;
const maxFile = 10 * 1024 * 1024;
const safeTags = new Set(["b", "strong", "i", "em", "u", "div", "p", "br", "ul", "ol", "li"]);
const ignoredTags = new Set(["script", "style", "template"]);

export const noticesRouter = express.Router();
noticesRouter.use((_request, response, next) => {
  response.set("Cache-Control", "no-store");
  next();
});
const manage = express.Router();
manage.use(requiredRole("admin"));
noticesRouter.use("/manage", manage);
const json = [sameOrigin, express.json({ limit: "128kb" })];
const raw = [
  (request, _response, next) => {
    assertWebsiteOrigin(request);
    if (!request.is("multipart/form-data")) throw new AuthError(415, "Yêu cầu cần có biểu mẫu hợp lệ.");
    next();
  },
  express.raw({ type: "multipart/form-data", limit: "26mb", inflate: false }),
];

const readRows = `
  SELECT n.*, COALESCE((SELECT jsonb_object_agg(nf.slot,${fileMetadata("f")})
    FROM admin_notice_files nf JOIN files f ON f.id=nf.file_id WHERE nf.notice_id=n.id),'{}') AS slots,
    COALESCE((SELECT jsonb_agg(jsonb_build_object('id',nr.account_id,'name',nr.name,'code',nr.code,'type',nr.role)
      ORDER BY nr.name,nr.account_id) FROM admin_notice_recipients nr WHERE nr.notice_id=n.id),'[]') AS recipients
  FROM admin_notices n
`;

function noticeView(row) {
  const files = Object.entries(row.slots).map(([slot, file]) => ({
    id: slot, file: { ...file, url: `/api/notices/${row.id}/files/${slot}` },
  }));
  return {
    id: row.id, kind: row.kind, name: row.name, body: row.body, html: row.html,
    type: row.type, status: row.status, audience: row.audience, scope: row.scope, revision: row.revision,
    date: vietnamMinute(row.changed_at), publishedAt: row.published_at,
    sentAt: row.kind === "system" ? row.created_at : undefined, recipients: row.recipients,
    images: files.filter(({ id }) => id !== "attachment"), attachment: files.find(({ id }) => id === "attachment")?.file,
  };
}

const recipientRows = `
  SELECT a.id,COALESCE(p.full_name,a.display_name,a.username,a.email,'Chưa có thông tin') AS name,
    COALESCE(a.account_code,'') AS code,a.role AS type
  FROM accounts a LEFT JOIN account_profiles p ON p.account_id=a.id
  WHERE a.role IN ('student','lecturer') AND a.status='active' AND NOT a.is_locked AND (NOT a.is_demo OR $1)
    AND ($2='both' OR a.role=$2)
`;
const changed = () => new AuthError(409, "Thông báo đã thay đổi. Hãy mở lại và thử lại.");
const revision = value => Number.isInteger(value) && value >= 0 && value < 2147483647 ? value : -1;

manage.get("/", async (_request, response) => {
  const [notices, recipients] = await Promise.all([
    pool.query(readRows + " ORDER BY n.changed_at DESC,n.id"),
    pool.query(recipientRows + " ORDER BY name,a.id", [systemDemoEnabled, "both"]),
  ]);
  response.json({ records: notices.rows.map(noticeView), recipients: recipients.rows });
});

function validateText(input, hasImage = false) {
  const name = typeof input.title === "string" ? input.title.trim() : "";
  const body = typeof input.body === "string" ? input.body.trim() : "";
  if (!name || name.length > 120 || name.includes("\0")) throw new AuthError(400, "Nhập tiêu đề từ 1 đến 120 ký tự.");
  if ((!body && !hasImage) || body.length > 5000 || body.includes("\0")) {
    throw new AuthError(400, "Nhập nội dung từ 1 đến 5000 ký tự.");
  }
  return { name, body };
}

function cleanHtml(markup, slots) {
  if (typeof markup !== "string" || markup.length > 100000) throw new AuthError(400, "Nội dung biểu mẫu không hợp lệ.");
  const document = load(markup, {}, false);
  const escape = value => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  function render(node) {
    if (node.type === "text") return escape(node.data);
    if (ignoredTags.has(node.name)) return "";
    if (node.name === "img") {
      const id = node.attribs["data-notice-image"];
      return slots.includes(id) ? `<img data-notice-image="${id}">` : "";
    }
    if (node.name === "br") return "<br>";
    const body = (node.children ?? []).map(render).join("");
    return safeTags.has(node.name) ? `<${node.name}>${body}</${node.name}>` : body;
  }
  return document.root().get(0).children.map(render).join("");
}

async function newId(client, kind) {
  const { rows: [row] } = await client.query("SELECT nextval($1::regclass) AS number", [kind + "_notice_number"]);
  return (kind === "academic" ? "TB-" : "HT-") + String(row.number).padStart(3, "0");
}

async function readUpload(request) {
  const form = await readMultipartForm(request);
  const rawPayload = form.get("payload");
  let input;
  try {
    if (form.getAll("payload").length === 1 && typeof rawPayload === "string" && rawPayload.length <= 120000) input = JSON.parse(rawPayload);
  } catch {
    throw new AuthError(400, "Nội dung biểu mẫu không hợp lệ.");
  }
  if (!input || !categories.includes(input.category) || !["draft", "published"].includes(input.status) ||
      !Array.isArray(input.images) || input.images.length > 32 || new Set(input.images).size !== input.images.length ||
      input.images.some(id => typeof id !== "string" || !imageId.test(id) || id === "attachment") ||
      typeof input.attachment !== "boolean") throw new AuthError(400, "Thông tin thông báo không hợp lệ.");
  const slots = input.attachment ? [...input.images, "attachment"] : input.images;
  const { name, body } = validateText(input, input.images.length > 0);
  if ([...form.keys()].some(key => key !== "payload" && !slots.includes(key))) throw new AuthError(400, "Thông tin tệp không hợp lệ.");
  const uploads = new Map();
  for (const slot of slots) {
    const values = form.getAll(slot);
    if (!values.length) continue;
    const [file] = values;
    if (values.length !== 1 || !(file instanceof File) || !file.size || file.size > maxFile) {
      throw new AuthError(400, "Tệp đính kèm phải có nội dung và dung lượng tối đa 10 MB.");
    }
    uploads.set(slot, slot === "attachment" ? await uploadedAttachment(file) : await readImage(file, 10, imageTypes));
  }
  return { input, name, body, slots, html: cleanHtml(input.html, input.images), uploads };
}

manage.post("/academic", raw, saveAcademic);
manage.patch("/academic/:id", raw, saveAcademic);

async function saveAcademic(request, response) {
  const { input, name, body, slots, html, uploads } = await readUpload(request);
  let id = request.params.id;
  if (id && !academicId.test(id)) throw changed();
  const notice = await transaction(async client => {
    const existingFiles = new Map();
    if (id) {
      const saved = await client.query("SELECT 1 FROM admin_notices WHERE id=$1 AND kind='academic' AND status='draft' AND revision=$2 FOR UPDATE", [id, revision(input.revision)]);
      if (!saved.rowCount) throw changed();
      const { rows } = await client.query("SELECT slot,file_id FROM admin_notice_files WHERE notice_id=$1", [id]);
      for (const row of rows) existingFiles.set(row.slot, row.file_id);
      await client.query(`
        UPDATE admin_notices SET name=$2,body=$3,html=$4,type=$5,status=$6,changed_at=now(),
          published_at=CASE WHEN $6='published' THEN now() END,revision=revision+1 WHERE id=$1
      `, [id, name, body, html, input.category, input.status]);
    } else {
      id = await newId(client, "academic");
      await client.query(`
        INSERT INTO admin_notices (id,kind,name,body,html,type,status,published_at,created_by)
        VALUES ($1,'academic',$2,$3,$4,$5,$6,CASE WHEN $6='published' THEN now() END,$7)
      `, [id, name, body, html, input.category, input.status, response.locals.account.id]);
    }
    for (const [slot, fileId] of existingFiles) {
      if (!slots.includes(slot) || uploads.has(slot)) {
        await client.query("DELETE FROM admin_notice_files WHERE notice_id=$1 AND slot=$2", [id, slot]);
        await client.query("DELETE FROM files WHERE id=$1", [fileId]);
        existingFiles.delete(slot);
      }
    }
    for (const slot of slots) {
      if (existingFiles.has(slot)) continue;
      if (!uploads.has(slot)) throw new AuthError(400, "Không tìm thấy tệp đính kèm.");
      const fileId = await insertFile(client, uploads.get(slot));
      await client.query("INSERT INTO admin_notice_files (notice_id,slot,file_id) VALUES ($1,$2,$3)", [id, slot, fileId]);
    }
    return (await client.query(readRows + " WHERE n.id=$1", [id])).rows[0];
  });
  response.status(request.params.id ? 200 : 201).json({ record: noticeView(notice) });
}

manage.patch("/academic/:id/withdraw", json, async (request, response) => {
  const { id } = request.params;
  const result = await pool.query(`
    UPDATE admin_notices SET status='withdrawn',changed_at=now(),revision=revision+1
    WHERE id=$1 AND kind='academic' AND status='published' AND revision=$2
  `, [id, revision(request.body?.revision)]);
  if (!result.rowCount) throw changed();
  response.json({ record: { id, status: "withdrawn" } });
});

manage.delete("/academic/:id", json, async (request, response) => {
  const { id } = request.params;
  await transaction(async client => {
    const target = await client.query("SELECT 1 FROM admin_notices WHERE id=$1 AND kind='academic' AND status='draft' AND revision=$2 FOR UPDATE",
      [id, revision(request.body?.revision)]);
    if (!target.rowCount) throw changed();
    const { rows } = await client.query("DELETE FROM admin_notice_files WHERE notice_id=$1 RETURNING file_id", [id]);
    await client.query("DELETE FROM admin_notices WHERE id=$1", [id]);
    await client.query("DELETE FROM files WHERE id=ANY($1::uuid[])", [rows.map(row => row.file_id)]);
  });
  response.json({ record: { id } });
});

manage.post("/system", json, async (request, response) => {
  const input = request.body ?? {};
  const { name, body } = validateText(input);
  const { audience, scope } = input;
  if (!audiences.includes(audience) || !["all", "specific"].includes(scope)) {
    throw new AuthError(400, "Hãy chọn đối tượng và phạm vi gửi.");
  }
  const ids = Array.isArray(input.ids) ? [...new Set(input.ids)] : [];
  if (scope === "specific" && (!ids.length || ids.length > 1000 || ids.some(id => !isUuid(id)))) {
    throw new AuthError(400, "Hãy chọn ít nhất một người nhận hợp lệ.");
  }
  const row = await transaction(async client => {
    const { rows } = await client.query(recipientRows + " AND ($3::uuid[] IS NULL OR a.id=ANY($3)) FOR SHARE OF a",
      [systemDemoEnabled, audience, scope === "specific" ? ids : null]);
    if (!rows.length || (scope === "specific" && rows.length !== ids.length)) {
      throw new AuthError(409, "Người nhận đã thay đổi. Hãy chọn lại người nhận.");
    }
    const id = await newId(client, "system");
    await client.query(`
      INSERT INTO admin_notices (id,kind,name,body,type,status,audience,scope,created_by)
      VALUES ($1,'system',$2,$3,'manual','sent',$4,$5,$6)
    `, [id, name, body, audience, scope, response.locals.account.id]);
    await client.query(`
      INSERT INTO admin_notice_recipients (notice_id,account_id,name,code,role)
      SELECT $1,id,name,code,type FROM jsonb_to_recordset($2::jsonb) AS r(id uuid,name text,code text,type text)
    `, [id, JSON.stringify(rows)]);
    return (await client.query(readRows + " WHERE n.id=$1", [id])).rows[0];
  });
  response.status(201).json({ record: noticeView(row) });
});

noticesRouter.get("/published", async (_request, response) => {
  const { rows } = await pool.query(`
    SELECT id,kind,name,body,type,status,published_at
    FROM admin_notices WHERE kind='academic' AND status='published' ORDER BY published_at DESC,id
  `);
  response.json({ records: rows.map(row => ({ ...row, publishedAt: row.published_at })) });
});

noticesRouter.get("/published/:id", async (request, response) => {
  const { rows } = await pool.query(readRows + " WHERE n.kind='academic' AND n.status='published' AND n.id=$1", [request.params.id]);
  response.json({ records: rows.map(noticeView) });
});

noticesRouter.get("/:id/files/:slot", async (request, response) => {
  const { id, slot } = request.params;
  if (!academicId.test(id) || !imageId.test(slot)) throw new AuthError(404, "Không tìm thấy tệp.");
  const { rows: [row] } = await pool.query(`
    SELECT n.status,f.file_id FROM admin_notices n JOIN admin_notice_files f ON f.notice_id=n.id
    WHERE n.id=$1 AND n.kind='academic' AND f.slot=$2
  `, [id, slot]);
  if (!row || (row.status !== "published" && (await activeAccount(request, "admin"))?.role !== "admin")) {
    throw new AuthError(404, "Không tìm thấy tệp.");
  }
  sendFile(response, await readFileContent(row.file_id), { inline: slot !== "attachment" });
});

noticesRouter.get("/inbox", requiredRole(), async (_request, response) => {
  const { rows } = await pool.query(`
    SELECT n.id,n.name AS title,n.body,n.created_at AS date,(r.read_at IS NOT NULL) AS read,true AS system
    FROM admin_notice_recipients r JOIN admin_notices n ON n.id=r.notice_id
    WHERE r.account_id=$1 AND r.role=$2 AND n.kind='system' AND n.status='sent'
    ORDER BY n.created_at DESC,n.id DESC
  `, [response.locals.account.id, response.locals.account.role]);
  response.json({ notices: rows });
});

noticesRouter.patch("/inbox", ...json, requiredRole(), async (request, response) => {
  const ids = request.body?.ids;
  if (!Array.isArray(ids) || ids.length > 1000 || ids.some(id => typeof id !== "string" || !systemId.test(id))) {
    throw new AuthError(400, "Danh sách thông báo không hợp lệ.");
  }
  await pool.query(`
    UPDATE admin_notice_recipients SET read_at=now()
    WHERE account_id=$1 AND role=$2 AND notice_id=ANY($3::text[]) AND read_at IS NULL
  `, [response.locals.account.id, response.locals.account.role, ids]);
  response.status(204).end();
});
