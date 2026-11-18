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

  const invitationId = new URLSearchParams(location.search).get('loi-moi');
  if (invitationId && window.IE104SupervisionEntry?.hasStudentSession()) {
    const store = window.IE104Supervision;
    let accepted;
    try {
      accepted = store.getAll().find(({ id, status, student }) =>
        id === invitationId && status === 'accepted' && student.id === store.student.id);
    } catch {
      savedLabel.textContent = 'Không đọc được lời mời đã lưu. Bạn có thể chọn giảng viên thủ công.';
    }
    if (accepted) {
      const option = options[0].cloneNode(true);
      const radio = option.querySelector('input');
      radio.id = 'supervisor-from-invitation';
      radio.value = accepted.teacher.id;
      option.htmlFor = radio.id;
      option.querySelector('.supervisor-dialog__name').textContent = accepted.teacher.name;
      option.querySelector('.supervisor-dialog__specialty').textContent = 'Đã đồng ý hướng dẫn';
      dialog.querySelector('#supervisor-list').prepend(option);
      options.unshift(option);
      savedId.value = accepted.teacher.id;
      savedLabel.textContent = accepted.teacher.name;
    }
  }

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
