(() => {
  const app = globalThis.IE104 ||= {};
  const ui = app.ui ||= {};

  ui.renderRegistrationSupervisor = (root, lecturer, supervisor = {}) => {
    const name = (supervisor?.name || lecturer || '').trim();
    const department = supervisor?.department?.trim() || supervisor?.faculty?.trim();
    const email = supervisor?.email?.trim() || '';
    const avatar = root.querySelector('[data-supervisor-avatar]');
    avatar.textContent = name.split(/\s+/).slice(-2)
      .map(part => part.charAt(0)).join('').toLocaleUpperCase('vi');
    avatar.hidden = !avatar.textContent;

    root.querySelector('[data-supervisor-name]').textContent = name || 'Chưa có thông tin';
    root.querySelector('[data-supervisor-department]').textContent = department || 'Chưa cập nhật bộ môn';
    const link = root.querySelector('[data-supervisor-email]');
    const validEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
    link.hidden = !validEmail;
    link.textContent = validEmail ? email : '';
    if (validEmail) link.href = `mailto:${encodeURIComponent(email).replace('%40', '@')}`;
    else link.removeAttribute('href');
    root.querySelector('[data-supervisor-no-email]').hidden = validEmail;
  };
})();
