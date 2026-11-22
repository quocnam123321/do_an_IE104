(() => {
  const dialog = document.getElementById('supervisor-dialog');
  const openButton = document.getElementById('add-supervisor');
  const search = document.getElementById('supervisor-search');
  const confirmButton = document.getElementById('confirm-supervisor-selection');
  const savedId = document.getElementById('supervisor-id');
  const savedLabel = document.getElementById('selected-supervisor');
  const person = document.querySelector('.proposal-supervisor__person');
  const avatar = person.querySelector('.proposal-supervisor__avatar');
  const personName = person.querySelector('.proposal-supervisor__name');
  const personSpecialty = person.querySelector('.proposal-supervisor__specialty');
  const action = document.getElementById('proposal-supervisor-action');
  const addIcon = openButton.querySelector('svg');
  const list = document.getElementById('supervisor-list');
  const template = document.getElementById('proposal-supervisor-option');
  const empty = dialog.querySelector('.supervisor-dialog__empty');
  const getSelection = () => list.querySelector('label:not([hidden]) input:checked');
  const entry = globalThis.IE104SupervisionEntry;
  const { normalizeSearch, departmentLabel } = entry;
  const service = globalThis.IE104.services.proposals;
  let directoryRequest;
  let teachersById = new Map();
  let savedName = '';
  let options = [];
  let openAttempt = 0;

  function renderSavedSelection() {
    const teacher = teachersById.get(savedId.value);
    const name = teacher?.name || savedName;
    const specialty = teacher ? departmentLabel(teacher.department) : '';
    const selected = Boolean(savedId.value && name);
    person.hidden = !selected;
    personName.textContent = name;
    personSpecialty.textContent = specialty;
    personSpecialty.hidden = !specialty;
    avatar.textContent = name.split(/\s+/).slice(-2).map(part => part.charAt(0)).join('').toLocaleUpperCase('vi');
    action.textContent = selected ? 'Đổi giảng viên' : 'Thêm giảng viên';
    addIcon.toggleAttribute('hidden', selected);
    savedLabel.textContent = selected ? name : '';
  }

  function loadDirectory() {
    directoryRequest ||= service.listSupervisors().then(teachers => {
      teachersById = new Map(teachers.map(teacher => [teacher.id, teacher]));
      if (savedId.value) renderSavedSelection();
      return teachers;
    }).catch(failure => {
      directoryRequest = undefined;
      throw failure;
    });
    return directoryRequest;
  }

  function showInvitationNote(message) {
    const note = document.createElement('p');
    note.className = 'proposal-form__selected-supervisor';
    note.textContent = message;
    savedLabel.after(note);
  }

  const invitationId = new URLSearchParams(location.search).get('loi-moi');
  const editing = new URLSearchParams(location.search).has('proposal');
  if (invitationId && !editing && entry.hasStudentSession()) {
    const store = window.IE104Supervision;
    let accepted;
    try {
      accepted = store.getAll().find(({ id, status, student }) =>
        id === invitationId && status === 'accepted' && student.id === store.student.id);
    } catch {
      showInvitationNote('Không đọc được lời mời đã lưu. Bạn có thể chọn giảng viên thủ công.');
    }
    if (accepted) loadDirectory().then(() => {
      if (savedId.value) return;
      const teacher = teachersById.get(accepted.teacher.id);
      if (!teacher) {
        showInvitationNote(`${accepted.teacher.name} đã đồng ý hướng dẫn. Giảng viên này chưa có trong danh mục.`);
        return;
      }
      savedId.value = teacher.id;
      renderSavedSelection();
    }).catch(failure => showInvitationNote(failure.message));
  }

  function updateSelection() {
    confirmButton.disabled = !getSelection();
  }

  function filterOptions() {
    if (!options.length) return;
    const query = normalizeSearch(search.value);
    let hasMatch = false;
    for (const { row, radio, keywords } of options) {
      row.hidden = !keywords.includes(query);
      if (row.hidden) radio.checked = false;
      hasMatch ||= !row.hidden;
    }
    list.hidden = !hasMatch;
    list.scrollTop = 0;
    empty.hidden = hasMatch;
    empty.textContent = hasMatch ? '' : 'Không tìm thấy giảng viên phù hợp. Hãy thử từ khóa khác.';
    updateSelection();
  }

  search.addEventListener('input', filterOptions);

  openButton.addEventListener('click', async () => {
    const attempt = ++openAttempt;
    search.value = '';
    options = [];
    list.replaceChildren();
    list.hidden = true;
    empty.hidden = false;
    empty.textContent = 'Đang tải danh sách giảng viên…';
    updateSelection();
    dialog.showModal();
    search.focus();

    try {
      const teachers = await loadDirectory();
      if (!dialog.open || attempt !== openAttempt) return;
      options = teachers.map(teacher => {
        const row = template.content.firstElementChild.cloneNode(true);
        const radio = row.querySelector('input');
        radio.value = teacher.id;
        radio.checked = teacher.id === savedId.value;
        row.querySelector('.supervisor-dialog__name').textContent = teacher.name;
        row.querySelector('.supervisor-dialog__specialty').textContent = departmentLabel(teacher.department);
        return { row, radio, keywords: normalizeSearch(`${teacher.name} ${teacher.department} ${teacher.email}`) };
      });
      list.replaceChildren(...options.map(({ row }) => row));
      filterOptions();
    } catch (failure) {
      if (dialog.open && attempt === openAttempt) empty.textContent = failure.message;
    }
  });

  dialog.addEventListener('change', updateSelection);
  savedId.addEventListener('change', event => {
    savedName = event.detail?.name || '';
    renderSavedSelection();
    if (savedId.value && savedName) loadDirectory().catch(() => {});
  });
  document.getElementById('close-supervisor-dialog').addEventListener('click', () => dialog.close());
  confirmButton.addEventListener('click', () => {
    const selected = getSelection();
    if (!selected) return;
    savedId.value = selected.value;
    savedId.dispatchEvent(new Event('change'));
    dialog.close();
  });
  dialog.addEventListener('close', () => openButton.focus());
})();
