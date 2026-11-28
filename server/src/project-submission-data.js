import { pool } from "./db.js";
import { AuthError, demoDisplayName, isUuid, transaction } from "./auth-security.js";
import { isDemoTeamId, lockProject, readProject } from "./project-data.js";
import editor from "../../web/assets/js/services/teaching-service.js";
import fileLimits from "../../web/assets/js/services/student-submissions-service.js";
import { readMultipartForm, uploadedAttachment } from "./multipart-upload.js";
import { insertFile } from "./shared-files.js";

export function assertSubmissionRole(account, role) {
  if (account.role !== role) throw new AuthError(403, "Bạn không có quyền thực hiện thao tác này.");
}

function requirementFrom(board, id) {
  const requirement = board.requirements.find(item => item.id === id);
  if (!requirement) throw new AuthError(404, "Không tìm thấy yêu cầu bài nộp.");
  return requirement;
}

function assertActive(project) {
  if (project.status !== "dang-thuc-hien") throw new AuthError(409, "Đề tài hiện chỉ cho xem bài nộp.");
}

function assertBoardRevision(board, revision) {
  if (!Number.isInteger(revision) || revision !== board.revision) {
    throw new AuthError(409, "Yêu cầu bài nộp đã thay đổi. Hãy tải lại trang rồi thực hiện lại.");
  }
}

async function updateBoard(account, id, role, change) {
  assertSubmissionRole(account, role);
  return transaction(async client => {
    const projectId = await lockProject(account, id, client);
    const state = await readProject(account, id, client);
    const recordId = await change(client, projectId, state);
    await client.query("UPDATE projects SET submissions_revision = submissions_revision + 1 WHERE id = $1", [projectId]);
    const { submissionBoard } = await readProject(account, id, client);
    return { submissionBoard, record: recordId ? submissionBoard.submissions.find(item => item.id === recordId) : undefined };
  });
}

export function saveRequirement(account, id, requirementId, { requirement, revision } = {}) {
  if (!requirement || typeof requirement !== "object" || Array.isArray(requirement)) {
    throw new AuthError(400, "Thông tin yêu cầu bài nộp không hợp lệ.");
  }
  const { value, errors } = editor.validateRequirement(requirement);
  if (errors.length || [value.title, value.content].some(text => text.includes("\0"))) {
    throw new AuthError(400, errors[0] || "Nội dung chứa ký tự không hợp lệ.");
  }
  return updateBoard(account, id, "lecturer", async (client, projectId, { project, submissionBoard }) => {
    assertActive(project);
    assertBoardRevision(submissionBoard, revision);
    const fields = [projectId, value.title, value.content, value.deadline];
    if (requirementId) {
      requirementFrom(submissionBoard, requirementId);
      await client.query("UPDATE project_submission_requirements SET title=$2, content=$3, deadline=$4 WHERE project_id=$1 AND id=$5",
        [...fields, requirementId]);
    } else {
      await client.query("INSERT INTO project_submission_requirements (project_id, title, content, deadline) VALUES ($1, $2, $3, $4)", fields);
    }
  });
}

export function deleteRequirement(account, id, requirementId, revision) {
  return updateBoard(account, id, "lecturer", async (client, projectId, { project, submissionBoard }) => {
    assertActive(project);
    assertBoardRevision(submissionBoard, revision);
    requirementFrom(submissionBoard, requirementId);
    if (submissionBoard.submissions.some(submission => submission.requirementId === requirementId)) {
      throw new AuthError(409, "Yêu cầu đã có bài nộp nên không thể xóa.");
    }
    await client.query("DELETE FROM project_submission_requirements WHERE project_id=$1 AND id=$2", [projectId, requirementId]);
  });
}

export function setSubmissionsLocked(account, id, requirementId, { locked, revision } = {}) {
  if (typeof locked !== "boolean") throw new AuthError(400, "Trạng thái nhận bài không hợp lệ.");
  return updateBoard(account, id, "lecturer", async (client, projectId, { project, submissionBoard }) => {
    assertBoardRevision(submissionBoard, revision);
    if (!locked) assertActive(project);
    if (requirementId) {
      requirementFrom(submissionBoard, requirementId);
      await client.query("UPDATE project_submission_requirements SET locked=$1 WHERE project_id=$2 AND id=$3", [locked, projectId, requirementId]);
    } else {
      await client.query("UPDATE projects SET submissions_locked=$1 WHERE id=$2", [locked, projectId]);
    }
  });
}

