import { AuthError, transaction } from "./auth-security.js";
import { assertTopicRevision, lockLecturerTopic } from "./lecturer-topic-data.js";
import { proposalStudent } from "./proposal-data.js";
import { readProject } from "./project-data.js";
import validation from "../../web/assets/js/shared/validation.js";

export async function registerForTopic(account, code, { revision, enrollment } = {}) {
  if (!enrollment || typeof enrollment !== "object" || !Array.isArray(enrollment.members)) {
    throw new AuthError(400, "Thông tin nhóm đăng ký không hợp lệ.");
  }
  return transaction(async client => {
    const topic = await lockLecturerTopic(client, account, code);
    if (topic.registered) throw new AuthError(409, "Đề tài đã có nhóm đăng ký.");
    assertTopicRevision(topic, revision);
    if (topic.status !== "open") throw new AuthError(409, "Giảng viên đã đóng đăng ký đề tài này.");
    const now = Date.now();
    if (Date.parse(topic.registration.deadline) <= now) throw new AuthError(409, "Đề tài đã hết hạn đăng ký.");
    if (topic.registration.opensAt && Date.parse(topic.registration.opensAt) > now) {
      throw new AuthError(409, "Chưa đến thời điểm mở đăng ký đề tài.");
    }
    const student = proposalStudent(account);
    const members = enrollment.members.map((member, index) =>
      index === 0 ? { code: student.code, name: student.name, role: "nhom-truong" } : member);
    const checked = validation.validateRegistration({ ...enrollment, members }, {
      ...topic.registration, groupNameRequired: false, leaderCodeOptional: true,
    });
    if (checked.errors.length) throw new AuthError(400, checked.errors[0].message);
    const { groupName, message } = checked.value;
    if ([groupName, message, ...checked.value.members.flatMap(member => [member.code, member.name])].some(value => value.includes("\0"))) {
      throw new AuthError(400, "Thông tin nhóm chứa ký tự không hợp lệ.");
    }
    const { attachmentRef, attachmentName, imageRef, ...topicSnapshot } = topic;
    const { rows: [registration] } = await client.query(`
      INSERT INTO registrations (topic_code, student_account_id, topic_snapshot, group_name, message)
      VALUES ($1, $2, $3, $4, $5) RETURNING id, created_at
    `, [code, account.id, JSON.stringify(topicSnapshot), groupName, message]);
    await client.query(`
      INSERT INTO projects (id, registration_id, supervisor_account_id, created_at)
      VALUES ($1, $1, $2, $3)
    `, [registration.id, topic.ownerId, registration.created_at]);
    await client.query(`
      INSERT INTO project_members (project_id, position, account_id, student_code, display_name, role)
      SELECT $1, position, CASE WHEN position = 1 THEN $2::uuid END, member->>'code', member->>'name', member->>'role'
      FROM jsonb_array_elements($3::jsonb) WITH ORDINALITY AS entry(member, position)
    `, [registration.id, account.id, JSON.stringify(checked.value.members)]);
    const record = { id: "DK-" + registration.id, status: "da-dang-ky", isDatabaseRegistration: true };
    return { record, topic: { ...topic, registered: true, registrationId: record.id },
      project: await readProject(account, "DT-" + record.id, client) };
  });
}
