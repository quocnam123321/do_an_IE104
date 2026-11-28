import { pool } from "./db.js";
import { AuthError, isUuid, systemDemoEnabled, transaction } from "./auth-security.js";
import { availableLecturers, proposalStudent } from "./proposal-data.js";
import { lockTeamProject, readTeamProject } from "./project-data.js";
import { assertTeamLeader, bumpTeamRevision } from "./project-team-data.js";
import { readMultipartForm, uploadedAttachment } from "./multipart-upload.js";
import { insertFile } from "./shared-files.js";

export const maxAttachmentBytes = 10 * 1024 * 1024;
const statuses = ["accepted", "rejected"];

function checkedText(input, label, limit, optional = false) {
  const value = typeof input === "string" ? input.trim() : "";
  if ((!value && !optional) || value.length > limit || value.includes("\0")) {
    throw new AuthError(400, `${label} cần ${optional ? "tối đa" : "từ 1 đến"} ${limit} ký tự.`);
  }
  return value;
}

export async function parseSupervisionForm(request) {
  const form = await readMultipartForm(request);
  const files = form.getAll("attachment");
  if (files.length > 1 || files.some(file => !(file instanceof File) || !file.size)) {
    throw new AuthError(400, "Chọn tối đa một tệp đính kèm hợp lệ.");
  }
  if (files[0]?.size > maxAttachmentBytes) throw new AuthError(413, "Tệp đính kèm tối đa 10 MB.");
  return {
    teacherId: form.get("teacherId"), subject: form.get("subject"), text: form.get("message"),
    projectId: form.get("projectId") ?? undefined,
    revision: form.has("revision") ? Number(form.get("revision")) : undefined,
    attachment: files.length ? await uploadedAttachment(files[0]) : null,
  };
}

function assertRole(account, role) {
  if (role ? account.role !== role : !["student", "lecturer"].includes(account.role)) {
    throw new AuthError(403, "Bạn không có quyền thực hiện thao tác này.");
  }
}

function allowed(account, parameter) {
  assertRole(account);
  if (systemDemoEnabled) return "invitation.is_demo";
  const actor = account.role === "student" ? "student_account_id" : "lecturer_account_id";
  return `NOT invitation.is_demo AND invitation.${actor} = ${parameter}`;
}

const selectThreads = `
  SELECT invitation.*, project.status AS project_status,
    CASE WHEN project.registration_id IS NOT NULL THEN 'DT-DK-' || project.id::text
         WHEN project.proposal_id IS NOT NULL THEN 'DT-DX-' || project.id::text
         ELSE project.demo_catalog_id END AS browser_project,
    entries.messages
  FROM supervision_invitations AS invitation
  LEFT JOIN projects AS project ON project.id = invitation.project_id
  CROSS JOIN LATERAL (
    SELECT jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
      'role', author_role, 'text', message, 'sentAt', sent_at,
      'attachment', CASE WHEN f.id IS NOT NULL THEN jsonb_build_object(
        'id', entry.id, 'name', f.file_name, 'size', f.size_bytes, 'invitationId', invitation.id
      ) END
    )) ORDER BY position) AS messages
    FROM supervision_invitation_messages AS entry LEFT JOIN files AS f ON f.id = entry.file_id
    WHERE entry.invitation_id = invitation.id
  ) AS entries
`;

function browserThread(row, account) {
  return {
    id: row.id, teacher: { id: row.teacher_key, name: row.teacher_name },
    student: { id: systemDemoEnabled && account.role === "student" ? account.id : row.student_account_id,
      name: row.student_name, code: row.student_code },
    subject: row.subject, status: row.status, createdAt: row.created_at, updatedAt: row.updated_at,
    ...(row.browser_project ? { projectId: row.browser_project, projectStatus: row.project_status } : {}),
    decision: row.decided_at ? { at: row.decided_at, note: row.decision_note, messageCount: row.decision_message_count } : null,
    messages: row.messages,
    readCount: account.role === "student" ? row.student_read_count : undefined,
  };
}

