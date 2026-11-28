import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createContext, runInContext } from "node:vm";

const assets = new URL("../../assets/", import.meta.url);
const scripts = [
  "data/mock-data", "data/student-projects", "data/student-progress", "data/student-evaluations",
  "data/teaching-data", "uit-lecturer-catalog", "data/lecturer-topics", "data/lecturer-merge-catalog",
  "data/student-uit-catalog", "data/student-web-submissions",
];

export async function loadCatalog() {
  // Use the same sample definitions as the static site, without browser storage.
  const context = createContext({ URLSearchParams, location: { protocol: "file:", search: "" } });
  context.window = context;
  for (const script of scripts) {
    const file = new URL(`js/${script}.js`, assets);
    runInContext(await readFile(file, "utf8"), context, { filename: file.pathname });
  }
  return context.IE104.data;
}

async function seedProgress(client, projectId, tasks, started) {
  const rows = tasks.map((task, index) => ({
    ...task, id: randomUUID(), assignees: task.assigneeCodes ?? [task.assigneeCode],
    created: new Date(Date.parse(started) + index).toISOString(),
  }));
  await client.query(`
    WITH sample AS (
      SELECT * FROM jsonb_to_recordset($2::jsonb) AS task(id uuid, title text, description text,
        deadline date, status text, percent smallint, created timestamptz, assignees text[])
    ), inserted AS (
      INSERT INTO project_tasks (id, project_id, title, description, deadline, status, percent, created_at)
      SELECT id, $1, title, COALESCE(description, ''), deadline, status, percent, created FROM sample
      RETURNING id
    )
    INSERT INTO project_task_assignees (project_id, task_id, member_position)
    SELECT $1, sample.id, member.position
    FROM sample JOIN inserted USING (id)
    JOIN project_members AS member ON member.project_id = $1 AND member.student_code = ANY(sample.assignees)
  `, [projectId, JSON.stringify(rows)]);
}

async function seedSubmissions(client, projectId, sample, board, demoAccounts, bundledFile) {
  const requirementIds = new Map(board.requirements.map(item => [item.id, randomUUID()]));
  const requirements = board.requirements.map(item => ({ ...item, id: requirementIds.get(item.id) }));
  await client.query(`
    INSERT INTO project_submission_requirements (id, project_id, title, content, deadline, locked)
    SELECT id, $1, title, content, deadline, COALESCE(locked, false)
    FROM jsonb_to_recordset($2::jsonb) AS req(id uuid, title text, content text, deadline timestamptz, locked boolean)
  `, [projectId, JSON.stringify(requirements)]);

  const submissions = await Promise.all(board.submissions.map(async submission => {
    const attachment = await bundledFile(sample.id, submission);
    return {
      id: randomUUID(), requirement: requirementIds.get(submission.requirementId),
      submitted: submission.submittedAt, notes: submission.notes || "", calendar_status: submission.calendarStatus ?? null,
      feedback: submission.feedback, feedback_at: submission.feedbackAt ?? null,
      ...attachment,
    };
  }));
  await client.query(`
    WITH sample AS (
      SELECT * FROM jsonb_to_recordset($5::jsonb) AS entry(id uuid, requirement uuid,
        submitted timestamptz, notes text, calendar_status text, feedback text, feedback_at timestamptz,
        file_id uuid, file_name text, mime text, encoded text)
    ), submitted AS (
      INSERT INTO project_submissions (id, project_id, requirement_id, attempt, submitted_by_account_id,
        submitted_at, notes, sample_calendar_status)
      SELECT id, $1, requirement, 1, $2, submitted, notes, calendar_status FROM sample RETURNING id
    ), attachments AS (
      INSERT INTO files (id, file_name, content_type, content, created_at)
      SELECT file_id, file_name, mime, decode(encoded, 'base64'), sample.submitted
      FROM sample JOIN submitted USING (id) RETURNING id
    ), linked AS (
      INSERT INTO project_submission_files (id, submission_id, position)
      SELECT attachments.id, sample.id, 1 FROM attachments JOIN sample ON attachments.id = sample.file_id
    )
    INSERT INTO project_submission_feedback (submission_id, revision, lecturer_account_id, lecturer_name, content, created_at)
    SELECT sample.id, 1, $3, $4, feedback, COALESCE(feedback_at, sample.submitted)
    FROM sample JOIN submitted USING (id) WHERE NULLIF(btrim(feedback), '') IS NOT NULL
  `, [projectId, demoAccounts.student, demoAccounts.lecturer, sample.lecturer, JSON.stringify(submissions)]);
}

export default async function migrate(client) {
  const data = await loadCatalog();
  const { rows: accounts } = await client.query("SELECT id, role FROM accounts WHERE is_demo");
  const demo = Object.fromEntries(accounts.map(({ id, role }) => [role, id]));
  if (!demo.student || !demo.lecturer) throw new Error("Thiếu tài khoản minh họa để nhập dữ liệu đề tài mẫu.");

  await client.query(`
    ALTER TABLE project_submissions ADD COLUMN sample_calendar_status text CHECK (sample_calendar_status = 'submitted')
  `);
  const files = new Map();
  async function bundledFile(projectId, submission) {
    const file = data.studentWebSubmissions.attachment(projectId, submission);
    if (!file || !/^[a-z0-9-]+\.(pdf|zip)$/.test(file.path)) {
      throw new Error(`Thiếu tệp minh họa của bài nộp ${submission.id}.`);
    }
    if (!files.has(file.path)) files.set(file.path, readFile(new URL(`files/${file.path}`, assets)));
    const content = await files.get(file.path);
    return { file_id: randomUUID(), file_name: file.name,
      mime: file.path.endsWith(".zip") ? "application/zip" : "application/pdf", encoded: content.toString("base64") };
  }

  if (!data.myTopics?.length) throw new Error("Không tìm thấy danh mục đề tài mẫu.");
  for (const sample of data.myTopics) {
    const team = data.projectTeams.find(item => item.projectId === sample.id);
    const progress = data.projectProgress.find(item => item.projectId === sample.id);
    const board = data.teachingSeeds.find(item => item.projectId === sample.id);
    if (!team || !progress || !board) throw new Error(`Dữ liệu đề tài mẫu ${sample.id} chưa đầy đủ.`);
    const { rows: [existing] } = await client.query("SELECT id FROM projects WHERE demo_catalog_id = $1", [sample.id]);
    let project = existing;
    if (!project) {
      const snapshot = { title: sample.title, lecturer: sample.lecturer, maxMembers: team.maxMembers };
      const inserted = await client.query(`
        INSERT INTO projects (demo_catalog_id, supervisor_account_id, status, created_at, demo_team_snapshot, submissions_locked)
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
      `, [sample.id, demo.lecturer, sample.status, sample.createdAt, snapshot, board.submissionsLocked]);
      [project] = inserted.rows;
      await client.query(`
        INSERT INTO project_members (project_id, position, student_code, display_name, role)
        SELECT $1, position, member->>'code', member->>'name', member->>'role'
        FROM jsonb_array_elements($2::jsonb) WITH ORDINALITY AS entry(member, position)
      `, [project.id, JSON.stringify(team.members)]);
    }
    await seedProgress(client, project.id, progress.tasks, sample.createdAt);
    await seedSubmissions(client, project.id, sample, board, demo, bundledFile);
  }
}
