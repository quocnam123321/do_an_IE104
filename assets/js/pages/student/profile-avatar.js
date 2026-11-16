(() => {
  const service = globalThis.IE104?.services?.avatar;
  const dialog = document.getElementById('profile-avatar-dialog');
  if (!service || !dialog) return;
  const image = document.getElementById('profile-avatar');
  const preview = document.getElementById('avatar-preview');
  const input = document.getElementById('avatar-file');
  const save = document.getElementById('avatar-save');
  const error = document.getElementById('avatar-error');
  const status = document.getElementById('avatar-status');
  const open = document.querySelector('[commandfor="profile-avatar-dialog"][command="show-modal"]');
  const fallback = image.getAttribute('src');
  let currentUrl = null;
  let previewUrl = null;
  let pending = null;
  let sequence = 0;
  let saving = false;
  let loadSequence = 0;

  function clearPreview() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = null;
    pending = null;
    input.value = '';
    save.disabled = true;
    preview.src = currentUrl || fallback;
  }

  async function load() {
    const attempt = ++loadSequence;
    try {
      const file = await service.read();
      const url = file ? URL.createObjectURL(file) : null;
      if (url) {
        const candidate = new Image();
        candidate.src = url;
        try { await candidate.decode(); }
        catch { URL.revokeObjectURL(url); throw new Error('Ảnh đã lưu không đọc được. Vui lòng chọn lại ảnh.'); }
      }
      if (attempt !== loadSequence) { if (url) URL.revokeObjectURL(url); return; }
      if (currentUrl) URL.revokeObjectURL(currentUrl);
      currentUrl = url;
      image.src = url || fallback;
      if (!dialog.open) preview.src = image.src;
    } catch (failure) { if (attempt === loadSequence) status.textContent = failure.message; }
  }

  open.removeAttribute('command');
  open.removeAttribute('commandfor');
  open.addEventListener('click', () => {
    clearPreview();
    status.textContent = '';
    error.textContent = '';
    dialog.showModal();
  });
  input.addEventListener('change', async () => {
    const attempt = ++sequence;
    pending = null;
    save.disabled = true;
    error.textContent = '';
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = null;
    preview.src = currentUrl || fallback;
    const file = input.files[0];
    if (!file) return;
    try {
      service.validate(file);
      const url = URL.createObjectURL(file);
      const candidate = new Image();
      candidate.src = url;
      try { await candidate.decode(); }
      catch { URL.revokeObjectURL(url); throw new Error('Không đọc được nội dung ảnh. Vui lòng chọn ảnh khác.'); }
      if (attempt !== sequence || !dialog.open) { URL.revokeObjectURL(url); return; }
      previewUrl = url;
      preview.src = url;
      pending = file;
      save.disabled = false;
    } catch (failure) { if (attempt === sequence) error.textContent = failure.message; }
  });
  save.addEventListener('click', async () => {
    if (!pending || saving) return;
    saving = true;
    loadSequence += 1;
    save.disabled = true;
    input.disabled = true;
    dialog.querySelectorAll('[command="close"]').forEach(button => { button.disabled = true; });
    try {
      const file = await service.save(pending);
      if (currentUrl) URL.revokeObjectURL(currentUrl);
      currentUrl = URL.createObjectURL(file);
      image.src = currentUrl;
      dialog.close();
      status.textContent = 'Đã lưu ảnh đại diện thử trên trình duyệt này. Chưa tải lên hệ thống.';
    } catch (failure) { error.textContent = failure.message; }
    finally { saving = false; save.disabled = !pending; input.disabled = false; dialog.querySelectorAll('[command="close"]').forEach(button => { button.disabled = false; }); }
  });
  dialog.addEventListener('cancel', event => { if (saving) event.preventDefault(); });
  dialog.addEventListener('close', () => { sequence += 1; clearPreview(); });
  window.addEventListener('pageshow', load);
  load();
})();
