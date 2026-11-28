(() => {
  const store = globalThis.IE104ContactRequests;
  const { normalizeSearch, labels } = globalThis.IE104Admin;
  const statuses = {
    new: ["Mới", "info"],
    processing: ["Đang xử lý", "warning"],
    resolved: ["Đã xử lý", "success"],
  };
  const formatDate = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  });
  const byId = (id) => document.getElementById("admin-contact-" + id);
  const search = byId("search");
  const filter = byId("filter");
  const feedback = byId("feedback");
  const table = byId("table");
  const rows = table.querySelector("tbody");
  const template = byId("row");
  const dialog = byId("detail");
  const close = dialog.querySelector(".admin-dialog-close");
  const form = byId("status-form");
  const select = byId("status");
  const save = form.querySelector("button[type='submit']");
  const error = byId("save-error");
  let records;
  let selected;
  let saving = false;
  let refreshNumber = 0;

  function roleLabel(role) {
    return role === "guest" ? "Khách" : labels[role];
  }

  function setBadge(element, status) {
    const [label, color] = statuses[status];
    element.className = `admin-status admin-status--${color}`;
    element.textContent = label;
  }

  function setDate(element, sentAt) {
    const parts = Object.fromEntries(formatDate.formatToParts(new Date(sentAt)).map(({ type, value }) => [type, value]));
    element.dateTime = sentAt;
    element.textContent = `${parts.day}/${parts.month}/${parts.year} · ${parts.hour}:${parts.minute}`;
  }

  function render() {
    if (!records) return;
    const query = normalizeSearch(search.value);
    const matches = records.filter(({ status, subject, name }) =>
      (!filter.value || filter.value === status) &&
      [subject, name].some((value) => normalizeSearch(value).includes(query))
    );
    const focusedId = rows.contains(document.activeElement) ? document.activeElement.dataset.id : "";
    rows.replaceChildren(...matches.map((entry) => {
      const row = template.content.cloneNode(true);
      row.querySelector("th").textContent = entry.subject;
      row.querySelector(".admin-contact-sender").textContent = entry.name;
      row.querySelector(".admin-code").textContent = roleLabel(entry.role);
      setDate(row.querySelector("time"), entry.sentAt);
      setBadge(row.querySelector(".admin-status"), entry.status);
      row.querySelector("button").dataset.id = entry.id;
      row.querySelector("button .visually-hidden").textContent = ` — ${entry.subject}`;
      return row;
    }));
    byId("count").textContent = matches.length;
    byId("total").hidden = false;
    table.hidden = matches.length === 0;
    byId("empty").hidden = matches.length !== 0;
    if (focusedId) focusRow(focusedId);
  }

  function focusRow(id) {
    const trigger = rows.querySelector(`button[data-id="${id}"]`);
    (trigger ?? search).focus();
  }

  async function refresh(message = "") {
    const number = ++refreshNumber;
    try {
      const loaded = await store.list();
      if (number !== refreshNumber) return;
      records = loaded.sort((a, b) => Date.parse(b.sentAt) - Date.parse(a.sentAt) || b.id - a.id);
      render();
      feedback.textContent = message;
      feedback.hidden = !message;
    } catch {
      if (number !== refreshNumber) return;
      feedback.textContent = "Không thể tải lời nhắn. Vui lòng tải lại trang.";
      feedback.hidden = false;
    }
  }

  function openDetail(entry) {
    selected = entry;
    byId("subject").textContent = entry.subject;
    byId("name").textContent = entry.name;
    byId("role").textContent = roleLabel(entry.role);
    byId("email").textContent = entry.email;
    byId("phone").textContent = entry.phone || "Chưa cung cấp";
    byId("message").textContent = entry.message;
    setBadge(byId("badge"), entry.status);
    setDate(byId("date"), entry.sentAt);
    select.value = entry.status;
    save.disabled = true;
    error.hidden = true;

    const gmail = new URL("https://mail.google.com/mail/");
    gmail.search = new URLSearchParams({ view: "cm", fs: "1", to: entry.email, su: `Re: ${entry.subject}` });
    byId("gmail").href = gmail.href;
    dialog.showModal();
  }

  search.addEventListener("input", render);
  filter.addEventListener("change", render);
  rows.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-id]");
    const entry = button && records.find(({ id }) => id === Number(button.dataset.id));
    if (entry) openDetail(entry);
  });
  select.addEventListener("change", () => {
    save.disabled = select.value === selected.status;
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (save.disabled || saving) return;
    const { id, revision } = selected;
    const status = select.value;
    error.hidden = true;
    saving = save.disabled = select.disabled = close.disabled = true;
    try {
      if (await store.saveStatus(id, revision, status)) {
        await refresh("Đã lưu trạng thái.");
        dialog.close();
      } else {
        await refresh();
        error.textContent = "Trạng thái đã thay đổi. Hãy đóng và mở lại lời nhắn.";
        error.hidden = false;
      }
    } catch {
      error.textContent = "Không thể lưu trạng thái. Vui lòng thử lại.";
      error.hidden = false;
    } finally {
      saving = select.disabled = close.disabled = false;
      save.disabled = select.value === selected.status;
    }
  });
  close.addEventListener("click", () => dialog.close());
  dialog.addEventListener("cancel", (event) => {
    if (saving) event.preventDefault();
  });
  dialog.addEventListener("close", () => focusRow(selected.id));
  store.onChange(() => void refresh());
  window.addEventListener("focus", () => void refresh());
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) void refresh();
  });
  void refresh();
})();
