import { pool } from "./db.js";
import { AuthError, demoStudentName, fingerprint, isUuid, systemDemoEnabled, transaction } from "./auth-security.js";
import validators from "../../web/assets/js/shared/validation.js";
import configuration from "../../web/assets/js/services/proposal-service.js";
import { combineLecturerDirectory } from "./lecturer-directory.js";
import { readProject } from "./project-data.js";
import { useTopicCode } from "./topic-code-data.js";
import { fileMetadata, nextFileId, readFileContent } from "./shared-files.js";

const { validateProposal } = validators;
const { catalog } = configuration;
const readRows = `
  SELECT proposals.*, COALESCE(student.display_name, student.username, student.email) AS student_name,
    COALESCE(lecturer.display_name, lecturer.username, lecturer.email) AS lecturer_name,
    COALESCE(reviewer.username, reviewer.email) AS reviewer_login,
    COALESCE(decider.display_name, decider.username,
      CASE WHEN proposals.demo_directory_id IS NULL THEN decider.email END) AS decider_name,
    ${fileMetadata("attachment")} AS attachment, ${fileMetadata("cover")} AS cover
  FROM proposals
  JOIN accounts AS student ON student.id = proposals.student_account_id
  JOIN accounts AS lecturer ON lecturer.id = proposals.lecturer_account_id
  LEFT JOIN accounts AS reviewer ON reviewer.id = proposals.reviewer_account_id
  LEFT JOIN accounts AS decider ON decider.id = proposals.decided_by_account_id
  LEFT JOIN files AS attachment ON attachment.id = proposals.attachment_file_id
  LEFT JOIN files AS cover ON cover.id = proposals.cover_file_id
`;

const accountLabel = (account) => account.display_name || account.username || account.email || "Chưa có thông tin";

export function proposalStudent(account) {
  return { accountId: account.id, name: systemDemoEnabled ? demoStudentName : accountLabel(account), code: "" };
}

function browserRecord(row) {
  const id = "DX-" + row.id;
  const { outline } = row.content;
  const isSharedDemo = Boolean(row.demo_directory_id);
  const student = proposalStudent({ id: isSharedDemo ? undefined : row.student_account_id, username: row.student_name });
  return {
    ...row.content,
    outline: systemDemoEnabled && Array.isArray(outline?.members)
      ? { ...outline, members: outline.members.map(member => member.role === "nhom-truong" ? { ...member, name: student.name } : member) }
      : outline,
    id,
    topicId: "DT-" + id,
    isDatabaseProposal: true,
    isSharedDemo,
    topicCode: row.topic_code,
    attachment: row.attachment ? { ...row.attachment, fileKey: row.attachment_file_id, proposalId: id } : null,
    coverImage: row.cover ? { ...row.cover, fileKey: row.cover_file_id, proposalId: id } : null,
    student,
    lecturerId: row.lecturer_account_id,
    reviewer: !isSharedDemo && row.reviewer_account_id ? { id: row.reviewer_account_id, login: row.reviewer_login } : null,
    supervisorId: row.demo_directory_id || row.lecturer_account_id,
    demoReceiver: row.demo_directory_id ? row.lecturer_name : null,
    supervisorName: row.content.supervisorProfile?.name || row.lecturer_name || "Chưa có thông tin",
    type: row.type,
    typeLabel: catalog.types[row.type].label,
    courseId: row.course_id,
    courseLabel: catalog.types[row.type].courses[row.course_id],
    title: row.title,
    semester: row.semester,
    academicYear: row.academic_year,
    status: row.status,
    revision: row.revision,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    withdrawnAt: row.status === "da-rut" ? row.updated_at : undefined,
    decision: row.decided_at ? {
      lecturerId: row.decided_by_account_id || row.lecturer_account_id,
      lecturerName: row.decider_name || (row.decided_by_account_id ? "Giảng viên" : row.lecturer_name),
      reason: row.decision_reason || "",
      decidedAt: row.decided_at,
    } : null,
  };
}

function proposalAccess(account, parameter) {
  if (!["student", "lecturer"].includes(account.role)) {
    throw new AuthError(403, "Bạn không có quyền truy cập đề xuất.");
  }
  const clauses = account.role === "student"
    ? [`proposals.student_account_id = ${parameter}`]
    : [`proposals.lecturer_account_id = ${parameter}`, `proposals.reviewer_account_id = ${parameter}`];
  return systemDemoEnabled
    ? "proposals.demo_directory_id IS NOT NULL"
    : `proposals.demo_directory_id IS NULL AND (${clauses.join(" OR ")})`;
}

function databaseId(value) {
  const id = typeof value === "string" && value.startsWith("DX-") ? value.slice(3) : "";
  if (!isUuid(id)) throw new AuthError(404, "Không tìm thấy đề xuất.");
  return id;
}

export async function listProposals(account) {
  const result = await pool.query(readRows + " WHERE " + proposalAccess(account, "$1")
    + " ORDER BY created_at DESC, proposals.id", systemDemoEnabled ? [] : [account.id]);
  return result.rows.map(browserRecord);
}

