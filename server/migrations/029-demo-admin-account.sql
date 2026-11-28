ALTER TABLE accounts
  DROP CONSTRAINT accounts_demo_identity,
  ADD CONSTRAINT accounts_demo_identity CHECK (
    NOT is_demo OR (
      role IN ('student', 'lecturer', 'admin')
      AND display_name IS NOT NULL AND btrim(display_name) <> ''
      AND username IS NULL AND email IS NULL AND password_hash IS NULL
    )
  );

INSERT INTO accounts (role, status, display_name, is_demo)
VALUES ('admin', 'active', 'Quản trị IE104', true);