export async function listSupervisionInvitations(account, connection = pool) {
  const { rows } = await connection.query(selectThreads + " WHERE invitation.status <> 'cancelled' AND " +
    allowed(account, "$1") + " ORDER BY invitation.updated_at DESC, invitation.id",
  systemDemoEnabled ? [] : [account.id]);
  return rows.map(row => browserThread(row, account));
}

async function readInvitation(account, id, client, lock = false) {
  if (!isUuid(id)) throw new AuthError(404, "Không tìm thấy lời mời hướng dẫn.");
  const query = selectThreads + " WHERE invitation.id = $1 AND invitation.status <> 'cancelled' AND " + allowed(account, "$2");
  const params = systemDemoEnabled ? [id] : [id, account.id];
  if (lock) {
    // Khóa bản ghi trước khi lấy nội dung để thấy thông điệp của giao dịch vừa hoàn tất.
    const locked = await client.query("SELECT invitation.id FROM supervision_invitations AS invitation WHERE invitation.id = $1 AND " +
      allowed(account, "$2") + " FOR UPDATE", params);
    if (!locked.rowCount) throw new AuthError(404, "Không tìm thấy lời mời hướng dẫn.");
  }
  const { rows: [row] } = await client.query(query, params);
  if (!row) throw new AuthError(404, "Không tìm thấy lời mời hướng dẫn.");
  return row;
}

async function insertMessage(client, id, position, account, text, attachment) {
  const fileId = attachment ? await insertFile(client, attachment) : null;
  await client.query(`
    INSERT INTO supervision_invitation_messages (invitation_id, position, author_account_id, author_role, message, file_id)
    VALUES ($1, $2, $3, $4, $5, $6)
  `, [id, position, account.id, account.role === "lecturer" ? "teacher" : "student", text, fileId]);
}

export async function createSupervisionInvitation(account, input) {
  assertRole(account, "student");
  const message = checkedText(input.text, "Lời nhắn", 2000);
  return transaction(async client => {
    let projectId = null;
    let state;
    if (input.projectId !== undefined) {
      projectId = await lockTeamProject(account, input.projectId, client);
      state = await readTeamProject(account, input.projectId, client);
      assertTeamLeader(account, state, input.revision);
    }
    const teachers = await availableLecturers(client);
    const teacher = teachers.find(item => item.canReceive && [item.id, item.directoryId].includes(input.teacherId));
    if (!teacher) throw new AuthError(400, "Giảng viên chưa có tài khoản nhận lời mời.");
    const primaryName = state?.team.primaryTeacherName?.toLocaleLowerCase("vi");
    if (state && ([teacher.id, teacher.directoryId].includes(state.team.primaryTeacherKey) ||
        (primaryName && (" " + teacher.name.toLocaleLowerCase("vi")).endsWith(" " + primaryName)) ||
        state.team.invitations.some(item => item.lecturerId === teacher.id && ["pending", "accepted"].includes(item.status)))) {
      throw new AuthError(409, "Giảng viên đã tham gia đề tài hoặc đã có lời mời đang chờ.");
    }
    const { rows: [recipient] } = await client.query(`
      SELECT id FROM accounts WHERE role = 'lecturer' AND status = 'active'
        AND CASE WHEN $1 THEN is_demo ELSE id::text = $2 AND NOT is_demo END FOR SHARE
    `, [systemDemoEnabled, teacher.id]);
    if (!recipient) throw new AuthError(409, "Giảng viên hiện chưa thể nhận lời mời.");
    const student = proposalStudent(account);
    const { rows: [created] } = await client.query(`
      INSERT INTO supervision_invitations
        (project_id, student_account_id, lecturer_account_id, is_demo, student_name, student_code, teacher_key, teacher_name, subject)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id
    `, [projectId, account.id, recipient.id, systemDemoEnabled, student.name, student.code,
      teacher.id, teacher.name, state ? state.project.title.slice(0, 120) : checkedText(input.subject, "Tiêu đề", 120)]);
    await insertMessage(client, created.id, 1, account, message, input.attachment);
    if (projectId) await bumpTeamRevision(client, projectId);
    return { record: browserThread(await readInvitation(account, created.id, client), account),
      ...(projectId ? { project: await readTeamProject(account, input.projectId, client) } : {}) };
  });
}

