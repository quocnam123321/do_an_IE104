import { randomBytes } from "node:crypto";
import catalog from "../functions/calendar-catalog.json" with { type: "json" };
import { CalendarError, createGoogleCalendar, createTokenVault, digest, eventId } from "../functions/google-calendar.cjs";
import { editable, validateEdit, withOverride, readCalendarSelection } from "../functions/calendar-policy.cjs";
import { authenticate } from "./auth.mjs";
import { createStore } from "./store.mjs";

const catalogById = new Map(catalog.map((entry) => [entry.id, entry]));
const maximumBatch = 5;
const demoTopic = "thu-vien";

function siteUrl(env) {
  try {
    const site = new URL(env.CALENDAR_SITE_URL);
    if (site.protocol !== "https:" || site.username || site.password || site.search || site.hash) throw new Error();
    if (!site.pathname.endsWith("/")) site.pathname += "/";
    return site;
  } catch {
    throw new CalendarError(503, "calendar-unconfigured");
  }
}

function googleConnection(env, site, fetcher) {
  const clientId = env.GOOGLE_CALENDAR_CLIENT_ID?.trim();
  const clientSecret = env.GOOGLE_CALENDAR_CLIENT_SECRET?.trim();
  const redirectUri = env.GOOGLE_CALENDAR_REDIRECT_URI?.trim();
  if (!clientId || !clientSecret || !redirectUri) throw new CalendarError(503, "calendar-unconfigured");
  return {
    google: createGoogleCalendar({ clientId, clientSecret, redirectUri, site, fetcher }),
    vault: createTokenVault(env.CALENDAR_TOKEN_KEY?.trim()),
  };
}

async function readBody(request) {
  if (request.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase() !== "application/json"
      || Number(request.headers.get("Content-Length")) > 12_000) {
    throw new CalendarError(400, "calendar-invalid-request");
  }
  try {
    const reader = request.body.getReader();
    const bytes = new Uint8Array(12_000);
    let size = 0;
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      if (size + value.length > bytes.length) {
        await reader.cancel();
        throw new Error();
      }
      bytes.set(value, size);
      size += value.length;
    }
    const body = JSON.parse(new TextDecoder().decode(bytes.subarray(0, size)));
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error();
    return body;
  } catch {
    throw new CalendarError(400, "calendar-invalid-request");
  }
}

async function saveRequirement(store, user, body, access) {
  const seed = catalogById.get(body.id);
  if (!seed || !editable(seed)) throw new CalendarError(404, "calendar-unknown-event");
  if (!access.has(seed.topic)) throw new CalendarError(403, "calendar-access-denied");
  const changes = validateEdit(body);
  const [current] = await store.readItems([seed]);
  if (current.revision !== body.revision) throw new CalendarError(409, "calendar-stale-edit");
  if (Object.keys(changes).every((key) => changes[key] === current[key])) return current;
  const saved = await store.save(seed, user, current.revision, changes);
  if (!saved) throw new CalendarError(409, "calendar-stale-edit");
  return withOverride(seed, saved);
}

async function startOAuth(store, user, google) {
  const state = randomBytes(32).toString("base64url");
  await store.saveState(digest(state), user, Date.now() + 10 * 60_000);
  return { url: google.authorizationUrl(state, user.email) };
}

async function finishOAuth(parameters, store, env, site, fetcher) {
  const state = parameters.get("state");
  if (!state || !/^[A-Za-z0-9_-]{43}$/.test(state)) return "expired";
  const grant = await store.takeState(digest(state));
  if (!grant || grant.expires_at < Date.now()) return "expired";
  const code = parameters.get("code");
  if (parameters.has("error") || !code || code.length > 2048) return "denied";
  if (!(await store.access({ uid: grant.uid, role: "student" })).size) return "denied";
  try {
    const { google, vault } = googleConnection(env, site, fetcher);
    const { profile, refreshToken } = await google.exchange(code);
    if (profile.email_verified !== true || profile.email?.toLowerCase() !== grant.email
        || typeof profile.sub !== "string" || !profile.sub) return "account-mismatch";
    const saved = await store.connect(grant.uid, grant.email, profile.sub, vault.seal(grant.uid, refreshToken));
    return saved ? "connected" : "account-mismatch";
  } catch (error) {
    console.warn("Calendar authorization failed", error.code ?? "unknown");
    return "failed";
  }
}

