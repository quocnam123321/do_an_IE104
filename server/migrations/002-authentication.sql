CREATE TABLE password_reset_codes (
  account_id uuid PRIMARY KEY REFERENCES accounts (id) ON DELETE CASCADE,
  code_hash text NOT NULL UNIQUE,
  issued_by_account_id uuid NOT NULL REFERENCES accounts (id),
  expires_at timestamptz NOT NULL
);

CREATE TABLE google_auth_challenges (
  nonce_hash text PRIMARY KEY,
  expires_at timestamptz NOT NULL
);

CREATE INDEX google_auth_challenges_expires_at_idx ON google_auth_challenges (expires_at);
