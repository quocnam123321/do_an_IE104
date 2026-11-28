import { authConfig, authRequest, databaseAccount, notifyAccountChange, rememberDatabaseRole } from "./auth-api.js";

const destinations = {
  student: "../sinh-vien/tong-quan-sinh-vien.html",
  lecturer: "../giang-vien/tong-quan-giang-vien.html",
  admin: "../quan-tri/tong-quan-quan-tri.html",
};
const type = document.querySelector("[data-auth-page]")?.dataset.authPage;
const byId = (id) => document.getElementById(id);
let googleScript;

function loadScript(source) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = source;
    script.onload = resolve;
    script.onerror = () => {
      script.remove();
      reject(new Error("Không tải được thành phần đăng nhập. Vui lòng tải lại trang."));
    };
    document.head.append(script);
  });
}

function parentPage(account) {
  return destinations[account.role];
}

function openAccount(account) {
  rememberDatabaseRole(account.role);
  notifyAccountChange();
  const invitation = window.IE104SupervisionLogin?.destinationFor(account.role);
  location.assign(invitation || parentPage(account));
}

function bindForm(form, error, submitForm) {
  const submit = form.querySelector('button[type="submit"]');
  submit.disabled = false;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (submit.disabled) return;
    error.textContent = "";
    submit.disabled = true;
    form.setAttribute("aria-busy", "true");
    try {
      await submitForm(Object.fromEntries(new FormData(form)));
    } catch (failure) {
      error.textContent = failure.message;
    } finally {
      submit.disabled = false;
      form.removeAttribute("aria-busy");
    }
  });
}

function preserveInvitation(link) {
  const id = new URLSearchParams(location.search).get("loi-moi");
  if (id !== null) {
    const target = new URL(link.href);
    target.searchParams.set("loi-moi", id);
    link.href = target;
  }
}

async function showGoogle(config, onCredential, text = "continue_with") {
  const host = byId("database-google-button");
  const error = byId("database-google-error");
  const retry = byId("database-google-retry");
  byId("database-google").hidden = false;
  if (!config.googleClientId) {
    byId("database-google-hint").textContent = "Đăng nhập Google chưa được cấu hình trên máy chủ này.";
    return;
  }

  async function prepare() {
    host.replaceChildren();
    retry.hidden = true;
    googleScript ??= loadScript("https://accounts.google.com/gsi/client").catch((failure) => {
      googleScript = undefined;
      throw failure;
    });
    try {
      const [{ nonce }] = await Promise.all([
        authRequest("google/challenge", { method: "POST" }),
        googleScript,
      ]);
      google.accounts.id.initialize({
        client_id: config.googleClientId,
        nonce,
        callback: async ({ credential }) => {
          error.textContent = "";
          host.replaceChildren();
          try {
            await onCredential(credential);
          } catch (failure) {
            error.textContent = failure.message;
            retry.hidden = false;
          }
        },
      });
      google.accounts.id.renderButton(host, {
        type: "standard", theme: "outline", size: "large", text,
        width: Math.min(host.clientWidth || 240, 320), locale: "vi",
      });
    } catch (failure) {
      error.textContent = failure.message;
      retry.hidden = false;
    }
  }

  retry.addEventListener("click", () => {
    error.textContent = "";
    void prepare();
  });
  await prepare();
}

function bindDemoLogin(config) {
  if (!config.systemDemo) return;
  const demo = byId("database-demo-login");
  demo.querySelector('[data-demo-role="admin"]').hidden = !config.adminDemo;
  const controls = [...demo.querySelectorAll("[data-demo-role]:not([hidden])")];
  const error = byId("database-demo-error");
  demo.hidden = false;

  for (const button of controls) {
    button.addEventListener("click", async () => {
      if (button.disabled) return;
      error.textContent = "";
      demo.setAttribute("aria-busy", "true");
      controls.forEach(control => { control.disabled = true; });
      try {
        const result = await authRequest("demo/login", { method: "POST", body: { role: button.dataset.demoRole } });
        openAccount(result.account);
      } catch (failure) {
        error.textContent = failure.message;
      } finally {
        controls.forEach(control => { control.disabled = false; });
        demo.removeAttribute("aria-busy");
        if (error.textContent) button.focus();
      }
    });
  }
}

function login(config) {
  const form = byId("demo-login-form");
  byId("login-demo").hidden = true;
  bindDemoLogin(config);
  byId("login-google").closest(".login-alternative").hidden = true;
  byId("database-login-links").hidden = false;
  preserveInvitation(byId("database-signup-link"));
  const username = byId("username");
  username.labels[0].textContent = "Tên đăng nhập";
  username.placeholder = "Nhập tên đăng nhập";
  form.setAttribute("aria-describedby", "invitation-login-context login-error");
  bindForm(form, byId("login-error"), async (fields) => {
    const result = await authRequest("login", {
      method: "POST",
      body: { username: fields["tai-khoan"], password: fields["mat-khau"] },
    });
    openAccount(result.account);
  });
  void showGoogle(config, async (credential) => {
    const result = await authRequest("google", { method: "POST", body: { credential } });
    openAccount(result.account);
  }, "signin_with");
}