async function addEvents(store, user, input, access, env, site, fetcher) {
  const { seeds, personal } = readCalendarSelection(input, catalogById, maximumBatch);
  if (seeds.some(({ topic }) => !access.has(topic))) throw new CalendarError(403, "calendar-access-denied");

  const connection = await store.credentials(user.uid);
  if (!connection || connection.email !== user.email) throw new CalendarError(409, "calendar-connect-required");
  const { google, vault } = googleConnection(env, site, fetcher);
  let token;
  try {
    token = await google.accessToken(vault.open(user.uid, connection.refresh));
  } catch (error) {
    if (error.code === "calendar-connect-required") throw new CalendarError(409, error.code);
    throw error;
  }
  const items = [...await store.readItems(seeds), ...personal];
  const outcomes = [];
  const links = [];
  // Keep below Workers Free's six simultaneous outgoing connections.
  for (let offset = 0; offset < items.length; offset += 4) {
    outcomes.push(...await Promise.allSettled(items.slice(offset, offset + 4).map(async (item) => {
      const id = eventId(user.uid, item.id);
      const status = await google.insert(token, id, item);
      if (!item.selectionId) links.push({ item, eventId: id });
      return { id: item.selectionId ?? item.id, status };
    })));
  }
  if (links.length) await store.linkStatements(links, user.uid, connection.account_id);
  if (outcomes.every((result) => result.reason?.code === "calendar-connect-required")) {
    throw new CalendarError(409, "calendar-connect-required");
  }
  return outcomes.map((result, index) => result.value
    ?? { id: items[index].selectionId ?? items[index].id, status: "failed" });
}

export function createCalendarWorker(fetcher = (...args) => fetch(...args)) {
  return {
    async fetch(request, env) {
      const url = new URL(request.url);
      const headers = new Headers({ "Cache-Control": "no-store", "Referrer-Policy": "no-referrer", Vary: "Origin" });
      const json = (body, status = 200) => Response.json(body, { status, headers });
      try {
        const site = siteUrl(env);
        const store = createStore(env.DB);
        if (request.method === "GET" && ["/", "/health"].includes(url.pathname)) {
          await store.access({ uid: "-", role: "student" });
          googleConnection(env, site, fetcher);
          return json({ status: "ok" });
        }
        if (request.method === "GET" && url.pathname === "/oauth/callback") {
          const returnTo = new URL("pages/sinh-vien/lich-han-nop.html", site);
          returnTo.searchParams.set("calendar", await finishOAuth(url.searchParams, store, env, site, fetcher));
          headers.set("Location", returnTo.href);
          return new Response(null, { status: 303, headers });
        }

        const origin = request.headers.get("Origin");
        if (origin !== site.origin) throw new CalendarError(403, "calendar-origin-denied");
        headers.set("Access-Control-Allow-Origin", origin);
        if (request.method === "OPTIONS") {
          headers.set("Access-Control-Allow-Methods", "POST");
          headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
          return new Response(null, { status: 204, headers });
        }
        if (request.method !== "POST") throw new CalendarError(405, "calendar-invalid-request");
        const body = await readBody(request);
        const user = await authenticate(request, fetcher);
        if (!user.role) throw new CalendarError(403, "calendar-access-denied");
        const access = await store.access(user);
        if (user.verifiedUitStudent && !access.has(demoTopic) && ["/events", "/connect", "/add"].includes(url.pathname)) {
          await store.enrollStudent(demoTopic, user.uid);
          access.add(demoTopic);
        }
        switch (url.pathname) {
          case "/events": {
            const seeds = catalog.filter((item) => access.has(item.topic) && (user.role !== "lecturer" || editable(item)));
            return json({ events: await store.readItems(seeds) });
          }
          case "/save":
            if (user.role === "lecturer") return json({ event: await saveRequirement(store, user, body, access) });
            break;
          case "/connect":
            if (user.role === "student" && user.email && access.size) {
              return json(await startOAuth(store, user, googleConnection(env, site, fetcher).google));
            }
            break;
          case "/add":
            if (user.role === "student" && access.size) {
              return json({ results: await addEvents(store, user, body, access, env, site, fetcher) });
            }
            break;
          default:
            return json({ code: "calendar-invalid-request" }, 404);
        }
        throw new CalendarError(403, "calendar-access-denied");
      } catch (error) {
        if (!(error instanceof CalendarError)) console.warn("Calendar request failed", error.code ?? "unknown");
        return json({ code: error instanceof CalendarError ? error.code : "calendar-unavailable" },
          error instanceof CalendarError ? error.status : 503);
      }
    },

    async scheduled(_event, env) {
      const store = createStore(env.DB);
      const now = Date.now();
      const [pending] = await Promise.all([store.pending(now), store.cleanup(now)]);
      if (!pending.length) return;
      const { google, vault } = googleConnection(env, siteUrl(env), fetcher);
      const tokens = new Map();
      const completed = await Promise.all(pending.map(async (link) => {
        try {
          if (!tokens.has(link.uid)) tokens.set(link.uid, google.accessToken(vault.open(link.uid, link.refresh)));
          const token = await tokens.get(link.uid);
          const item = withOverride(catalogById.get(link.requirement_id), link);
          await google.patch(token, link.event_id, item);
          return { link, syncedRevision: link.revision, attempts: 0, retryAt: 0 };
        } catch (error) {
          const minutes = Math.min(2 ** link.attempts, 60);
          const retryAt = error.code === "calendar-connect-required" ? Number.MAX_SAFE_INTEGER : now + 60_000 * minutes;
          console.warn("Calendar synchronization deferred", error.code ?? "unknown");
          return { link, syncedRevision: 0, attempts: link.attempts + 1, retryAt };
        }
      }));
      await store.finishStatements(completed);
    },
  };
}

export default createCalendarWorker();
