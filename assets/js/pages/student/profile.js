(() => {
  const service = globalThis.IE104?.services?.profile;
  const form = document.getElementById('profile-edit-form');
  if (!service || !form) return;
  const dialog = document.getElementById('profile-edit-dialog');
  const open = document.getElementById('profile-edit-button');
  const status = document.getElementById('profile-save-status');
  const error = document.getElementById('profile-edit-error');
  const submit = form.querySelector('[type="submit"]');
  const databaseProfile = globalThis.IE104.services.databaseProfile;
  const fields = Object.fromEntries(['name', 'email', 'phone'].map(key => [key, document.getElementById(`profile-edit-${key}`)]));
  const identity = { code: 'code', faculty: 'faculty', major: 'major', class: 'className', cohort: 'cohort' };
  const sampleIdentity = databaseProfile?.sampleIdentity ? globalThis.IE104.data.studentProfile : {};
  let revision = 0;
  let saving = false;

  function render(state) {
    Object.entries({ name: 'name', email: 'email', phone: 'phone', ...identity }).forEach(([id, key]) => {
      const node = document.getElementById(`profile-${id}`);
      node.textContent = state[key] || 'Chưa có thông tin';
      node.classList.toggle('profile-value--empty', !state[key]);
    });
  }

  async function refresh() {
    open.disabled = true;
    try {
      const state = databaseProfile ? { ...sampleIdentity, ...await databaseProfile.read() } : service.getState();
      render(state);
      if (status.classList.contains('profile-feedback-error')) {
        status.textContent = '';
        status.classList.remove('profile-feedback-error');
      }
      open.disabled = false;
      return state;
    } catch (failure) {
      status.textContent = failure.message;
      status.classList.add('profile-feedback-error');
      open.disabled = !databaseProfile;
      submit.disabled = true;
      return null;
    }
  }

  open.removeAttribute('command');
  open.removeAttribute('commandfor');
  form.noValidate = true;
  function clearEditErrors() {
    Object.values(fields).forEach(field => field.removeAttribute('aria-invalid'));
    error.hidden = true;
  }

  if (databaseProfile) {
    document.getElementById('profile-edit-notice').textContent = 'Thông tin hồ sơ được lưu theo tài khoản trên hệ thống.';
    render({});
  }

  open.addEventListener('click', async () => {
    const state = await refresh();
    if (!state) return;
    revision = state.revision;
    status.textContent = '';
    Object.entries(fields).forEach(([key, field]) => { field.defaultValue = state[key]; });
    Object.entries(identity).forEach(([id, key]) => {
      document.getElementById(`profile-edit-${id}`).defaultValue = state[key] || 'Chưa có thông tin';
    });
    form.reset();
    form.querySelector('.profile-edit__identity').open = false;
    submit.disabled = false;
    dialog.showModal();
    fields.name.focus();
  });
  form.addEventListener('reset', clearEditErrors);
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (saving) return;
    clearEditErrors();
    const checked = service.validate(Object.fromEntries(Object.entries(fields).map(([key, field]) => [key, field.value])));
    if (checked.errors.length) {
      error.textContent = checked.errors.map(item => item.message).join(' ');
      error.hidden = false;
      checked.errors.forEach(item => fields[item.field].setAttribute('aria-invalid', 'true'));
      fields[checked.errors[0].field].focus();
      return;
    }
    saving = true;
    form.setAttribute('aria-busy', 'true');
    submit.disabled = true;
    try {
      const state = databaseProfile ? { ...sampleIdentity, ...await databaseProfile.save(checked.value, revision) }
        : service.update(checked.value, revision);
      dialog.close();
      render(state);
      status.classList.remove('profile-feedback-error');
      status.textContent = databaseProfile ? 'Đã lưu thông tin hồ sơ.'
        : 'Đã lưu hồ sơ thử trên trình duyệt này. Chưa cập nhật tài khoản trên hệ thống.';
      status.tabIndex = -1;
      status.focus();
    } catch (failure) {
      error.textContent = failure.message;
      error.hidden = false;
      error.tabIndex = -1;
      error.focus();
    } finally { saving = false; submit.disabled = false; form.removeAttribute('aria-busy'); }
  });
  dialog.addEventListener('cancel', event => { if (saving) event.preventDefault(); });
  dialog.addEventListener('click', event => { if (saving && event.target.closest('[command="close"]')) event.preventDefault(); });
  if (!databaseProfile) {
    window.addEventListener('storage', event => { if (event.key === globalThis.IE104.storage.profileKey || event.key === null) void refresh(); });
  }
  window.addEventListener('pageshow', event => { if (event.persisted) void refresh(); });

  const passwordForm = document.getElementById('profile-password-form');
  const passwordDialog = document.getElementById('profile-password-dialog');
  const passwordError = document.getElementById('profile-password-error');
  const passwordStatus = document.getElementById('profile-password-status');
  const passwordFields = { current: document.getElementById('profile-password-current'), next: document.getElementById('profile-password-new'), confirm: document.getElementById('profile-password-confirm') };
  passwordForm.noValidate = true;
  document.querySelectorAll('#profile-password-dialog .password-toggle').forEach(button => { button.disabled = false; });
  document.getElementById('password-submit').disabled = false;
  passwordForm.addEventListener('submit', event => {
    event.preventDefault();
    Object.values(passwordFields).forEach(field => field.removeAttribute('aria-invalid'));
    passwordError.textContent = '';
    passwordStatus.textContent = '';
    const errors = service.validatePassword(Object.fromEntries(Object.entries(passwordFields).map(([key, field]) => [key, field.value])));
    if (errors.length) {
      passwordError.textContent = errors.map(item => item.message).join(' ');
      errors.forEach(item => passwordFields[item.field].setAttribute('aria-invalid', 'true'));
      passwordFields[errors[0].field].focus();
      return;
    }
    passwordStatus.textContent = 'Các trường đã nhập khớp nhau. Chưa xác minh mật khẩu hiện tại hoặc đổi mật khẩu vì chưa kết nối hệ thống.';
  });
  passwordDialog.addEventListener('close', () => { passwordForm.reset(); passwordError.textContent = ''; passwordStatus.textContent = ''; Object.values(passwordFields).forEach(field => field.removeAttribute('aria-invalid')); });
  window.addEventListener('pagehide', () => passwordForm.reset());
  void refresh();
  document.body.dataset.profileReady = 'true';
})();
