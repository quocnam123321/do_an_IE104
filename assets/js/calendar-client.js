import { getFirebaseAuth, useRecoveryEmulator } from "./firebase-client.js?v=20261119-otp";
import { getWebsiteSession } from "./website-session.js";

const endpoint = useRecoveryEmulator
  ? "http://127.0.0.1:5001/demo-ie104-recovery/asia-southeast1/calendarBridge"
  : "https://ie104-calendar.ntranphu230606.workers.dev";
const eventBatchSize = 5;
const calendarSite = "https://ie104-nhom7.web.app";
// Keep the original export keys when the lecturer opens the library group's workspace.
const requirementTopics = new Map([
  ["DA001", "thu-vien"],
  ["GV-DT001-N01", "thu-vien"],
  ["DA002", "ban-sach"],
]);

const messages = {
  "calendar-file": "Mở website qua HTTP hoặc HTTPS để sử dụng Google Calendar.",
  "calendar-login-required": "Vui lòng đăng nhập tài khoản IE104 để tiếp tục.",
  "calendar-access-denied": "Tài khoản của bạn chưa được cấp quyền đối với đề tài này.",
  "calendar-origin-denied": "Địa chỉ website này chưa được cấu hình cho Google Calendar.",
  "calendar-unconfigured": "Dịch vụ Google Calendar chưa được cấu hình cho dự án.",
  "calendar-invalid-edit": "Kiểm tra tên, nội dung và hạn nộp trước khi lưu.",
  "calendar-stale-edit": "Yêu cầu đã được sửa ở nơi khác. Tải lại trang để lấy bản mới nhất.",
  "calendar-unknown-event": "Không tìm thấy hạn nộp này trong danh mục đồng bộ Google Calendar.",
  "calendar-connect-required": "Cần kết nối lại tài khoản Google Calendar.",
};

export function calendarMessage(error) {
  return messages[error?.code] ?? "Không kết nối được dịch vụ lịch. Vui lòng thử lại.";
}

export async function calendarSession() {
  if (location.protocol === "file:") return null;
  const session = await getWebsiteSession();
  if (session?.user) return session.user;
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

function calendarRequirementId(projectId, requirementId) {
  const topic = requirementTopics.get(projectId);
  if (topic === "thu-vien" && /^requirement-(?:[1-9]|1\d|2[01])$/.test(requirementId)) return `${topic}--${requirementId}`;
  if (topic === "ban-sach" && /^requirement-[23]$/.test(requirementId)) return `${topic}--${requirementId}`;
  return null;
}

export async function loadCalendarRequirement(projectId, requirementId) {
  const id = calendarRequirementId(projectId, requirementId);
  if (!id || (!useRecoveryEmulator && location.origin !== calendarSite)) return null;
  try {
    const user = await calendarSession();
    if (!user) return null;
    const { events } = await calendarRequest(user, "/events");
    const event = events.find(item => item.id === id);
    if (!event) throw Object.assign(new Error(), { code: "calendar-access-denied" });
    return {
      due: event.revision > 0 ? event.due : null,
      async save(deadline) {
        try {
          // Use the existing export key and revision so the worker can update its links.
          const { name, description, revision } = event;
          await calendarRequest(user, "/save", { id, name, description, revision, due: deadline + "+07:00" });
        } catch (error) {
          throw new Error(calendarMessage(error));
        }
      },
    };
  } catch (error) {
    throw new Error(calendarMessage(error));
  }
}
