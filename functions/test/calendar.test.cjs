const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const { test } = require("node:test");
const { initializeApp, deleteApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { createCalendarBridge } = require("../calendar-bridge.cjs");
const { createGoogleCalendar, createTokenVault, eventId } = require("../google-calendar.cjs");

const site = new URL("https://school.example/ie104/");
const redirectUri = "https://functions.example/calendarBridge/oauth/callback";
const scope = "https://www.googleapis.com/auth/calendar.events.owned";
const seed = require("../calendar-catalog.json").find((item) => item.id === "thu-vien--requirement-8");

function googleFixture() {
  const events = new Map();
  let writes = 0;
  const json = (data, status = 200) => Response.json(data, { status });
  const fetcher = async (url, request) => {
    const { hostname, pathname } = new URL(url);
    if (hostname === "oauth2.googleapis.com") {
      const grant = request.body.get("grant_type");
      if (grant === "refresh_token") {
        assert.equal(request.body.get("refresh_token"), "refresh-value");
        return json({ access_token: "access-token" });
      }
      assert.equal(request.body.get("redirect_uri"), redirectUri);
      return json({ access_token: request.body.get("code"), refresh_token: "refresh-value", scope });
    }
    if (hostname === "openidconnect.googleapis.com") {
      const email = request.headers.Authorization === "Bearer mismatch" ? "other@example.edu" : "student@example.edu";
      return json({ sub: "google-student", email_verified: true, email });
    }
    assert.equal(request.headers.Authorization, "Bearer access-token");
    const body = request.body && JSON.parse(request.body);
    const id = request.method === "POST" ? body.id : pathname.split("/").at(-1);
    const current = events.get(id);
    if (request.method === "GET") return current ? json(current) : json({}, 404);
    if (request.method === "POST" && current) return json({}, 409);
    if (request.method === "PATCH" && request.headers["If-Match"] !== current.etag) return json({}, 412);
    const next = { ...current, ...body, etag: '"' + ++writes + '"' };
    events.set(id, next);
    return json(next);
  };
  return {
    events,
    google: createGoogleCalendar({ clientId: "web-client", clientSecret: "test-secret", redirectUri, site, fetcher }),
  };
}

test("Google adapter serializes UTC+7 dates, avoids duplicate events and ignores stale writes", async () => {
  const { google, events } = googleFixture();
  const id = eventId("student", seed.id);
  const item = { ...seed, revision: 0 };
  assert.equal(await google.insert("access-token", id, item), "added");
  assert.equal(await google.insert("access-token", id, item), "existing");
  assert.equal(events.size, 1);
  assert.equal(events.get(id).start.dateTime, "2026-10-25T16:59:00.000Z");
  assert.equal(events.get(id).start.timeZone, "Asia/Ho_Chi_Minh");
  assert.match(events.get(id).description, /school.example\/ie104\/pages/);
  const changed = { ...item, name: "Mốc đã sửa", description: "<Ghi chú>", due: "2026-11-19T09:15+07:00", revision: 2 };
  assert.equal(await google.patch("access-token", id, changed), "updated");
  assert.equal(await google.patch("access-token", id, { ...item, revision: 1 }), "current");
  assert.equal(events.get(id).summary, "[Bài nộp] Mốc đã sửa");
  assert.equal(events.get(id).start.dateTime, "2026-11-19T02:15:00.000Z");
  assert.match(events.get(id).description, /&lt;Ghi chú&gt;/);
  assert.deepEqual(events.get(id).reminders.overrides.map(({ minutes }) => minutes), [1440, 60]);
});

test("refresh tokens are encrypted and bound to the Firebase user", () => {
  const vault = createTokenVault("3a".repeat(32));
  const encrypted = vault.seal("student", "refresh-value");
  assert.notEqual(encrypted, vault.seal("student", "refresh-value"));
  assert.equal(vault.open("student", encrypted), "refresh-value");
  assert.throws(() => vault.open("another-student", encrypted), { code: "calendar-connect-required" });
});

test("Firestore roster, OAuth callback, course edit and resync", { skip: !process.env.FIRESTORE_EMULATOR_HOST }, async (t) => {
  const projectId = "demo-" + randomUUID().slice(0, 8);
  const app = initializeApp({ projectId }, projectId);
  t.after(() => deleteApp(app));
  const db = getFirestore(app);
  const { google, events: remote } = googleFixture();
  const vault = createTokenVault("3a".repeat(32));
  const email = "student@example.edu";
  const auth = {
    async verifyIdToken(uid) {
      return { uid, email, ie104Role: uid === "lecturer" ? "lecturer" : "student" };
    },
    async getUser() { return { email }; },
  };
  const service = createCalendarBridge({ db, auth, getConfig: () => ({ site, google, vault }), log() {} });

  async function call(path, uid = "student", body = {}, query) {
    const req = {
      path, body, query, method: query ? "GET" : "POST",
      get(name) { return name === "origin" ? site.origin : "Bearer " + uid; },
      is() { return true; },
    };
    const res = {
      statusCode: 200,
      set() { return this; },
      vary() { return this; },
      status(code) { this.statusCode = code; return this; },
      json(value) { this.body = value; },
      redirect(code, url) { this.statusCode = code; this.location = new URL(url); },
    };
    await service.handle(req, res);
    return res;
  }

  await db.collection("_calendarProjectAccess").doc("thu-vien").set({
    studentUids: ["student"], lecturerUids: ["lecturer"],
  });
  assert.equal((await call("/add", "outsider", { ids: [seed.id] })).statusCode, 403);
  assert.equal((await call("/connect", "outsider")).statusCode, 403);
  assert.equal((await call("/add", "student", { ids: [seed.id] })).body.code, "calendar-connect-required");
  assert.equal((await call("/save", "student", { id: seed.id })).statusCode, 403);

  async function consent(code) {
    const { body } = await call("/connect");
    const state = new URL(body.url).searchParams.get("state");
    const path = "/oauth/callback";
    const callback = await call(path, "student", {}, { code, state });
    assert.equal(callback.statusCode, 303);
    const replay = await call(path, "student", {}, { code, state });
    assert.equal(replay.location.searchParams.get("calendar"), "expired");
    return callback.location.searchParams.get("calendar");
  }
  assert.equal(await consent("mismatch"), "account-mismatch");
  assert.equal(await consent("match"), "connected");
  const stored = (await db.collection("_calendarCredentials").doc("student").get()).data();
  assert.equal(vault.open("student", stored.refresh), "refresh-value");

  const add = await call("/add", "student", { ids: [seed.id, "thu-vien--deadline", seed.id] });
  assert.deepEqual(add.body.results.map(({ status }) => status), ["added", "added"]);
  const addedEventId = eventId("student", seed.id);
  const projectEventId = eventId("student", "thu-vien--deadline");
  assert.match(remote.get(projectEventId).summary, /^\[Hạn đề tài\]/);
  assert.notEqual(remote.get(projectEventId).colorId, remote.get(addedEventId).colorId);
  const change = { id: seed.id, revision: 0, name: "Hạn đã đổi", description: "Nộp bản mới", due: "2026-11-22T10:30+07:00" };
  assert.equal((await call("/save", "lecturer", { ...change, due: "2026-11-31T10:30+07:00" })).statusCode, 400);
  assert.equal((await call("/save", "lecturer", change)).body.event.revision, 1);
  assert.equal((await call("/save", "lecturer", change)).body.code, "calendar-stale-edit");
  await service.syncRequirement(seed.id);
  assert.equal(remote.get(addedEventId).summary, "[Bài nộp] Hạn đã đổi");
  assert.equal(remote.get(addedEventId).start.dateTime, "2026-11-22T03:30:00.000Z");
  assert.match(remote.get(addedEventId).description, /Nộp bản mới/);
  const repeated = await call("/add", "student", { ids: [seed.id] });
  assert.equal(repeated.body.results[0].status, "existing");
  assert.equal(remote.size, 2);
  const listed = (await call("/events")).body.events;
  assert.equal(listed.find(({ id }) => id === seed.id).due, change.due);
  assert.ok(listed.every(({ topic }) => topic === "thu-vien"));
});
