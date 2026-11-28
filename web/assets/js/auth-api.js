const api = new URL("../../api/auth/", import.meta.url);
let configRequest;

export const databaseSessionEvent = "ie104.website.session.v2.database";
const databaseTabRole = "ie104.website.database.role";
const pageRoles = { "sinh-vien": "student", "giang-vien": "lecturer", "quan-tri": "admin" };

export function websitePageRole() {
  const folder = /\/pages\/(sinh-vien|giang-vien|quan-tri)\//.exec(location.pathname)?.[1];
  return pageRoles[folder];
}

function preferredRole() {
  const role = websitePageRole();
  if (role) return role;
  try {
    return sessionStorage.getItem(databaseTabRole);
  } catch {
    return null;
  }
}

export function rememberDatabaseRole(role) {
  try {
    if (role) sessionStorage.setItem(databaseTabRole, role);
    else sessionStorage.removeItem(databaseTabRole);
  } catch {
    // Trang theo vai trò vẫn đọc được phiên từ cookie.
  }
}

export function authConfig() {
  if (!/^https?:$/.test(location.protocol)) return Promise.resolve(null);
  configRequest ??= fetch(new URL("config", api), { cache: "no-store" }).then(async (response) => {
    if (response.status === 404 || !response.headers.get("content-type")?.includes("application/json")) return null;
    if (!response.ok) throw new Error("Không kết nối được máy chủ IE104.");
    const config = await response.json();
    return config.mode === "database" ? config : null;
  }).catch((error) => {
    configRequest = undefined;
    throw error;
  });
  return configRequest;
}

export async function authRequest(route, { method = "GET", body = {}, role = preferredRole() } = {}) {
  const options = { method, cache: "no-store", credentials: "same-origin", headers: {} };
  if (role) options.headers["X-IE104-Role"] = role;
  if (method !== "GET") {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(new URL(route, api), options);
  } catch {
    throw new Error("Không kết nối được máy chủ IE104. Hãy tải lại trang hoặc thử lại sau.");
  }
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw Object.assign(new Error(data.error ?? "Không thể thực hiện yêu cầu. Vui lòng thử lại."), { status: response.status });
  }
  return data;
}

export async function databaseAccount(role) {
  try {
    return (await authRequest("session", { role })).account;
  } catch (error) {
    if (error.status === 401) return null;
    throw error;
  }
}

export function notifyAccountChange() {
  try {
    localStorage.setItem(databaseSessionEvent, crypto.randomUUID());
  } catch {
    // Cookie vẫn xác thực được khi trình duyệt chặn lưu trữ web.
  }
}
