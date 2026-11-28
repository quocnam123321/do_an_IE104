CREATE TABLE files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name text NOT NULL CHECK (char_length(btrim(file_name)) BETWEEN 1 AND 255),
  content_type text NOT NULL DEFAULT 'application/octet-stream'
    CHECK (char_length(btrim(content_type)) BETWEEN 1 AND 255),
  content bytea NOT NULL CHECK (octet_length(content) BETWEEN 1 AND 20971520),
  size_bytes integer GENERATED ALWAYS AS (octet_length(content)) STORED,
  created_at timestamptz NOT NULL DEFAULT now()
);
