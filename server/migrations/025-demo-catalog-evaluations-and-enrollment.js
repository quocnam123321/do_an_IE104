import { createHash } from "node:crypto";
import { loadCatalog } from "./024-demo-catalog-workspaces.js";

async function seedEvaluations(client, data, lecturerId) {
  const knownProjects = new Set(data.myTopics.map(project => project.id));
  for (const evaluation of data.projectEvaluations.filter(item => item.published && knownProjects.has(item.projectId))) {
    const { rows: [project] } = await client.query(`
      SELECT id FROM projects WHERE demo_catalog_id = $1 AND status = 'hoan-thanh' FOR UPDATE
    `, [evaluation.projectId]);
    if (!project) throw new Error(`Không tìm thấy đề tài mẫu đã hoàn thành ${evaluation.projectId}.`);

    await client.query(`
      WITH inserted AS (
        INSERT INTO project_evaluations
          (project_id, revision, lecturer_account_id, lecturer_name, score, result_label, feedback, published_at)
        SELECT $1, 1, $2, $3, $4, $5, $6, $7
        WHERE NOT EXISTS (SELECT 1 FROM project_evaluations WHERE project_id = $1)
        RETURNING id
      )
      INSERT INTO project_evaluation_scores
        (evaluation_id, position, criterion_id, title, description, weight, score, comment)
      SELECT inserted.id, entry.position, criterion->>'id', criterion->>'title', COALESCE(criterion->>'description', ''),
        (criterion->>'weight')::smallint, (criterion->>'score')::numeric, criterion->>'comment'
      FROM inserted CROSS JOIN LATERAL jsonb_array_elements($8::jsonb) WITH ORDINALITY AS entry(criterion, position)
    `, [project.id, lecturerId, evaluation.lecturerName, evaluation.score, evaluation.resultLabel,
      evaluation.feedback, `${evaluation.evaluatedAt}T00:00:00+07:00`, JSON.stringify(evaluation.criteria)]);
  }
}

async function seedOpenTopics(client, data, lecturerId) {
  const openIds = new Set(data.studentUITCatalog.openIds);
  const topics = data.lecturerTopics.filter(item => item.kind === "created" && openIds.has(item.id));
  if (topics.length !== openIds.size) throw new Error("Danh mục đề tài mẫu mở đăng ký chưa đầy đủ.");

  for (const topic of topics) {
    const { id, displayId, title, registration, createdAt, ownerId, status, statusLabel, kind, sourceRecord, ...fields } = topic;
    const courseId = topic.topicType === "course" ? topic.courseCode
      : topic.topicType === "thesis" ? "IE505" : "IE501";
    const { deadline, ...rules } = registration;
    if (!displayId || !courseId || !deadline) throw new Error(`Thiếu thông tin mở đăng ký của đề tài mẫu ${id}.`);
    const content = { ...fields, registration: rules, courseId, legacyCatalogId: id, studentListed: true };
    const titleKey = createHash("sha256").update(title.normalize("NFC").toLocaleLowerCase("vi").replace(/\s+/gu, " ")).digest("hex");
    await client.query(`
      INSERT INTO lecturer_topics (code, owner_account_id, is_demo, title, title_key, content, status, deadline, created_at, updated_at)
      VALUES ($1, $2, true, $3, $4, $5, $6, $7, $8, $8)
      ON CONFLICT (title_key) WHERE is_demo DO UPDATE
        SET content = lecturer_topics.content || jsonb_build_object('legacyCatalogId', $9::text, 'studentListed', true)
    `, [displayId, lecturerId, title, titleKey, content, status, deadline, createdAt, id]);
  }
}

export default async function migrate(client) {
  const data = await loadCatalog();
  const { rows: [lecturer] } = await client.query("SELECT id FROM accounts WHERE is_demo AND role = 'lecturer'");
  if (!lecturer) throw new Error("Thiếu tài khoản giảng viên minh họa để nhập dữ liệu mẫu.");
  await seedEvaluations(client, data, lecturer.id);
  await seedOpenTopics(client, data, lecturer.id);
}
