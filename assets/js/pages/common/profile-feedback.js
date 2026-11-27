(() => {
  const app = globalThis.IE104 ||= {};
  app.ui ||= {};
  const dialog = document.createElement('dialog');
  dialog.className = 'profile-dialog profile-success-dialog';
  dialog.setAttribute('aria-labelledby', 'profile-success-title');
  dialog.setAttribute('aria-describedby', 'profile-success-message');
  dialog.innerHTML = '<header><h2 id="profile-success-title"></h2><button type="button" aria-label="Đóng thông báo">×</button></header><div class="profile-dialog__body"><p id="profile-success-message"></p></div>';
  document.body.append(dialog);
  dialog.querySelector('button').addEventListener('click', () => dialog.close());
  let returnFocus;
  dialog.addEventListener('close', () => returnFocus?.focus({ preventScroll: true }));
  app.ui.profileSuccess = (title, message, trigger) => {
    dialog.querySelector('h2').textContent = title;
    dialog.querySelector('p').textContent = message;
    returnFocus = trigger;
    if (!dialog.open) dialog.showModal();
    document.dispatchEvent(new Event('ie104:profile-feedback'));
  };

  const student = document.body.classList.contains('student-profile-page');
  const passwordDialog = document.getElementById(student ? 'profile-password-dialog' : 'change-password-dialog');
  const form = document.getElementById(student ? 'profile-password-form' : 'change-password-form');
  const service = app.services?.accountPassword;
  if (!form || !service) return;
  const role = student ? 'student' : 'lecturer';
  const fields = student
    ? { current: document.getElementById('profile-password-current'), next: document.getElementById('profile-password-new'), confirm: document.getElementById('profile-password-confirm') }
    : { current: document.getElementById('current-password'), next: document.getElementById('new-password'), confirm: document.getElementById('confirm-new-password') };
  const submit = student ? document.getElementById('password-submit') : form.querySelector('.change-password-dialog__submit');
  let error = document.getElementById(student ? 'profile-password-error' : 'change-password-error');
  if (!error) { error = document.createElement('p'); error.id = 'change-password-error'; error.setAttribute('role', 'alert'); form.querySelector('.change-password-dialog__actions').before(error); }
  const notice = document.getElementById(student ? 'profile-password-notice' : 'change-password-notice');
  notice.textContent = 'Mật khẩu mới cần từ 8 đến 128 ký tự.';
  const opener = document.querySelector(`[commandfor="${passwordDialog.id}"][command="show-modal"]`);
  submit.disabled = false;
  submit.type = 'submit';
  submit.removeAttribute('title');
  form.noValidate = true;
  let busy = false;
  const clear = () => { error.textContent = ''; Object.values(fields).forEach(field => field.removeAttribute('aria-invalid')); };
  const reset = () => {
    form.reset(); clear();
    form.querySelectorAll('.password-toggle, .change-password-form__visibility').forEach(button => {
      const field = document.getElementById(button.getAttribute('aria-controls'));
      field.type = 'password'; button.setAttribute('aria-pressed', 'false');
      button.setAttribute('aria-label', button.getAttribute('aria-label').replace('Ẩn', 'Hiện'));
    });
  };
  passwordDialog.addEventListener('close', reset);
  passwordDialog.addEventListener('cancel', event => { if (busy) event.preventDefault(); });
  window.addEventListener('pagehide', reset);
  form.addEventListener('submit', async event => {
    if (event.submitter?.value === 'cancel') return;
    event.preventDefault();
    if (busy) return;
    clear();
    const input = Object.fromEntries(Object.entries(fields).map(([key, field]) => [key, field.value]));
    const errors = service.validate(input);
    if (errors.length) {
      error.textContent = errors.map(item => item.message).join(' ');
      errors.forEach(item => fields[item.field].setAttribute('aria-invalid', 'true'));
      fields[errors[0].field].focus(); return;
    }
    busy = true;
    const label = submit.textContent;
    form.setAttribute('aria-busy', 'true');
    passwordDialog.querySelectorAll('button, input').forEach(node => { node.disabled = true; });
    submit.textContent = 'Đang đổi mật khẩu…';
    try {
      const result = await service.change(role, input);
      passwordDialog.close();
      app.ui.profileSuccess('Đổi mật khẩu thành công', result.mode === 'demo'
        ? 'Mật khẩu tài khoản mẫu đã được cập nhật trên trình duyệt này. Dùng mật khẩu mới cho lần đăng nhập tiếp theo.'
        : 'Mật khẩu đã được cập nhật. Dùng mật khẩu mới cho lần đăng nhập tiếp theo.', opener);
    } catch (failure) {
      const messages = {
        'auth/invalid-credential': 'Mật khẩu hiện tại không đúng.', 'auth/wrong-password': 'Mật khẩu hiện tại không đúng.',
        'auth/weak-password': 'Mật khẩu mới chưa đáp ứng yêu cầu bảo mật.', 'auth/password-does-not-meet-requirements': 'Mật khẩu mới chưa đáp ứng yêu cầu bảo mật.',
        'auth/network-request-failed': 'Không kết nối được máy chủ. Vui lòng thử lại.', 'auth/too-many-requests': 'Bạn đã thử quá nhiều lần. Hãy thử lại sau.',
        'auth/requires-recent-login': 'Hãy đăng nhập lại trước khi đổi mật khẩu.'
      };
      error.textContent = messages[failure.code] || (failure.code ? 'Chưa đổi được mật khẩu. Vui lòng thử lại.' : failure.message);
      error.tabIndex = -1; error.focus();
    } finally {
      Object.keys(input).forEach(key => { input[key] = ''; });
      busy = false; form.removeAttribute('aria-busy');
      passwordDialog.querySelectorAll('button, input').forEach(node => { node.disabled = false; });
      submit.textContent = label;
    }
  });
})();
