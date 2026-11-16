(() => {
  const dialog = document.getElementById('supervisor-dialog');
  const openButton = document.getElementById('add-supervisor');
  const search = document.getElementById('supervisor-search');
  const confirmButton = document.getElementById('confirm-supervisor-selection');
  const status = document.getElementById('supervisor-selection-status');
  const savedId = document.getElementById('supervisor-id');
  const savedLabel = document.getElementById('selected-supervisor');
  const options = Array.from(dialog.querySelectorAll('.supervisor-dialog__option'));
  const empty = dialog.querySelector('.supervisor-dialog__empty');
  const normalize = (value) => value.toLocaleLowerCase('vi').normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').trim();

  function updateSelection() {
    const selected = dialog.querySelector('input[type="radio"]:checked');
    confirmButton.disabled = !selected;
    status.textContent = selected
      ? `Đã chọn: ${selected.closest('label').querySelector('.supervisor-dialog__name').textContent.trim()}`
      : 'Chưa chọn giảng viên';
  }

  search.addEventListener('input', () => {
    const query = normalize(search.value);
    options.forEach((option) => {
      option.hidden = !normalize(option.textContent).includes(query);
    });
    empty.hidden = options.some((option) => !option.hidden);
  });

  openButton.addEventListener('click', () => {
    search.value = '';
    options.forEach((option) => {
      option.hidden = false;
      const radio = option.querySelector('input');
      radio.checked = radio.value === savedId.value;
    });
    empty.hidden = true;
    updateSelection();
    dialog.showModal();
    search.focus();
  });

  dialog.addEventListener('change', updateSelection);
  document.getElementById('close-supervisor-dialog').addEventListener('click', () => dialog.close());
  document.getElementById('cancel-supervisor-selection').addEventListener('click', () => dialog.close());
  confirmButton.addEventListener('click', () => {
    const selected = dialog.querySelector('input[type="radio"]:checked');
    if (!selected) return;
    savedId.value = selected.value;
    savedLabel.textContent = selected.closest('label').querySelector('.supervisor-dialog__name').textContent.trim();
    dialog.close();
  });
  dialog.addEventListener('close', () => openButton.focus());
})();
