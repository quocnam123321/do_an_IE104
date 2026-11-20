import { getFirebaseAuth } from "../../firebase-client.js?v=20261119-otp";
import { addCalendarEvents, calendarMessage, calendarRequest } from "../../calendar-client.js";

const dialog = document.getElementById("calendar-export");
const trigger = document.querySelector(".deadline-calendar__google");
const calendarMonth = document.getElementById("deadline-month");
const monthTitle = dialog.querySelector(".calendar-export__month");
const search = document.getElementById("calendar-export-search");
const selectAll = document.getElementById("calendar-export-select-all");
const list = document.getElementById("calendar-export-events");
const rowTemplate = document.getElementById("calendar-export-row");
const empty = dialog.querySelector(".calendar-export__empty");
const count = dialog.querySelector(".calendar-export__count");
const feedback = dialog.querySelector(".calendar-export__feedback");
const add = dialog.querySelector(".calendar-export__add");
const login = dialog.querySelector(".calendar-export__login");
const closeButtons = dialog.querySelectorAll("[data-calendar-export-close]");
const storageKey = "ie104-calendar-selection";
const topicNames = {
  "thu-vien": "Website quản lý thư viện",
  "ban-sach": "Website bán sách trực tuyến",
  "he-thong-thu-vien": "Hệ thống quản lý thư viện",
  "cau-lac-bo": "Website quản lý câu lạc bộ sinh viên",
};

let month;
let client;
let user;
let busy = false;
let loaded = false;
let rows = [];
let matches = [];

function normalize(value) {
  return value.toLocaleLowerCase("vi").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").trim();
}

function isUitStudent(account) {
  return account?.emailVerified === true && /^[^@\s]+@gm\.uit\.edu\.vn$/i.test(account.email ?? "");
}

function selectedIds() {
  return rows.filter(({ input }) => input.checked).map(({ id }) => id);
}

function updateControls() {
  const selected = selectedIds().length;
  const visibleSelected = matches.filter(({ input }) => input.checked).length;
  search.disabled = busy || !loaded;
  selectAll.disabled = busy || !matches.length;
  selectAll.checked = matches.length > 0 && visibleSelected === matches.length;
  selectAll.indeterminate = visibleSelected > 0 && !selectAll.checked;
  login.disabled = busy;
  add.disabled = busy || !selected;
  count.textContent = `Đã chọn ${selected} mốc`;
  for (const { input } of rows) input.disabled = busy;
}

function filterRows() {
  const terms = normalize(search.value).split(/\s+/).filter(Boolean);
  matches = rows.filter((row) => {
    row.element.hidden = !terms.every((term) => row.terms.includes(term));
    return !row.element.hidden;
  });
  list.hidden = matches.length === 0;
  empty.hidden = !loaded || !list.hidden;
  empty.textContent = rows.length ? "Không tìm thấy mốc phù hợp." : "Không có mốc nào trong tháng này.";
  updateControls();
}

function createRow(event, selected) {
  const element = rowTemplate.content.firstElementChild.cloneNode(true);
  const input = element.querySelector("input");
  const time = element.querySelector("time");
  const kind = element.querySelector(".calendar-export__kind");
  const isTopic = event.id.endsWith("--deadline");
  const [year, number, day] = event.due.slice(0, 10).split("-");
  element.querySelector("strong").textContent = event.name;
  time.dateTime = event.due;
  time.textContent = `${event.due.slice(11, 16)} · ${day}/${number}/${year}`;
  kind.textContent = isTopic ? "Hạn đề tài" : "Bài nộp";
  kind.classList.toggle("calendar-export__kind--topic", isTopic);
  input.checked = selected.includes(event.id);
  return { element, input, id: event.id, terms: normalize(`${event.name} ${topicNames[event.topic] ?? ""}`) };
}

function setBusy(value) {
  busy = value;
  updateControls();
}

async function loadEvents(selected = []) {
  feedback.textContent = "Đang tải các mốc đã được cấp quyền…";
  const { events } = await calendarRequest(user, "/events");
  rows = events.filter(({ due }) => due.startsWith(`${month}-`))
    .sort((first, second) => first.due.localeCompare(second.due))
    .map((event) => createRow(event, selected));
  list.replaceChildren(...rows.map(({ element }) => element));
  loaded = true;
  feedback.textContent = events.length ? "" : "Tài khoản chưa có đề tài được phép đồng bộ.";
  filterRows();
}

