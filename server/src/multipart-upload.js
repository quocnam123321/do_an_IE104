import { AuthError } from "./auth-security.js";

export async function readMultipartForm(request) {
  try {
    const input = new Request("http://localhost", {
      method: "POST", headers: { "Content-Type": request.get("content-type") }, body: request.body,
    });
    return await input.formData();
  } catch {
    throw new AuthError(400, "Không đọc được biểu mẫu và tệp đính kèm.");
  }
}

export async function uploadedAttachment(file) {
  const name = file.name.replace(/[\u0000-\u001f\u007f<>:"/\\|?*]/gu, "_").trim();
  if (!name || name.length > 255 || name === "." || name === "..") throw new AuthError(400, "Tên tệp không hợp lệ.");
  const type = /^[\w.+-]+\/[\w.+-]+$/.test(file.type) && file.type.length <= 255 ? file.type : "application/octet-stream";
  return { name, type, content: Buffer.from(await file.arrayBuffer()) };
}
