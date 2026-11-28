ALTER TABLE accounts
  ADD COLUMN account_code text CHECK (account_code = btrim(account_code) AND char_length(account_code) BETWEEN 1 AND 32),
  ADD COLUMN is_locked boolean NOT NULL DEFAULT false,
  ADD COLUMN admin_revision integer NOT NULL DEFAULT 0 CHECK (admin_revision >= 0),
  ADD CONSTRAINT accounts_lock_requires_managed_role CHECK (
    NOT is_locked OR (role IN ('student', 'lecturer') AND status = 'active' AND NOT is_demo)
  );

CREATE UNIQUE INDEX accounts_role_account_code_key
  ON accounts (role, lower(account_code)) WHERE account_code IS NOT NULL;