async function readProposalRow(account, id, connection) {
  const result = await connection.query(readRows + " WHERE proposals.id = $1 AND " + proposalAccess(account, "$2"),
    systemDemoEnabled ? [databaseId(id)] : [databaseId(id), account.id]);
  if (!result.rowCount) throw new AuthError(404, "Không tìm thấy đề xuất.");
  return result.rows[0];
}

export async function readProposal(account, id, connection = pool) {
  return browserRecord(await readProposalRow(account, id, connection));
}

export async function readProposalFile(account, id, fileId) {
  const row = await readProposalRow(account, id, pool);
  const inline = fileId === row.cover_file_id;
  if (!inline && fileId !== row.attachment_file_id) throw new AuthError(404, "Không tìm thấy tệp đề xuất.");
  return { file: await readFileContent(fileId), inline };
}

const eligibleLecturers = `
  SELECT lecturer.id, lecturer.username, lecturer.email, lecturer.display_name, google.authoritative_email
  FROM accounts AS lecturer
  LEFT JOIN google_identities AS google ON google.account_id = lecturer.id
  WHERE lecturer.role = 'lecturer' AND lecturer.status = 'active'
    AND (lecturer.is_demo OR lecturer.password_hash IS NOT NULL OR google.account_id IS NOT NULL)
`;

export async function availableLecturers(connection = pool) {
  const { rows } = await connection.query(
    eligibleLecturers + " AND lecturer.is_demo = $1 ORDER BY COALESCE(lecturer.username, lecturer.email), lecturer.id",
    [systemDemoEnabled],
  );
  if (systemDemoEnabled && !rows.length) {
    throw new AuthError(503, "Tài khoản giảng viên minh họa chưa khả dụng.");
  }
  return combineLecturerDirectory(rows, systemDemoEnabled ? rows[0] : undefined);
}

async function checkedProposal(input, account, connection, previous = null) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new AuthError(400, "Thông tin đề xuất không hợp lệ.");
  const keys = ["title", "description", "objectives", "outcomes", "type", "courseId", "semester", "academicYear", "supervisorId"];
  if (keys.some(key => typeof input[key] !== "string" || input[key].includes("\0"))) {
    throw new AuthError(400, "Thông tin đề xuất không hợp lệ.");
  }
  if (input.attachment || input.coverImage) throw new AuthError(400, "Tệp đề xuất cần được gửi cùng biểu mẫu.");
  if (!isUuid(input.supervisorId) && !/^giang-vien-\d+$/.test(input.supervisorId)) {
    throw new AuthError(400, "Vui lòng chọn giảng viên hợp lệ.");
  }
  if (input.outline?.version !== 3) throw new AuthError(400, "Vui lòng điền đề cương và các mốc của đề xuất.");

  // Khi giữ nguyên lựa chọn, giữ cả tài khoản nhận của đề xuất đã lưu.
  const keepSupervisor = previous?.supervisorId === input.supervisorId;
  const profile = keepSupervisor
    ? previous.supervisorProfile || { name: previous.supervisorName }
    : (await availableLecturers(connection)).find(item => item.id === input.supervisorId && item.canReceive);
  if (!profile) throw new AuthError(400, "Giảng viên chưa có trong danh sách có thể chọn.");

  const sendToDemo = !keepSupervisor && systemDemoEnabled;
  const recipientFilter = sendToDemo ? " AND lecturer.is_demo" : " AND lecturer.id = $1";
  const recipientId = keepSupervisor ? previous.lecturerId : input.supervisorId;
  const { rows: [lecturer] } = await connection.query(
    eligibleLecturers + recipientFilter + " FOR SHARE OF lecturer",
    sendToDemo ? [] : [recipientId],
  );
  if (!lecturer) throw new AuthError(400, "Tài khoản nhận đề xuất hiện chưa hoạt động.");

  const usesDemoDirectory = sendToDemo || (keepSupervisor && previous.isSharedDemo);
  const demoDirectoryId = usesDemoDirectory ? input.supervisorId : null;
  const supervisorProfile = profile.directoryId ? profile : undefined;

  const student = { ...proposalStudent(account), name: accountLabel(account) };
  const members = input.outline.members;
  const reviewInput = {
    ...input,
    outline: {
      ...input.outline,
      members: members === undefined
        ? [{ ...student, role: "nhom-truong" }]
        : Array.isArray(members)
          ? members.map(member => member?.role === "nhom-truong" ? { ...student, role: "nhom-truong" } : member)
          : members,
    },
  };
  const checked = validateProposal(reviewInput, { ...catalog, supervisors: { [input.supervisorId]: profile.name } }, student);
  if (checked.errors.length) throw new AuthError(400, checked.errors[0].message);

  const { title, type, courseId, semester, academicYear, description, objectives, outcomes, outline } = checked.value;
  const titleKey = fingerprint(title.normalize("NFC").toLocaleLowerCase("vi").replace(/\s+/g, " "));
  const content = JSON.stringify({ description, objectives, outcomes, outline, supervisorProfile });
  if (content.includes("\\u0000")) throw new AuthError(400, "Nội dung đề xuất có ký tự không hợp lệ.");
  return [lecturer.id, type, courseId, semester, academicYear, title, titleKey, content, demoDirectoryId];
}

