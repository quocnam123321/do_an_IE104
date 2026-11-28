import { getWebsiteSession, hasStoredWebsiteSession, roleSessionPrefix } from "../website-session.js";
import "./logout.js?v=20261125-direct-logout";

const login = document.querySelector(".site-header__inner > .site-header__login");
const guestAction = document.querySelector("[data-public-login]");
const overviewAction = document.querySelector("[data-public-overview]");
const pages = new URL("../../../pages/", import.meta.url);
const roles = {
  student: {
    label: "Tài khoản sinh viên",
    avatar: "SV",
    overview: "sinh-vien/tong-quan-sinh-vien.html",
    profile: "sinh-vien/ho-so-ca-nhan.html",
  },
  lecturer: {
    label: "Tài khoản giảng viên",
    avatar: "GV",
    overview: "giang-vien/tong-quan-giang-vien.html",
    profile: "giang-vien/ho-so-ca-nhan-giang-vien.html",
  },
  admin: {
    label: "Tài khoản quản trị",
    avatar: "QT",
    overview: "quan-tri/tai-khoan.html",
  },
};

function createAccountMenu() {
  const account = document.createElement("div");
  account.className = "account-menu account-menu--public";
  account.innerHTML = `
    <details class="account-menu__disclosure">
      <summary class="account-menu__toggle">
        <span class="account-menu__avatar" aria-hidden="true"></span>
        <span class="account-menu__label"></span>
      </summary>
      <div class="account-menu__panel">
        <ul class="account-menu__list">
          <li><a class="account-menu__profile" data-account-overview>Tổng quan</a></li>
          <li><a class="account-menu__profile" data-account-profile>Hồ sơ cá nhân</a></li>
          <li data-account-settings hidden><a class="account-menu__profile" href="${new URL("chung/tai-khoan.html", pages)}">Liên kết tài khoản</a></li>
          <li><button type="button" class="account-menu__logout" aria-controls="logout-dialog" aria-haspopup="dialog" disabled>Đăng xuất</button></li>
        </ul>
      </div>
    </details>`;

  const dialog = document.createElement("dialog");
  dialog.className = "confirmation-dialog public-logout-dialog";
  dialog.id = "logout-dialog";
  dialog.setAttribute("aria-labelledby", "logout-title");
  dialog.innerHTML = `
    <h2 id="logout-title">Xác nhận đăng xuất</h2>
    <p>Bạn muốn đăng xuất khỏi tài khoản hiện tại?</p>
    <div class="public-logout-dialog__actions">
      <button type="button" data-logout-cancel autofocus>Hủy</button>
      <button type="button" class="button--primary" data-logout-confirm>Xác nhận đăng xuất</button>
    </div>
    <p data-logout-status role="status"></p>`;

  login.after(account);
  login.closest("header").after(dialog);
  window.IE104BindLogout(dialog, account.querySelectorAll(".account-menu__logout"), new URL("chung/dang-nhap.html", pages));
  return account;
}

if (login) {
  let account;
  let currentRole;
  let refreshNumber = 0;

  async function refreshAccount() {
    const requestNumber = ++refreshNumber;
    const focusedAction = document.activeElement;
    let session;
    try {
      if (!account && hasStoredWebsiteSession()) {
        login.hidden = true;
        if (guestAction) guestAction.hidden = true;
      }
      session = await getWebsiteSession();
    } catch {
      // Điều hướng công khai vẫn dùng được khi không tải được phiên.
    }
    if (requestNumber !== refreshNumber) return;

    const role = roles[session?.role];
    if (guestAction && overviewAction) {
      if (role) overviewAction.href = new URL(role.overview, pages);
      const previousAction = role ? guestAction : overviewAction;
      const nextAction = role ? overviewAction : guestAction;
      const restoreFocus = document.activeElement === previousAction
        || (focusedAction === guestAction && document.activeElement === document.body);
      previousAction.hidden = true;
      nextAction.hidden = false;
      if (restoreFocus) nextAction.focus();
    }

    if (role) {
      account ??= createAccountMenu();
      if (currentRole !== role) {
        account.querySelector(".account-menu__avatar").textContent = role.avatar;
        account.querySelector(".account-menu__label").textContent = role.label;
        account.querySelector("[data-account-overview]").href = new URL(role.overview, pages);
        const profile = account.querySelector("[data-account-profile]");
        profile.parentElement.hidden = !role.profile;
        if (role.profile) profile.href = new URL(role.profile, pages);
        currentRole = role;
      }
      account.querySelector("[data-account-settings]").hidden = session.mode !== "database" || session.role === "admin" || session.account?.isDemo;
      account.hidden = false;
      const restoreFocus = document.activeElement === login
        || (focusedAction === login && document.activeElement === document.body);
      login.hidden = true;
      if (restoreFocus) account.querySelector("summary").focus();
    } else {
      login.hidden = false;
      if (account) {
        const dialog = document.getElementById("logout-dialog");
        const restoreFocus = account.contains(document.activeElement) || dialog?.open;
        if (dialog?.open) dialog.close();
        account.querySelector("details").open = false;
        account.hidden = true;
        if (restoreFocus) login.focus();
      } else if (focusedAction === login && document.activeElement === document.body) {
        login.focus();
      }
    }
  }

  void refreshAccount();
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) void refreshAccount();
  });
  window.addEventListener("storage", (event) => {
    if (event.storageArea === localStorage && (event.key === null || event.key.startsWith(roleSessionPrefix))) {
      void refreshAccount();
    }
  });
}
