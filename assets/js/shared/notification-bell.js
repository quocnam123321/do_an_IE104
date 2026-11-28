import { roleSessionPrefix, websitePageRole } from "../website-session.js";
import "../pages/admin/sample-data.js";
import "../pages/admin/account-store.js";
import "./academic-notices.js";
import "./system-notices.js";

const directory = globalThis.IE104AdminAccounts;
const system = globalThis.IE104SystemNotices;

const demoNotices = {
  student: [
    { id: "proposal-approved", title: "Hồ sơ đề xuất đã được duyệt", date: "2026-11-28T10:45:00+07:00",
      body: "Giảng viên đã duyệt đề xuất đề tài Hệ thống quản lý phòng tự học của bạn." },
    { id: "report-reminder", title: "Sắp đến hạn nộp báo cáo", date: "2026-11-28T09:50:00+07:00",
      body: "Bạn sắp đến hạn nộp báo cáo tiến độ. Hãy kiểm tra thời hạn trong mục Lịch hạn nộp." },
    { id: "submission-feedback", title: "Giảng viên đã phản hồi bài nộp", date: "2026-11-27T15:30:00+07:00",
      body: "Giảng viên đã gửi nhận xét về bài nộp. Bạn có thể xem nhận xét trong mục Bài nộp của đề tài.", read: true },
  ],
  lecturer: [
    { id: "registration-new", title: "Có hồ sơ đăng ký mới", date: "2026-11-28T10:40:00+07:00",
      body: "Một sinh viên vừa gửi hồ sơ đăng ký đề tài. Hồ sơ có trong mục Yêu cầu chờ duyệt." },
    { id: "progress-submitted", title: "Sinh viên đã nộp báo cáo tiến độ", date: "2026-11-28T08:50:00+07:00",
      body: "Nhóm sinh viên đã nộp báo cáo tiến độ. Bạn có thể đọc báo cáo trong mục Bài nộp của đề tài.", read: true },
    { id: "registration-open", title: "Đã mở đợt đăng ký đề tài", date: "2026-11-27T08:00:00+07:00",
      body: "Đợt đăng ký đề tài đã mở. Sinh viên có thể xem và đăng ký các đề tài còn nhận hồ sơ.", read: true },
  ],
};

