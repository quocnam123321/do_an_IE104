const { createCipheriv, createDecipheriv, createHash, randomBytes } = require("node:crypto");

const scope = "https://www.googleapis.com/auth/calendar.events.owned";
const tokenUrl = "https://oauth2.googleapis.com/token";
const calendarUrl = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

class CalendarError extends Error {
  constructor(status, code, retryable = false) {
    super(code);
    this.status = status;
    this.code = code;
    this.retryable = retryable;
  }
}

const digest = (value) => createHash("sha256").update(value).digest("hex");
const eventId = (uid, id) => digest("ie104:" + uid + ":" + id);
const escapeHtml = (value) => value.replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[char]);

function createTokenVault(secret) {
  const key = typeof secret === "string" && /^[0-9a-f]{64}$/i.test(secret) ? Buffer.from(secret, "hex") : null;
  if (!key) throw new CalendarError(503, "calendar-unconfigured");

  return {
    seal(uid, token) {
      const iv = randomBytes(12);
      const cipher = createCipheriv("aes-256-gcm", key, iv).setAAD(Buffer.from(uid));
      const data = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
      return Buffer.concat([iv, cipher.getAuthTag(), data]).toString("base64");
    },
    open(uid, sealed) {
      try {
        const payload = Buffer.from(sealed, "base64");
        const decipher = createDecipheriv("aes-256-gcm", key, payload.subarray(0, 12))
          .setAAD(Buffer.from(uid)).setAuthTag(payload.subarray(12, 28));
        return Buffer.concat([decipher.update(payload.subarray(28)), decipher.final()]).toString("utf8");
      } catch {
        throw new CalendarError(409, "calendar-connect-required");
      }
    },
  };
}

function buildEvent(item, site) {
  const link = new URL(item.path, site).href;
  const type = item.id.endsWith("--deadline") ? "Hạn đề tài" : "Bài nộp";
  const deadline = new Date(item.due).getTime();
  const timeZone = "Asia/Ho_Chi_Minh";
  return {
    summary: "[" + type + "] " + item.name,
    description: (item.description ? escapeHtml(item.description).replace(/\r?\n/g, "<br>") + "<br><br>" : "")
      + '<a href="' + escapeHtml(link) + '">Xem chi tiết trong hệ thống IE104</a>',
    start: { dateTime: new Date(deadline).toISOString(), timeZone },
    end: { dateTime: new Date(deadline + 5 * 60_000).toISOString(), timeZone },
    extendedProperties: { private: { ie104Key: item.id, ie104Revision: String(item.revision) } },
  };
}

function createGoogleCalendar({ clientId, clientSecret, redirectUri, site, fetcher = globalThis.fetch }) {
  const client = { client_id: clientId, client_secret: clientSecret };

  async function request(url, options) {
    let response;
    try {
      response = await fetcher(url, { ...options, signal: AbortSignal.timeout(10_000) });
    } catch {
      throw new CalendarError(503, "calendar-network", true);
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const reason = data.error?.errors?.[0]?.reason;
      const retryable = response.status === 429 || response.status >= 500
        || ["rateLimitExceeded", "userRateLimitExceeded"].includes(reason);
      const reconnect = data.error === "invalid_grant" || response.status === 401
        || reason === "insufficientPermissions";
      throw new CalendarError(response.status, reconnect ? "calendar-connect-required" : "calendar-google-error", retryable);
    }
    return data;
  }

  function tokenRequest(values) {
    return request(tokenUrl, { method: "POST", body: new URLSearchParams({ ...client, ...values }) });
  }

  function authorized(url, token, method = "GET", body, etag) {
    const headers = { Authorization: "Bearer " + token };
    if (body) headers["Content-Type"] = "application/json";
    if (etag) headers["If-Match"] = etag;
    return request(url, { method, headers, body: body && JSON.stringify(body) });
  }

  async function patch(token, id, item) {
    const url = calendarUrl + "/" + encodeURIComponent(id);
    for (let attempt = 0; attempt < 3; attempt += 1) {
      let stored;
      try {
        stored = await authorized(url, token);
      } catch (error) {
        if ([404, 410].includes(error.status)) return "removed";
        throw error;
      }
      if (stored.status === "cancelled") return "removed";
      const properties = stored.extendedProperties?.private;
      if (properties?.ie104Key !== item.id || !stored.etag) return "unlinked";
      if (Number(properties.ie104Revision) >= item.revision) return "current";

      const fields = buildEvent(item, site);
      fields.extendedProperties.private = { ...properties, ...fields.extendedProperties.private };
      try {
        await authorized(url, token, "PATCH", fields, stored.etag);
        return "updated";
      } catch (error) {
        if ([404, 410].includes(error.status)) return "removed";
        if (error.status !== 412) throw error;
      }
    }
    throw new CalendarError(503, "calendar-conflict", true);
  }

  return {
    authorizationUrl(state, email) {
      const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      url.search = new URLSearchParams({
        client_id: clientId, redirect_uri: redirectUri, response_type: "code",
        scope: "openid email " + scope, state, access_type: "offline",
        prompt: "consent", login_hint: email,
      });
      return url.href;
    },
    async exchange(code) {
      const credentials = await tokenRequest({ code, redirect_uri: redirectUri, grant_type: "authorization_code" });
      if (!credentials.access_token || !credentials.refresh_token || !credentials.scope?.split(/\s+/).includes(scope)) {
        throw new CalendarError(409, "calendar-consent-required");
      }
      const profile = await authorized("https://openidconnect.googleapis.com/v1/userinfo", credentials.access_token);
      return { profile, refreshToken: credentials.refresh_token };
    },
    async accessToken(refreshToken) {
      const data = await tokenRequest({ refresh_token: refreshToken, grant_type: "refresh_token" });
      if (!data.access_token) throw new CalendarError(409, "calendar-connect-required");
      return data.access_token;
    },
    async insert(token, id, item) {
      const fields = buildEvent(item, site);
      const body = {
        ...fields, id, transparency: "transparent", visibility: "private",
        colorId: item.id.endsWith("--deadline") ? "6" : "9",
        reminders: { useDefault: false, overrides: [{ method: "popup", minutes: 1440 }, { method: "popup", minutes: 60 }] },
        source: { title: "Lịch hạn nộp IE104", url: new URL(item.path, site).href },
      };
      try {
        await authorized(calendarUrl, token, "POST", body);
        return "added";
      } catch (error) {
        if (error.status !== 409) throw error;
        const result = await patch(token, id, item);
        if (result === "removed" || result === "unlinked") throw new CalendarError(409, "calendar-event-missing");
        return result === "updated" ? result : "existing";
      }
    },
    patch,
  };
}

module.exports = { CalendarError, buildEvent, createGoogleCalendar, createTokenVault, digest, eventId };