function signup(config) {
  const form = byId("database-register-form");
  const feedback = byId("database-register-status");
  const links = byId("database-signin-link");
  preserveInvitation(links);
  function showCreated(account) {
    if (!account.username) return openAccount(account);
    form.hidden = true;
    byId("database-google").hidden = true;
    feedback.hidden = false;
    feedback.textContent = "Đã tạo tài khoản. Bạn có thể đăng nhập bằng tên và mật khẩu vừa đặt.";
    links.focus();
  }

  bindForm(form, byId("database-form-error"), async ({ confirmPassword, ...fields }) => {
    if (confirmPassword !== fields.password) {
      form.elements.confirmPassword.focus();
      throw new Error("Mật khẩu xác nhận chưa khớp.");
    }
    const result = await authRequest("register", { method: "POST", body: fields });
    showCreated(result.account);
  });
  void showGoogle(config, async (credential) => {
    const role = form.elements.role;
    if (!role.value) {
      role.focus();
      throw new Error("Hãy chọn vai trò trước khi đăng ký bằng Google.");
    }
    const result = await authRequest("google", { method: "POST", body: { credential, role: role.value } });
    showCreated(result.account);
  }, "signup_with");
}

function reset(config) {
  byId("legacy-recovery").hidden = true;
  const form = byId("database-reset-form");
  const confirmation = form.elements.confirmPassword;
  const formError = byId("database-form-error");
  const simulation = config.systemDemo;
  if (simulation) {
    byId("database-recovery-title").textContent = "Mô phỏng đặt lại mật khẩu";
    byId("database-reset-help").hidden = true;
    byId("database-reset-demo-help").hidden = false;
    form.setAttribute("aria-describedby", "database-reset-demo-help database-form-error");
    for (const field of [form.elements.username, form.elements.code]) {
      field.disabled = true;
      field.closest(".form-field").hidden = true;
    }
    form.autocomplete = "off";
    form.elements.password.autocomplete = "off";
    confirmation.autocomplete = "off";
    form.querySelector('button[type="submit"]').textContent = "Hoàn tất mô phỏng";
  }
  byId("database-recovery").hidden = false;
  for (const field of [form.elements.password, confirmation]) {
    field.addEventListener("input", () => {
      if (confirmation.getAttribute("aria-invalid") !== "true") return;
      confirmation.removeAttribute("aria-invalid");
      formError.textContent = "";
    });
  }
  bindForm(form, formError, async ({ confirmPassword, ...fields }) => {
    if (confirmPassword !== fields.password) {
      confirmation.setAttribute("aria-invalid", "true");
      confirmation.focus();
      throw new Error("Mật khẩu xác nhận chưa khớp.");
    }
    if (!simulation) {
      await authRequest("password/reset", { method: "POST", body: fields });
      notifyAccountChange();
    }
    form.reset();
    form.hidden = true;
    byId(simulation ? "database-reset-demo-status" : "database-reset-status").hidden = false;
    byId("database-reset-back").focus();
  });
}

async function settings(config) {
  const account = await databaseAccount();
  if (!account) {
    location.replace("dang-nhap.html");
    return;
  }
  byId("database-settings-back").href = parentPage(account);
  const status = byId("database-link-status");
  if (account.isDemo) {
    status.textContent = "Tài khoản minh họa được mở từ trang đăng nhập.";
    return;
  }
  if (account.googleLinked || account.role === "admin") {
    status.textContent = account.googleLinked
      ? "Tài khoản này đã liên kết với Google."
      : "Bạn đang đăng nhập bằng tài khoản quản trị viên.";
    return;
  }

  status.textContent = "Liên kết Google để lần sau có thể đăng nhập bằng Google vào cùng tài khoản.";
  await showGoogle(config, async (credential) => {
    await authRequest("google/link", { method: "POST", body: { credential } });
    status.textContent = "Đã liên kết Google với tài khoản hiện tại.";
    byId("database-google").hidden = true;
    byId("database-settings-back").focus();
  });
}

async function init() {
  if (location.protocol === "file:") return;
  const config = await authConfig();
  if (type === "profile") {
    if (config && !(await databaseAccount())?.isDemo) byId("database-profile-link").hidden = false;
    return;
  }
  if (!config) {
    if (type === "login") {
      await Promise.all([
        loadScript(new URL("./demo-login.js", import.meta.url)),
        loadScript(new URL("./google-login.js", import.meta.url)),
      ]);
    } else if (type === "reset") {
      await loadScript(new URL("./recovery-otp.js", import.meta.url));
    } else {
      byId("database-form-error").textContent = "Mở trang này từ địa chỉ website chạy bằng Express.";
    }
    return;
  }

  if (type === "login") login(config);
  if (type === "signup") signup(config);
  if (type === "reset") reset(config);
  if (type === "settings") await settings(config);
}

if (type) init().catch((failure) => {
  const error = byId("database-page-error") ?? byId("database-form-error") ?? byId("login-error");
  if (error) error.textContent = failure.message;
});
