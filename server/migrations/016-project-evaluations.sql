CREATE TABLE project_evaluation_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  file_name text NOT NULL CHECK (char_length(btrim(file_name)) BETWEEN 1 AND 255),
  content bytea NOT NULL CHECK (octet_length(content) BETWEEN 1 AND 20971520),
  size_bytes integer GENERATED ALWAYS AS (octet_length(content)) STORED,
  UNIQUE (project_id, id)
);

CREATE TABLE project_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  revision integer NOT NULL CHECK (revision > 0),
  lecturer_account_id uuid NOT NULL REFERENCES accounts (id),
  lecturer_name text NOT NULL CHECK (btrim(lecturer_name) <> ''),
  score numeric(3,1) NOT NULL CHECK (score BETWEEN 0 AND 10),
  result_label text NOT NULL CHECK (char_length(btrim(result_label)) BETWEEN 1 AND 100),
  feedback text NOT NULL CHECK (char_length(btrim(feedback)) BETWEEN 1 AND 2000),
  published_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  attachment_id uuid,
  UNIQUE (project_id, revision),
  FOREIGN KEY (project_id, attachment_id) REFERENCES project_evaluation_attachments (project_id, id)
);

CREATE TABLE project_evaluation_scores (
  evaluation_id uuid NOT NULL REFERENCES project_evaluations (id) ON DELETE CASCADE,
  position integer NOT NULL CHECK (position > 0),
  criterion_id text NOT NULL CHECK (btrim(criterion_id) <> ''),
  title text NOT NULL CHECK (btrim(title) <> ''),
  description text NOT NULL,
  weight smallint NOT NULL CHECK (weight BETWEEN 0 AND 100),
  score numeric(3,1) NOT NULL CHECK (score BETWEEN 0 AND 10),
  comment text NOT NULL CHECK (char_length(btrim(comment)) BETWEEN 1 AND 2000),
  PRIMARY KEY (evaluation_id, criterion_id),
  UNIQUE (evaluation_id, position)
);
