CREATE TABLE contact_requests (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  account_id uuid REFERENCES accounts(id),
  role text NOT NULL CHECK (role IN ('guest', 'student', 'lecturer', 'admin')),
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'processing', 'resolved')),
  revision integer NOT NULL DEFAULT 0 CHECK (revision >= 0)
);

CREATE SEQUENCE academic_notice_number;
CREATE SEQUENCE system_notice_number;

CREATE TABLE admin_notices (
  id text PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('academic','system')),
  name text NOT NULL,
  body text NOT NULL,
  html text,
  type text NOT NULL,
  status text NOT NULL CHECK (status IN ('draft','published','withdrawn','sent')),
  audience text CHECK (audience IN ('student','lecturer','both')),
  scope text CHECK (scope IN ('all','specific')),
  created_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  changed_at timestamptz NOT NULL DEFAULT now(),
  revision integer NOT NULL DEFAULT 0 CHECK (revision >= 0),
  created_by uuid REFERENCES accounts(id)
);

CREATE TABLE admin_notice_files (
  notice_id text REFERENCES admin_notices(id) ON DELETE CASCADE,
  slot text NOT NULL,
  file_id uuid NOT NULL UNIQUE REFERENCES files(id),
  PRIMARY KEY (notice_id, slot)
);

CREATE TABLE admin_notice_recipients (
  notice_id text REFERENCES admin_notices(id) ON DELETE CASCADE,
  account_id uuid REFERENCES accounts(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text NOT NULL,
  role text NOT NULL CHECK (role IN ('student','lecturer')),
  read_at timestamptz,
  PRIMARY KEY (notice_id, account_id)
);
CREATE INDEX admin_notice_inbox_idx ON admin_notice_recipients (account_id, notice_id);
