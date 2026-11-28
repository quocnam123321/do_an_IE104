import defaultCriteria from "../../assets/js/data/teaching-data.js";

export const evaluationColumns = `
  evaluation.revision AS evaluation_revision,
  CASE WHEN evaluation.id IS NOT NULL THEN jsonb_build_object(
    'published', true, 'score', evaluation.score, 'resultLabel', evaluation.result_label,
    'feedback', evaluation.feedback, 'lecturerName', evaluation.lecturer_name,
    'publishedAt', evaluation.published_at,
    'evaluatedAt', to_char(evaluation.published_at AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD'),
    'criteria', grade.criteria,
    'attachment', CASE WHEN attachment.id IS NOT NULL THEN jsonb_build_object(
      'id', attachment.id, 'name', attachment.file_name, 'size', attachment.size_bytes
    ) END
  ) END AS published_evaluation
`;

export function formatEvaluation(row, projectId, account) {
  const publication = row.published_evaluation;
  if (publication?.attachment) publication.attachment.projectId = projectId;
  return { revision: row.evaluation_revision ?? 0, publication,
    criteria: account.role === "lecturer" ? publication?.criteria ?? defaultCriteria : undefined };
}

export const evaluationJoins = `
  LEFT JOIN LATERAL (
    SELECT id, revision, score, result_label, feedback, lecturer_name, published_at, attachment_id
    FROM project_evaluations WHERE project_id = project.id ORDER BY revision DESC LIMIT 1
  ) AS evaluation ON true
  LEFT JOIN files AS attachment ON attachment.id = evaluation.attachment_id
  CROSS JOIN LATERAL (
    SELECT jsonb_agg(jsonb_build_object('id', criterion_id, 'title', title, 'description', description,
      'weight', weight, 'score', score, 'comment', comment) ORDER BY position) AS criteria
    FROM project_evaluation_scores WHERE evaluation_id = evaluation.id
  ) AS grade
`;
