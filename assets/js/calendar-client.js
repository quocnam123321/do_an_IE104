import { getFirebaseAuth, useRecoveryEmulator } from "./firebase-client.js?v=20261119-otp";

const endpoint = useRecoveryEmulator
  ? "http://127.0.0.1:5001/demo-ie104-recovery/asia-southeast1/calendarBridge"
  : "https://ie104-calendar.ntranphu230606.workers.dev";
const eventBatchSize = 5;

const messages = {
  "calendar-file": "Mở website qua HTTP hoặc HTTPS để sử dụng Google Calendar.",
  "calendar-login-required": "Vui lòng đăng nhập tài khoản IE104 để tiếp tục.",
  "calendar-access-denied": "Tài khoản của bạn chưa được cấp quyền đối với đề tài này.",
  "calendar-origin-denied": "Địa chỉ website này chưa được cấu hình cho Google Calendar.",
  "calendar-unconfigured": "Dịch vụ Google Calendar chưa được cấu hình cho dự án.",
  "calendar-invalid-edit": "Kiểm tra tên, nội dung và hạn nộp trước khi lưu.",
  "calendar-stale-edit": "Yêu cầu đã được sửa ở nơi khác. Tải lại trang để lấy bản mới nhất.",
  "calendar-connect-required": "Cần kết nối lại tài khoản Google Calendar.",
};

export function calendarMessage(error) {
  return messages[error?.code] ?? "Không kết nối được dịch vụ lịch. Vui lòng thử lại.";
}

export async function calendarSession() {
  if (location.protocol === "file:") return null;
  const { auth } = await getFirebaseAuth(useRecoveryEmulator);
  await auth.authStateReady();
  return auth.currentUser;
}

export async function calendarRequest(user, route, body = {}) {
  if (!user) {
    throw Object.assign(new Error("Calendar sign-in"), {
      code: location.protocol === "file:" ? "calendar-file" : "calendar-login-required",
    });
  }
  const response = await fetch(endpoint + route, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + await user.getIdToken() },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(185_000),
  });
  const data = await response.json();
  if (!response.ok) throw Object.assign(new Error("Calendar request"), { code: data.code ?? "calendar-unavailable" });
  return data;
}

export async function addCalendarEvents(user, ids) {
  const results = [];
  for (let offset = 0; offset < ids.length; offset += eventBatchSize) {
    const batch = ids.slice(offset, offset + eventBatchSize);
    try {
      const response = await calendarRequest(user, "/add", { ids: batch });
      results.push(...response.results);
    } catch (error) {
      if (offset === 0 || error.code === "calendar-connect-required") throw error;
      results.push(...ids.slice(offset).map((id) => ({ id, status: "failed" })));
      break;
    }
  }
  return { results };
}
