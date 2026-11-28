ALTER TABLE accounts
  ADD COLUMN display_name text,
  ADD COLUMN is_demo boolean NOT NULL DEFAULT false,
  ADD CONSTRAINT accounts_demo_identity CHECK (
    NOT is_demo OR (
      role IN ('student', 'lecturer')
      AND display_name IS NOT NULL AND btrim(display_name) <> ''
      AND username IS NULL AND email IS NULL AND password_hash IS NULL
    )
  );

CREATE UNIQUE INDEX accounts_demo_role_key ON accounts (role) WHERE is_demo;

INSERT INTO accounts (role, status, display_name, is_demo) VALUES
  ('student', 'active', 'Nguyễn Minh Anh', true),
  ('lecturer', 'active', 'ThS. Nguyễn Văn An', true);
