import { pool } from "./db.js";
import { AuthError, demoDisplayName, fingerprint, systemDemoEnabled, transaction } from "./auth-security.js";
import { useTopicCode } from "./topic-code-data.js";
import editor from "../../assets/js/services/lecturer-topic-editor-service.js";
import configuration from "../../assets/js/services/proposal-service.js";
import { fileMetadata, nextFileId, readFileContent } from "./shared-files.js";

const types = { course: "do-an-mon-hoc", graduation: "do-an-tot-nghiep", thesis: "khoa-luan" };
const courseIds = { web: "IE104", database: "IT004", "phan-tich-thiet-ke-phan-mem": "IE108", IE101: "IE101", IE103: "IE103", IE105: "IE105" };
const courses = Object.fromEntries(Object.entries(courseIds).map(([key, id]) =>
  [key, configuration.catalog.types["do-an-mon-hoc"].courses[id].replace(/^\w+ - /, "")]));
const selectTopic = `
  SELECT topic.*, registration.id AS registration_id, registration.student_account_id,
    ${fileMetadata("attachment")} AS attachment, ${fileMetadata("cover")} AS cover
  FROM lecturer_topics AS topic
  LEFT JOIN registrations AS registration ON registration.topic_code = topic.code
  LEFT JOIN files AS attachment ON attachment.id = topic.attachment_file_id
  LEFT JOIN files AS cover ON cover.id = topic.cover_file_id
`;

function topicRecord(row, account) {
  const registered = Boolean(row.registration_id);
  const showRegistration = account.role === "student" && (systemDemoEnabled || row.student_account_id === account.id);
  return {
    ...row.content,
    id: row.code, displayId: row.code, kind: "created", title: row.title,
    ownerId: row.owner_account_id, isDatabaseTopic: true, registered,
    attachmentRef: row.attachment ? { ...row.attachment, key: row.attachment_file_id } : null,
    attachmentName: row.attachment?.name || "",
    imageRef: row.cover ? { ...row.cover, key: row.cover_file_id } : null,
    registrationId: registered && showRegistration ? "DK-" + row.registration_id : null,
    registration: { ...row.content.registration, deadline: row.deadline.toISOString() },
    status: row.status, statusLabel: row.status === "open" ? "Đang mở đăng ký" : "Đã đóng đăng ký",
    revision: row.revision, createdAt: row.created_at.toISOString(), updatedAt: row.updated_at.toISOString(),
  };
}

export async function listLecturerTopics(account) {
  if (!["student", "lecturer"].includes(account.role)) throw new AuthError(403, "Bạn không có quyền truy cập danh mục đề tài.");
  const ownTopics = account.role === "lecturer" && !systemDemoEnabled;
  const { rows } = await pool.query(selectTopic + " WHERE topic.is_demo = $1"
    + (ownTopics ? " AND topic.owner_account_id = $2" : "") + " ORDER BY topic.created_at DESC, topic.code",
  ownTopics ? [systemDemoEnabled, account.id] : [systemDemoEnabled]);
  return rows.map(row => topicRecord(row, account));
}

async function readTopic(account, code, connection = pool) {
  const { rows: [row] } = await connection.query(selectTopic + " WHERE topic.code = $1 AND topic.is_demo = $2", [code, systemDemoEnabled]);
  if (!row || !["student", "lecturer"].includes(account.role) ||
      (account.role === "lecturer" && !systemDemoEnabled && row.owner_account_id !== account.id)) {
    throw new AuthError(404, "Không tìm thấy đề tài.");
  }
  return row;
}

export async function readLecturerTopicFile(account, code, fileId) {
  const row = await readTopic(account, code);
  const inline = fileId === row.cover_file_id;
  if (!inline && fileId !== row.attachment_file_id) throw new AuthError(404, "Không tìm thấy tệp đề tài.");
  return { file: await readFileContent(fileId), inline };
}

export async function lockLecturerTopic(client, account, code) {
  const { rows: [row] } = await client.query(`
    SELECT * FROM lecturer_topics WHERE code = $1 AND is_demo = $2 FOR UPDATE
  `, [code, systemDemoEnabled]);
  if (!row || (account.role === "lecturer" && !systemDemoEnabled && row.owner_account_id !== account.id)) {
    throw new AuthError(404, "Không tìm thấy đề tài.");
  }
  // Đọc lượt đăng ký sau khi khóa để thấy giao dịch đăng ký vừa hoàn tất.
  return topicRecord(await readTopic(account, code, client), account);
}

export function assertTopicRevision(topic, revision) {
  if (!Number.isInteger(revision) || topic.revision !== revision) {
    throw new AuthError(409, "Thông tin đề tài đã thay đổi. Hãy tải lại trước khi xác nhận.");
  }
}

