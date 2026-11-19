import { withOverride } from "../functions/calendar-policy.cjs";

export function createStore(db) {
  const sql = (statement, ...values) => db.prepare(statement).bind(...values);
  const list = async (statement, ...values) => (await sql(statement, ...values).all()).results;

  return {
    async access(user) {
      const rows = await list("SELECT topic FROM calendar_members WHERE uid = ? AND role = ?", user.uid, user.role);
      return new Set(rows.map(({ topic }) => topic));
    },
    enrollStudent(topic, uid) {
      return sql(`
        INSERT INTO calendar_members (topic, uid, role) VALUES (?, ?, 'student')
        ON CONFLICT (topic, uid, role) DO NOTHING
      `, topic, uid).run();
    },
    async readItems(seeds) {
      if (!seeds.length) return [];
      const ids = seeds.map(({ id }) => id);
      const placeholders = ids.map(() => "?").join(", ");
      const rows = await list("SELECT * FROM calendar_requirements WHERE id IN (" + placeholders + ")", ...ids);
      const indexed = new Map(rows.map((row) => [row.id, row]));
      return seeds.map((seed) => withOverride(seed, indexed.get(seed.id)));
    },
    async save(seed, user, revision, changes) {
      const { name, description, due } = changes;
      return sql(`
        INSERT INTO calendar_requirements (id, name, description, due, revision, updated_by)
        SELECT ?, ?, ?, ?, ? + 1, ?
        WHERE EXISTS (SELECT 1 FROM calendar_members WHERE topic = ? AND uid = ? AND role = 'lecturer')
          AND COALESCE((SELECT revision FROM calendar_requirements WHERE id = ?), 0) = ?
        ON CONFLICT (id) DO UPDATE SET name = excluded.name, description = excluded.description,
          due = excluded.due, revision = excluded.revision, updated_by = excluded.updated_by
        RETURNING name, description, due, revision
      `, seed.id, name, description, due, revision, user.uid, seed.topic, user.uid, seed.id, revision).first();
    },
    saveState(hash, user, expiry) {
      return sql("INSERT INTO calendar_oauth_states VALUES (?, ?, ?, ?)", hash, user.uid, user.email, expiry).run();
    },
    takeState(hash) {
      return sql("DELETE FROM calendar_oauth_states WHERE state_hash = ? RETURNING uid, email, expires_at", hash).first();
    },
    cleanup(now) {
      return sql("DELETE FROM calendar_oauth_states WHERE expires_at < ?", now).run();
    },
    credentials(uid) {
      return sql("SELECT * FROM calendar_credentials WHERE uid = ?", uid).first();
    },
    async connect(uid, email, accountId, refresh) {
      const [connection] = await db.batch([
        sql(`
          INSERT INTO calendar_credentials VALUES (?, ?, ?, ?)
          ON CONFLICT (uid) DO UPDATE SET email = excluded.email, refresh = excluded.refresh
          WHERE calendar_credentials.account_id = excluded.account_id
          RETURNING uid
        `, uid, email, accountId, refresh),
        sql("UPDATE calendar_links SET attempts = 0, retry_at = 0 WHERE uid = ? AND account_id = ?", uid, accountId),
      ]);
      return connection.results.length === 1;
    },
    linkStatements(links, uid, accountId) {
      return db.batch(links.map(({ item, eventId }) => sql(`
        INSERT INTO calendar_links (requirement_id, uid, topic, event_id, account_id, synced_revision)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT (requirement_id, uid) DO UPDATE SET
          synced_revision = MAX(calendar_links.synced_revision, excluded.synced_revision), retry_at = 0, attempts = 0
        WHERE calendar_links.account_id = excluded.account_id AND calendar_links.event_id = excluded.event_id
      `, item.id, uid, item.topic, eventId, accountId, item.revision)));
    },
    pending(now) {
      return list(`
        SELECT l.requirement_id, l.uid, l.event_id, l.attempts, l.account_id, c.refresh,
          r.name, r.description, r.due, r.revision
        FROM calendar_links l
        JOIN calendar_requirements r ON r.id = l.requirement_id
        JOIN calendar_credentials c ON c.uid = l.uid AND c.account_id = l.account_id
        JOIN calendar_members m ON m.uid = l.uid AND m.topic = l.topic AND m.role = 'student'
        WHERE l.synced_revision < r.revision AND l.retry_at <= ?
        ORDER BY l.retry_at, l.requirement_id, l.uid
        LIMIT 5
      `, now);
    },
    finishStatements(completed) {
      return db.batch(completed.map(({ link, syncedRevision, retryAt, attempts }) => sql(`
        UPDATE calendar_links
        SET synced_revision = MAX(synced_revision, ?), retry_at = ?, attempts = ?
        WHERE requirement_id = ? AND uid = ? AND account_id = ?
          AND (synced_revision < ? OR ? = 0)
      `, syncedRevision, retryAt, attempts, link.requirement_id, link.uid, link.account_id,
      link.revision, retryAt)));
    },
  };
}
