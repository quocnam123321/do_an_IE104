import { roleSessionPrefix, websitePageRole } from "../website-session.js";

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
      <p class="notification-inbox__empty" hidden>Chưa có thông báo.</p>
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
        <h2 id="website-notification-title"></h2>
        <time class="notification-message__time"></time>
      </header>
      <p class="notification-message__body"></p>
    </dialog>`);

  const bell = preferences.querySelector(".notification-bell");
  const count = bell.querySelector(".notification-bell__count");
  const inbox = preferences.querySelector(".notification-inbox");
  const markAll = inbox.querySelector(".notification-inbox__mark");
  const sample = inbox.querySelector(".notification-inbox__sample");
  const empty = inbox.querySelector(".notification-inbox__empty");
  const list = inbox.querySelector(".notification-inbox__list");
  const message = document.querySelector(".notification-message");
  const close = message.querySelector(".notification-message__close");
  const title = message.querySelector("h2");
  const sentTime = message.querySelector("time");
  const body = message.querySelector(".notification-message__body");
  let notices = [];

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

  function hasRead(notice) {
    return notice.read || unsavedReads.has(notice.id) || getSaved(readKey + notice.id) === "1";
  }

  function markRead(items) {
    for (const { id } of items) {
      try {
        localStorage.setItem(readKey + id, "1");
      } catch {
        unsavedReads.add(id);
      }
    }
    render();
  }

  function render() {
    const unread = notices.filter((notice) => !hasRead(notice)).length;
    count.textContent = String(unread);
    count.hidden = unread === 0;
    markAll.setAttribute("aria-disabled", String(unread === 0));
    markAll.hidden = notices.length === 0;
    empty.hidden = notices.length !== 0;
    sample.hidden = notices.length === 0;
    bell.setAttribute("aria-label", unread ? `Thông báo (${unread} chưa đọc)` : "Thông báo");
    list.replaceChildren(...notices.map((notice) => {
      const item = document.createElement("li");
      const row = document.createElement("button");
      row.type = "button";
      row.className = "notification-inbox__item";
      const heading = document.createElement("strong");
      heading.textContent = notice.title;
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
        markRead([notice]);
        title.textContent = notice.title;
        sentTime.dateTime = notice.date;
        sentTime.textContent = dateLabel(notice.date);
        body.textContent = notice.body;
        message.showModal();
      });
      item.append(row);
      return item;
    }));
  }

  function refreshInbox() {
    const session = getSaved(sessionKey);
    notices = session === null || session === "demo" ? demoNotices[role] : [];
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
    if (event.newState === "open") placeInbox();
  });
  window.addEventListener("resize", () => {
    if (inbox.matches(":popover-open")) placeInbox();
  });
  window.addEventListener("scroll", () => {
    if (!inbox.matches(":popover-open")) return;
    if (bell.getBoundingClientRect().bottom < 0) inbox.hidePopover();
    else placeInbox();
  }, { passive: true });
  markAll.addEventListener("click", () => {
    if (markAll.getAttribute("aria-disabled") === "false") markRead(notices);
  });
  close.addEventListener("click", () => message.close());
  message.addEventListener("close", () => bell.focus());
  document.addEventListener("ie104:languagechange", render);
  window.addEventListener("storage", (event) => {
    if (event.storageArea !== localStorage) return;
    if (event.key === null || event.key === sessionKey) refreshInbox();
    else if (event.key.startsWith(readKey)) render();
  });
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) refreshInbox();
  });
  refreshInbox();
}

document.addEventListener("DOMContentLoaded", installBell, { once: true });
