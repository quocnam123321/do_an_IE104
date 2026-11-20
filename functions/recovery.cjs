const { createHmac, randomBytes, randomInt, timingSafeEqual } = require("node:crypto");

const OTP_LIFETIME = 10 * 60_000;
const RESEND_DELAY = 60_000;
const MAX_SENDS_PER_MAILBOX = 5;
const MAX_SENDS_TOTAL = 240;
const MAX_ATTEMPTS = 5;
const DAY = 24 * 60 * 60_000;
const INVALID_CODE = "invalid-code";

class RecoveryError extends Error {
  constructor(status, code, retryAfterMs) {
    super(code);
    this.status = status;
    this.code = code;
    this.retryAfterMs = retryAfterMs;
  }
}

function normalizeEmail(value) {
  const email = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (email.length > 254 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw new RecoveryError(400, "invalid-email");
  }
  return email;
}

function gmailAddress(value) {
  const email = normalizeEmail(value);
  const parts = /^([a-z0-9]+(?:\.[a-z0-9]+)*)(?:\+[a-z0-9_.+-]+)?@gmail\.com$/.exec(email);
  if (!parts || email.indexOf("@") > 64) throw new RecoveryError(400, "invalid-email");
  return { email, mailbox: parts[1].replaceAll(".", "") };
}

function createRecovery({ store, secret, sendEmail, clock = Date.now }) {
  const sign = (value) => createHmac("sha256", secret).update(value).digest("hex");
  const mailboxKey = (mailbox) => sign("demo-gmail:" + mailbox);
  const codeHash = (challengeId, code) => sign("demo-otp:" + challengeId + ":" + code);

  async function issueCode(rawEmail) {
    const { email, mailbox } = gmailAddress(rawEmail);
    const key = mailboxKey(mailbox);
    const challengeId = randomBytes(24).toString("base64url");
    const code = String(randomInt(1_000_000)).padStart(6, "0");

    await store.change(key, (previous, quota) => {
      const now = clock();
      const mailboxTimes = (previous?.sendTimes ?? []).filter((time) => time > now - DAY);
      const totalTimes = (quota?.sendTimes ?? []).filter((time) => time > now - DAY);
      const nextAttempt = Math.max(
        (mailboxTimes.at(-1) ?? -Infinity) + RESEND_DELAY,
        mailboxTimes.length >= MAX_SENDS_PER_MAILBOX ? mailboxTimes[0] + DAY : 0,
        totalTimes.length >= MAX_SENDS_TOTAL ? totalTimes[0] + DAY : 0,
      );
      if (nextAttempt > now) throw new RecoveryError(429, "rate-limited", nextAttempt - now);

      const deleteAt = new Date(now + DAY);
      return {
        next: { ...previous, reservation: challengeId, sendTimes: [...mailboxTimes, now], deleteAt },
        nextQuota: { sendTimes: [...totalTimes, now], deleteAt },
      };
    }, true);

    // Leave the previous code valid when the new email has not been accepted.
    await sendEmail(email, code, challengeId);
    await store.change(key, (current) => {
      if (current?.reservation !== challengeId) throw new RecoveryError(409, "request-superseded");
      const { reservation, ...record } = current;
      return {
        next: {
          ...record,
          challenge: {
            id: challengeId,
            otpDigest: codeHash(challengeId, code),
            expiresAt: clock() + OTP_LIFETIME,
            attempts: 0,
          },
        },
      };
    });
    return { challengeId, retryAfterMs: RESEND_DELAY };
  }

  async function verifyCode(rawEmail, challengeId, code) {
    const { mailbox } = gmailAddress(rawEmail);
    if (typeof challengeId !== "string" || !/^[A-Za-z0-9_-]{32}$/.test(challengeId)
        || typeof code !== "string" || !/^[0-9]{6}$/.test(code)) {
      throw new RecoveryError(400, INVALID_CODE);
    }
    const verified = await store.change(mailboxKey(mailbox), (current) => {
      if (current?.challenge?.id !== challengeId) return { result: false };
      const { challenge, ...record } = current;
      if (challenge.expiresAt <= clock() || challenge.attempts >= MAX_ATTEMPTS) {
        return { next: record, result: false };
      }
      const matches = timingSafeEqual(
        Buffer.from(challenge.otpDigest, "hex"),
        Buffer.from(codeHash(challengeId, code), "hex"),
      );
      if (matches) return { next: record, result: true };
      return { next: { ...record, challenge: { ...challenge, attempts: challenge.attempts + 1 } }, result: false };
    });

    if (!verified) throw new RecoveryError(400, INVALID_CODE);
    return { verified: true };
  }

  return { issueCode, verifyCode };
}

module.exports = { createRecovery, normalizeEmail, RecoveryError };

