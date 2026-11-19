const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");
const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { defineSecret, defineString } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const { createRecovery, RecoveryError } = require("./recovery.cjs");
const { otpMessage, sendBrevoEmail, subject } = require("./brevo.cjs");
const { createCalendarBridge } = require("./calendar-bridge.cjs");
const { CalendarError, createGoogleCalendar, createTokenVault } = require("./google-calendar.cjs");

const app = initializeApp();
const db = getFirestore(app);
const otpSecret = defineSecret("RECOVERY_OTP_SECRET");
const brevoApiKey = defineSecret("BREVO_API_KEY");
const fromAddress = defineString("RECOVERY_EMAIL_FROM", { default: "unset" });
const allowedOrigins = defineString("RECOVERY_ALLOWED_ORIGINS", {
  default: "http://localhost:8012,http://127.0.0.1:8012",
});
const emulator = process.env.FUNCTIONS_EMULATOR === "true";
const isolatedEmulator = process.env.GCLOUD_PROJECT === "demo-ie104-recovery"
  && Boolean(process.env.FIRESTORE_EMULATOR_HOST);
const localInbox = emulator && process.env.RECOVERY_DELIVERY !== "brevo";
const collection = db.collection("_demoRecovery");
const quotaRef = collection.doc("deliveryQuota");
const calendarSite = defineString("CALENDAR_SITE_URL", { default: "" });
const calendarClientId = defineString("GOOGLE_CALENDAR_CLIENT_ID", { default: "" });
const calendarRedirect = defineString("GOOGLE_CALENDAR_REDIRECT_URI", { default: "" });
const calendarClientSecret = defineSecret("GOOGLE_CALENDAR_CLIENT_SECRET");
const calendarTokenKey = defineSecret("CALENDAR_TOKEN_KEY");
const calendarSecrets = [calendarClientSecret, calendarTokenKey];

const store = {
  change(key, update, countDelivery = false) {
    const reference = collection.doc(key);
    return db.runTransaction(async (transaction) => {
      const references = countDelivery ? [reference, quotaRef] : [reference];
      const [current, quota] = await transaction.getAll(...references);
      const { next, nextQuota, result } = update(current.data(), quota?.data());
      if (next) transaction.set(reference, next);
      if (nextQuota) transaction.set(quotaRef, nextQuota);
      return result;
    });
  },
};

async function sendEmail(email, code, challengeId) {
  const text = otpMessage(code);

  if (localInbox) {
    await db.collection("_recoveryDevInbox").doc(challengeId).set({
      to: email,
      subject,
      text,
      createdAt: new Date(),
    });
    return;
  }

  await sendBrevoEmail({
    apiKey: brevoApiKey.value(),
    from: fromAddress.value().trim(),
    to: email,
    text,
    logError: (status) => logger.warn("OTP email delivery failed", { status: status ?? "network" }),
  });
}

exports.accountRecovery = onRequest({
  region: "asia-southeast1",
  secrets: [otpSecret, brevoApiKey],
  maxInstances: 5,
  timeoutSeconds: 20,
}, async (req, res) => {
  const origin = req.get("origin");
  const allowed = allowedOrigins.value().split(",").map((value) => value.trim());
  res.set("Cache-Control", "no-store").vary("Origin");

  if (!origin || !allowed.includes(origin)) {
    res.status(403).json({ code: "origin-not-allowed" });
    return;
  }
  res.set("Access-Control-Allow-Origin", origin);
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Methods", "POST").set("Access-Control-Allow-Headers", "Content-Type");
    res.status(204).end();
    return;
  }
  if (req.method !== "POST" || !req.is("application/json")) {
    res.status(400).json({ code: "invalid-request" });
    return;
  }
  const verify = req.path === "/verify";
  if (req.path !== "/request" && !verify) {
    res.status(404).json({ code: "invalid-request" });
    return;
  }
  if (req.rawBody?.length > 2048 || !req.body || typeof req.body !== "object") {
    res.status(400).json({ code: "invalid-request" });
    return;
  }

  try {
    const secret = otpSecret.value();
    if (!secret || secret.length < 32 || (emulator && !isolatedEmulator)) {
      throw new RecoveryError(503, "service-unavailable");
    }
    const recovery = createRecovery({ store, secret, sendEmail });
    if (verify) {
      const { email, challengeId, code } = req.body;
      res.json(await recovery.verifyCode(email, challengeId, code));
      return;
    }
    const sender = fromAddress.value().trim();
    if (!localInbox && (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(sender)
        || !brevoApiKey.value() || brevoApiKey.value() === "emulator-unused")) {
      throw new RecoveryError(503, "service-unavailable");
    }
    const result = await recovery.issueCode(req.body.email);
    res.json({ ...result, delivery: localInbox ? "test" : "email" });
  } catch (error) {
    if (error instanceof RecoveryError) {
      res.status(error.status).json({ code: error.code, retryAfterMs: error.retryAfterMs });
      return;
    }
    logger.error("Account recovery request failed", { code: error.code ?? "unknown" });
    res.status(503).json({ code: "service-unavailable" });
  }
});

const calendarBridge = createCalendarBridge({
  db,
  auth: getAuth(app),
  getConfig(connected) {
    let site;
    try {
      site = new URL(calendarSite.value() || (isolatedEmulator ? "http://127.0.0.1:8012/" : ""));
      if (!site.pathname.endsWith("/")) site.pathname += "/";
      const local = isolatedEmulator && Boolean(process.env.FIREBASE_AUTH_EMULATOR_HOST)
        && ["localhost", "127.0.0.1"].includes(site.hostname);
      if ((emulator && !local) || (!local && site.protocol !== "https:")
          || site.username || site.password || site.search || site.hash) throw new Error();
    } catch {
      throw new CalendarError(503, "calendar-unconfigured");
    }
    if (!connected) return { site };

    const clientId = calendarClientId.value().trim();
    const clientSecret = calendarClientSecret.value();
    const redirectUri = calendarRedirect.value().trim();
    if (!clientId || !clientSecret || !redirectUri) throw new CalendarError(503, "calendar-unconfigured");
    return {
      site,
      google: createGoogleCalendar({ clientId, clientSecret, redirectUri, site }),
      vault: createTokenVault(calendarTokenKey.value()),
    };
  },
  log: (message, code) => logger.warn(message, { code: code ?? "unknown" }),
});

exports.calendarBridge = onRequest({
  region: "asia-southeast1",
  secrets: calendarSecrets,
  maxInstances: 5,
  timeoutSeconds: 180,
}, calendarBridge.handle);

exports.syncCalendarRequirement = onDocumentWritten({
  document: "_calendarRequirements/{id}",
  region: "asia-southeast1",
  secrets: calendarSecrets,
  retry: true,
  maxInstances: 5,
  timeoutSeconds: 300,
}, (event) => event.data?.after.exists && calendarBridge.syncRequirement(event.params.id));
