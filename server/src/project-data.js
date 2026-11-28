import { pool } from "./db.js";
import { AuthError, demoStudentName, isUuid, systemDemoEnabled } from "./auth-security.js";
import configuration from "../../web/assets/js/services/proposal-service.js";
import { submissionBoardJoins } from "./submission-board-query.js";
import { evaluationColumns, evaluationJoins, formatEvaluation } from "./evaluation-query.js";
import { fileMetadata, readFileContent } from "./shared-files.js";

const { catalog } = configuration;
const projectSource = `
  FROM projects AS project
  LEFT JOIN proposals AS proposal ON proposal.id = project.proposal_id
  LEFT JOIN registrations AS registration ON registration.id = project.registration_id
  LEFT JOIN lecturer_topics AS lecturer_topic ON lecturer_topic.code = registration.topic_code
  LEFT JOIN files AS project_cover ON project_cover.id = COALESCE(proposal.cover_file_id, lecturer_topic.cover_file_id)
`;
const teamJoins = `
  CROSS JOIN LATERAL (
    SELECT jsonb_agg(jsonb_build_object('name', display_name, 'code', student_code, 'role', role,
      'assignmentKey', 'member-' || position, 'accountId', account_id) ORDER BY position) AS members
    FROM project_members WHERE project_id = project.id
  ) AS team
  CROSS JOIN LATERAL (
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id', id, 'lecturerId', teacher_key, 'lecturerName', teacher_name, 'status', status, 'thread', true,
      'createdAt', created_at, 'decidedAt', decided_at, 'decisionNote', decision_note
    ) ORDER BY created_at, id) FILTER (WHERE status <> 'cancelled'), '[]'::jsonb) AS records
    FROM supervision_invitations WHERE project_id = project.id
  ) AS invitations
`;
const readRows = `
  SELECT project.id, project.proposal_id, project.registration_id, project.supervisor_account_id,
    project.demo_catalog_id, project.demo_team_snapshot,
    project.status, project.created_at, project.team_revision, project.progress_revision, project.submissions_revision, project.submissions_locked,
    proposal.topic_code, proposal.title, proposal.type, proposal.course_id, proposal.semester, proposal.academic_year,
    proposal.content, COALESCE(lecturer_topic.is_demo, proposal.demo_directory_id IS NOT NULL) AS is_shared_demo,
    registration.topic_snapshot, registration.group_name, proposal.demo_directory_id,
    project_cover.id AS cover_file_id, ${fileMetadata("project_cover")} AS cover,
    COALESCE(proposal.content #>> '{supervisorProfile,name}', lecturer.display_name, lecturer.username, lecturer.email) AS supervisor_name,
    team.members, invitations.records AS invitations, progress.tasks, updates.history, requirements.requirements, submissions.submissions, ${evaluationColumns}
  ${projectSource}
  LEFT JOIN accounts AS lecturer ON lecturer.id = proposal.lecturer_account_id
  ${teamJoins}
  CROSS JOIN LATERAL (
    SELECT jsonb_agg(jsonb_build_object(
      'id', task.id, 'title', task.title, 'description', task.description, 'deadline', to_char(task.deadline, 'YYYY-MM-DD'),
      'status', task.status, 'percent', task.percent, 'assigneeCodes', assigned.members
    ) ORDER BY task.created_at, task.id) AS tasks
    FROM project_tasks AS task
    CROSS JOIN LATERAL (
      SELECT COALESCE(jsonb_agg('member-' || member_position ORDER BY member_position), '[]'::jsonb) AS members
      FROM project_task_assignees WHERE task_id = task.id
    ) AS assigned WHERE task.project_id = project.id
  ) AS progress
  CROSS JOIN LATERAL (
    SELECT jsonb_agg(jsonb_build_object(
      'id', log.id, 'taskId', log.task_id, 'taskTitle', log.task_title, 'status', log.status,
      'percent', log.percent, 'content', log.content, 'actorName', log.actor_name, 'actorCode', log.actor_code,
      'createdAt', log.created_at
    ) ORDER BY log.created_at DESC, log.id) AS history
    FROM project_progress_updates AS log WHERE log.project_id = project.id
  ) AS updates
  ${submissionBoardJoins}
  ${evaluationJoins}
`;

function projectAccess(account, parameter) {
  if (account.role !== "student" && account.role !== "lecturer") {
    throw new AuthError(403, "Bạn không có quyền truy cập đề tài đang thực hiện.");
  }
  const demo = "COALESCE(lecturer_topic.is_demo, proposal.demo_directory_id IS NOT NULL)";
  if (systemDemoEnabled) return demo;
  const condition = account.role === "student"
    ? `EXISTS (SELECT 1 FROM project_members WHERE project_id = project.id AND account_id = ${parameter})`
    : `(project.supervisor_account_id = ${parameter} OR EXISTS (
      SELECT 1 FROM supervision_invitations
      WHERE project_id = project.id AND status = 'accepted' AND lecturer_account_id = ${parameter}
    ))`;
  return `project.demo_catalog_id IS NULL AND NOT ${demo} AND ${condition}`;
}

