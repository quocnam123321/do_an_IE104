(() => {
  if (!location.pathname.includes('/pages/sinh-vien/')) return;
  const app = globalThis.IE104 ||= {};
  app.ui ||= {};
  const dialog = document.createElement('dialog');
  dialog.className = 'student-operation-success';
  dialog.id = 'student-operation-success';
  dialog.setAttribute('aria-labelledby', 'student-operation-success-title');
  dialog.setAttribute('aria-describedby', 'student-operation-success-message');
  dialog.innerHTML = '<header><h2 id="student-operation-success-title"></h2><button type="button" aria-label="Đóng thông báo">×</button></header><div class="student-operation-success__body"><p id="student-operation-success-message"></p></div>';
  document.body.append(dialog);
  const queue = [];
  let current = null;
  function next() {
    if (dialog.open || !queue.length) return;
    current = queue.shift();
    dialog.querySelector('h2').textContent = current.title;
    dialog.querySelector('p').textContent = current.message;
    dialog.showModal();
  }
  dialog.querySelector('button').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    const completed = current;
    current = null;
    const target = typeof completed?.returnTo === 'function' ? completed.returnTo() : completed?.returnTo;
    if (target?.isConnected && !target.disabled) target.focus({ preventScroll: true });
    completed?.onClose?.();
    next();
  });
  // Call only after the operation has completed, never on click or form validation.
  app.ui.studentSuccess = (title, message, options = {}) => {
    queue.push({ title, message, ...options });
    next();
  };
})();