export async function parseSubmissionUpload(request) {
  const form = await readMultipartForm(request);
  const files = form.getAll("files");
  if (!files.length || files.length > fileLimits.maxFiles || files.some(file => !(file instanceof File) || !file.size)) {
    throw new AuthError(400, "Chọn từ 1 đến 10 tệp có nội dung.");
  }
  if (files.reduce((sum, file) => sum + file.size, 0) > fileLimits.maxBytes) {
    throw new AuthError(413, "Tổng dung lượng tệp của một lần nộp tối đa 20 MiB.");
  }
  const notes = form.get("notes") ?? "";
  const expected = form.get("expectedSubmissionId") ?? "";
  if (typeof notes !== "string" || notes.length > 2000 || notes.includes("\0") || (expected && !isUuid(expected))) {
    throw new AuthError(400, "Ghi chú hoặc phiên bản bài nộp không hợp lệ.");
  }
  const attachments = await Promise.all(files.map(uploadedAttachment));
  return { attachments, notes: notes.trim(), expectedSubmissionId: expected || null };
}

export function submitAssignment(account, id, requirementId, { attachments, notes, expectedSubmissionId }) {
  return updateBoard(account, id, "student", async (client, projectId, { project, progress, submissionBoard }) => {
    if (!progress.viewerMemberKey) throw new AuthError(403, "Chỉ thành viên nhóm được nộp bài.");
    assertActive(project);
    const requirement = requirementFrom(submissionBoard, requirementId);
    if (requirement.locked || submissionBoard.submissionsLocked) throw new AuthError(409, "Đề tài hoặc yêu cầu đang khóa nhận bài.");
    const previous = submissionBoard.submissions.find(item => item.requirementId === requirementId);
    if ((previous?.id ?? null) !== expectedSubmissionId) {
      throw new AuthError(409, "Bài nộp đã thay đổi. Hãy mở lại yêu cầu trước khi cập nhật.");
    }
    const { rows: [record] } = await client.query(`
      INSERT INTO project_submissions (project_id, requirement_id, attempt, submitted_by_account_id, notes)
      VALUES ($1, $2, $3, $4, $5) RETURNING id
    `, [projectId, requirementId, (previous?.attempt ?? 0) + 1, account.id, notes]);
    for (const [index, file] of attachments.entries()) {
      const fileId = await insertFile(client, file);
      await client.query("INSERT INTO project_submission_files (id, submission_id, position) VALUES ($1, $2, $3)",
        [fileId, record.id, index + 1]);
    }
    return record.id;
  });
}

export function saveSubmissionFeedback(account, id, submissionId, { content, revision } = {}) {
  const text = typeof content === "string" ? content.trim() : "";
  if (!text || text.length > 2000 || text.includes("\0")) throw new AuthError(400, "Nhập phản hồi từ 1 đến 2000 ký tự.");
  return updateBoard(account, id, "lecturer", async (client, _projectId, { project, submissionBoard }) => {
    assertActive(project);
    const current = submissionBoard.submissions.find(item => item.id === submissionId);
    if (!current || !Number.isInteger(revision) || current.feedbackRevision !== revision) {
      throw new AuthError(409, "Bài nộp hoặc phản hồi đã thay đổi. Hãy mở lại bài nộp.");
    }
    const name = demoDisplayName("lecturer") || account.display_name || account.username || "Giảng viên";
    await client.query(`
      INSERT INTO project_submission_feedback (submission_id, revision, lecturer_account_id, lecturer_name, content)
      VALUES ($1, $2, $3, $4, $5)
    `, [submissionId, revision + 1, account.id, name, text]);
    return submissionId;
  });
}

export async function readSubmissionFile(account, id, submissionId, fileId) {
  const { project } = await readProject(account, id);
  if (!isUuid(submissionId) || !isUuid(fileId)) throw new AuthError(404, "Không tìm thấy tệp bài nộp.");
  const demo = isDemoTeamId(project.id);
  const { rows: [file] } = await pool.query(`
    SELECT f.file_name, f.content_type, f.content FROM project_submission_files AS attachment
    JOIN files AS f ON f.id = attachment.id
    JOIN project_submissions AS s ON s.id = attachment.submission_id
    JOIN projects AS p ON p.id = s.project_id
    WHERE ${demo ? "p.demo_catalog_id" : "p.id"} = $1 AND s.id = $2 AND attachment.id = $3
  `, [demo ? project.id : project.id.slice(6), submissionId, fileId]);
  if (!file) throw new AuthError(404, "Không tìm thấy tệp bài nộp.");
  return file;
}
