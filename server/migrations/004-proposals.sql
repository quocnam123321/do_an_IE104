CREATE TABLE proposal_code_counters (
  type text PRIMARY KEY CHECK (type IN ('do-an-mon-hoc', 'do-an-tot-nghiep', 'khoa-luan')),
  last_number integer NOT NULL CHECK (last_number BETWEEN 0 AND 999)
);

-- Những mã bên dưới đã xuất hiện trong dữ liệu minh họa.
INSERT INTO proposal_code_counters (type, last_number) VALUES
  ('do-an-mon-hoc', 104), ('do-an-tot-nghiep', 103), ('khoa-luan', 103);

CREATE TABLE proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_code text NOT NULL UNIQUE,
  student_account_id uuid NOT NULL REFERENCES accounts (id),
  lecturer_account_id uuid NOT NULL REFERENCES accounts (id),
  type text NOT NULL REFERENCES proposal_code_counters (type),
  course_id text NOT NULL,
  semester text NOT NULL CHECK (semester IN ('1', '2', 'he')),
  academic_year text NOT NULL,
  title text NOT NULL,
  title_key text NOT NULL,
  content jsonb NOT NULL CHECK (jsonb_typeof(content) = 'object'),
  status text NOT NULL DEFAULT 'cho-duyet' CHECK (status IN ('cho-duyet', 'da-duyet', 'tu-choi', 'da-rut')),
  revision integer NOT NULL DEFAULT 0 CHECK (revision >= 0),
  decision_reason text,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((status IN ('da-duyet', 'tu-choi')) = (decided_at IS NOT NULL)),
  CHECK ((status = 'tu-choi') = (decision_reason IS NOT NULL)),
  CHECK (decision_reason IS NULL OR char_length(btrim(decision_reason)) >= 10)
);

CREATE INDEX proposals_student_timeline_idx ON proposals (student_account_id, created_at DESC);
CREATE INDEX proposals_lecturer_timeline_idx ON proposals (lecturer_account_id, created_at DESC);

CREATE UNIQUE INDEX proposals_pending_request_key
  ON proposals (student_account_id, lecturer_account_id, type, course_id, semester, academic_year, title_key)
  WHERE status = 'cho-duyet';
