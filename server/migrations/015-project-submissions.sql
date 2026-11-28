ALTER TABLE projects
  ADD COLUMN submissions_revision integer NOT NULL DEFAULT 0 CHECK (submissions_revision >= 0),
  ADD COLUMN submissions_locked boolean NOT NULL DEFAULT false;

CREATE TABLE project_submission_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 200),
  content text NOT NULL CHECK (char_length(btrim(content)) BETWEEN 1 AND 5000),
  deadline timestamptz NOT NULL,
  locked boolean NOT NULL DEFAULT false,
  UNIQUE (project_id, id)
);

CREATE TABLE project_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  requirement_id uuid NOT NULL,
  attempt integer NOT NULL CHECK (attempt > 0),
  submitted_by_account_id uuid NOT NULL REFERENCES accounts (id),
  submitted_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  notes text NOT NULL CHECK (char_length(notes) <= 2000),
  UNIQUE (requirement_id, attempt),
  FOREIGN KEY (project_id, requirement_id) REFERENCES project_submission_requirements (project_id, id) ON DELETE CASCADE
);

CREATE INDEX project_submissions_project_attempt_idx ON project_submissions (project_id, requirement_id, attempt DESC);

CREATE TABLE project_submission_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES project_submissions (id) ON DELETE CASCADE,
  position integer NOT NULL CHECK (position BETWEEN 1 AND 10),
  file_name text NOT NULL CHECK (char_length(btrim(file_name)) BETWEEN 1 AND 255),
  content bytea NOT NULL CHECK (octet_length(content) BETWEEN 1 AND 20971520),
  size_bytes integer GENERATED ALWAYS AS (octet_length(content)) STORED,
  UNIQUE (submission_id, position)
);

CREATE TABLE project_submission_feedback (
  submission_id uuid NOT NULL REFERENCES project_submissions (id) ON DELETE CASCADE,
  revision integer NOT NULL CHECK (revision > 0),
  lecturer_account_id uuid NOT NULL REFERENCES accounts (id),
  lecturer_name text NOT NULL,
  content text NOT NULL CHECK (char_length(btrim(content)) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY (submission_id, revision)
);