function projectAndProgress(row, account) {
  const viewer = account.role === "student" && (row.members || []).find(member =>
    systemDemoEnabled ? member.role === "nhom-truong" : member.accountId === account.id);
  const record = row.demo_catalog_id ? demoTeamRecord(row, account)
    : browserProject({ ...row, members: (row.members || []).map(({ accountId, ...member }) => member) });
  if (!row.demo_catalog_id) {
    if (row.cover) record.project.coverImage = { ...row.cover, fileKey: row.cover_file_id, projectId: record.project.id };
    if (account.role === "lecturer" && !systemDemoEnabled && account.id !== row.supervisor_account_id) {
      Object.assign(record.project, { role: "secondary", roleLabel: "Đồng hướng dẫn" });
    }
    Object.assign(record.team, { revision: row.team_revision, viewerMemberKey: viewer?.assignmentKey ?? null,
      invitations: row.invitations, primaryTeacherKey: row.demo_directory_id ?? row.supervisor_account_id });
  }
  return {
    ...record,
    progress: { projectId: record.project.id, revision: row.progress_revision,
      tasks: (row.tasks || []).map(task => ({ ...task, assigneeCode: task.assigneeCodes[0] || "" })),
      history: row.history || [], viewerMemberKey: viewer?.assignmentKey ?? null },
    submissionBoard: submissionBoard(row),
    evaluation: formatEvaluation(row, record.project.id, account),
  };
}

function submissionBoard(row) {
  return { revision: row.submissions_revision, projectStatus: row.status, submissionsLocked: row.submissions_locked,
    requirements: row.requirements, submissions: row.submissions };
}

function browserProject(row) {
  if (row.registration_id) return browserRegistrationProject(row);
  const id = "DT-DX-" + row.id;
  const { outline, description, objectives, outcomes, startsAt, progressReportDate, finalReportDate, methodAndScope, plan } = row.content;
  const members = (row.members || []).map(member => systemDemoEnabled && member.role === "nhom-truong"
    ? { ...member, name: demoStudentName } : member);
  const leader = members.find(member => member.role === "nhom-truong");
  const requestId = "DX-" + row.proposal_id;
  return {
    project: {
      id, topicId: id, requestId, source: "approved-proposal",
      topicCode: row.topic_code, displayId: row.topic_code, title: row.title,
      isDatabaseProject: true, isDatabaseProposal: true, isSharedDemo: row.is_shared_demo,
      type: row.type === "khoa-luan" ? "khoa-luan" : "do-an", topicType: row.type, typeLabel: catalog.types[row.type].label,
      courseId: row.course_id, courseLabel: catalog.types[row.type].courses[row.course_id],
      semester: row.semester, academicYear: row.academic_year, status: row.status,
      statusLabel: row.status === "hoan-thanh" ? "Hoàn thành" : "Đang thực hiện",
      groupName: leader ? "Nhóm của " + leader.name : "",
      lecturer: row.supervisor_name || "Chưa có thông tin", lecturerLabel: "Giảng viên hướng dẫn", roleLabel: "Hướng dẫn chính",
      lecturerId: row.supervisor_account_id, createdAt: row.created_at,
      description, objectives, outcomes,
      outline: outline ? { ...outline, members } : null,
      startsAt: outline?.startDate || startsAt || "",
      progressReportDate: outline?.progressReportDate || progressReportDate || "",
      finalReportDate: outline?.finalReportDate || outline?.endDate || finalReportDate || "",
      methodAndScope: outline?.methodAndScope || [outline?.method, outline?.scope].filter(Boolean).join("\n\n") || methodAndScope || "",
      plan: outline?.plan || plan || "",
    },
    team: { projectId: id, maxMembers: 4, members, supervisorIds: [row.supervisor_account_id], invitations: [] },
  };
}

function browserRegistrationProject(row) {
  const topic = row.topic_snapshot;
  const id = "DT-DK-" + row.id;
  const text = value => Array.isArray(value) ? value.join("\n") : value || "";
  return {
    project: {
      id, topicId: id, requestId: "DK-" + row.registration_id, source: "approved-registration",
      title: topic.title, topicCode: topic.id, displayId: topic.id,
      isDatabaseProject: true, isSharedDemo: row.is_shared_demo,
      type: topic.topicType === "thesis" ? "khoa-luan" : "do-an",
      topicType: topic.topicType, typeLabel: topic.typeLabel, courseId: topic.courseId, courseLabel: topic.courseLabel,
      academicYear: topic.academicYear, semester: topic.semester, createdAt: row.created_at,
      status: row.status, statusLabel: row.status === "hoan-thanh" ? "Hoàn thành" : "Đang thực hiện",
      registrationStatus: "da-dang-ky", requestStatusLabel: "Đã đăng ký",
      lecturer: topic.supervisor.name, lecturerId: row.supervisor_account_id,
      lecturerLabel: "Giảng viên hướng dẫn", roleLabel: "Hướng dẫn chính",
      groupName: row.group_name || "Nhóm chưa đặt tên",
      description: topic.description, objectives: text(topic.objectives), outcomes: text(topic.outcomes),
      requirements: text(topic.requirements), methodAndScope: topic.methodAndScope, plan: topic.plan,
      startsAt: topic.startsAt, progressReportDate: topic.progressReportDate, finalReportDate: topic.finalReportDate,
    },
    team: { projectId: id, maxMembers: topic.registration.maxMembers, members: row.members || [],
      supervisorIds: [row.supervisor_account_id], invitations: [] },
  };
}

