import { pool } from "./db.js";
import { AuthError, demoDisplayName, isUuid, systemDemoEnabled, transaction } from "./auth-security.js";
import { lockProject, readProject } from "./project-data.js";
import { evaluationColumns, evaluationJoins, formatEvaluation } from "./evaluation-query.js";
import editor from "../../assets/js/services/teaching-service.js";
import fileLimits from "../../assets/js/services/student-submissions-service.js";
import { readMultipartForm, uploadedAttachment } from "./multipart-upload.js";
import { insertFile } from "./shared-files.js";

const isRecord = input => input !== null && typeof input === "object" && !Array.isArray(input);
const demoProject = id => id.startsWith("UIT-SV-");
const demoEvaluationRows = `
  SELECT project.id, project.demo_catalog_id, project.status, ${evaluationColumns}
  FROM projects AS project ${evaluationJoins}
`;

function canReadDemo(account) {
  return systemDemoEnabled && ["lecturer", "student"].includes(account.role);
}

export async function listDemoEvaluations(account) {
  if (!canReadDemo(account)) return {};
  const { rows } = await pool.query(demoEvaluationRows + `
    WHERE project.demo_catalog_id IS NOT NULL AND (project.status <> 'hoan-thanh' OR evaluation.id IS NOT NULL)
    ORDER BY project.demo_catalog_id
  `);
  return Object.fromEntries(rows.map(row => [row.demo_catalog_id, formatEvaluation(row, row.demo_catalog_id, account)]));
}

export async function readProjectEvaluation(account, id, connection = pool) {
  if (!demoProject(id)) {
    const { project, evaluation } = await readProject(account, id, connection);
    return { projectId: project.id.slice(6), projectStatus: project.status, evaluation };
  }
  if (!canReadDemo(account)) throw new AuthError(404, "Không tìm thấy đề tài đang thực hiện.");
  const { rows: [row] } = await connection.query(demoEvaluationRows + " WHERE project.demo_catalog_id = $1", [id]);
  if (!row) throw new AuthError(404, "Không tìm thấy đề tài đang thực hiện.");
  return { projectId: row.id, projectStatus: row.status, evaluation: formatEvaluation(row, id, account) };
}

export async function parseEvaluationForm(request) {
  const form = await readMultipartForm(request);
  const serialized = form.get("assessment");
  let payload;
  try {
    if (typeof serialized === "string") payload = JSON.parse(serialized);
  } catch {
    throw new AuthError(400, "Thông tin đánh giá không hợp lệ.");
  }
  if (!isRecord(payload) || !isRecord(payload.scores) || typeof payload.feedback !== "string"
    || (payload.comments !== undefined && !isRecord(payload.comments))) {
    throw new AuthError(400, "Thông tin đánh giá không hợp lệ.");
  }
  const files = form.getAll("attachment");
  const { attachmentAction } = payload;
  if (!["keep", "replace", "remove"].includes(attachmentAction) || files.length !== Number(attachmentAction === "replace")
    || files.some(file => !(file instanceof File) || !file.size)) {
    throw new AuthError(400, "Chọn một tệp đánh giá hợp lệ.");
  }
  if (files[0]?.size > fileLimits.maxBytes) throw new AuthError(413, "Tệp đánh giá tối đa 20 MiB.");
  const attachment = files.length ? await uploadedAttachment(files[0]) : null;
  return { ...payload, attachment };
}

export function assertEvaluator(account) {
  if (account.role !== "lecturer") throw new AuthError(403, "Chỉ giảng viên được công bố kết quả đánh giá.");
}

export async function publishProjectEvaluation(account, id, input) {
  assertEvaluator(account);
  return transaction(async client => {
    if (demoProject(id)) {
      if (!canReadDemo(account)) throw new AuthError(404, "Không tìm thấy đề tài đang thực hiện.");
      await client.query("SELECT id FROM projects WHERE demo_catalog_id = $1 FOR UPDATE", [id]);
    } else {
      await lockProject(account, id, client);
    }
    const { projectId, evaluation } = await readProjectEvaluation(account, id, client);
    if (!Number.isInteger(input.revision) || input.revision !== evaluation.revision) {
      throw new AuthError(409, "Kết quả đánh giá đã thay đổi. Hãy tải lại trước khi công bố.");
    }
    const rubric = evaluation.criteria;
    if (rubric.some(criterion => !Object.hasOwn(input.scores, criterion.id)
      || !["number", "string"].includes(typeof input.scores[criterion.id]))) {
      throw new AuthError(400, "Nhập điểm cho từng tiêu chí đánh giá.");
    }
    const { value, errors } = editor.validateEvaluation(input, rubric, true);
    if (errors.length || [value.feedback, ...value.criteria.map(item => item.comment)].some(text => text.includes("\0"))) {
      throw new AuthError(400, errors.join(" ") || "Nội dung đánh giá chứa ký tự không hợp lệ.");
    }
    let attachmentId = input.attachmentAction === "keep" ? evaluation.publication?.attachment?.id ?? null : null;
    if (input.attachment) {
      attachmentId = await insertFile(client, input.attachment);
      await client.query("INSERT INTO project_evaluation_attachments (id, project_id) VALUES ($1, $2)", [attachmentId, projectId]);
    }
    const lecturerName = demoDisplayName("lecturer") || account.display_name || account.username || "Giảng viên";
    const resultLabel = evaluation.publication?.resultLabel || "Đã đánh giá";
    const { rows: [published] } = await client.query(`
      INSERT INTO project_evaluations (project_id, revision, lecturer_account_id, lecturer_name, score, result_label, feedback, attachment_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id
    `, [projectId, evaluation.revision + 1, account.id, lecturerName, value.score, resultLabel, value.feedback, attachmentId]);
    const criteria = value.criteria.map((item, index) => ({ ...item, description: rubric[index].description }));
    await client.query(`
      INSERT INTO project_evaluation_scores (evaluation_id, position, criterion_id, title, description, weight, score, comment)
      SELECT $1, position, criterion->>'id', criterion->>'title', criterion->>'description',
        (criterion->>'weight')::smallint, (criterion->>'score')::numeric, criterion->>'comment'
      FROM jsonb_array_elements($2::jsonb) WITH ORDINALITY AS entry(criterion, position)
    `, [published.id, JSON.stringify(criteria)]);
    await client.query("UPDATE projects SET status = 'hoan-thanh' WHERE id = $1", [projectId]);
    const updated = await readProjectEvaluation(account, id, client);
    return { evaluation: updated.evaluation, projectStatus: updated.projectStatus };
  });
}

export async function readEvaluationAttachment(account, id, fileId) {
  const { projectId, evaluation } = await readProjectEvaluation(account, id);
  if (!isUuid(fileId) || evaluation.publication?.attachment?.id !== fileId) {
    throw new AuthError(404, "Không tìm thấy tệp đánh giá.");
  }
  const { rows: [file] } = await pool.query(
    `SELECT f.file_name, f.content FROM project_evaluation_attachments AS attachment
    JOIN files AS f ON f.id = attachment.id WHERE attachment.project_id=$1 AND attachment.id=$2`, [projectId, fileId],
  );
  if (!file) throw new AuthError(404, "Không tìm thấy tệp đánh giá.");
  return file;
}
