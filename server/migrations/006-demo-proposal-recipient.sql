ALTER TABLE proposals
  ADD COLUMN demo_directory_id text CHECK (demo_directory_id ~ '^giang-vien-[0-9]+$');

DROP INDEX proposals_pending_request_key;

CREATE UNIQUE INDEX proposals_pending_request_key
  ON proposals (
    student_account_id, lecturer_account_id, type, course_id, semester, academic_year, title_key,
    (COALESCE(demo_directory_id, ''))
  )
  WHERE status = 'cho-duyet';