export function replyToSupervision(account, id, input) {
  const text = checkedText(input.text, "Phản hồi", 2000);
  return transaction(async client => {
    const row = await readInvitation(account, id, client, true);
    if (row.status !== "pending" && !(row.project_id && row.status === "accepted")) {
      throw new AuthError(409, "Cuộc trao đổi đã kết thúc.");
    }
    await insertMessage(client, id, row.messages.length + 1, account, text, input.attachment);
    await client.query("UPDATE supervision_invitations SET updated_at = clock_timestamp() WHERE id = $1", [id]);
    return browserThread(await readInvitation(account, id, client), account);
  });
}

export function decideSupervisionInvitation(account, id, status, note = "") {
  assertRole(account, "lecturer");
  if (!statuses.includes(status)) throw new AuthError(400, "Chọn quyết định hợp lệ.");
  const decision = checkedText(note, "Lời nhắn kèm theo", 2000, true);
  return transaction(async client => {
    const preview = await readInvitation(account, id, client);
    if (preview.project_id) {
      const { rows: [project] } = await client.query("SELECT status FROM projects WHERE id = $1 FOR UPDATE", [preview.project_id]);
      if (project?.status !== "dang-thuc-hien") throw new AuthError(409, "Đề tài hiện chỉ cho xem lời mời.");
    }
    const row = await readInvitation(account, id, client, true);
    if (row.status !== "pending") throw new AuthError(409, "Lời mời đã được xử lý.");
    await client.query(`
      UPDATE supervision_invitations SET status = $2, decision_note = $3, decided_at = clock_timestamp(),
        updated_at = clock_timestamp(), decided_by_account_id = $4, decision_message_count = $5 WHERE id = $1
    `, [id, status, decision, account.id, row.messages.length]);
    if (row.project_id) await bumpTeamRevision(client, row.project_id);
    return browserThread(await readInvitation(account, id, client), account);
  });
}

export function cancelSupervisionInvitation(account, id, projectBrowserId, revision) {
  assertRole(account, "student");
  return transaction(async client => {
    const projectId = await lockTeamProject(account, projectBrowserId, client);
    assertTeamLeader(account, await readTeamProject(account, projectBrowserId, client), revision);
    const row = await readInvitation(account, id, client, true);
    if (row.project_id !== projectId || row.status !== "pending") throw new AuthError(409, "Lời mời không còn ở trạng thái đang chờ.");
    await client.query("UPDATE supervision_invitations SET status = 'cancelled', updated_at = clock_timestamp() WHERE id = $1", [id]);
    await bumpTeamRevision(client, projectId);
    return readTeamProject(account, projectBrowserId, client);
  });
}

export function markSupervisionRead(account, id, count) {
  assertRole(account, "student");
  if (!Number.isSafeInteger(count) || count < 0) throw new AuthError(400, "Trạng thái đã xem không hợp lệ.");
  return transaction(async client => {
    const row = await readInvitation(account, id, client, true);
    const total = row.messages.filter(message => message.role === "teacher").length + Number(row.decided_at !== null);
    await client.query("UPDATE supervision_invitations SET student_read_count = $2 WHERE id = $1",
      [id, Math.max(row.student_read_count, Math.min(count, total))]);
    return browserThread(await readInvitation(account, id, client), account);
  });
}

export async function readSupervisionFile(account, id, fileId) {
  const row = await readInvitation(account, id, pool);
  if (!isUuid(fileId)) throw new AuthError(404, "Không tìm thấy tệp đính kèm.");
  const { rows: [file] } = await pool.query(`
    SELECT f.file_name, f.content FROM supervision_invitation_messages AS entry
    JOIN files AS f ON f.id = entry.file_id WHERE entry.invitation_id = $1 AND entry.id = $2
  `, [row.id, fileId]);
  if (!file) throw new AuthError(404, "Không tìm thấy tệp đính kèm.");
  return file;
}
