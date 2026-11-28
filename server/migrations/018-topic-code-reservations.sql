CREATE TABLE topic_code_reservations (
  account_id uuid NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  form_id uuid NOT NULL,
  type text NOT NULL REFERENCES proposal_code_counters (type),
  topic_code text NOT NULL UNIQUE,
  used_at timestamptz,
  PRIMARY KEY (account_id, form_id, type)
);
