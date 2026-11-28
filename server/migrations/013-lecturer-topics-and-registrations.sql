CREATE TABLE lecturer_topics (
  code text PRIMARY KEY,
  owner_account_id uuid NOT NULL REFERENCES accounts (id),
  is_demo boolean NOT NULL,
  title text NOT NULL,
  title_key text NOT NULL,
  content jsonb NOT NULL CHECK (jsonb_typeof(content) = 'object'),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  deadline timestamptz NOT NULL,
  revision integer NOT NULL DEFAULT 1 CHECK (revision > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX lecturer_topics_demo_title_key ON lecturer_topics (title_key) WHERE is_demo;
CREATE UNIQUE INDEX lecturer_topics_owner_title_key ON lecturer_topics (owner_account_id, title_key) WHERE NOT is_demo;

CREATE TABLE registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_code text NOT NULL UNIQUE REFERENCES lecturer_topics (code),
  student_account_id uuid NOT NULL REFERENCES accounts (id),
  topic_snapshot jsonb NOT NULL CHECK (jsonb_typeof(topic_snapshot) = 'object'),
  group_name text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE projects
  ALTER COLUMN proposal_id DROP NOT NULL,
  ADD COLUMN registration_id uuid UNIQUE REFERENCES registrations (id),
  ADD CONSTRAINT projects_source_check CHECK (num_nonnulls(proposal_id, registration_id) = 1);
