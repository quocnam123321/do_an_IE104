ALTER TABLE projects
  ADD COLUMN progress_revision integer NOT NULL DEFAULT 0 CHECK (progress_revision >= 0);

CREATE TABLE project_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 200),
  description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 2000),
  deadline date NOT NULL,
  status text NOT NULL,
  percent smallint,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, id),
  CHECK (
    (status = 'chua-thuc-hien' AND percent IS NOT DISTINCT FROM 0) OR
    (status = 'dang-thuc-hien' AND (percent IS NULL OR percent BETWEEN 1 AND 99)) OR
    (status = 'da-hoan-thanh' AND percent IS NOT DISTINCT FROM 100)
  )
);

CREATE TABLE project_task_assignees (
  project_id uuid NOT NULL,
  task_id uuid NOT NULL,
  member_position integer NOT NULL,
  PRIMARY KEY (task_id, member_position),
  FOREIGN KEY (project_id, task_id) REFERENCES project_tasks (project_id, id) ON DELETE CASCADE,
  FOREIGN KEY (project_id, member_position) REFERENCES project_members (project_id, position)
);

CREATE TABLE project_progress_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  task_id uuid REFERENCES project_tasks (id) ON DELETE SET NULL,
  task_title text NOT NULL,
  actor_account_id uuid NOT NULL REFERENCES accounts (id),
  actor_name text NOT NULL,
  actor_code text NOT NULL,
  content text NOT NULL CHECK (char_length(btrim(content)) BETWEEN 1 AND 2000),
  status text NOT NULL,
  percent smallint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (status = 'chua-thuc-hien' AND percent = 0) OR
    (status = 'dang-thuc-hien' AND percent BETWEEN 1 AND 99) OR
    (status = 'da-hoan-thanh' AND percent = 100)
  )
);

CREATE INDEX project_progress_updates_timeline_idx ON project_progress_updates (project_id, created_at DESC, id);

CREATE TABLE project_task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES project_tasks (id) ON DELETE CASCADE,
  parent_id uuid,
  author_account_id uuid NOT NULL REFERENCES accounts (id),
  author_name text NOT NULL,
  author_role text NOT NULL CHECK (author_role IN ('student', 'lecturer')),
  content text NOT NULL CHECK (char_length(btrim(content)) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (task_id, id),
  FOREIGN KEY (task_id, parent_id) REFERENCES project_task_comments (task_id, id) ON DELETE CASCADE
);
