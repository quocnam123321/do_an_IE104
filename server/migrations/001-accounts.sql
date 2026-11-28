CREATE TABLE accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE CHECK (username <> '' AND username = btrim(username)),
  password_hash text CHECK (password_hash IS NULL OR username IS NOT NULL),
  email text,
  role text NOT NULL CHECK (role IN ('student', 'lecturer', 'admin')),
  status text NOT NULL CHECK (status IN ('pending_approval', 'active', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE google_identities (
  google_sub text PRIMARY KEY,
  account_id uuid NOT NULL UNIQUE REFERENCES accounts (id) ON DELETE CASCADE,
  linked_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sessions (
  token_hash text PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL CHECK (expires_at > created_at)
);

CREATE INDEX sessions_account_id_idx ON sessions (account_id);

CREATE TABLE lecturer_account_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lecturer_account_id uuid NOT NULL REFERENCES accounts (id),
  reviewed_by_account_id uuid NOT NULL REFERENCES accounts (id),
  decision text NOT NULL CHECK (decision IN ('approved', 'rejected')),
  reviewed_at timestamptz NOT NULL DEFAULT now()
);
