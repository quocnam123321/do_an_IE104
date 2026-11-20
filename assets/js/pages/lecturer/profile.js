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
  const fields = { name: document.getElementById('profile-full-name'), email: document.getElementById('profile-email'), phone: document.getElementById('profile-phone'), expertise: document.getElementById('profile-expertise') };
  let snapshot;
  let busy = false;
  const message = (node, text) => { node.textContent = text; node.hidden = !text; };
  function refresh() {
    try {
      const state = service.getState();
      const values = [state.name, state.id, state.email, state.phone, '', '', '', state.expertise];
      document.querySelectorAll('.profile-details dd').forEach((node, index) => { node.textContent = values[index] || 'Chưa có thông tin'; });
      const placeholder = document.querySelector('.profile-avatar__placeholder');
      placeholder.replaceChildren();
      if (state.avatar) {
        const image = document.createElement('img');
        image.src = state.avatar;
        image.alt = `Ảnh đại diện ${state.name}`;
        placeholder.append(image);
      } else placeholder.textContent = 'Chưa có ảnh đại diện';
      open.disabled = avatarButton.disabled = busy;
      return state;
    } catch (failure) {
      message(status, failure.message);
      open.disabled = avatarButton.disabled = true;
      return null;
    }
  }
  open.removeAttribute('command');
  open.removeAttribute('commandfor');
  open.addEventListener('click', () => {
    snapshot = refresh();
    if (!snapshot) return;
    Object.entries(fields).forEach(([key, field]) => { field.value = snapshot[key]; field.removeAttribute('aria-invalid'); });
    message(error, '');
    submit.disabled = false;
    dialog.showModal();
    fields.name.focus();
  });
  form.noValidate = true;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy || !snapshot) return;
    const checked = service.validate(Object.fromEntries(Object.entries(fields).map(([key, field]) => [key, field.value])));
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
      await service.update(checked.value, snapshot.revision, snapshot.id);
      dialog.close();
      message(status, 'Đã lưu hồ sơ thử trên trình duyệt này.');
      status.focus();
    } catch (failure) { message(error, failure.message); error.focus(); }
    finally { busy = false; submit.disabled = false; form.removeAttribute('aria-busy'); refresh(); }
  });
  dialog.addEventListener('cancel', event => { if (busy) event.preventDefault(); });
  dialog.addEventListener('click', event => { if (busy && event.target.closest('[command="close"]')) event.preventDefault(); });
  avatarButton.removeAttribute('title');
  avatarButton.addEventListener('click', () => { snapshot = refresh(); if (snapshot) fileInput.click(); });
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file || busy || !snapshot) return;
    const captured = { ...snapshot };
    busy = true;
    refresh();
    try {
      if (!['image/png', 'image/jpeg'].includes(file.type) || !file.size || file.size > 2 * 1024 * 1024) throw new Error('Chọn ảnh PNG hoặc JPG tối đa 2 MB.');
      const image = await createImageBitmap(file);
      const valid = image.width > 0 && image.height > 0;
      image.close();
      if (!valid) throw new Error('Không đọc được nội dung ảnh.');
      const data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Không đọc được tệp ảnh.'));
        reader.readAsDataURL(file);
      });
      await service.update({}, captured.revision, captured.id, data);
      message(status, 'Đã lưu ảnh đại diện thử trên trình duyệt này.');
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
  window.addEventListener('storage', event => { if (event.key === null || event.key.startsWith(service.prefix)) refresh(); });
  window.addEventListener('pageshow', refresh);
  refresh();
})();
