ALTER TABLE proposals
  ADD COLUMN demo_workspace_key text CHECK (
    demo_workspace_key IS NULL OR (demo_directory_id IS NOT NULL AND demo_workspace_key ~ '^[0-9a-f]{64}$')
  ),
  DROP CONSTRAINT proposals_decision_actor,
  ADD CONSTRAINT proposals_decision_actor CHECK (
    decided_by_account_id IS NULL OR (
      decided_at IS NOT NULL AND (
        demo_workspace_key IS NOT NULL
        OR decided_by_account_id = lecturer_account_id
        OR decided_by_account_id IS NOT DISTINCT FROM reviewer_account_id
      )
    )
  );

CREATE INDEX proposals_demo_workspace_timeline_idx ON proposals (demo_workspace_key, created_at DESC)
  WHERE demo_workspace_key IS NOT NULL;

DROP INDEX proposals_pending_request_key;

CREATE UNIQUE INDEX proposals_pending_request_key
  ON proposals (
    student_account_id, lecturer_account_id, type, course_id, semester, academic_year, title_key,
    (COALESCE(demo_directory_id, '')), (COALESCE(demo_workspace_key, ''))
  )
  WHERE status = 'cho-duyet';
