import { authRequest, notifyAccountChange } from "./auth-api.js";

const list = document.getElementById("admin-accounts");
const error = document.getElementById("admin-error");
const status = document.getElementById("admin-status");
const codePanel = document.getElementById("reset-code-panel");
const codeField = document.getElementById("reset-code");
const filter = document.getElementById("admin-filter");
const refresh = document.getElementById("admin-refresh");
const labels = { student: "Sinh viên", lecturer: "Giảng viên" };
const states = { active: "Đang hoạt động", pending_approval: "Chờ duyệt", rejected: "Đã từ chối" };
const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh",
});
let accounts = [];
let busy = false;

function button(text, handler) {
  const control = document.createElement("button");
  control.type = "button";
  control.textContent = text;
  control.addEventListener("click", handler);
  return control;
}

function label(account) {
  return account.display_name || account.username || account.email;
}

async function manage(control, work) {
  if (busy) return;
  busy = true;
  control.disabled = true;
  error.textContent = "";
  try {
    await work();
  } catch (failure) {
    error.textContent = failure.message;
    if (failure.status === 401) location.replace("../chung/dang-nhap.html");
  } finally {
    control.disabled = false;
    busy = false;
  }
}

async function issueCode(account, control) {
  await manage(control, async () => {
    const result = await authRequest("admin/accounts/" + account.id + "/reset-codes", { method: "POST" });
    codeField.value = result.code;
    document.getElementById("reset-code-help").textContent =
      "Mã cho " + label(account) + " có hiệu lực đến " + dateFormatter.format(new Date(result.expiresAt))
      + ". Chỉ cung cấp mã sau khi xác minh danh tính người yêu cầu.";
    codePanel.hidden = false;
    codeField.focus();
    codeField.select();
  });
}

function render() {
  list.replaceChildren();
  const visible = filter.value === "all" ? accounts : accounts.filter((account) => account.role === filter.value);
  if (!visible.length) status.textContent = "Không có tài khoản trong danh sách này.";
  for (const account of visible) {
    const row = document.createElement("li");
    row.className = "account-admin__row";
    const details = document.createElement("div");
    const name = document.createElement("strong");
    name.textContent = label(account);
    const meta = document.createElement("p");
    meta.textContent = labels[account.role] + " · " + states[account.status]
      + " · " + dateFormatter.format(new Date(account.created_at));
    details.append(name, meta);
    row.append(details);
    const actions = document.createElement("div");
    actions.className = "account-admin__actions";
    if (account.status === "active" && account.can_reset) {
      actions.append(button("Cấp mã đặt lại", (event) => issueCode(account, event.currentTarget)));
    }
    row.append(actions);
    list.append(row);
  }
}

async function load() {
  status.textContent = "Đang tải tài khoản…";
  ({ accounts } = await authRequest("admin/accounts"));
  status.textContent = "";
  render();
}

filter.addEventListener("change", () => {
  status.textContent = "";
  render();
});
refresh.addEventListener("click", () => manage(refresh, load));
document.getElementById("admin-logout").addEventListener("click", (event) => manage(event.currentTarget, async () => {
  await authRequest("logout", { method: "POST" });
  notifyAccountChange();
  location.replace("../chung/dang-nhap.html");
}));
document.getElementById("reset-code-close").addEventListener("click", () => {
  codePanel.hidden = true;
  codeField.value = "";
  filter.focus();
});
void manage(refresh, load);
