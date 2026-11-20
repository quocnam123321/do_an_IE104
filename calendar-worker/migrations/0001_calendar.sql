CREATE TABLE calendar_members (
  topic TEXT NOT NULL,
  uid TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'lecturer')),
  PRIMARY KEY (topic, uid, role)
);

CREATE INDEX calendar_member_lookup ON calendar_members (uid, role);

CREATE TABLE calendar_requirements (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  due TEXT NOT NULL,
  revision INTEGER NOT NULL,
  updated_by TEXT NOT NULL
);

CREATE TABLE calendar_oauth_states (
  state_hash TEXT PRIMARY KEY NOT NULL,
  uid TEXT NOT NULL,
  email TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX calendar_oauth_expiry ON calendar_oauth_states (expires_at);

CREATE TABLE calendar_credentials (
  uid TEXT PRIMARY KEY NOT NULL,
  email TEXT NOT NULL,
  account_id TEXT NOT NULL,
  refresh TEXT NOT NULL
);

CREATE TABLE calendar_links (
  requirement_id TEXT NOT NULL,
  uid TEXT NOT NULL,
  topic TEXT NOT NULL,
  event_id TEXT NOT NULL,
  account_id TEXT NOT NULL,
  synced_revision INTEGER NOT NULL,
  retry_at INTEGER NOT NULL DEFAULT 0,
  attempts INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (requirement_id, uid)
);

CREATE INDEX calendar_link_user ON calendar_links (uid);
