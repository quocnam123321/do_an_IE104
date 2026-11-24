import { getFirebaseAuth, useRecoveryEmulator } from "./firebase-client.js?v=20261119-otp";

const sessionKey = "ie104.website.session.v1";
const roles = ["student", "lecturer"];
const uitRoles = new Map([["gm.uit.edu.vn", "student"], ["uit.edu.vn", "lecturer"]]);

export function setDemoRole(role) {
  if (roles.includes(role)) sessionStorage.setItem(sessionKey, role);
}

export function setFirebaseSession(emulator = false) {
  sessionStorage.setItem(sessionKey, emulator ? "emulator" : "firebase");
}

export function clearWebsiteSession() {
  sessionStorage.removeItem(sessionKey);
}

export function hasStoredWebsiteSession() {
  return sessionStorage.getItem(sessionKey) !== null;
}

export async function getWebsiteRole(user) {
  const { claims, signInProvider } = await user.getIdTokenResult();
  if (signInProvider === "google.com") {
    const email = (user.email ?? "").trim().toLowerCase();
    const domain = /^[^@\s]+@([^@\s]+)$/.exec(email)?.[1];
    return user.emailVerified ? uitRoles.get(domain) : undefined;
  }
  return roles.includes(claims.ie104Role) ? claims.ie104Role : undefined;
}

async function readFirebaseSession(emulator) {
  const { auth } = await getFirebaseAuth(emulator);
  await auth.authStateReady();
  const user = auth.currentUser;
  const role = user && await getWebsiteRole(user);
  return role ? { role, user } : null;
}

export async function getWebsiteSession() {
  const signedInWith = sessionStorage.getItem(sessionKey);
  if (roles.includes(signedInWith)) return { role: signedInWith, user: null };
  if (location.protocol === "file:") return null;
  if (!useRecoveryEmulator || signedInWith === "firebase") return readFirebaseSession(false);
  if (signedInWith === "emulator") return readFirebaseSession(true);

  // Tab mở trước khi dùng chung luồng đăng nhập có thể đã có phiên ở một trong hai Firebase client.
  const sessions = await Promise.allSettled([readFirebaseSession(true), readFirebaseSession(false)]);
  const session = sessions.find((result) => result.status === "fulfilled" && result.value);
  if (session) return session.value;
  const failure = sessions.find((result) => result.status === "rejected");
  if (failure) throw failure.reason;
  return null;
}
