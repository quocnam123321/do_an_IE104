CREATE TABLE demo_recovery_passwords (
  browser_hash text NOT NULL,
  email_hash text NOT NULL,
  password_hash text NOT NULL,
  PRIMARY KEY (browser_hash, email_hash)
);