function checkRevision(value) {
  if (!Number.isInteger(value) || value < 0 || value >= 2147483647) throw new AuthError(400, "Phiên bản đề xuất không hợp lệ.");
  return value;
}

function conflict() {
  return new AuthError(409, "Đề xuất đã thay đổi, đã rút hoặc đã được xử lý. Vui lòng tải lại để xem cập nhật.");
}

function duplicate(error) {
  if (error.code === "23505" && error.constraint === "proposals_pending_request_key") {
    throw new AuthError(409, "Đề xuất này đang chờ duyệt. Bạn có thể xem lại trong Đề tài của tôi.");
  }
  throw error;
}

export async function createProposal(account, input, files = {}) {
  try {
    return await transaction(async (client) => {
      const validated = await checkedProposal(input, account, client);
      const topicCode = await useTopicCode(client, account, validated[1], input.topicCodeFormId);
      const attachment = await nextFileId(client, files.attachment);
      const cover = await nextFileId(client, files.cover);
      const result = await client.query(`
        INSERT INTO proposals (student_account_id, topic_code, lecturer_account_id, type, course_id,
          semester, academic_year, title, title_key, content, demo_directory_id, attachment_file_id, cover_file_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id
      `, [account.id, topicCode, ...validated, attachment, cover]);
      return readProposal(account, "DX-" + result.rows[0].id, client);
    });
  } catch (error) {
    duplicate(error);
  }
}

export async function updateProposal(account, id, revision, input, files = {}) {
  checkRevision(revision);
  try {
    return await transaction(async (client) => {
      const row = await readProposalRow(account, id, client);
      const previous = browserRecord(row);
      if (previous.status !== "cho-duyet" || previous.revision !== revision) throw conflict();
      const owner = { id: row.student_account_id, username: row.student_name };
      const validated = await checkedProposal(input, owner, client, previous);
      const attachment = await nextFileId(client, files.attachment, row.attachment_file_id);
      const cover = await nextFileId(client, files.cover, row.cover_file_id);
      const result = await client.query(`
        UPDATE proposals SET lecturer_account_id = $3, type = $4, course_id = $5, semester = $6,
          academic_year = $7, title = $8, title_key = $9, content = $10, demo_directory_id = $11,
          attachment_file_id = $12, cover_file_id = $13,
          reviewer_account_id = CASE WHEN $11::text IS NULL THEN NULL ELSE reviewer_account_id END,
          revision = revision + 1, updated_at = now()
        WHERE id = $1 AND revision = $2 AND status = 'cho-duyet' AND ${proposalAccess(account, "$14")}
      `, [databaseId(id), revision, ...validated, attachment, cover, ...(systemDemoEnabled ? [] : [account.id])]);
      if (!result.rowCount) throw conflict();
      const replaced = [row.attachment_file_id !== attachment && row.attachment_file_id, row.cover_file_id !== cover && row.cover_file_id].filter(Boolean);
      if (replaced.length) await client.query("DELETE FROM files WHERE id = ANY($1::uuid[])", [replaced]);
      return readProposal(account, id, client);
    });
  } catch (error) {
    duplicate(error);
  }
}

export async function changeProposalStatus(account, id, revision, action, reason) {
  checkRevision(revision);
  const student = account.role === "student";
  const statuses = student ? { withdraw: "da-rut" } : { approved: "da-duyet", rejected: "tu-choi" };
  if (!Object.hasOwn(statuses, action)) throw new AuthError(400, "Thao tác với đề xuất không hợp lệ.");
  const trimmed = typeof reason === "string" ? reason.trim() : "";
  if (action === "rejected" && (trimmed.length < 10 || trimmed.includes("\0"))) {
    throw new AuthError(400, "Vui lòng nhập lý do từ chối từ 10 ký tự.");
  }

  return transaction(async (client) => {
    const previous = await readProposal(account, id, client);
    if (previous.status !== "cho-duyet" || previous.revision !== revision) throw conflict();
    const result = await client.query(`
      UPDATE proposals SET status = $4, revision = revision + 1, updated_at = now(),
        decision_reason = $5, decided_at = CASE WHEN $4 = 'da-rut' THEN NULL ELSE now() END,
        decided_by_account_id = CASE WHEN $4 = 'da-rut' THEN NULL ELSE $2::uuid END
      WHERE id = $1 AND revision = $3 AND status = 'cho-duyet' AND ${proposalAccess(account, "$2")}
    `, [databaseId(id), account.id, revision, statuses[action], action === "rejected" ? trimmed : null]);
    if (!result.rowCount) throw conflict();
    const record = await readProposal(account, id, client);
    if (action !== "approved") return { record };
    return { record, project: await readProject(account, record.topicId, client) };
  });
}
