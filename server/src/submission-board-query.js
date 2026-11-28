// Only return attachment metadata here. The file endpoint reads the binary data on demand.
export const submissionBoardJoins = `
  CROSS JOIN LATERAL (
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id', req.id, 'title', req.title, 'content', req.content, 'deadline', req.deadline, 'locked', req.locked
    ) ORDER BY req.deadline, req.id), '[]'::jsonb) AS requirements
    FROM project_submission_requirements AS req WHERE req.project_id = project.id
  ) AS requirements
  CROSS JOIN LATERAL (
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id', sub.id, 'requirementId', sub.requirement_id, 'title', req.title, 'submittedAt', sub.submitted_at,
      'notes', sub.notes, 'files', files.list, 'isDatabaseSubmission', true, 'attempt', sub.attempt,
      'calendarStatus', sub.sample_calendar_status,
      'feedback', feedback.content, 'feedbackAt', feedback.created_at, 'feedbackBy', feedback.lecturer_name,
      'feedbackRevision', COALESCE(feedback.revision, 0), 'feedbackHistory', previous.list
    ) ORDER BY sub.submitted_at DESC, sub.id), '[]'::jsonb) AS submissions
    FROM (
      SELECT DISTINCT ON (requirement_id) * FROM project_submissions
      WHERE project_id = project.id
      ORDER BY requirement_id, attempt DESC
    ) AS sub
    JOIN project_submission_requirements AS req ON req.id = sub.requirement_id
    CROSS JOIN LATERAL (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('id', f.id, 'name', f.file_name, 'size', f.size_bytes)
        ORDER BY attachment.position), '[]'::jsonb) AS list
      FROM project_submission_files AS attachment JOIN files AS f ON f.id = attachment.id
      WHERE attachment.submission_id = sub.id
    ) AS files
    LEFT JOIN LATERAL (
      SELECT revision, content, lecturer_name, created_at FROM project_submission_feedback
      WHERE submission_id = sub.id ORDER BY revision DESC LIMIT 1
    ) AS feedback ON true
    CROSS JOIN LATERAL (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('content', content, 'at', created_at, 'author', lecturer_name)
        ORDER BY revision), '[]'::jsonb) AS list
      FROM project_submission_feedback WHERE submission_id = sub.id AND revision < feedback.revision
    ) AS previous
  ) AS submissions
`;
