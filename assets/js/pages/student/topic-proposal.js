(() => {
  const form = document.getElementById('proposal-form');
  const service = globalThis.IE104?.services?.proposals;
  const dialog = document.getElementById('proposal-confirm-dialog');
  if (!form || !service || !dialog) return;
  const fields = Object.fromEntries(Object.entries({ title: 'topic-name', type: 'topic-type', courseId: 'course', semester: 'semester', academicYear: 'academic-year', description: 'topic-description', objectives: 'topic-objectives', outcomes: 'expected-results', supervisorId: 'add-supervisor', attachment: 'proposal-attachment' }).map(([key, id]) => [key, document.getElementById(id)]));
  const outline = globalThis.IE104.ui?.proposalOutline;
  const fieldFor = key => fields[key] || outline?.getField(key);
  const fixedCourse = document.getElementById('fixed-course');
  const status = document.getElementById('course-status');
  const supervisorId = document.getElementById('supervisor-id');
  const submit = form.querySelector('.proposal-form__submit');
  const confirm = dialog.querySelector('[data-confirm-proposal]');
  const error = document.getElementById('proposal-error');
  const reviewError = dialog.querySelector('[data-proposal-error]');
  const result = document.getElementById('proposal-result');
  if (form.querySelector('[data-proposal-outline]') && (!outline || !globalThis.IE104.shared?.proposalOutline)) {
    error.textContent = 'Chưa tải đủ biểu mẫu đề cương. Hãy tải lại trang trước khi gửi.';
    error.hidden = false;
    return;
  }
  const regularOptions = Array.from(fields.courseId.options, option => option.cloneNode(true));
  let courseIsFixed = false;
  let pending = null;
  let saved = false;
  let saving = false;
  const params = new URLSearchParams(location.search);
  const editing = params.has('proposal');
  const editId = params.get('proposal');
  let original = null;
  let retainedAttachment = null;
  const attachmentStatus = document.getElementById('proposal-attachment-status');
  const removeAttachment = document.querySelector('[data-remove-proposal-attachment]');

  function showAttachment() {
    const file = fields.attachment.files[0] || retainedAttachment;
    attachmentStatus.textContent = file ? `${file.name} - chỉ lưu thông tin tệp` : 'Chưa chọn tệp';
    removeAttachment.hidden = !file;
  }

  function fillOriginal() {
    fields.type.value = original.type;
    updateCourse();
    Object.entries(fields).forEach(([key, field]) => {
      if (!['supervisorId', 'attachment'].includes(key)) field.value = original[key];
    });
    supervisorId.value = original.supervisorId;
    document.getElementById('selected-supervisor').textContent = original.supervisorName;
    fields.attachment.value = '';
    retainedAttachment = original.attachment;
    showAttachment();
    outline?.fill(original);
  }

  function updateCourse() {
    const type = fields.type.value;
    const fixed = ['khoa-luan', 'do-an-tot-nghiep'].includes(type);
    if (fixed) {
      const [code, label] = Object.entries(service.catalog.types[type].courses)[0];
      fields.courseId.replaceChildren(new Option(label, code, true, true));
      fixedCourse.value = code;
      status.textContent = `${label}. Môn học được chọn tự động theo loại đề tài.`;
    } else if (courseIsFixed) {
      fields.courseId.replaceChildren(...regularOptions.map(option => option.cloneNode(true)));
      fields.courseId.selectedIndex = 0;
      fixedCourse.value = '';
      status.textContent = 'Vui lòng chọn môn học cho đồ án môn học.';
    }
    fields.courseId.disabled = fixed;
    fixedCourse.disabled = !fixed;
    courseIsFixed = fixed;
    outline?.setType(type);
  }

  function clearErrors() {
    form.querySelectorAll('[data-proposal-field-error]').forEach(node => node.remove());
    form.querySelectorAll('input, select, textarea, [tabindex="-1"]').forEach(field => {
      field.removeAttribute('aria-invalid');
      const descriptions = (field.getAttribute('aria-describedby') || '').split(' ').filter(id => id && !id.startsWith('proposal-field-error-'));
      if (descriptions.length) field.setAttribute('aria-describedby', descriptions.join(' '));
      else field.removeAttribute('aria-describedby');
    });
    error.hidden = true;
  }

  function readInput() {
    return { ...Object.fromEntries(Object.entries(fields).filter(([key]) => !['supervisorId', 'attachment'].includes(key)).map(([key, field]) => [key, field.value])), supervisorId: supervisorId.value, attachment: fields.attachment.files[0] || retainedAttachment, ...(outline ? { outline: outline.read() } : {}) };
  }

  function showErrors(errors) {
    error.textContent = 'Vui lòng kiểm tra các thông tin được đánh dấu bên dưới.';
    error.hidden = false;
    errors.forEach(({ field: key, message }) => {
      const field = fieldFor(key) || document.getElementById('proposal-members');
      field.closest('details')?.setAttribute('open', '');
      const note = document.createElement('p');
      note.id = `proposal-field-error-${key}`;
      note.dataset.proposalFieldError = '';
      note.className = 'proposal-field-error';
      note.textContent = message;
      field.closest('.proposal-form__field').append(note);
      field.setAttribute('aria-invalid', 'true');
      field.setAttribute('aria-describedby', `${field.getAttribute('aria-describedby') || ''} ${note.id}`.trim());
    });
    (fieldFor(errors[0].field) || error).focus();
  }

  function review(value) {
    const list = dialog.querySelector('[data-proposal-review]');
    list.replaceChildren();
    const type = service.catalog.types[value.type];
    const rows = [['Tên đề tài', value.title], ['Loại đề tài', type.label], ['Môn học', type.courses[value.courseId]], ['Học kỳ - Năm học', `${value.semester === 'he' ? 'Hè' : value.semester} - ${value.academicYear}`], ['Giảng viên', service.catalog.supervisors[value.supervisorId]], ['Mô tả', value.description], ['Mục tiêu', value.objectives], ['Kết quả dự kiến', value.outcomes], ['Tài liệu', value.attachment ? `${value.attachment.name} (${value.attachment.size} byte). Chỉ lưu thông tin tệp, chưa lưu nội dung tệp.` : 'Không đính kèm']];
    rows.push(...(globalThis.IE104.shared?.proposalOutline?.fields(value) || []));
    rows.forEach(([label, text]) => {
      const row = document.createElement('div');
      const term = document.createElement('dt');
      const description = document.createElement('dd');
      term.textContent = label;
      description.textContent = text;
      row.append(term, description);
      list.append(row);
    });
  }

  form.noValidate = true;
  submit.disabled = false;
  submit.type = 'submit';
  if (editing) {
    try {
      original = service.findById(editId);
      if (!original) throw new Error('Không tìm thấy đề xuất đã lưu trên trình duyệt này.');
      if (original.status !== 'cho-duyet') throw new Error('Đề xuất đã rút hoặc đã được xét duyệt, bạn chỉ có thể xem lại thông tin.');
      fillOriginal();
      document.getElementById('proposal-title').textContent = 'Chỉnh sửa đề xuất';
      document.title = 'Chỉnh sửa đề xuất | Quản lý đồ án';
      document.querySelector('.breadcrumb [aria-current="page"]')?.replaceChildren(document.createTextNode('Chỉnh sửa đề xuất'));
      document.querySelector('.page-header__description').textContent = 'Cập nhật bản đề xuất thử đã lưu trên trình duyệt.';
      document.getElementById('proposal-confirm-title').textContent = 'Xác nhận chỉnh sửa';
      submit.textContent = 'Lưu thay đổi';
      confirm.textContent = 'Lưu thay đổi thử';
      form.querySelector('.proposal-form__cancel').href = `chi-tiet-de-xuat-da-luu.html?proposal=${encodeURIComponent(editId)}`;
    } catch (failure) {
      error.textContent = failure.message;
      error.hidden = false;
      form.querySelectorAll('fieldset').forEach(fieldset => { fieldset.disabled = true; });
      submit.disabled = true;
      return;
    }
  }
  form.dataset.proposalReady = 'true';
  fields.type.addEventListener('change', updateCourse);
  fields.attachment.addEventListener('change', () => {
    showAttachment();
  });
  removeAttachment.addEventListener('click', () => {
    fields.attachment.value = '';
    retainedAttachment = null;
    showAttachment();
    fields.attachment.focus();
  });
  form.addEventListener('reset', () => requestAnimationFrame(() => {
    updateCourse();
    clearErrors();
    if (editing) { fillOriginal(); return; }
    retainedAttachment = null;
    outline?.fill();
    showAttachment();
    supervisorId.value = '';
    document.getElementById('selected-supervisor').textContent = 'Chưa chọn giảng viên';
  }));
  window.addEventListener('pageshow', () => { if (!saved) updateCourse(); });
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (saved || saving) return;
    clearErrors();
    const checked = service.validate(readInput());
    if (checked.errors.length) { showErrors(checked.errors); return; }
    pending = checked.value;
    review(pending);
    reviewError.hidden = true;
    dialog.showModal();
  });
  dialog.addEventListener('close', () => { pending = null; if (!saved) submit.focus(); });
  confirm.addEventListener('click', () => {
    if (!pending || saved || saving) return;
    saving = true;
    confirm.disabled = true;
    try {
      const record = editing ? service.update(editId, pending, original.revision || 0) : service.create(pending);
      saved = true;
      dialog.close();
      form.querySelectorAll('fieldset').forEach(fieldset => { fieldset.disabled = true; });
      submit.disabled = true;
      submit.textContent = editing ? 'Đã lưu thay đổi' : 'Đã lưu đề xuất thử';
      result.replaceChildren(document.createTextNode(editing ? 'Đã lưu thay đổi trên trình duyệt này. Đã đưa vào hàng chờ của giảng viên trong bản demo cùng trình duyệt. ' : 'Đã lưu đề xuất thử trên trình duyệt này. Đã đưa vào hàng chờ của giảng viên trong bản demo cùng trình duyệt. '));
      const link = document.createElement('a');
      link.href = `chi-tiet-de-xuat-da-luu.html?proposal=${encodeURIComponent(record.id)}`;
      link.textContent = 'Xem đề xuất đã lưu';
      result.append(link);
      result.hidden = false;
      result.tabIndex = -1;
      result.focus();
    } catch (failure) {
      reviewError.textContent = failure.message;
      reviewError.hidden = false;
      reviewError.focus();
    } finally {
      saving = false;
      confirm.disabled = saved;
    }
  });
  updateCourse();
})();
