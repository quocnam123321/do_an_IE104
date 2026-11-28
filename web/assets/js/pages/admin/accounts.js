(() => {
  const { badge, escapeHtml, labels, normalizeSearch, params, view } = globalThis.IE104Admin;
  const store = globalThis.IE104AdminAccounts;
  const addButton = document.querySelector("#admin-account-add");
  const rows = document.querySelector("#admin-account-rows");
  const count = document.querySelector("#admin-account-count");
  const search = document.querySelector("#admin-account-search");
  const roleFilter = document.querySelector("#admin-account-role-filter");
  const statusFilter = document.querySelector("#admin-account-status-filter");
  const dataError = document.querySelector("#admin-account-data-error");
  const editor = document.querySelector("#admin-account-dialog");
  const form = document.querySelector("#admin-account-form");
  const fields = form.elements;
  const passwordFields = document.querySelector("#admin-account-password-fields");
  const editorTitle = document.querySelector("#admin-account-dialog-title");
  const editorError = document.querySelector("#admin-account-form-error");
  const editorSubmit = form.querySelector('button[type="submit"]');
  const successDialog = document.querySelector("#admin-account-success");
  const successTitle = document.querySelector("#admin-account-success-title");
  const confirm = document.querySelector("#admin-account-confirm-dialog");
  const confirmForm = document.querySelector("#admin-account-confirm-form");
  const confirmTitle = document.querySelector("#admin-account-confirm-title");
  const confirmPrompt = document.querySelector("#admin-account-confirm-prompt");
  const confirmName = document.querySelector("#admin-account-confirm-name");
  const confirmError = document.querySelector("#admin-account-confirm-error");
  const confirmSubmit = confirmForm.querySelector('button[type="submit"]');
  const googleMark = `<svg aria-hidden="true" width="18" height="18" viewBox="0 0 48 48">
    <path fill="#4285F4" d="M43.6 24.46c0-1.36-.12-2.66-.34-3.92H24v7.42h11a9.4 9.4 0 0 1-4.08 6.17l6.61 5.15c3.85-3.54 6.07-8.76 6.07-14.82z"/>
    <path fill="#34A853" d="M24 44c5.51 0 10.13-1.83 13.53-4.72l-6.61-5.15c-1.83 1.22-4.17 1.94-6.92 1.94-5.32 0-9.82-3.59-11.43-8.43l-6.8 5.27A20 20 0 0 0 24 44z"/>
    <path fill="#FBBC05" d="M12.57 27.64a12.02 12.02 0 0 1 0-7.28l-6.8-5.27a20 20 0 0 0 0 17.82z"/>
    <path fill="#EA4335" d="M24 11.93c3.02 0 5.73 1.04 7.86 3.07l5.89-5.89A19.18 19.18 0 0 0 24 4 20 20 0 0 0 5.77 15.09l6.8 5.27C14.18 15.52 18.68 11.93 24 11.93z"/>
  </svg>`;
  let editing;
  let changingStatus;

  function accountRow(account) {
    const locked = account.status === "locked";
    const id = escapeHtml(account.id);
    const name = escapeHtml(account.name);
    const email = escapeHtml(account.email);
    const identity = account.provider === "google" ?
      `<span class="admin-account-email" translate="no">${email}</span>` :
      `<span translate="no">${escapeHtml(account.username)}</span>${email ?
        `<span translate="no">${email}</span>` : "<span>Chưa có email</span>"}`;
    const button = (action, style, label) =>
      `<button class="admin-button ${style}" type="button" data-account-id="${id}" data-account-action="${action}">
        <span>${label}</span><span class="visually-hidden" translate="no"> ${name} · ${escapeHtml(account.code)}</span>
      </button>`;
    return `<tr>
      <th scope="row" translate="no">${name}</th>
      <td class="admin-code" translate="no">${escapeHtml(account.code)}</td>
      <td class="admin-account-identity">${identity}</td>
      <td><span class="admin-account-method">${account.provider === "google" ? `${googleMark}Google` : "Mật khẩu"}</span></td>
      <td>${labels[account.type]}</td>
      <td>${badge(labels[account.status], account.status)}</td>
      <td><div class="admin-account-actions">${locked ?
        button("unlock", "admin-account-unlock", "Mở khóa") :
        button("edit", "", "Sửa thông tin") + button("lock", "admin-account-lock", "Khóa")}</div></td>
    </tr>`;
  }

  function render() {
    const { accounts, unavailable } = store.snapshot();
    const query = normalizeSearch(search.value);
    const matches = accounts.filter((account) =>
      (!roleFilter.value || account.type === roleFilter.value) &&
      (!statusFilter.value || account.status === statusFilter.value) &&
      [account.name, account.code, account.username, account.email].some((value) => normalizeSearch(value).includes(query))
    );
    dataError.hidden = !unavailable;
    count.textContent = matches.length;
    rows.innerHTML = matches.length ? matches.map(accountRow).join("") :
      '<tr><td class="admin-empty" colspan="7">Không có tài khoản phù hợp.</td></tr>';
  }

  function setError(output, message, control) {
    output.textContent = message;
    output.hidden = !message;
    if (control) {
      control.setAttribute("aria-invalid", "true");
      control.setAttribute("aria-describedby", output.id);
      control.focus();
    }
  }

  function clearEditorError() {
    const invalid = form.querySelector('[aria-invalid="true"]');
    invalid?.removeAttribute("aria-invalid");
    invalid?.removeAttribute("aria-describedby");
    setError(editorError, "");
  }

  function updateCodeLabel() {
    document.querySelector("#admin-account-code-label").textContent =
      fields.role.value === "lecturer" ? "Mã giảng viên" : "MSSV";
  }

  function openEditor(account) {
    form.reset();
    clearEditorError();
    editing = account;
    const google = account?.provider === "google";
    fields.fullName.value = account?.name ?? "";
    fields.role.value = account?.type ?? "student";
    fields.code.value = account?.code ?? "";
    fields.username.value = account?.username ?? "";
    fields.email.value = account?.email ?? "";
    fields.username.disabled = google;
    document.querySelector("#admin-account-username-field").hidden = google;
    fields.email.readOnly = google;
    document.querySelector("#admin-account-email-label").textContent = google ? "Email Google" : "Email (tùy chọn)";
    passwordFields.hidden = passwordFields.disabled = Boolean(account);
    editorTitle.textContent = account ? "Sửa thông tin tài khoản" : "Thêm tài khoản";
    editorSubmit.textContent = account ? "Lưu thay đổi" : "Thêm tài khoản";
    updateCodeLabel();
    editor.showModal();
  }

  function openStatusDialog(account) {
    changingStatus = account;
    const locked = account.status === "locked";
    confirmTitle.textContent = locked ? "Mở khóa tài khoản" : "Khóa tài khoản";
    confirmPrompt.textContent = locked ? "Bạn muốn mở khóa tài khoản" : "Bạn muốn khóa tài khoản";
    confirmName.textContent = `${account.name} · ${account.code}`;
    confirmSubmit.textContent = locked ? "Xác nhận mở khóa" : "Xác nhận khóa";
    confirmSubmit.classList.toggle("admin-account-confirm-lock", !locked);
    confirmSubmit.classList.toggle("admin-account-confirm-unlock", locked);
    setError(confirmError, "");
    confirm.showModal();
  }

  function showSuccess(id, action, message) {
    render();
    const control = rows.querySelector(`[data-account-id="${CSS.escape(id)}"][data-account-action="${action}"]`);
    (control ?? addButton).focus();
    successTitle.textContent = message;
    successDialog.showModal();
  }

  [search, roleFilter, statusFilter].forEach((control) => control.addEventListener("input", render));
  addButton.addEventListener("click", () => openEditor(null));
  successDialog.querySelector(".success-dialog__close").addEventListener("click", () => successDialog.close());
  rows.addEventListener("click", (event) => {
    const button = event.target.closest("[data-account-action]");
    if (!button) return;
    const { accountId, accountAction } = button.dataset;
    const account = store.snapshot().accounts.find(({ id }) => id === accountId);
    if (!account) return;
    if (accountAction === "edit") {
      if (account.status !== "locked") openEditor(account);
      else render();
    } else {
      openStatusDialog(account);
    }
  });

  fields.role.addEventListener("input", updateCodeLabel);
  form.addEventListener("input", clearEditorError);
  editor.addEventListener("close", () => {
    if (!editor.open) form.reset();
  });

  for (const [dialog, submit] of [[editor, editorSubmit], [confirm, confirmSubmit]]) {
    dialog.querySelector(".admin-dialog-close").addEventListener("click", () => {
      if (!submit.disabled) dialog.close();
    });
    dialog.addEventListener("cancel", (event) => {
      if (submit.disabled) event.preventDefault();
    });
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (editorSubmit.disabled) return;
    if (!editing && (fields.password.value.length < 6 || fields.password.value.length > 128)) {
      setError(editorError, "Mật khẩu phải có từ 6 đến 128 ký tự.", fields.password);
      return;
    }
    if (!editing && fields.password.value !== fields.confirmPassword.value) {
      setError(editorError, "Mật khẩu xác nhận chưa khớp.", fields.confirmPassword);
      return;
    }
    editorSubmit.disabled = true;
    const result = await store.saveAccount({
      fullName: fields.fullName.value,
      code: fields.code.value,
      role: fields.role.value,
      username: fields.username.value,
      email: fields.email.value,
    }, editing);
    editorSubmit.disabled = false;
    if (result.error) {
      setError(editorError, result.error, fields[result.field]);
      return;
    }
    editor.close();
    showSuccess(result.id, "edit", editing ? "Đã lưu thay đổi" : "Đã thêm tài khoản");
  });

  confirmForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (confirmSubmit.disabled) return;
    const locking = changingStatus.status === "enabled";
    confirmSubmit.disabled = true;
    const result = await store.toggleStatus(changingStatus);
    confirmSubmit.disabled = false;
    if (result.error) {
      setError(confirmError, result.error);
      return;
    }
    confirm.close();
    showSuccess(result.id, locking ? "unlock" : "lock", locking ? "Đã khóa tài khoản" : "Đã mở khóa tài khoản");
  });

  window.addEventListener("storage", (event) => {
    if (event.key === store.storageKey || event.key === null) render();
  });
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) render();
  });
  const initialStatus = params.get("status");
  if (["enabled", "locked"].includes(initialStatus)) statusFilter.value = initialStatus;
  render();
  view.hidden = false;
  addButton.hidden = false;
})();