async function loadPicker(selected) {
  setBusy(true);
  feedback.textContent = "Đang kiểm tra phiên đăng nhập…";
  try {
    if (location.protocol === "file:") {
      feedback.textContent = calendarMessage({ code: "calendar-file" });
      return;
    }
    client = await getFirebaseAuth();
    await client.auth.authStateReady();
    user = client.auth.currentUser;
    login.hidden = isUitStudent(user);
    if (login.hidden) await loadEvents(selected);
    else feedback.textContent = "Đăng nhập bằng email sinh viên @gm.uit.edu.vn để chọn mốc.";
  } catch (error) {
    feedback.textContent = calendarMessage(error);
  } finally {
    setBusy(false);
  }
}

async function signIn() {
  setBusy(true);
  feedback.textContent = "Đang chờ đăng nhập Google…";
  try {
    const provider = new client.sdk.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    const result = await client.sdk.signInWithPopup(client.auth, provider);
    user = result.user;
    if (!isUitStudent(user)) {
      feedback.textContent = "Hãy chọn email sinh viên @gm.uit.edu.vn đã xác minh.";
      return;
    }
    login.hidden = true;
    await loadEvents();
  } catch (error) {
    feedback.textContent = calendarMessage(error);
  } finally {
    setBusy(false);
  }
}

function openPicker(selected = []) {
  month = calendarMonth.value;
  const [year, number] = month.split("-");
  monthTitle.textContent = number ? `Tháng ${Number(number)}/${year}` : "";
  loaded = false;
  login.hidden = true;
  rows = [];
  matches = [];
  list.replaceChildren();
  search.value = "";
  filterRows();
  dialog.showModal();
  return loadPicker(selected);
}

async function submit(allowConnect = true) {
  const ids = selectedIds();
  if (busy || !ids.length) return;
  setBusy(true);
  feedback.textContent = "Đang thêm mốc vào Google Calendar…";
  try {
    const { results } = await addCalendarEvents(user, ids);
    const labels = { added: "Đã thêm", existing: "Đã có", updated: "Đã cập nhật", failed: "Cần thử lại" };
    feedback.textContent = Object.entries(labels).map(([key, label]) => {
      const total = results.filter(({ status }) => status === key).length;
      return total ? `${label} ${total} mốc` : "";
    }).filter(Boolean).join(" · ");
  } catch (error) {
    try {
      if (!allowConnect || error.code !== "calendar-connect-required") throw error;
      const { url } = await calendarRequest(user, "/connect");
      const destination = new URL(url);
      if (destination.origin !== "https://accounts.google.com") throw new Error("Invalid OAuth origin");
      sessionStorage.setItem(storageKey, JSON.stringify({ ids, month, uid: user.uid }));
      location.assign(destination.href);
    } catch (failure) {
      feedback.textContent = calendarMessage(failure);
    }
  } finally {
    setBusy(false);
  }
}

async function resumeConnection() {
  const url = new URL(location.href);
  const result = url.searchParams.get("calendar");
  if (!result) return;
  url.searchParams.delete("calendar");
  history.replaceState(history.state, "", url);
  let pending;
  try {
    pending = JSON.parse(sessionStorage.getItem(storageKey));
    sessionStorage.removeItem(storageKey);
  } catch {
    return;
  }
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(pending?.month) || !Array.isArray(pending.ids)) return;
  calendarMonth.value = pending.month;
  calendarMonth.dispatchEvent(new Event("change"));
  await openPicker(pending.ids);
  if (result === "connected" && isUitStudent(user) && user.uid === pending.uid) {
    if (selectedIds().length) await submit(false);
    else if (loaded) feedback.textContent = "Đã kết nối Google Calendar. Hãy chọn mốc muốn thêm.";
  } else if (loaded) {
    feedback.textContent = result === "account-mismatch"
      ? "Hãy dùng cùng email sinh viên khi cấp quyền Google Calendar."
      : "Chưa kết nối được Google Calendar. Bấm Thêm lịch để thử lại.";
  }
}

trigger.addEventListener("click", () => {
  if (!busy) void openPicker();
});
search.addEventListener("input", filterRows);
selectAll.addEventListener("change", () => {
  for (const { input } of matches) input.checked = selectAll.checked;
  updateControls();
});
list.addEventListener("change", updateControls);
login.addEventListener("click", signIn);
add.addEventListener("click", () => submit());
for (const button of closeButtons) button.addEventListener("click", () => dialog.close());
dialog.addEventListener("close", () => trigger.focus({ preventScroll: true }));
trigger.disabled = false;
void resumeConnection();
