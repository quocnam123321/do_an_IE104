import { pool } from "./db.js";
import { AuthError, isUuid, systemDemoEnabled } from "./auth-security.js";
import { academicTermId, roundEnd, vietnamMinute } from "./academic-data.js";
import { fileMetadata, readFileContent } from "./shared-files.js";

const status = { "cho-duyet": "pending", "da-duyet": "approved", "tu-choi": "rejected", "da-rut": "withdrawn" };
const types = { "do-an-mon-hoc": "course", "do-an-tot-nghiep": "graduation", "khoa-luan": "thesis" };
const unknown = "Chưa có thông tin";
const nameOf = alias => `COALESCE(${alias}.display_name,${alias}.username,${alias}.email)`;
const milestones = info => [info.startsAt, info.progressReportDate, info.finalReportDate].map(value =>
  typeof value === "string" && value.includes("T") && Number.isFinite(Date.parse(value)) ? vietnamMinute(value) : value);

export async function readAdminCatalog() {
  const [projects, proposals, registrations, topics] = await Promise.all([
    pool.query(`
      SELECT p.id,p.status,p.created_at,p.demo_catalog_id,p.demo_team_snapshot,
        pr.topic_code,pr.title,pr.type,pr.course_id,pr.academic_year,pr.semester,pr.content,pr.registration_round_id AS proposal_round_id,
        r.group_name,r.topic_snapshot,r.topic_code AS registered_topic_code,t.registration_round_id,${nameOf("a")} AS lecturer,
        (SELECT MAX(e.published_at) FROM project_evaluations e WHERE e.project_id=p.id) AS published_on,
        COALESCE((SELECT jsonb_agg(jsonb_build_object('name',m.display_name,'code',m.student_code,'role',m.role)
          ORDER BY m.position) FROM project_members m WHERE m.project_id=p.id),'[]') AS members
      FROM projects p
      LEFT JOIN proposals pr ON pr.id=p.proposal_id
      LEFT JOIN registrations r ON r.id=p.registration_id
      LEFT JOIN lecturer_topics t ON t.code=r.topic_code
      LEFT JOIN accounts a ON a.id=p.supervisor_account_id
      WHERE (p.demo_catalog_id IS NULL AND NOT COALESCE(t.is_demo,pr.demo_directory_id IS NOT NULL))
        OR $1
      ORDER BY p.created_at DESC,p.id
    `, [systemDemoEnabled]),
    pool.query(`
      SELECT p.*,${nameOf("s")} AS sender,s.account_code AS sender_code,${nameOf("l")} AS lecturer,
        ${fileMetadata("f")} AS attachment
      FROM proposals p JOIN accounts s ON s.id=p.student_account_id JOIN accounts l ON l.id=p.lecturer_account_id
      LEFT JOIN files f ON f.id=p.attachment_file_id WHERE p.demo_directory_id IS NULL OR $1
      ORDER BY p.created_at DESC,p.id
    `, [systemDemoEnabled]),
    pool.query(`
      SELECT r.*,${nameOf("s")} AS sender,s.account_code AS sender_code,${nameOf("l")} AS lecturer
      FROM registrations r JOIN accounts s ON s.id=r.student_account_id
      JOIN lecturer_topics t ON t.code=r.topic_code JOIN accounts l ON l.id=t.owner_account_id
      WHERE NOT t.is_demo OR $1 ORDER BY r.created_at DESC,r.id
    `, [systemDemoEnabled]),
    pool.query(`
      SELECT t.code,t.title,t.content,t.registration_round_id,t.status,t.deadline,r.starts_at,r.ends_at,r.source,
        ${nameOf("a")} AS lecturer, EXISTS(SELECT 1 FROM registrations WHERE topic_code=t.code) AS registered
      FROM lecturer_topics t JOIN accounts a ON a.id=t.owner_account_id
      LEFT JOIN registration_rounds r ON r.id=t.registration_round_id WHERE NOT t.is_demo OR $1
    `, [systemDemoEnabled]),
  ]);
  const now = Date.now();
  const topicRows = topics.rows.map(row => {
    const starts = row.starts_at?.getTime() ?? Date.parse(row.content.registration?.opensAt);
    const ends = row.ends_at ? roundEnd(row).getTime() : row.deadline.getTime();
    const manuallyClosed = row.status !== "open" || row.registered;
    return {
      id: row.code, name: row.title, lecturer: row.content.supervisor?.name ?? row.lecturer ?? unknown,
      type: row.content.topicType, term: academicTermId(row.content.academicYear, row.content.semester),
      roundId: row.registration_round_id, manuallyClosed,
      status: manuallyClosed || ends <= now ? "closed" : starts > now ? "upcoming" : "open",
      course: row.content.courseLabel, dates: milestones(row.content),
    };
  });
  const projectsView = projects.rows.map(row => {
    const info = row.topic_snapshot ?? row.content ?? row.demo_team_snapshot ?? {};
    return {
      id: row.topic_code ?? row.registered_topic_code ?? row.demo_catalog_id ?? row.id,
      name: row.title ?? info.title ?? unknown,
      type: info.topicType ?? types[row.type],
      lecturer: info.supervisor?.name ?? info.supervisorProfile?.name ?? info.lecturer ?? row.lecturer ?? unknown,
      course: info.courseLabel ?? row.course_id,
      term: academicTermId(row.academic_year ?? info.academicYear, row.semester ?? info.semester),
      roundId: row.proposal_round_id ?? row.registration_round_id,
      status: row.status === "hoan-thanh" ? "completed" : "active",
      memberDetails: row.members, groupName: row.group_name || info.groupName,
      group: row.members.length > 1 ? (row.group_name || info.groupName || "Nhóm thực hiện") : null,
      dates: milestones(info),
      publishedOn: row.published_on,
    };
  });
  const requests = [
    ...proposals.rows.map(row => ({
      id: "DX-" + row.id, code: row.topic_code, name: row.title, type: "proposal", status: status[row.status],
      sender: row.sender ?? unknown, senderCode: row.sender_code, lecturer: row.content.supervisorProfile?.name ?? row.lecturer ?? unknown,
      term: academicTermId(row.academic_year, row.semester), date: vietnamMinute(row.created_at), roundId: row.registration_round_id,
      message: row.content.description, reason: row.decision_reason, attachment: row.attachment,
    })),
    ...registrations.rows.map(row => ({
      id: "DK-" + row.id, name: row.topic_snapshot.title ?? unknown, type: "registration", status: "registered",
      sender: row.sender ?? unknown, senderCode: row.sender_code, lecturer: row.topic_snapshot.supervisor?.name ?? row.lecturer ?? unknown,
      term: academicTermId(row.topic_snapshot.academicYear, row.topic_snapshot.semester),
      date: vietnamMinute(row.created_at), topicId: row.topic_code, message: row.message,
    })),
  ].sort((a,b) => b.date.localeCompare(a.date));
  const projectIds = new Set(projectsView.map(project => project.id));
  const allTopics = [...projectsView, ...topicRows.filter(topic => !projectIds.has(topic.id))];
  const roundTopics = [...allTopics.filter(topic => topic.roundId),
    ...requests.filter(request => request.roundId && !projectIds.has(request.code))];
  return { topics: allTopics, requests, roundTopics };
}

export async function readAdminProposalFile(id) {
  if (!isUuid(id)) throw new AuthError(404, "Không tìm thấy tệp.");
  const { rows: [row] } = await pool.query(
    "SELECT attachment_file_id FROM proposals WHERE id=$1 AND (demo_directory_id IS NULL OR $2)", [id, systemDemoEnabled]);
  if (!row?.attachment_file_id) throw new AuthError(404, "Không tìm thấy tệp.");
  return readFileContent(row.attachment_file_id);
}
