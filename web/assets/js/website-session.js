import { getFirebaseAuth, useRecoveryEmulator } from "./firebase-client.js?v=20261119-otp";
import { authConfig, authRequest, databaseAccount, notifyAccountChange, rememberDatabaseRole, websitePageRole } from "./auth-api.js";

export { websitePageRole };

const tabRoleKey = "ie104.website.role.v2";
export const roleSessionPrefix = "ie104.website.session.v2.";
const roles = ["student", "lecturer"];
const uitRoles = new Map([["gm.uit.edu.vn", "student"], ["uit.edu.vn", "lecturer"]]);

function remember(role, mode) {
  localStorage.setItem(roleSessionPrefix + role, mode);
  sessionStorage.setItem(tabRoleKey, role);
}

export function setDemoRole(role) {
  if (roles.includes(role)) remember(role, "demo");
}

export async function setFirebaseSession(role, user, emulator = false) {
  const { auth, sdk } = await getFirebaseAuth(emulator, role);
  await sdk.updateCurrentUser(auth, user);
  remember(role, emulator ? "emulator" : "firebase");
}

export function hasStoredWebsiteSession() {
  return roles.some(role => localStorage.getItem(roleSessionPrefix + role) !== null);
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

async function readRole(role) {
  const mode = localStorage.getItem(roleSessionPrefix + role);
  if (mode === "demo") return { role, user: null };
  if (mode !== "firebase" && mode !== "emulator") return null;
  const { auth } = await getFirebaseAuth(mode === "emulator", role);
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user || await getWebsiteRole(user) !== role) return null;
  return localStorage.getItem(roleSessionPrefix + role) === mode ? { role, user } : null;
}

export async function getWebsiteSession(role = websitePageRole()) {
  if (location.protocol === "file:") return null;
  if (await authConfig()) {
    const account = await databaseAccount(role);
    if (!account || (role && account.role !== role)) return null;
    rememberDatabaseRole(account.role);
    return { role: account.role, account, user: null, mode: "database" };
  }
  if (roles.includes(role)) {
    const session = await readRole(role);
    if (session) sessionStorage.setItem(tabRoleKey, role);
    return session;
  }
  const preferred = sessionStorage.getItem(tabRoleKey);
  const ordered = roles.includes(preferred) ? [preferred, ...roles.filter(role => role !== preferred)] : roles;
  for (const candidate of ordered) {
    const session = await readRole(candidate);
    if (session) return session;
  }
  return null;
}

export async function signOutWebsite() {
  if (await authConfig()) {
    await authRequest("logout", { method: "POST" });
    rememberDatabaseRole(null);
    notifyAccountChange();
    return;
  }
  const role = websitePageRole() ?? (await getWebsiteSession())?.role;
  const mode = role && localStorage.getItem(roleSessionPrefix + role);
  if (mode === "firebase" || mode === "emulator") {
    const { auth, sdk } = await getFirebaseAuth(mode === "emulator", role);
    await sdk.signOut(auth);
  }
  if (role) localStorage.removeItem(roleSessionPrefix + role);
  sessionStorage.removeItem(tabRoleKey);
  // Dọn phiên Firebase phụ dùng cho lịch và các phiên cũ trong tab.
  const clients = useRecoveryEmulator ? [false, true] : [false];
  await Promise.allSettled(clients.map(async emulator => {
    const { auth, sdk } = await getFirebaseAuth(emulator);
    await sdk.signOut(auth);
  }));
}
