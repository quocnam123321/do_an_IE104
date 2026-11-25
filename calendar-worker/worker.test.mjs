import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import { firebaseConfig } from "../assets/js/firebase-config.js";
import { createCalendarWorker } from "./index.mjs";

const site = "https://web.example/ie104/";
const origin = new URL(site).origin;
const host = "https://backend.example";
const key = "thu-vien--requirement-8";
const scope = "https://www.googleapis.com/auth/calendar.events.owned";

function database(t) {
  const db = new DatabaseSync(":memory:");
  t.after(() => db.close());
  db.exec(readFileSync(new URL("./migrations/0001_calendar.sql", import.meta.url), "utf8"));
  db.exec(`INSERT INTO calendar_members VALUES
    ('thu-vien', 'student', 'student'), ('thu-vien', 'lecturer', 'lecturer')`);
  return {
    db,
    prepare(sql) {
      const statement = db.prepare(sql);
      return {
        bind(...values) {
          return {
            async all() { return { results: statement.all(...values) }; },
            async first() { return statement.get(...values) ?? null; },
            async run() { return { meta: statement.run(...values) }; },
          };
        },
      };
    },
    async batch(statements) {
      db.exec("BEGIN");
      try {
        const results = [];
        for (const statement of statements) results.push(await statement.all());
        db.exec("COMMIT");
        return results;
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    },
  };
}

function fixture(t) {
  const DB = database(t);
  const env = {
    DB, CALENDAR_SITE_URL: site, GOOGLE_CALENDAR_CLIENT_ID: "google-client",
    GOOGLE_CALENDAR_CLIENT_SECRET: "fake-secret",
    GOOGLE_CALENDAR_REDIRECT_URI: host + "/oauth/callback", CALENDAR_TOKEN_KEY: "ab".repeat(32),
  };
  const now = Math.floor(Date.now() / 1000);
  const accounts = {
    student: { role: "student" }, lecturer: { role: "lecturer" },
    outsider: { role: "student" }, revoked: { role: "student" },
    uit: { domain: "gm.uit.edu.vn", provider: "google.com" },
    uitUnverified: { domain: "gm.uit.edu.vn", provider: "google.com", verified: false },
    uitPassword: { domain: "gm.uit.edu.vn", provider: "password", role: "student" },
    uitLecturer: { domain: "uit.edu.vn", provider: "google.com" },
  };
  const emailFor = (id) => `${id}@${accounts[id].domain ?? "example.edu"}`;
  const tokens = new Map();
  for (const [sub, { role, provider }] of Object.entries(accounts)) {
    const claims = { sub, ie104Role: role, aud: firebaseConfig.projectId,
      iss: `https://securetoken.google.com/${firebaseConfig.projectId}`,
      exp: now + 3600, auth_time: now - 5, iat: now, email: emailFor(sub), email_verified: true,
      firebase: { sign_in_provider: provider } };
    tokens.set(sub, "e30." + Buffer.from(JSON.stringify(claims)).toString("base64url") + ".verified-in-fixture");
  }
  const remote = new Map();
  const control = { nextPatchStatus: 0 };
  let writes = 0;
  const reply = (data, status = 200) => Response.json(data, { status });
  const worker = createCalendarWorker(async (url, request) => {
    const { hostname, pathname } = new URL(url);
    if (hostname === "identitytoolkit.googleapis.com") {
      const { idToken } = JSON.parse(request.body);
      const account = [...tokens].find(([, token]) => token === idToken)?.[0];
      if (!account) return reply({}, 400);
      return reply({ users: [{ localId: account, email: emailFor(account), emailVerified: accounts[account].verified !== false,
        validSince: account === "revoked" ? now : 0 }] });
    }
    if (hostname === "oauth2.googleapis.com") {
      assert.equal(request.body.get("client_secret"), env.GOOGLE_CALENDAR_CLIENT_SECRET);
      if (request.body.get("grant_type") === "refresh_token") {
        assert.equal(request.body.get("refresh_token"), "google-refresh");
        return reply({ access_token: "google-token" });
      }
      assert.equal(request.body.get("redirect_uri"), env.GOOGLE_CALENDAR_REDIRECT_URI);
      return reply({ access_token: request.body.get("code"), refresh_token: "google-refresh", scope });
    }
    if (hostname === "openidconnect.googleapis.com") {
      const user = request.headers.Authorization.slice("Bearer ".length);
      return reply({ sub: "google-" + user, email_verified: true, email: emailFor(user) });
    }
    assert.equal(hostname, "www.googleapis.com");
    assert.equal(request.headers.Authorization, "Bearer google-token");
    const body = request.body && JSON.parse(request.body);
    const id = request.method === "POST" ? body.id : pathname.split("/").at(-1);
    const current = remote.get(id);
    if (request.method === "GET") return current ? reply(current) : reply({}, 404);
    if (request.method === "POST" && current) return reply({}, 409);
    if (request.method === "PATCH") {
      assert.equal(request.headers["If-Match"], current.etag);
      if (control.nextPatchStatus) {
        const status = control.nextPatchStatus;
        control.nextPatchStatus = 0;
        return reply({}, status);
      }
    }
    const next = { ...current, ...body, etag: '"' + ++writes + '"' };
    remote.set(id, next);
    return reply(next);
  });

  function call(path, user = "student", data = {}, overrides = {}) {
    return worker.fetch(new Request(host + path, {
      method: "POST",
      headers: { Origin: origin, Authorization: "Bearer " + tokens.get(user), "Content-Type": "application/json" },
      body: JSON.stringify(data), ...overrides,
    }), env);
  }

  async function consent(code, user) {
    const { url } = await (await call("/connect", user)).json();
    const authorization = new URL(url);
    assert.equal(authorization.searchParams.get("access_type"), "offline");
    const callback = new URL("/oauth/callback", host);
    callback.search = new URLSearchParams({ state: authorization.searchParams.get("state"), code });
    const handle = async () => {
      const response = await worker.fetch(new Request(callback), env);
      assert.equal(response.status, 303);
      return new URL(response.headers.get("Location")).searchParams.get("calendar");
    };
    const result = await handle();
    assert.equal(await handle(), "expired");
    return result;
  }

  return { DB, env, remote, worker, control, call, consent };
}

test("validates Firebase sessions and D1 project permissions", async (t) => {
  const { call, env, worker } = fixture(t);
  const health = await worker.fetch(new Request(host + "/health"), env);
  assert.equal(health.status, 200);
  assert.equal((await call("/events", "missing")).status, 401);
  assert.equal((await call("/events", "revoked")).status, 401);
  assert.equal((await call("/events", "student", {}, { headers: { Origin: "https://other.example" } })).status, 403);
  assert.deepEqual(await (await call("/events", "outsider")).json(), { events: [] });
  assert.equal((await call("/connect", "outsider")).status, 403);
  assert.equal((await call("/save", "student")).status, 403);
  assert.equal((await call("/add", "student", { ids: ["ban-sach--deadline"] })).status, 403);
});

test("enrolls verified UIT Google students once and only in the library demo", async (t) => {
  const { DB, call } = fixture(t);
  assert.equal((await call("/save", "uit")).status, 403);
  assert.equal((await call("/events", "uitUnverified")).status, 403);
  for (const user of ["uitPassword", "uitLecturer"]) {
    assert.deepEqual(await (await call("/events", user)).json(), { events: [] });
    assert.equal((await call("/connect", user)).status, 403);
  }
  const memberships = DB.db.prepare("SELECT topic, role FROM calendar_members WHERE uid LIKE 'uit%'");
  assert.deepEqual(memberships.all(), []);
  const responses = await Promise.all([call("/events", "uit"), call("/events", "uit")]);
  for (const response of responses) {
    assert.equal(response.status, 200);
    const { events } = await response.json();
    assert.ok(events.some((event) => event.id === key));
    assert.deepEqual([...new Set(events.map(({ topic }) => topic))], ["thu-vien"]);
  }
  assert.equal((await call("/save", "uit")).status, 403);
  assert.equal((await call("/add", "uit", { ids: ["ban-sach--deadline"] })).status, 403);
  assert.deepEqual(memberships.all().map((row) => ({ ...row })), [{ topic: "thu-vien", role: "student" }]);
});

test("links Google events once and retries propagation after a lecturer saves", async (t) => {
  const { DB, env, remote, worker, control, call, consent } = fixture(t);
  assert.equal((await call("/add", "uit", { ids: [key] })).status, 409);
  assert.equal(await consent("outsider", "uit"), "account-mismatch");
  assert.equal(await consent("uit", "uit"), "connected");
  const credentials = DB.db.prepare("SELECT refresh FROM calendar_credentials").get();
  assert.ok(credentials.refresh && !credentials.refresh.includes("google-refresh"));
  const add = (ids) => call("/add", "uit", { ids }).then((response) => response.json());
  assert.deepEqual((await add([key, "thu-vien--deadline", key])).results.map(({ status }) => status), ["added", "added"]);
  assert.deepEqual((await add([key])).results, [{ id: key, status: "existing" }]);
  const submission = [...remote.values()].find((item) => item.summary.startsWith("[Bài nộp]"));
  assert.equal(submission.start.dateTime, "2026-10-25T16:59:00.000Z");
  assert.equal(remote.size, 2);
  const edit = { id: key, revision: 0, name: "Hạn mới", description: "Nộp bản cập nhật", due: "2026-11-26T09:15+07:00" };
  const updates = await Promise.all([call("/save", "lecturer", edit), call("/save", "lecturer", edit)]);
  assert.deepEqual(updates.map(({ status }) => status).sort(), [200, 409]);
  assert.equal(remote.get(submission.id).start.dateTime, "2026-10-25T16:59:00.000Z");
  control.nextPatchStatus = 503;
  await worker.scheduled({}, env);
  assert.equal(DB.db.prepare("SELECT attempts FROM calendar_links WHERE requirement_id = ?").get(key).attempts, 1);
  DB.db.prepare("UPDATE calendar_links SET retry_at = 0 WHERE requirement_id = ?").run(key);
  await worker.scheduled({}, env);
  assert.equal(remote.get(submission.id).start.dateTime, "2026-11-26T02:15:00.000Z");
  assert.equal(remote.get(submission.id).summary, "[Bài nộp] Hạn mới");
  assert.match(remote.get(submission.id).description, /Nộp bản cập nhật/);
  assert.deepEqual((await add([key])).results, [{ id: key, status: "existing" }]);
  assert.equal(remote.size, 2);
});

test("the lecturer editor updates the original Google event through the calendar client", async (t) => {
  const { env, remote, worker, call, consent } = fixture(t);
  assert.equal(await consent("student", "student"), "connected");
  assert.deepEqual((await (await call("/add", "student", { ids: [key] })).json()).results,
    [{ id: key, status: "added" }]);
  const [[eventId, before]] = remote;
  const requests = [];
  const source = readFileSync(new URL("../assets/js/calendar-client.js", import.meta.url), "utf8")
    .replace(/^import .+;\n/, "").replace(/^export /gm, "");
  const loadRequirement = runInNewContext(source + "\nloadCalendarRequirement", {
    location: new URL("https://ie104-nhom7.web.app/"),
    useRecoveryEmulator: false,
    getFirebaseAuth: async () => ({
      auth: { authStateReady: async () => {}, currentUser: { getIdToken: async () => "lecturer-session" } },
    }),
    AbortSignal,
    fetch: (url, options) => {
      assert.equal(options.headers.Authorization, "Bearer lecturer-session");
      const route = new URL(url).pathname;
      const payload = JSON.parse(options.body);
      requests.push({ route, payload });
      return call(route, "lecturer", payload);
    },
  });

  assert.equal(await loadRequirement("DA005", "requirement-8"), null);
  assert.equal(await loadRequirement("GV-DT001-N01", "REQ-local"), null);
  assert.deepEqual(requests, []);

  const editor = await loadRequirement("GV-DT001-N01", "requirement-8");
  assert.equal(editor.due, null);
  await editor.save("2026-11-26T09:15");
  assert.deepEqual(requests.map(({ route }) => route), ["/events", "/save"]);
  assert.equal(requests[1].payload.id, key);
  assert.equal(requests[1].payload.revision, 0);
  assert.equal(requests[1].payload.due, "2026-11-26T09:15+07:00");
  assert.equal(remote.get(eventId).start.dateTime, before.start.dateTime);
  await assert.rejects(editor.save("2026-11-27T09:15"), /đã được sửa ở nơi khác/);

  const reopened = await loadRequirement("GV-DT001-N01", "requirement-8");
  assert.equal(reopened.due, "2026-11-26T09:15+07:00");
  await worker.scheduled({}, env);
  assert.deepEqual([...remote.keys()], [eventId]);
  assert.equal(remote.get(eventId).start.dateTime, "2026-11-26T02:15:00.000Z");
  assert.equal(remote.get(eventId).summary, before.summary);
  assert.equal(remote.get(eventId).extendedProperties.private.ie104Key, key);
});
