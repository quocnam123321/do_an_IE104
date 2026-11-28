ALTER TABLE projects ADD COLUMN team_revision integer NOT NULL DEFAULT 0 CHECK (team_revision >= 0);

CREATE TABLE supervision_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects (id) ON DELETE CASCADE,
  student_account_id uuid NOT NULL REFERENCES accounts (id),
  lecturer_account_id uuid NOT NULL REFERENCES accounts (id),
  decided_by_account_id uuid REFERENCES accounts (id),
  is_demo boolean NOT NULL,
  student_name text NOT NULL,
  student_code text NOT NULL DEFAULT '',
  teacher_key text NOT NULL,
  teacher_name text NOT NULL,
  subject text NOT NULL CHECK (char_length(btrim(subject)) BETWEEN 1 AND 120),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  decision_note text NOT NULL DEFAULT '' CHECK (char_length(decision_note) <= 2000),
  decision_message_count integer,
  student_read_count integer NOT NULL DEFAULT 0 CHECK (student_read_count >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz,
  CHECK ((status IN ('accepted', 'rejected')) = (decided_at IS NOT NULL
    AND decided_by_account_id IS NOT NULL AND decision_message_count IS NOT NULL)),
  CHECK (status <> 'cancelled' OR project_id IS NOT NULL)
);

CREATE INDEX supervision_invitations_student_idx ON supervision_invitations (student_account_id, updated_at DESC);
CREATE INDEX supervision_invitations_lecturer_idx ON supervision_invitations (lecturer_account_id, updated_at DESC);
CREATE INDEX supervision_invitations_project_idx ON supervision_invitations (project_id);
CREATE UNIQUE INDEX supervision_invitations_active_project_teacher_key
  ON supervision_invitations (project_id, teacher_key) WHERE project_id IS NOT NULL AND status IN ('pending', 'accepted');

CREATE TABLE supervision_invitation_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id uuid NOT NULL REFERENCES supervision_invitations (id) ON DELETE CASCADE,
  position integer NOT NULL CHECK (position > 0),
  author_account_id uuid NOT NULL REFERENCES accounts (id),
  author_role text NOT NULL CHECK (author_role IN ('student', 'teacher')),
  message text NOT NULL CHECK (char_length(btrim(message)) BETWEEN 1 AND 2000),
  sent_at timestamptz NOT NULL DEFAULT now(),
  file_name text,
  file_content bytea,
  size_bytes integer GENERATED ALWAYS AS (octet_length(file_content)) STORED,
  UNIQUE (invitation_id, position),
  CHECK ((file_name IS NULL AND file_content IS NULL) OR
    (file_name IS NOT NULL AND file_content IS NOT NULL AND char_length(btrim(file_name)) BETWEEN 1 AND 255
      AND octet_length(file_content) BETWEEN 1 AND 10485760))
);
