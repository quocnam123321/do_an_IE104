(() => {
  const app = globalThis.IE104;
  const service = app?.services?.lecturerProfile;
  const form = document.getElementById('profile-edit-form');
  if (!service || !form) return;
  const dialog = form.closest('dialog');
  const status = document.getElementById('lecturer-profile-status');
  const error = document.getElementById('lecturer-profile-error');
  const open = document.querySelector('.profile-actions__edit');
  const submit = form.querySelector('[data-profile-save]');
  const avatarButton = document.querySelector('.profile-avatar__change');
  const fileInput = document.getElementById('lecturer-avatar-file');
  const databaseAvatar = app.services.databaseAvatar;
  const databaseProfile = app.services.databaseProfile;
  const fields = { name: document.getElementById('profile-full-name'), email: document.getElementById('profile-email'), phone: document.getElementById('profile-phone'), expertise: document.getElementById('profile-expertise') };
  const demoName = document.querySelector('meta[name="ie104-demo-lecturer"]')?.content;
  if (demoName) fields.name.readOnly = true;
  let snapshot;
  let databaseState;
  let loadingProfile = false;
  let busy = false;
  let avatarUrl;
  let avatarLoad = 0;
  const message = (node, text) => { node.textContent = text; node.hidden = !text; };
  function refresh() {
    try {
      const state = databaseProfile ? databaseState : service.getState();
      const { id, email, phone, expertise } = state ?? {};
      const name = demoName || state?.name;
      const values = [name, id, email, phone, '', '', '', expertise];
      document.querySelectorAll('.profile-details dd').forEach((node, index) => { node.textContent = values[index] || 'Chưa có thông tin'; });
      const placeholder = document.querySelector('.profile-avatar__placeholder');
      placeholder.replaceChildren();
      const avatar = databaseAvatar ? avatarUrl : state?.avatar;
      if (avatar) {
        const image = document.createElement('img');
        image.src = avatar;
        image.alt = `Ảnh đại diện ${name}`;
        placeholder.append(image);
      } else placeholder.textContent = 'Chưa có ảnh đại diện';
      open.disabled = busy || loadingProfile;
      avatarButton.disabled = busy;
      return state;
    } catch (failure) {
      message(status, failure.message);
      open.disabled = avatarButton.disabled = true;
      return null;
    }
  }
  async function loadProfile() {
    if (!databaseProfile) return refresh();
    if (loadingProfile || busy) return null;
    loadingProfile = true;
    open.disabled = true;
    try {
      const profile = await databaseProfile.read();
      databaseState = { ...profile, id: databaseProfile.sampleIdentity ? app.data.currentLecturer.id : '' };
      message(status, '');
      return databaseState;
    } catch (failure) {
      message(status, failure.message);
      return null;
    } finally {
      loadingProfile = false;
      refresh();
    }
  }
  function renderAvatar(file) {
    if (avatarUrl) URL.revokeObjectURL(avatarUrl);
    avatarUrl = file ? URL.createObjectURL(file) : undefined;
    refresh();
  }
  async function loadAvatar() {
    if (!databaseAvatar || busy) return;
    const attempt = ++avatarLoad;
    try {
      const file = await databaseAvatar.read();
      if (attempt === avatarLoad) renderAvatar(file);
    } catch (failure) {
      if (attempt === avatarLoad) message(status, failure.message);
    }
  }
  open.removeAttribute('command');
  open.removeAttribute('commandfor');
  if (databaseProfile) document.getElementById('profile-edit-notice').textContent = 'Thông tin hồ sơ được lưu theo tài khoản trên hệ thống.';
  open.addEventListener('click', async () => {
    snapshot = await loadProfile();
    if (!snapshot) return;
    Object.entries(fields).forEach(([key, field]) => {
      field.value = key === 'name' && demoName ? demoName : snapshot[key];
      field.removeAttribute('aria-invalid');
    });
    message(error, '');
    submit.disabled = false;
    dialog.showModal();
    (demoName ? fields.email : fields.name).focus();
  });
  form.noValidate = true;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy || !snapshot) return;
    const input = Object.fromEntries(Object.entries(fields).map(([key, field]) => [key, field.value]));
    if (demoName) input.name = snapshot.name;
    const checked = service.validate(input);
    Object.values(fields).forEach(field => field.removeAttribute('aria-invalid'));
    if (checked.errors.length) {
      message(error, checked.errors.map(item => item.message).join(' '));
      checked.errors.forEach(item => fields[item.field].setAttribute('aria-invalid', 'true'));
      fields[checked.errors[0].field].focus();
      return;
    }
    busy = true;
    form.setAttribute('aria-busy', 'true');
    submit.disabled = true;
    try {
      if (databaseProfile) databaseState = { ...databaseState, ...await databaseProfile.save(checked.value, snapshot.revision) };
      else await service.update(checked.value, snapshot.revision, snapshot.id);
      dialog.close();
      message(status, databaseProfile ? 'Đã lưu thông tin hồ sơ.' : 'Đã lưu hồ sơ thử trên trình duyệt này.');
      status.focus();
    } catch (failure) { message(error, failure.message); error.focus(); }
    finally { busy = false; submit.disabled = false; form.removeAttribute('aria-busy'); refresh(); }
  });
  dialog.addEventListener('cancel', event => { if (busy) event.preventDefault(); });
  dialog.addEventListener('click', event => { if (busy && event.target.closest('[command="close"]')) event.preventDefault(); });
  avatarButton.removeAttribute('title');
  avatarButton.addEventListener('click', () => { snapshot = refresh(); if (databaseAvatar || snapshot) fileInput.click(); });
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file || busy || (!databaseAvatar && !snapshot)) return;
    const captured = snapshot;
    avatarLoad += 1;
    busy = true;
    refresh();
    try {
      if (!['image/png', 'image/jpeg'].includes(file.type) || !file.size || file.size > 2 * 1024 * 1024) throw new Error('Chọn ảnh PNG hoặc JPG tối đa 2 MB.');
      const image = await createImageBitmap(file);
      const valid = image.width > 0 && image.height > 0;
      image.close();
      if (!valid) throw new Error('Không đọc được nội dung ảnh.');
      if (databaseAvatar) {
        renderAvatar(await databaseAvatar.save(file));
        message(status, 'Đã lưu ảnh đại diện.');
      } else {
        const data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(new Error('Không đọc được tệp ảnh.'));
          reader.readAsDataURL(file);
        });
        await service.update({}, captured.revision, captured.id, data);
        message(status, 'Đã lưu ảnh đại diện thử trên trình duyệt này.');
      }
    } catch (failure) { message(status, failure.message); }
    finally { busy = false; fileInput.value = ''; refresh(); status.focus(); }
  });
  document.querySelectorAll('.change-password-form__visibility').forEach(button => {
    button.disabled = false;
    button.removeAttribute('aria-describedby');
    button.setAttribute('aria-pressed', 'false');
    const field = document.getElementById(button.getAttribute('aria-controls'));
    const label = button.getAttribute('aria-label');
    button.addEventListener('click', () => {
      const show = field.type === 'password';
      field.type = show ? 'text' : 'password';
      button.setAttribute('aria-pressed', String(show));
      button.setAttribute('aria-label', show ? label.replace('Hiện', 'Ẩn') : label);
    });
  });
  document.getElementById('change-password-dialog').addEventListener('close', () => {
    document.getElementById('change-password-form').reset();
    document.querySelectorAll('.change-password-form__visibility[aria-pressed="true"]').forEach(button => button.click());
  });
  if (!databaseProfile) {
    window.addEventListener('storage', event => { if (event.key === null || event.key.startsWith(service.prefix)) refresh(); });
  }
  window.addEventListener('pageshow', event => { if (event.persisted) void loadProfile(); void loadAvatar(); });
  if (databaseAvatar) window.addEventListener('focus', loadAvatar);
  refresh();
  if (databaseProfile) void loadProfile();
})();
