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
  const demoNote = document.getElementById('supervisor-demo-note');
  const getSelection = () => list.querySelector('label:not([hidden]) input:checked:not(:disabled)');
  const entry = globalThis.IE104SupervisionEntry;
  const { normalizeSearch, selectionDepartment } = entry;
  const service = globalThis.IE104.services.proposals;
  const database = globalThis.IE104.proposalDatabase;
  let directoryRequest;
  let teachersById = new Map();
  let savedName = '';
  let options = [];
  let openAttempt = 0;

  function renderSavedSelection() {
    const teacher = teachersById.get(savedId.value);
    const name = teacher?.name || savedName;
    const department = teacher ? selectionDepartment(teacher) : '';
    const receiver = teacher?.demoReceiver ? (database ? 'Hàng chờ minh họa chung' : 'Hàng chờ minh họa của trình duyệt') : '';
    const specialty = [department, receiver].filter(Boolean).join(' · ');
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
  async function fillFromInvitation() {
    const store = window.IE104Supervision;
    let accepted;
    try {
      const currentStudent = await entry.getStudent();
      if (!currentStudent) return;
      accepted = store.getAll().find(({ id, status, student, projectId }) =>
        id === invitationId && status === 'accepted' && student.id === currentStudent.id && !projectId);
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
  if (invitationId && !editing) fillFromInvitation();

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
    demoNote.hidden = true;
    empty.hidden = false;
    empty.textContent = 'Đang tải danh sách giảng viên…';
    updateSelection();
    dialog.showModal();
    search.focus();

    try {
      if (database) directoryRequest = undefined;
      const teachers = await loadDirectory();
      if (!dialog.open || attempt !== openAttempt) return;
      if (!teachers.length) {
        empty.textContent = 'Chưa có giảng viên có thể nhận đề xuất.';
        return;
      }
      const demoReceiver = teachers.find(teacher => teacher.demoReceiver)?.demoReceiver;
      if (demoReceiver) {
        demoNote.textContent = database
          ? 'Đề xuất xuất hiện trong hàng chờ minh họa chung. Bạn có thể đăng nhập giảng viên từ trình duyệt khác để duyệt.'
          : 'Đề xuất được lưu vào bộ dữ liệu của hồ sơ trình duyệt này. Đăng nhập giảng viên trong cùng hồ sơ để duyệt.';
        demoNote.hidden = false;
      }
      options = teachers.map(teacher => {
        const row = template.content.firstElementChild.cloneNode(true);
        const radio = row.querySelector('input');
        radio.value = teacher.id;
        radio.disabled = teacher.canReceive === false;
        radio.checked = !radio.disabled && teacher.id === savedId.value;
        row.querySelector('[data-supervisor-availability]').hidden = !radio.disabled;
        const specialty = selectionDepartment(teacher);
        row.querySelector('.supervisor-dialog__name').textContent = teacher.name;
        row.querySelector('.supervisor-dialog__specialty').textContent = specialty;
        return { row, radio, keywords: normalizeSearch(`${teacher.name} ${specialty} ${teacher.email}`) };
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