export async function saveLecturerTopic(account, input, { code, revision, topicCodeFormId, files = {} } = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input) ||
      Object.values(input).some(value => !["string", "number"].includes(typeof value) || String(value).includes("\0"))) {
    throw new AuthError(400, "Thông tin đề tài không hợp lệ.");
  }
  try {
    return await transaction(async client => {
      const previous = code ? await lockLecturerTopic(client, account, code) : null;
      if (previous) assertTopicRevision(previous, revision);
      const { value, errors } = editor.validate(input, previous, new Date(), { assignCode: !previous, courses });
      if (errors.length) throw new AuthError(400, errors[0].message);
      const { title, topicType, course, deadline, minMembers, maxMembers, opensAt } = value;
      const courseId = courseIds[course] || ({ graduation: "IE501", thesis: "IE505" })[topicType];
      const courseLabel = courses[course] || configuration.catalog.types[types[topicType]].courses[courseId];
      const supervisor = previous?.supervisor || {
        name: demoDisplayName("lecturer") || account.display_name || account.username || account.email || "Chưa có thông tin",
      };
      const { id, ...fields } = value;
      const content = {
        ...fields, typeLabel: editor.catalog.types[topicType], courseId, courseLabel, supervisor,
        ...(previous?.legacyCatalogId && { legacyCatalogId: previous.legacyCatalogId, studentListed: previous.studentListed }),
        registration: { minMembers, maxMembers, opensAt },
        ...Object.fromEntries(["objectives", "outcomes", "requirements"].map(field =>
          [field, value[field].split(/\r?\n/u).map(editor.text).filter(Boolean)])),
      };
      for (const key of ["title", "deadline", "minMembers", "maxMembers", "opensAt"]) delete content[key];
      const titleKey = fingerprint(title.toLocaleLowerCase("vi").replace(/\s+/gu, " "));
      const previousAttachment = previous?.attachmentRef?.key ?? null;
      const previousCover = previous?.imageRef?.key ?? null;
      const attachment = await nextFileId(client, files.attachment, previousAttachment);
      const cover = await nextFileId(client, files.cover, previousCover);
      const shared = [title, titleKey, JSON.stringify(content), deadline, attachment, cover];
      if (previous) {
        await client.query(`
          UPDATE lecturer_topics SET title = $1, title_key = $2, content = $3, deadline = $4,
            attachment_file_id = $5, cover_file_id = $6,
            revision = revision + 1, updated_at = now()
          WHERE code = $7
        `, [...shared, code]);
        const replaced = [previousAttachment !== attachment && previousAttachment, previousCover !== cover && previousCover].filter(Boolean);
        if (replaced.length) await client.query("DELETE FROM files WHERE id = ANY($1::uuid[])", [replaced]);
        return topicRecord(await readTopic(account, code, client), account);
      }
      const topicCode = await useTopicCode(client, account, types[topicType], topicCodeFormId);
      await client.query(`
        INSERT INTO lecturer_topics (title, title_key, content, deadline, attachment_file_id, cover_file_id, code, owner_account_id, is_demo)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [...shared, topicCode, account.id, systemDemoEnabled]);
      return topicRecord(await readTopic(account, topicCode, client), account);
    });
  } catch (error) {
    if (error.code === "23505" && ["lecturer_topics_demo_title_key", "lecturer_topics_owner_title_key"].includes(error.constraint)) {
      throw new AuthError(409, "Đã có đề tài cùng tên. Hãy mở đề tài đó để chỉnh sửa.");
    }
    throw error;
  }
}

export async function setLecturerTopicRegistration(account, code, { open, deadline, revision } = {}) {
  if (typeof open !== "boolean") throw new AuthError(400, "Trạng thái đăng ký không hợp lệ.");
  return transaction(async client => {
    const topic = await lockLecturerTopic(client, account, code);
    if (topic.registered) throw new AuthError(409, "Đề tài đã có nhóm đăng ký.");
    assertTopicRevision(topic, revision);
    const closesAt = open ? editor.date(deadline) : topic.registration.deadline;
    if (open && (!closesAt || Date.parse(closesAt) <= Date.now() || Date.parse(closesAt) <= Date.parse(topic.registration.opensAt))) {
      throw new AuthError(400, "Hạn đăng ký mới phải là ngày giờ hợp lệ trong tương lai và sau thời điểm mở.");
    }
    await client.query(`
      UPDATE lecturer_topics SET status = $2, deadline = $3, revision = revision + 1, updated_at = now()
      WHERE code = $1
    `, [code, open ? "open" : "closed", closesAt]);
    return topicRecord(await readTopic(account, code, client), account);
  });
}
