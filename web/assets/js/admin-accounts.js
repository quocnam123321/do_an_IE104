import { authRequest } from "./auth-api.js";

const dialog = document.querySelector("#admin-account-reset-dialog");
const form = document.querySelector("#admin-account-reset-form");
const submit = form.querySelector('button[type="submit"]');
const actions = form.querySelector(".admin-account-dialog__footer");
const close = dialog.querySelector(".admin-dialog-close");
const name = document.querySelector("#admin-account-reset-name");
const title = document.querySelector("#admin-account-reset-title");
const help = document.querySelector("#admin-account-reset-help");
const demoHelp = document.querySelector("#admin-account-reset-demo-help");
const result = document.querySelector("#admin-account-reset-result");
const code = document.querySelector("#admin-account-reset-code");
const codeLabel = document.querySelector("#admin-account-reset-code-label");
const validity = document.querySelector("#admin-account-reset-validity");
const expires = document.querySelector("#admin-account-reset-expiry");
const feedback = document.querySelector("#admin-account-reset-error");
const statuses = { active: "enabled", pending_approval: "pending", rejected: "rejected" };
let accountId;

function accountView(account) {
  return {
    id: account.id,
    name: account.display_name ?? "",
    code: account.account_code ?? "",
    username: account.username ?? "",
    email: account.email ?? "",
    type: account.role,
    status: account.is_locked ? "locked" : statuses[account.status],
    revision: account.admin_revision,
    profileRevision: account.profile_revision,
    googleLinked: account.google_linked,
    methods: [account.is_demo && "demo", account.can_reset && "password", account.google_linked && "google"].filter(Boolean),
    canManage: account.status === "active" && !account.is_demo,
    canReset: account.status === "active" && !account.is_locked && account.can_reset,
  };
}

export async function loadAccounts() {
  const { accounts } = await authRequest("admin/accounts");
  return accounts.map(accountView);
}

export async function saveAccount(fields, original, password) {
  const { account } = original ? await authRequest(`admin/accounts/${encodeURIComponent(original.id)}`, {
    method: "PATCH",
    body: { ...fields, revision: original.revision, profileRevision: original.profileRevision },
  }) : await authRequest("admin/accounts", { method: "POST", body: { ...fields, password } });
  return accountView(account);
}

export async function setAccountLock(original, locked) {
  const { account } = await authRequest(`admin/accounts/${encodeURIComponent(original.id)}/lock`, {
    method: "PATCH", body: { locked, revision: original.revision },
  });
  return accountView(account);
}

function clearResult() {
  form.reset();
  code.value = "";
  expires.textContent = "";
  expires.removeAttribute("datetime");
  result.hidden = true;
  feedback.textContent = "";
  feedback.hidden = true;
  actions.hidden = false;
  submit.textContent = "Cấp mã";
}

function showCode(value) {
  code.value = value;
  result.hidden = false;
  actions.hidden = true;
  code.focus();
  code.select();
}

export function openResetDialog(account, simulation) {
  clearResult();
  accountId = simulation ? undefined : account.id;
  title.textContent = simulation ? "Mã minh họa" : "Cấp mã đặt lại mật khẩu";
  codeLabel.textContent = simulation ? "Mã minh họa đặt lại mật khẩu" : "Mã đặt lại mật khẩu";
  help.hidden = validity.hidden = simulation;
  demoHelp.hidden = !simulation;
  dialog.setAttribute("aria-describedby", simulation ? demoHelp.id : help.id);
  name.textContent = account.name || account.username || account.email;
  dialog.showModal();
  if (simulation) showCode("IE104-DEMO");
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!accountId || submit.disabled || actions.hidden) return;
  submit.disabled = true;
  submit.textContent = "Đang cấp mã…";
  feedback.hidden = true;
  try {
    const issued = await authRequest(`admin/accounts/${encodeURIComponent(accountId)}/reset-codes`, { method: "POST" });
    expires.dateTime = issued.expiresAt;
    expires.textContent = new Intl.DateTimeFormat(document.documentElement.lang, {
      dateStyle: "short", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh",
    }).format(new Date(issued.expiresAt));
    showCode(issued.code);
  } catch (error) {
    if (error.status === 401) location.replace("../chung/dang-nhap.html");
    feedback.textContent = error.status === 409 ? "Tài khoản này chưa thể đặt lại mật khẩu." :
      "Không thể cấp mã đặt lại mật khẩu. Vui lòng thử lại.";
    feedback.hidden = false;
    submit.textContent = "Cấp mã";
  } finally {
    submit.disabled = false;
    if (!feedback.hidden) submit.focus();
  }
});

close.addEventListener("click", () => {
  if (!submit.disabled) dialog.close();
});
dialog.addEventListener("cancel", (event) => {
  if (submit.disabled) event.preventDefault();
});
dialog.addEventListener("close", () => {
  if (!dialog.open) {
    accountId = undefined;
    clearResult();
  }
});
