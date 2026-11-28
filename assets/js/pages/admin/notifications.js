(() => {
  const { badge, displayDateTime, escapeHtml, labels, normalizeSearch, params, view } = globalThis.IE104Admin;
  const store = globalThis.IE104AdminNotices;
  const { setup } = globalThis.IE104NoticeContent;
  const { renderArticle, articleImage } = globalThis.IE104NoticeArticle;
  const byId = (id) => document.getElementById(id);
  const system = params.get("tab") === "he-thong";
  const events = {
    registration: "Đăng ký đề tài", decision: "Kết quả xét duyệt",
    reminder: "Nhắc hạn nộp", submission: "Bài nộp mới", manual: "Gửi thủ công",
  };
  const roles = { student: "Sinh viên", lecturer: "Giảng viên", both: "Sinh viên và giảng viên" };
  const allByRole = { student: "Tất cả sinh viên", lecturer: "Tất cả giảng viên", both: "Tất cả sinh viên và giảng viên" };
  const states = { draft: "Bản nháp", published: "Đã đăng", withdrawn: "Đã gỡ" };
  const heading = system ? "Lịch sử thông báo hệ thống" : "Danh sách thông báo";
  const create = byId("admin-notice-create");
  const search = byId("admin-search");
  const type = byId("admin-notice-type");
  const state = byId("admin-notice-state");
  const count = byId("admin-notice-count");
  const results = byId("admin-results");
  const feedback = byId("admin-notice-feedback");
  const editor = byId("admin-notice-editor");
  const form = byId("admin-notice-form");
  const fields = form.elements;
  const submit = byId("admin-notice-save");
  const previewDraft = byId("admin-notice-preview");
  const editorError = byId("admin-notice-editor-error");
  const attachment = byId("admin-notice-existing-file");
  const picker = byId("admin-notice-picker");
  const pickerToggle = picker.querySelector(".admin-notice-picker-toggle");
  const pickerResults = byId("admin-notice-picker-results");
  const selectedChips = byId("admin-notice-selected");
  const audienceSummary = byId("admin-notice-audience-summary");
  const detail = byId("admin-notice-detail");
  const detailBody = byId("admin-notice-detail-body");
  const detailError = byId("admin-notice-detail-error");
  const backToEditor = byId("admin-notice-edit-back");
  const confirm = byId("admin-notice-confirm");
  const composer = setup(byId("admin-notice-content"), form.querySelector(".admin-notice-tools"), editorMessage);
  const detailUrls = new Set();
  const selected = new Set();
  let records = [];
  let editing;
  let retainedFile;
  let action;
  let ready = false;

  function message(target, text) {
    target.textContent = text;
    target.hidden = !text;
  }

  function localText(text) {
    return `<span translate="no">${escapeHtml(text)}</span>`;
  }

  function dateCell(value) {
    return `<time datetime="${escapeHtml(value)}+07:00">${escapeHtml(displayDateTime(value))}</time>`;
  }

  function roleOf(item) {
    if (item.scope === "all") return item.audience;
    const [role, other] = new Set(item.recipients.map(({ type }) => type));
    return other ? "both" : role ?? item.audience;
  }

  function recipientsCell(item) {
    if (item.scope === "all") return allByRole[item.audience];
    return item.recipients.map(({ name }) => localText(name)).join(", ");
  }

  function academicActions(item) {
    const button = (operation, label, style = "") =>
      `<button type="button" class="admin-button ${style}" data-notice-action="${operation}" data-notice-id="${item.id}">
        <span>${label}</span><span class="visually-hidden" translate="no"> ${escapeHtml(item.name)}</span></button>`;
    const preview = button("preview", "Xem trước");
    if (item.status === "draft") {
      return preview + button("edit", "Chỉnh sửa") + button("published", "Đăng", "admin-button--primary");
    }
    return preview + (item.status === "published" ? button("withdrawn", "Gỡ", "admin-notice-danger") : "");
  }

  function render() {
    if (!ready) return;
    const query = normalizeSearch(search.value);
    const matches = records.filter((item) => {
      if (item.kind !== (system ? "system" : "academic") || (type.value && type.value !== item.type)) return false;
      const values = [item.id, item.name];
      if (system) {
        const audience = roleOf(item);
        if (state.value && state.value !== audience && audience !== "both") return false;
        values.push(...item.recipients.flatMap(({ name, code }) => [name, code ?? ""]));
        if (item.scope === "all") values.push(allByRole[item.audience]);
      } else if (state.value && state.value !== item.status) {
        return false;
      }
      return values.some((value) => normalizeSearch(value).includes(query));
    }).sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id, undefined, { numeric: true }));

    count.textContent = matches.length;
    if (!matches.length) {
      results.innerHTML = '<p class="admin-empty">Không có kết quả phù hợp. Hãy đổi từ khóa hoặc bộ lọc.</p>';
      return;
    }
    const headers = system ? ["Thông báo", "Sự kiện", "Đối tượng", "Người nhận", "Thời điểm gửi"] :
      ["Tiêu đề", "Chuyên mục", "Cập nhật", "Trạng thái", "Thao tác"];
    results.innerHTML = `<div class="admin-table-scroll" tabindex="0" role="region" aria-label="${heading}">
      <table class="admin-table admin-notice-table${system ? " admin-notice-table--system" : ""}">
        <caption class="visually-hidden">${heading}</caption>
        <thead><tr>${headers.map((label) => `<th scope="col">${label}</th>`).join("")}</tr></thead>
        <tbody>${matches.map((item) => `<tr>
          <th scope="row"><span class="admin-notice-record">${localText(item.name)}
            <span class="admin-code" translate="no">${escapeHtml(item.id)}</span></span></th>
          ${system ? `<td>${events[item.type]}</td><td>${roles[roleOf(item)]}</td>
            <td>${recipientsCell(item)}</td><td>${dateCell(item.date)}</td>` :
            `<td>${labels[item.type]}</td><td>${dateCell(item.date)}</td>
            <td>${badge(states[item.status], item.status)}</td>
            <td><div class="admin-notice-actions">${academicActions(item)}</div></td>`}
        </tr>`).join("")}</tbody>
      </table>
    </div>`;
  }

  async function refresh(notice = "") {
    const snapshot = await store.snapshot();
    records = snapshot.records;
    ready = true;
    create.disabled = Boolean(snapshot.unavailable);
    message(feedback, snapshot.unavailable ?
      "Không thể đọc thông báo đã lưu. Đang hiển thị dữ liệu mẫu." : notice);
    render();
  }

  function fillSelect(select, all, options) {
    select.replaceChildren(new Option(all, ""), ...Object.entries(options).map(([value, label]) => new Option(label, value)));
  }

  function editorMessage(text, control) {
    const invalid = form.querySelector('[aria-invalid="true"]');
    invalid?.removeAttribute("aria-errormessage");
    invalid?.removeAttribute("aria-invalid");
    message(editorError, text);
    if (control && !control.closest("[hidden]")) {
      control.setAttribute("aria-invalid", "true");
      control.setAttribute("aria-errormessage", editorError.id);
      control.focus();
    }
  }

  function showPicker(open) {
    pickerResults.hidden = !open;
    pickerToggle.setAttribute("aria-expanded", String(open));
  }

  function recipientLabel(account) {
    return `${account.name} · ${account.code}`;
  }

  function renderPicker() {
    const audience = fields.audience.value;
    const all = fields.scope.value === "all";
    picker.hidden = all;
    message(audienceSummary, all ? allByRole[audience] : "");
    fields.recipientSearch.placeholder = {
      student: "Tìm sinh viên theo tên hoặc MSSV",
      lecturer: "Tìm giảng viên theo tên hoặc mã",
      both: "Tìm theo tên, MSSV hoặc mã giảng viên",
    }[audience];
    const { recipients, unavailable } = store.eligibleRecipients(audience);
    const available = new Set(recipients.map(({ id }) => id));
    for (const id of selected) if (!available.has(id)) selected.delete(id);

    const query = normalizeSearch(fields.recipientSearch.value);
    const visible = recipients.filter((account) =>
      !selected.has(account.id) && normalizeSearch(recipientLabel(account)).includes(query)
    );
    pickerResults.innerHTML = visible.length && !unavailable ? visible.map((account) =>
      `<button type="button" data-recipient-id="${escapeHtml(account.id)}">${localText(recipientLabel(account))}</button>`
    ).join("") : `<p>${unavailable ? "Không thể đọc danh sách tài khoản. Hãy thử lại." : "Không tìm thấy người nhận phù hợp."}</p>`;
    selectedChips.innerHTML = recipients.filter(({ id }) => selected.has(id)).map((account) =>
      `<li><button type="button" data-remove-recipient="${escapeHtml(account.id)}">
        ${localText(recipientLabel(account))} <span aria-hidden="true">×</span>
        <span class="visually-hidden">Bỏ chọn</span></button></li>`
    ).join("");
  }

  function renderAttachment() {
    attachment.hidden = !retainedFile || Boolean(fields.attachment.files.length);
    attachment.innerHTML = retainedFile ?
      `<button type="button">${localText(retainedFile.name)} <span aria-hidden="true">×</span><span class="visually-hidden">Bỏ tệp đính kèm</span></button>` : "";
  }

  function openEditor(item) {
    form.reset();
    selected.clear();
    editing = item;
    retainedFile = item?.attachment;
    editorMessage("");
    byId("admin-notice-editor-title").textContent = system ? "Tạo thông báo" : item ? "Chỉnh sửa thông báo" : "Soạn thông báo";
    byId("admin-notice-academic-fields").hidden = system;
    byId("admin-notice-system-fields").hidden = !system;
    fields.title.value = item?.name ?? "";
    fields.body.value = item?.body ?? "";
    fields.category.value = item?.type ?? "";
    showPicker(false);
    if (system) renderPicker();
    else {
      composer.reset(item);
      renderAttachment();
    }
    editor.showModal();
  }

  function openDetail(item, operation, draft) {
    action = { item, operation, draft };
    message(detailError, "");
    const preview = operation === "preview";
    const publish = operation === "published";
    byId("admin-notice-detail-title").textContent = preview ? "Xem trước thông báo" : publish ? "Đăng thông báo?" : "Gỡ thông báo?";
    byId("admin-notice-confirm-footer").hidden = preview && !draft;
    backToEditor.hidden = !draft;
    confirm.textContent = draft ? "Đăng thông báo" : publish ? "Xác nhận đăng" : "Xác nhận gỡ";
    confirm.classList.toggle("admin-button--primary", publish || Boolean(draft));
    confirm.classList.toggle("admin-notice-danger", !publish && !draft);
    detailBody.classList.toggle("admin-notice-preview", preview);
    detailBody.innerHTML = `<h3 translate="no">${escapeHtml(item.name)}</h3>
      <p class="admin-demo"><span>${labels[item.type]}</span>${draft ? "" : ` · <span>${states[item.status]}</span>`}</p>
      ${preview ? '<div class="admin-notice-article admin-notice-preview-text" translate="no"></div>' :
        `<p>${publish ? "Thông báo sẽ xuất hiện trên trang Thông báo chung của trình duyệt này." : "Thông báo sẽ được gỡ khỏi trang Thông báo chung của trình duyệt này."}</p>`}`;

    if (preview) {
      renderArticle(detailBody.querySelector(".admin-notice-article"), item, (id, file) => {
        const url = URL.createObjectURL(file);
        detailUrls.add(url);
        return articleImage(id, file, url);
      });
    }
    if (preview && item.attachment) {
      const fileUrl = URL.createObjectURL(item.attachment);
      detailUrls.add(fileUrl);
      detailBody.insertAdjacentHTML("beforeend", `<a class="admin-button" href="${fileUrl}" download="${escapeHtml(item.attachment.name)}">
        <span>Tải xuống</span> ${localText(item.attachment.name)}</a>`);
    }
    detail.showModal();
  }

  function showDraftError(result) {
    const control = result.field === "body" && !system ? composer.element : fields[result.field];
    editorMessage(result.error, control);
  }

  function readDraft() {
    if (composer.busy) {
      editorMessage("Đang mở ảnh. Hãy thử lại sau giây lát.");
      return;
    }
    const draft = {
      ...composer.read(),
      title: fields.title.value,
      category: fields.category.value,
      attachment: fields.attachment.files[0] ?? retainedFile,
    };
    const invalid = store.validateAcademic(draft);
    if (invalid) {
      showDraftError(invalid);
      return;
    }
    editorMessage("");
    return draft;
  }

  async function commit(dialog, button, operation, notice, closeEditor = false) {
    if (button.disabled) return;
    button.disabled = true;
    if (dialog === editor) previewDraft.disabled = true;
    let result;
    try {
      result = await operation();
    } catch {
      result = { error: "Không thể lưu thông báo trên trình duyệt. Hãy thử lại." };
    } finally {
      button.disabled = false;
      if (dialog === editor) previewDraft.disabled = false;
    }
    if (result.error) {
      if (dialog === editor) showDraftError(result);
      else message(detailError, result.error);
      return;
    }
    dialog.close();
    if (closeEditor) editor.close();
    await refresh(notice);
    (results.querySelector(`[data-notice-id="${result.record.id}"]`) ?? create).focus();
  }

  create.addEventListener("click", () => openEditor());
  results.addEventListener("click", (event) => {
    const button = event.target.closest("[data-notice-action]");
    if (!button) return;
    const item = records.find(({ id }) => id === button.dataset.noticeId);
    if (!item) return;
    if (button.dataset.noticeAction === "edit") openEditor(item);
    else openDetail(item, button.dataset.noticeAction);
  });

  for (const [dialog, button] of [[editor, submit], [detail, confirm]]) {
    dialog.querySelector(".admin-dialog-close").addEventListener("click", () => {
      if (!button.disabled) dialog.close();
    });
    dialog.addEventListener("cancel", (event) => {
      if (button.disabled) event.preventDefault();
    });
  }

  editor.addEventListener("close", () => {
    if (!system && !editor.open) composer.reset();
  });
  detail.addEventListener("close", () => {
    for (const url of detailUrls) URL.revokeObjectURL(url);
    detailUrls.clear();
    detailBody.replaceChildren();
  });
  backToEditor.addEventListener("click", () => {
    if (!confirm.disabled) detail.close();
  });
  previewDraft.addEventListener("click", () => {
    const draft = readDraft();
    if (!draft) return;
    openDetail({ ...draft, name: draft.title.trim(), type: draft.category }, "preview", draft);
  });
  confirm.addEventListener("click", () => {
    const { item, operation, draft } = action;
    if (draft) {
      commit(detail, confirm, () => store.saveAcademic(draft, editing, "published"),
        "Đã đăng thông báo trong bản mẫu.", true);
      return;
    }
    commit(detail, confirm, () => store.changeStatus(item, operation),
      operation === "published" ? "Đã đăng thông báo trong bản mẫu." : "Đã gỡ thông báo trong bản mẫu.");
  });

  form.addEventListener("input", () => editorMessage(""));
  form.addEventListener("change", (event) => {
    if (["audience", "scope"].includes(event.target.name)) {
      fields.recipientSearch.value = "";
      showPicker(false);
      renderPicker();
    } else if (event.target === fields.attachment) {
      renderAttachment();
    }
  });
  attachment.addEventListener("click", (event) => {
    if (!event.target.closest("button")) return;
    retainedFile = undefined;
    renderAttachment();
    fields.attachment.focus();
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (system) {
      const text = { title: fields.title.value, body: fields.body.value };
      const audience = fields.audience.value;
      const scope = fields.scope.value;
      commit(editor, submit, () => store.createSystem({ ...text, audience, scope, ids: [...selected] }),
        "Đã lưu thông báo hệ thống trong bản mẫu.");
    } else {
      const draft = readDraft();
      if (draft) commit(editor, submit, () => store.saveAcademic(draft, editing), "Đã lưu bản nháp.");
    }
  });

  fields.recipientSearch.addEventListener("input", () => {
    renderPicker();
    showPicker(true);
  });
  pickerToggle.addEventListener("click", () => {
    renderPicker();
    showPicker(pickerResults.hidden);
    if (!pickerResults.hidden) fields.recipientSearch.focus();
  });
  picker.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !pickerResults.hidden) {
      event.preventDefault();
      showPicker(false);
      fields.recipientSearch.focus();
    } else if (event.key === "ArrowDown" && event.target === fields.recipientSearch) {
      event.preventDefault();
      renderPicker();
      showPicker(true);
      pickerResults.querySelector("button")?.focus();
    } else if (event.key === "Enter" && event.target === fields.recipientSearch) {
      event.preventDefault();
      renderPicker();
      showPicker(true);
    }
  });
  picker.addEventListener("focusout", (event) => {
    if (!picker.contains(event.relatedTarget)) showPicker(false);
  });
  pickerResults.addEventListener("click", (event) => {
    const button = event.target.closest("[data-recipient-id]");
    if (!button) return;
    selected.add(button.dataset.recipientId);
    fields.recipientSearch.value = "";
    editorMessage("");
    fields.recipientSearch.focus();
    renderPicker();
    showPicker(false);
  });
  selectedChips.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-recipient]");
    if (!button) return;
    selected.delete(button.dataset.removeRecipient);
    fields.recipientSearch.focus();
    renderPicker();
  });

  if (system) {
    submit.textContent = "Gửi thông báo";
    submit.classList.add("admin-button--primary");
    previewDraft.hidden = true;
    create.querySelector("span").textContent = "Tạo thông báo";
    search.placeholder = "Tìm theo thông báo hoặc người nhận";
    type.labels[0].textContent = "Sự kiện";
    state.labels[0].textContent = "Đối tượng";
  }
  byId(system ? "admin-notice-system-tab" : "admin-notice-academic-tab").setAttribute("aria-current", "page");
  byId("admin-notice-list-title").textContent = heading;
  fillSelect(type, system ? "Tất cả sự kiện" : "Tất cả chuyên mục",
    system ? events : Object.fromEntries(store.categories.map((key) => [key, labels[key]])));
  fillSelect(state, system ? "Tất cả đối tượng" : "Tất cả trạng thái",
    system ? { student: roles.student, lecturer: roles.lecturer } : states);
  if (!system && Object.hasOwn(states, params.get("status"))) state.value = params.get("status");
  [search, type, state].forEach((control) => control.addEventListener("input", render));
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) refresh();
  });
  refresh().then(() => {
    view.hidden = false;
    create.hidden = false;
  });
})();
