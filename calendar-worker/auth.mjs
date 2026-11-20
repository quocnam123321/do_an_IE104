import { actor } from "../functions/calendar-policy.cjs";
import { CalendarError } from "../functions/google-calendar.cjs";
import { firebaseConfig } from "../assets/js/firebase-config.js";
import { Buffer } from "node:buffer";

const denied = () => new CalendarError(401, "calendar-login-required");

export async function authenticate(request, fetcher) {
  const token = /^Bearer ([A-Za-z0-9_.-]{1,8192})$/.exec(request.headers.get("Authorization") ?? "")?.[1];
  let claims;
  try {
    const parts = token?.split(".");
    if (parts?.length !== 3) throw denied();
    claims = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
  } catch {
    throw denied();
  }
  const { projectId, apiKey } = firebaseConfig;
  const now = Math.floor(Date.now() / 1000);
  if (claims?.aud !== projectId || claims.iss !== "https://securetoken.google.com/" + projectId
      || typeof claims.sub !== "string" || !claims.sub || claims.sub.length > 128
      || !Number.isSafeInteger(claims.exp) || claims.exp <= now
      || !Number.isSafeInteger(claims.iat) || claims.iat > now + 60
      || !Number.isSafeInteger(claims.auth_time) || claims.auth_time > now) throw denied();

  // Firebase verifies the signature of the same token whose claims are used below.
  const response = await fetcher("https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=" + encodeURIComponent(apiKey), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken: token }),
    signal: AbortSignal.timeout(10_000),
  });
  if (response.status >= 500 || response.status === 429) throw new CalendarError(503, "calendar-unavailable");
  if (!response.ok) throw denied();
  const { users } = await response.json();
  const account = users?.[0];
  if (!account || account.disabled || account.localId !== claims.sub
      || claims.auth_time < Number(account.validSince ?? 0)) throw denied();
  return actor({ ...claims, uid: account.localId, email: account.email, email_verified: account.emailVerified });
}
