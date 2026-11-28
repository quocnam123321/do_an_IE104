import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";

export default async function migrate(client) {
  await client.query(`
    CREATE TABLE academic_terms (
      id text PRIMARY KEY CHECK (id ~ '^20[0-9]{2}-[1-4]$')
    );
    CREATE TABLE registration_rounds (
      id text PRIMARY KEY,
      term text NOT NULL REFERENCES academic_terms(id),
      type text NOT NULL CHECK (type IN ('course', 'graduation', 'thesis')),
      name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 120),
      starts_at timestamptz NOT NULL,
      ends_at timestamptz NOT NULL,
      source text,
      is_sample boolean NOT NULL DEFAULT false,
      revision integer NOT NULL DEFAULT 1 CHECK (revision > 0),
      CHECK (starts_at < ends_at)
    );
    CREATE SEQUENCE registration_round_number;
    ALTER TABLE lecturer_topics ADD COLUMN registration_round_id text REFERENCES registration_rounds(id);
    ALTER TABLE proposals ADD COLUMN registration_round_id text REFERENCES registration_rounds(id);
    CREATE INDEX lecturer_topics_round_idx ON lecturer_topics (registration_round_id);
    CREATE INDEX proposals_round_idx ON proposals (registration_round_id);
  `);
  const definitions = {};
  const file = new URL("../../web/assets/js/pages/admin/sample-data.js", import.meta.url);
  runInNewContext(await readFile(file, "utf8"), definitions, { filename: file.pathname });
  const { rounds, currentTerm } = definitions.IE104AdminSampleData;
  await client.query("INSERT INTO academic_terms (id) SELECT DISTINCT unnest($1::text[])", [[currentTerm, ...rounds.map(round => round.term)]]);
  for (const round of rounds) {
    await client.query(`
      INSERT INTO registration_rounds (id, term, type, name, starts_at, ends_at, source, is_sample)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [round.id, round.term, round.type, round.name, round.start + "+07:00", round.end + "+07:00",
      round.source ?? null, Boolean(round.sample)]);
  }
  const used = rounds.filter(round => /^DOT-\d+$/.test(round.id)).map(round => Number(round.id.slice(4)));
  await client.query("SELECT setval('registration_round_number', $1, false)", [Math.max(0, ...used) + 1]);
}