function installBell() {
  const preferences = document.querySelector(".site-header .site-preferences");
  const role = websitePageRole();
  if (!preferences || !role) return;
  const readKey = "ie104.notifications.read." + role + ".";
  const sessionKey = roleSessionPrefix + role;
  const selectedAccountKey = "ie104.notifications.viewer." + role;
  const defaultAccountId = globalThis.IE104AdminSampleData.accounts.find(({ type }) => type === role)?.id;
  const getSaved = (key) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  };
  const unsavedReads = new Set();

  preferences.insertAdjacentHTML("beforeend", `
    <button type="button" class="notification-bell" popovertarget="website-notifications" aria-label="Thông báo">
      <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21a2 2 0 0 0 4 0"/>
      </svg>
      <span class="notification-bell__count" aria-hidden="true" hidden></span>
    </button>
    <section id="website-notifications" class="notification-inbox" popover aria-labelledby="website-notifications-title">
      <header class="notification-inbox__header">
        <h2 id="website-notifications-title">Thông báo</h2>
        <button class="notification-inbox__mark" type="button">Đánh dấu tất cả đã đọc</button>
      </header>
      <p class="notification-inbox__sample">Dữ liệu mẫu</p>
      <label class="notification-inbox__account" hidden>
        <span>Tài khoản xem thử</span>
        <select translate="no"></select>
      </label>
      <p class="notification-inbox__empty" role="status" hidden></p>
      <ul class="notification-inbox__list"></ul>
    </section>`);

  document.body.insertAdjacentHTML("beforeend", `
    <dialog class="confirmation-dialog notification-message" aria-labelledby="website-notification-title">
      <button type="button" class="notification-message__close" aria-label="Đóng" autofocus>
        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round">
          <path d="m6 6 12 12M18 6 6 18"/>
        </svg>
      </button>
      <header class="notification-message__header">
        <h2 id="website-notification-title" translate="no"></h2>
        <time class="notification-message__time"></time>
      </header>
      <p class="notification-message__body" translate="no"></p>
    </dialog>`);

  const bell = preferences.querySelector(".notification-bell");
  const count = bell.querySelector(".notification-bell__count");
  const inbox = preferences.querySelector(".notification-inbox");
  const markAll = inbox.querySelector(".notification-inbox__mark");
  const sample = inbox.querySelector(".notification-inbox__sample");
  const empty = inbox.querySelector(".notification-inbox__empty");
  const accountField = inbox.querySelector(".notification-inbox__account");
  const accountSelect = accountField.querySelector("select");
  const list = inbox.querySelector(".notification-inbox__list");
  const message = document.querySelector(".notification-message");
  const close = message.querySelector(".notification-message__close");
  const title = message.querySelector("h2");
  const sentTime = message.querySelector("time");
  const body = message.querySelector(".notification-message__body");
  let usingSamples;
  let accounts = [];
  let account;
  let status = "";
  let messages = [];
  let refreshNumber = 0;

  function savedAccountId() {
    try {
      return sessionStorage.getItem(selectedAccountKey);
    } catch {
      return null;
    }
  }

  function selectAccount(id) {
    account = accounts.find((entry) => entry.id === id) ?? accounts[0];
    accountSelect.value = account?.id ?? "";
    try {
      if (account) sessionStorage.setItem(selectedAccountKey, account.id);
    } catch {
      // The selected account still applies on this page.
    }
    messages = [];
    status = usingSamples && !account ? "Không có tài khoản xem thử khả dụng." : "";
    if (message.open) message.close();
    title.textContent = sentTime.textContent = body.textContent = "";
    sentTime.removeAttribute("datetime");
    render();
    void refreshInbox();
  }

  const formatter = new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  });

  function dateLabel(value) {
    const parts = Object.fromEntries(formatter.formatToParts(new Date(value)).map(({ type, value }) => [type, value]));
    return `${parts.day}/${parts.month}/${parts.year} · ${parts.hour}:${parts.minute}`;
  }

  function listTime(value) {
    const minutes = Math.floor((Date.now() - Date.parse(value)) / 60000);
    if (minutes < 0 || minutes >= 1440) return dateLabel(value);
    const relative = new Intl.RelativeTimeFormat(document.documentElement.lang, { numeric: "auto" });
    return minutes < 60 ? relative.format(-minutes, "minute") : relative.format(-Math.floor(minutes / 60), "hour");
  }

  function sampleReadKey(id) {
    return readKey + (account && account.id !== defaultAccountId ? account.id + "." : "") + id;
  }

  function hasRead(notice) {
    if (notice.system) return notice.read;
    const key = sampleReadKey(notice.id);
    return notice.read || unsavedReads.has(key) || getSaved(key) === "1";
  }

  async function markRead(items) {
    const viewer = account;
    const ids = [];
    for (const notice of items) {
      if (hasRead(notice)) continue;
      if (notice.system) {
        ids.push(notice.id);
        continue;
      }
      const key = sampleReadKey(notice.id);
      try {
        localStorage.setItem(key, "1");
      } catch {
        unsavedReads.add(key);
      }
    }
    render();
    if (viewer && ids.length) {
      try {
        await system.markRead(viewer, ids);
        if (account === viewer) await refreshInbox();
      } catch {
        if (account === viewer) {
          status = "Không thể lưu trạng thái đã đọc. Hãy thử lại.";
          render();
        }
      }
    }
  }

  function render() {
    const notices = usingSamples ? [...messages, ...demoNotices[role]] : [];
    const unread = notices.filter((notice) => !hasRead(notice)).length;
    const focusedId = list.contains(document.activeElement) ? document.activeElement.dataset.noticeId : "";
    count.textContent = String(unread);
    count.hidden = unread === 0;
    markAll.setAttribute("aria-disabled", String(unread === 0));
    markAll.hidden = notices.length === 0;
    empty.hidden = !status && notices.length !== 0;
    empty.textContent = status || "Chưa có thông báo.";
    sample.hidden = !usingSamples;
    bell.setAttribute("aria-label", unread ? `Thông báo (${unread} chưa đọc)` : "Thông báo");
    list.replaceChildren(...notices.map((notice) => {
      const item = document.createElement("li");
      const row = document.createElement("button");
      row.type = "button";
      row.className = "notification-inbox__item";
      row.dataset.noticeId = notice.id;
      const heading = document.createElement("strong");
      heading.textContent = notice.title;
      if (notice.system) heading.translate = false;
      const date = document.createElement("time");
      date.dateTime = notice.date;
      date.textContent = listTime(notice.date);
      row.append(heading, date);
      if (!hasRead(notice)) {
        row.dataset.unread = "";
        const state = document.createElement("span");
        state.className = "visually-hidden";
        state.textContent = "Chưa đọc";
        row.append(state);
      }
      row.addEventListener("click", () => {
        inbox.hidePopover();
        void markRead([notice]);
        title.translate = body.translate = !notice.system;
        title.textContent = notice.title;
        sentTime.dateTime = notice.date;
        sentTime.textContent = dateLabel(notice.date);
        body.textContent = notice.body;
        message.showModal();
      });
      item.append(row);
      return item;
    }));
    if (focusedId) {
      const row = [...list.querySelectorAll("button")].find((button) => button.dataset.noticeId === focusedId);
      if (row && inbox.matches(":popover-open")) row.focus({ preventScroll: true });
    }
  }

  function refreshAccounts() {
    const session = getSaved(sessionKey);
    usingSamples = session === null || session === "demo";
    const snapshot = usingSamples ? directory.snapshot() : null;
    accounts = snapshot && !snapshot.unavailable
      ? snapshot.accounts.filter(({ type, status }) => type === role && status === "enabled") : [];
    accountField.hidden = accounts.length === 0;
    accountSelect.replaceChildren(...accounts.map(({ id, name, code }) => new Option(`${name} · ${code}`, id)));
    selectAccount(savedAccountId());
  }

  async function refreshInbox() {
    const number = ++refreshNumber;
    if (!account) return;
    let incoming;
    try {
      incoming = await system.readInbox(account);
    } catch {
      if (number !== refreshNumber) return;
      status = "Không thể tải thông báo đã gửi. Hãy mở lại để thử lại.";
      render();
      return;
    }
    if (number !== refreshNumber) return;
    messages = incoming;
    status = "";
    render();
  }

  function placeInbox() {
    const anchor = bell.getBoundingClientRect();
    const root = document.documentElement;
    const gutter = 12;
    inbox.style.top = `${Math.max(gutter, anchor.bottom + 8)}px`;
    inbox.style.setProperty("--notification-inbox-right", `${root.clientWidth - anchor.right}px`);
    inbox.style.maxHeight = `${Math.max(0, root.clientHeight - anchor.bottom - 8 - gutter)}px`;
  }

  inbox.addEventListener("beforetoggle", (event) => {
    if (event.newState === "open") {
      placeInbox();
      void refreshInbox();
    }
  });
  window.addEventListener("resize", () => {
    if (inbox.matches(":popover-open")) placeInbox();
  });
  window.addEventListener("scroll", () => {
    if (!inbox.matches(":popover-open")) return;
    if (bell.getBoundingClientRect().bottom < 0) inbox.hidePopover();
    else placeInbox();
  }, { passive: true });
  accountSelect.addEventListener("change", () => selectAccount(accountSelect.value));
  markAll.addEventListener("click", () => {
    if (markAll.getAttribute("aria-disabled") === "false") void markRead([...messages, ...demoNotices[role]]);
  });
  close.addEventListener("click", () => message.close());
  message.addEventListener("close", () => bell.focus());
  document.addEventListener("ie104:languagechange", render);
  window.addEventListener("storage", (event) => {
    if (event.storageArea !== localStorage) return;
    if (event.key === null || event.key === sessionKey || event.key === directory.storageKey) refreshAccounts();
    else if (event.key.startsWith(readKey)) render();
  });
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) refreshAccounts();
  });
  system.onChange(refreshInbox);
  refreshAccounts();
}

document.addEventListener("DOMContentLoaded", installBell, { once: true });