export async function listProjects(account) {
  const { rows } = await pool.query(readRows + " WHERE " + projectAccess(account, "$1") + " ORDER BY project.created_at DESC, project.id",
    systemDemoEnabled ? [] : [account.id]);
  return rows.map(row => projectAndProgress(row, account));
}

export async function readProjectCover(account, id, fileId) {
  const { project } = await readProject(account, id);
  if (project.coverImage?.fileKey !== fileId) throw new AuthError(404, "Không tìm thấy ảnh đề tài.");
  return readFileContent(fileId);
}

function projectLookup(id) {
  const match = /^DT-(DX|DK)-(.+)$/u.exec(id);
  const projectId = match?.[2];
  if (!isUuid(projectId)) throw new AuthError(404, "Không tìm thấy đề tài đang thực hiện.");
  const source = match[1] === "DX" ? "proposal_id" : "registration_id";
  return { projectId, source };
}

function lookupQuery(account, id) {
  if (isDemoTeamId(id)) {
    if (!canReadDemoTeam(account)) throw new AuthError(404, "Không tìm thấy đề tài đang thực hiện.");
    return { where: " WHERE project.demo_catalog_id = $1 AND project.demo_team_snapshot IS NOT NULL", params: [id] };
  }
  const { projectId, source } = projectLookup(id);
  return {
    where: ` WHERE project.id = $1 AND project.${source} IS NOT NULL AND ` + projectAccess(account, "$2"),
    params: systemDemoEnabled ? [projectId] : [projectId, account.id],
  };
}

export async function readProject(account, id, connection = pool) {
  const { where, params } = lookupQuery(account, id);
  const { rows: [record] } = await connection.query(readRows + where, params);
  if (!record) throw new AuthError(404, "Không tìm thấy đề tài đang thực hiện.");
  return projectAndProgress(record, account);
}

export async function lockProject(account, id, connection) {
  const { where, params } = lookupQuery(account, id);
  const result = await connection.query("SELECT project.id " + projectSource + where + " FOR UPDATE OF project", params);
  if (!result.rowCount) throw new AuthError(404, "Không tìm thấy đề tài đang thực hiện.");
  return result.rows[0].id;
}

const demoTeamSource = " FROM projects AS project";
const demoTeamFilter = " WHERE project.demo_catalog_id IS NOT NULL AND project.demo_team_snapshot IS NOT NULL";
const demoTeamRows = `
  SELECT project.demo_catalog_id, project.demo_team_snapshot, project.supervisor_account_id,
    project.status, project.team_revision, team.members, invitations.records AS invitations
  ${demoTeamSource} ${teamJoins} ${demoTeamFilter}
`;
export const isDemoTeamId = id => typeof id === "string" && /^UIT-SV-[A-Z0-9-]{1,32}$/.test(id);
const canReadDemoTeam = account => systemDemoEnabled && ["student", "lecturer"].includes(account.role);

function demoTeamRecord(row, account) {
  const id = row.demo_catalog_id;
  const { title, lecturer, maxMembers } = row.demo_team_snapshot;
  const members = (row.members ?? []).map(({ accountId, ...member }) => member);
  const leader = account.role === "student" && members.find(member => member.role === "nhom-truong");
  return {
    project: { id, title, status: row.status },
    team: { projectId: id, revision: row.team_revision, maxMembers, members,
      viewerMemberKey: leader?.assignmentKey ?? null, supervisorIds: [row.supervisor_account_id],
      invitations: row.invitations, primaryTeacherKey: row.supervisor_account_id, primaryTeacherName: lecturer },
  };
}

export async function listDemoTeams(account, workspace) {
  if (!canReadDemoTeam(account)) return {};
  const { rows } = await pool.query(demoTeamRows + " ORDER BY project.demo_catalog_id");
  const teams = Object.fromEntries(rows.map(row => [row.demo_catalog_id, demoTeamRecord(row, account)]));
  if (typeof workspace === "string" && Object.hasOwn(teams, workspace)) {
    const { project, team, progress, submissionBoard: board } = await readProject(account, workspace);
    teams[workspace] = { project, team, progress, submissionBoard: board };
  } else if (workspace === "deadlines") {
    const { rows: active } = await pool.query(`
      SELECT project.demo_catalog_id, project.status, project.submissions_revision, project.submissions_locked,
        requirements.requirements, submissions.submissions
      FROM projects AS project ${submissionBoardJoins}
      ${demoTeamFilter} AND project.status = 'dang-thuc-hien'
    `);
    for (const row of active) teams[row.demo_catalog_id].submissionBoard = submissionBoard(row);
  }
  return teams;
}

export { readProject as readTeamProject, lockProject as lockTeamProject };
