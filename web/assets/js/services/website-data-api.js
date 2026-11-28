import { websitePageRole } from "../auth-api.js";

export async function websiteData(path, { method = "GET", body, role = websitePageRole() } = {}) {
  const headers = {};
  if (role) headers["X-IE104-Role"] = role;
  const multipart = body instanceof FormData;
  if (body !== undefined && !multipart) headers["Content-Type"] = "application/json";
  const response = await fetch("/api/" + path, { method, headers, cache: "no-store",
    body: body === undefined || multipart ? body : JSON.stringify(body) });
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw Object.assign(new Error(data.error ?? "Không thể thực hiện yêu cầu. Vui lòng thử lại."),
      { status: response.status, field: data.field });
  }
  return data;
}
