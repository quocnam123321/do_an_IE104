const { randomBytes } = require("node:crypto");
const { CalendarError, digest, eventId } = require("./google-calendar.cjs");
const catalog = require("./calendar-catalog.json");

const byId = new Map(catalog.map((item) => [item.id, item]));
const projects = [...new Set(catalog.map((item) => item.topic))];
const { actor, editable, validateEdit, withOverride, readCalendarSelection } = require("./calendar-policy.cjs");
const allowed = (access, user) => {
  const uids = user.role === "lecturer" ? access?.lecturerUids : access?.studentUids;
  return Array.isArray(uids) && uids.includes(user.uid);
};

async function inBatches(items, operation) {
  const results = [];
  for (let offset = 0; offset < items.length; offset += 5) {
    results.push(...await Promise.allSettled(items.slice(offset, offset + 5).map(operation)));
  }
  return results;
}

function createCalendarBridge({ db, auth, getConfig, log }) {
  const accessRef = (id) => db.collection("_calendarProjectAccess").doc(id);
  const requirementRef = (id) => db.collection("_calendarRequirements").doc(id);
  const credentialRef = (uid) => db.collection("_calendarCredentials").doc(uid);
  const states = db.collection("_calendarOAuth");
  const links = (id) => db.collection("_calendarLinks").doc(id).collection("students");

  async function accessFor(user) {
    const snapshots = await db.getAll(...projects.map(accessRef));
    return new Set(snapshots.filter((snapshot) => allowed(snapshot.data(), user)).map((snapshot) => snapshot.id));
  }

  async function readItems(seeds) {
    if (!seeds.length) return [];
    const docs = await db.getAll(...seeds.map(({ id }) => requirementRef(id)));
    return seeds.map((seed, index) => withOverride(seed, docs[index].data()));
  }

  async function saveRequirement(user, input) {
    const seed = byId.get(input.id);
    if (!seed || !editable(seed)) throw new CalendarError(404, "calendar-unknown-event");
    const changes = validateEdit(input);
    return db.runTransaction(async (transaction) => {
      const ref = requirementRef(seed.id);
      const [access, snapshot] = await transaction.getAll(accessRef(seed.topic), ref);
      if (!allowed(access.data(), user)) throw new CalendarError(403, "calendar-access-denied");
      const current = withOverride(seed, snapshot.data());
      if (input.revision !== current.revision) throw new CalendarError(409, "calendar-stale-edit");
      if (Object.keys(changes).every((key) => changes[key] === current[key])) return current;
      const next = { ...changes, revision: current.revision + 1, updatedBy: user.uid, updatedAt: new Date() };
      transaction.set(ref, next);
      return withOverride(seed, next);
    });
  }

  async function connect(user, google) {
    if (!user.email || !(await accessFor(user)).size) {
      throw new CalendarError(403, "calendar-access-denied");
    }
    const state = randomBytes(32).toString("base64url");
    await states.doc(digest(state)).create({
      uid: user.uid, email: user.email,
      expiresAt: new Date(Date.now() + 10 * 60_000),
    });
    return { url: google.authorizationUrl(state, user.email) };
  }

  async function callback(req, res, config) {
    const url = new URL("pages/sinh-vien/lich-han-nop.html", config.site);
    let result = "expired";
    try {
      const state = req.query.state;
      if (typeof state !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(state)) throw new CalendarError(400, "calendar-invalid-state");
      const ref = states.doc(digest(state));
      const grant = await db.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(ref);
        if (snapshot.exists) transaction.delete(ref);
        return snapshot.data();
      });
      if (!grant || grant.expiresAt.toMillis() < Date.now()) throw new CalendarError(400, "calendar-invalid-state");
      result = "denied";
      if (!req.query.error && typeof req.query.code === "string" && req.query.code.length <= 2048) {
        const { google, vault } = getConfig(true);
        const { profile, refreshToken } = await google.exchange(req.query.code);
        const owner = await auth.getUser(grant.uid);
        result = "account-mismatch";
        if (!owner.disabled && owner.email?.toLowerCase() === grant.email && profile.email_verified === true
            && profile.email?.toLowerCase() === grant.email && typeof profile.sub === "string" && profile.sub) {
          const credential = credentialRef(grant.uid);
          await db.runTransaction(async (transaction) => {
            const previous = (await transaction.get(credential)).data();
            if (previous?.accountId && previous.accountId !== profile.sub) {
              throw new CalendarError(403, "calendar-account-mismatch");
            }
            transaction.set(credential, {
              accountId: profile.sub,
              refresh: vault.seal(grant.uid, refreshToken),
              updatedAt: new Date(),
            });
          });
          result = "connected";
        }
      }
    } catch (error) {
      log("Calendar OAuth callback", error.code);
      if (result === "denied" && !req.query.error) result = "failed";
    }
    url.searchParams.set("calendar", result);
    res.redirect(303, url.href);
  }

  async function addEvents(user, input, config) {
    const { seeds, personal } = readCalendarSelection(input, byId, 50);
    const access = await accessFor(user);
    if (seeds.some((item) => !access.has(item.topic)) || (personal.length && !access.size)) {
      throw new CalendarError(403, "calendar-access-denied");
    }
    const { google, vault } = config;
    const credential = (await credentialRef(user.uid).get()).data();
    if (!credential) throw new CalendarError(409, "calendar-connect-required");
    let token;
    try {
      token = await google.accessToken(vault.open(user.uid, credential.refresh));
    } catch (error) {
      if (error.code === "calendar-connect-required") throw new CalendarError(409, error.code);
      throw error;
    }

    const items = [...await readItems(seeds), ...personal];
    const results = await inBatches(items, async (item) => {
      const id = eventId(user.uid, item.id);
      const result = await google.insert(token, id, item);
      if (item.selectionId) return result;
      const link = links(item.id).doc(user.uid);
      await link.set({ eventId: id, calendarId: "primary", accountId: credential.accountId });
      // Lượt sửa có thể hoàn tất trước khi lần thêm này tạo liên kết.
      const latest = (await readItems([byId.get(item.id)]))[0];
      if (latest.revision > item.revision) await google.patch(token, id, latest);
      return result;
    });
    if (results.every(({ status, reason }) => status === "rejected" && reason?.code === "calendar-connect-required")) {
      throw new CalendarError(409, "calendar-connect-required");
    }
    return { results: results.map((outcome, index) => ({
      id: items[index].selectionId ?? items[index].id,
      status: outcome.status === "fulfilled" ? outcome.value : "failed",
    })) };
  }

  async function handle(req, res) {
    res.set("Cache-Control", "no-store").set("Referrer-Policy", "no-referrer").vary("Origin");
    try {
      const config = getConfig(false);
      if (req.method === "GET" && req.path === "/oauth/callback") {
        await callback(req, res, config);
        return;
      }
      const origin = req.get("origin");
      if (origin !== config.site.origin) throw new CalendarError(403, "calendar-origin-denied");
      res.set("Access-Control-Allow-Origin", origin);
      if (req.method === "OPTIONS") {
        res.set("Access-Control-Allow-Methods", "POST").set("Access-Control-Allow-Headers", "Authorization, Content-Type");
        res.status(204).end();
        return;
      }
      if (req.method !== "POST" || !req.is("application/json") || req.rawBody?.length > 12_000
          || !req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
        throw new CalendarError(400, "calendar-invalid-request");
      }
      let user;
      try {
        const bearer = /^Bearer ([^\s]+)$/.exec(req.get("Authorization") ?? "")?.[1];
        if (!bearer) throw new Error();
        user = actor(await auth.verifyIdToken(bearer, true));
      } catch {
        throw new CalendarError(401, "calendar-login-required");
      }

      if (!user.role) throw new CalendarError(403, "calendar-access-denied");
      if (req.path === "/events") {
        const access = await accessFor(user);
        const seeds = catalog.filter((item) => access.has(item.topic) && (user.role !== "lecturer" || editable(item)));
        res.json({ events: await readItems(seeds) });
      } else if (req.path === "/save" && user.role === "lecturer") {
        res.json({ event: await saveRequirement(user, req.body) });
      } else if (req.path === "/connect" && user.role === "student") {
        res.json(await connect(user, getConfig(true).google));
      } else if (req.path === "/add" && user.role === "student") {
        res.json(await addEvents(user, req.body, getConfig(true)));
      } else {
        throw new CalendarError(403, "calendar-access-denied");
      }
    } catch (error) {
      if (!(error instanceof CalendarError)) log("Calendar bridge request", error.code);
      const code = error instanceof CalendarError ? error.code : "calendar-unavailable";
      const status = error instanceof CalendarError ? error.status : 503;
      res.status(status).json({ code });
    }
  }

  async function syncRequirement(id) {
    const seed = byId.get(id);
    if (!seed || !editable(seed)) return;
    const [access, subscribers, [item]] = await Promise.all([
      accessRef(seed.topic).get(), links(id).get(), readItems([seed]),
    ]);
    if (subscribers.empty) return;
    const { google, vault } = getConfig(true);
    const outcomes = await inBatches(subscribers.docs, async (subscriber) => {
      const uid = subscriber.id;
      if (!allowed(access.data(), { uid, role: "student" })) return;
      const link = subscriber.data();
      const credential = (await credentialRef(uid).get()).data();
      if (!credential || credential.accountId !== link.accountId) return;
      const token = await google.accessToken(vault.open(uid, credential.refresh));
      await google.patch(token, link.eventId, item);
    });
    for (const outcome of outcomes) {
      if (outcome.status !== "rejected") continue;
      if (!(outcome.reason instanceof CalendarError) || outcome.reason.retryable) throw outcome.reason;
      log("Calendar subscriber update skipped", outcome.reason.code);
    }
  }

  return { handle, syncRequirement };
}

module.exports = { createCalendarBridge };
