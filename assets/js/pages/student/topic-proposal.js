(() => {
  const form = document.getElementById('proposal-form');
  const service = globalThis.IE104?.services?.proposals;
  const requests = globalThis.IE104?.services?.requests;
  const files = globalThis.IE104?.services?.proposalFiles;
  const dialog = document.getElementById('proposal-confirm-dialog');
  if (!form || !service || !dialog) return;
  const fields = Object.fromEntries(Object.entries({ title: 'topic-name', type: 'topic-type', courseId: 'course', semester: 'semester', academicYear: 'academic-year', description: 'topic-description', objectives: 'topic-objectives', outcomes: 'expected-results', supervisorId: 'add-supervisor', attachment: 'proposal-attachment' }).map(([key, id]) => [key, document.getElementById(id)]));
  const outline = globalThis.IE104.ui?.proposalOutline;
  const pickers = globalThis.IE104.ui?.proposalPickers;
  const fieldFor = key => {
    const field = key ? fields[key] || outline?.getField(key) : undefined;
    return pickers?.fieldFor(field) || field;
  };
  const fixedCourse = document.getElementById('fixed-course');
  const topicCode = document.getElementById('proposal-topic-code');
  const topicCodeNote = document.getElementById('proposal-topic-code-note');
  const status = document.getElementById('course-status');
  const supervisorId = document.getElementById('supervisor-id');
  const submit = form.querySelector('.proposal-form__submit');
  const resubmit = form.querySelector('[data-resubmit-proposal]');
  const confirm = dialog.querySelector('[data-confirm-proposal]');
  const closeReview = dialog.querySelector('[command="close"]');
  const error = document.getElementById('proposal-error');
  const reviewError = dialog.querySelector('[data-proposal-error]');
  const result = document.getElementById('proposal-result');
  const successDialog = document.getElementById('proposal-success-dialog');
  const successTitle = document.getElementById('proposal-success-title');
  const successLink = document.getElementById('view-saved-proposal');
  const semesterNote = document.getElementById('proposal-legacy-semester');
  if (form.querySelector('[data-proposal-outline]') && (!outline || !globalThis.IE104.shared?.proposalOutline)) {
    error.textContent = 'Chưa tải đủ biểu mẫu đề cương. Hãy tải lại trang trước khi gửi.';
    error.hidden = false;
    return;
  }
  let pending = null;
  let saved = false;
  let saving = false;
  const params = new URLSearchParams(location.search);
  const editing = params.has('proposal');
  const editId = params.get('proposal');
  let legacy = null;
  let original = null;
  let retainedAttachment = null;
  let retainedAttachmentName = '';
  const attachmentPicker = fields.attachment.parentElement;
  const attachmentHint = document.getElementById('proposal-attachment-limit');
  const attachmentStatus = document.getElementById('proposal-attachment-status');
  const attachmentSelection = attachmentStatus.parentElement;
  const removeAttachment = attachmentSelection.querySelector('[data-remove-proposal-attachment]');
  const coverInput = document.getElementById('proposal-cover-image');
  const coverPicker = document.getElementById('proposal-cover-picker');
  const coverSelection = document.getElementById('proposal-cover-selection');
  const coverStatus = document.getElementById('proposal-cover-status');
  const coverError = document.getElementById('proposal-cover-error');
  const removeCover = coverSelection.querySelector('[data-remove-proposal-cover]');
  let retainedCover = null;

  const currentCover = () => coverInput.files[0] || retainedCover;

  function showCover() {
    const image = currentCover();
    coverPicker.hidden = Boolean(image);
    coverSelection.hidden = !image;
    coverStatus.textContent = image?.name || '';
  }

  function showAttachment() {
    const name = (fields.attachment.files[0] || retainedAttachment)?.name || retainedAttachmentName;
    attachmentPicker.hidden = Boolean(name);
    attachmentHint.hidden = Boolean(name);
    attachmentSelection.hidden = !name;
    attachmentStatus.textContent = name;
  }

  function fillOriginal() {
    Object.entries(fields).forEach(([key, field]) => {
      if (!['courseId', 'supervisorId', 'attachment'].includes(key)) field.value = original[key] ?? '';
    });
    updateCourse(original.courseId);
    supervisorId.value = original.supervisorId;
    supervisorId.dispatchEvent(new CustomEvent('change', { detail: { name: original.supervisorName } }));
    fields.attachment.value = '';
    retainedAttachment = original.attachment;
    retainedAttachmentName = original.attachmentName || '';
    showAttachment();
    coverInput.value = '';
    retainedCover = original.coverImage || null;
    coverError.hidden = true;
    showCover();
    outline?.fill(original);
  }

  function showLegacyValues() {
    if (!service.catalog.semesters.includes(original.semester)) {
      const placeholder = new Option('Chọn học kỳ', '', true, true);
      placeholder.disabled = true;
      fields.semester.prepend(placeholder);
      semesterNote.textContent = original.semester ? `Học kỳ đã lưu là ${original.semester}. Vui lòng chọn học kỳ tương ứng để cập nhật.` : 'Vui lòng chọn học kỳ để cập nhật.';
      semesterNote.hidden = false;
      fieldFor('semester').setAttribute('aria-describedby', semesterNote.id);
    }
  }

  function updateCourse(selectedCourse = fields.courseId.value) {
    const type = fields.type.value;
    const courses = Object.entries(service.catalog.types[type]?.courses || {});
    const fixed = courses.length === 1;
    if (fixed) {
      const [code, label] = courses[0];
      fields.courseId.replaceChildren(new Option(label, code, true, true));
      fixedCourse.value = code;
      status.textContent = `${label}. Môn học được chọn tự động theo loại đề tài.`;
    } else {
      const placeholder = new Option(courses.length ? 'Chọn môn học' : 'Chọn loại đề tài trước', '', true, true);
      placeholder.disabled = true;
      fields.courseId.replaceChildren(placeholder, ...courses.map(([code, label]) => new Option(label, code)));
      fields.courseId.value = courses.some(([code]) => code === selectedCourse) ? selectedCourse : '';
      fixedCourse.value = '';
      status.textContent = courses.length ? 'Vui lòng chọn môn học cho đồ án môn học.' : '';
    }
    fields.courseId.disabled = courses.length <= 1;
    fixedCourse.disabled = !fixed;
    outline?.setType(type);
    pickers?.syncSelects();
    updateTopicCode();
  }

  function updateTopicCode() {
    if (editing) {
      topicCode.value = original?.topicCode || original?.id || '';
      topicCodeNote.hidden = true;
      return;
    }
    const type = fields.type.value;
    try {
      topicCode.value = type ? service.nextTopicCode(type) : topicCode.defaultValue;
      topicCodeNote.textContent = 'Mã dự kiến được chốt khi lưu đề xuất.';
    } catch (failure) {
      topicCode.value = 'Chưa có mã';
      topicCodeNote.textContent = failure.message;
    }
  }

  function clearFieldError(field) {
    field.removeAttribute('aria-invalid');
    const descriptions = (field.getAttribute('aria-describedby') || '').split(' ').filter(id => id && !id.startsWith('proposal-field-error-'));
    if (descriptions.length) field.setAttribute('aria-describedby', descriptions.join(' '));
    else field.removeAttribute('aria-describedby');
  }

  function clearErrors() {
    form.querySelectorAll('[data-proposal-field-error]').forEach(node => node.remove());
    form.querySelectorAll('[aria-invalid="true"]').forEach(clearFieldError);
    error.hidden = true;
  }

  function readInput() {
    return { ...Object.fromEntries(Object.entries(fields).filter(([key]) => !['supervisorId', 'attachment'].includes(key)).map(([key, field]) => [key, field.value])), supervisorId: supervisorId.value, attachment: fields.attachment.files[0] || retainedAttachment, ...(outline ? { outline: outline.read() } : {}) };
  }

  function showErrors(errors) {
    const summary = [];
    error.hidden = false;
    errors.forEach(({ field: key, message }) => {
      const field = fieldFor(key);
      if (!field) {
        summary.push(message);
        return;
      }
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
    error.textContent = summary.join(' ') || 'Vui lòng kiểm tra các thông tin được đánh dấu bên dưới.';
    (fieldFor(errors[0].field) || error).focus();
  }

  function review(value) {
    const list = dialog.querySelector('[data-proposal-review]');
    list.replaceChildren();
    const catalog = legacy ? requests.proposalCatalog(legacy) : service.catalogFor(original);
    const type = catalog.types[value.type];
    const attachment = value.attachment ? `${value.attachment.name} (${value.attachment.size} byte)` : retainedAttachmentName;
    const rows = [['Tên đề tài', value.title], ['Loại đề tài', type.label], ['Môn học', type.courses[value.courseId]], ['Học kỳ - Năm học', `Học kỳ ${value.semester === 'he' ? '3' : value.semester} • ${value.academicYear}`], ['Giảng viên', catalog.supervisors[value.supervisorId]], ['Mô tả', value.description], ['Mục tiêu', value.objectives], ['Kết quả dự kiến', value.outcomes], ['Tài liệu', attachment || 'Không đính kèm']];
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
    const back = document.querySelector('.page-back-link');
    const breadcrumb = document.querySelector('.breadcrumb [href="dang-ky-de-tai.html"]');
    const oldNav = document.querySelector('.main-nav__link[aria-current="page"]');
    const topicsNav = document.querySelector('.main-nav__link[href="de-tai-cua-toi-sinh-vien.html"]');
    back.href = service.detailUrl(editId);
    back.lastChild.textContent = 'Quay lại chi tiết đề tài';
    breadcrumb.href = 'de-tai-cua-toi-sinh-vien.html';
    breadcrumb.textContent = 'Đề tài của tôi';
    oldNav?.removeAttribute('aria-current');
    topicsNav?.setAttribute('aria-current', 'page');
    try {
      original = service.findById(editId);
      if (!original) {
        legacy = requests?.findStudentProposal(editId);
        if (!legacy) throw new Error('Không tìm thấy đề xuất đã lưu trên trình duyệt này.');
        if (!requests.permissions(legacy).edit) throw new Error('Trạng thái hiện tại chỉ cho phép xem lại đề xuất.');
        original = requests.proposalForEdit(legacy);
        showLegacyValues();
        resubmit.disabled = resubmit.hidden = !requests.permissions(legacy).resubmit;
      } else if (original.status !== 'cho-duyet') throw new Error('Trạng thái hiện tại chỉ cho phép xem lại đề xuất.');
      document.getElementById('proposal-title').textContent = 'Chỉnh sửa đề xuất';
      document.title = 'Chỉnh sửa đề xuất | Quản lý đồ án';
      document.querySelector('.breadcrumb [aria-current="page"]')?.replaceChildren(document.createTextNode('Chỉnh sửa đề xuất'));
      document.querySelector('.page-header__description').textContent = 'Cập nhật thông tin đề xuất trong bản demo trên trình duyệt này.';
      submit.textContent = 'Lưu thay đổi';
      fillOriginal();
    } catch (failure) {
      error.textContent = failure.message;
      error.hidden = false;
      form.querySelectorAll('fieldset').forEach(fieldset => { fieldset.disabled = true; });
      submit.disabled = true;
      return;
    }
  }
  form.dataset.proposalReady = 'true';
  fields.type.addEventListener('change', () => updateCourse());
  supervisorId.addEventListener('change', () => {
    const note = document.getElementById('proposal-field-error-supervisorId');
    if (!supervisorId.value || !note) return;
    note.remove();
    clearFieldError(fields.supervisorId);
    if (!form.querySelector('[data-proposal-field-error]')) error.hidden = true;
  });
  fields.attachment.addEventListener('change', () => {
    showAttachment();
    if (!attachmentSelection.hidden) removeAttachment.focus();
  });
  coverInput.addEventListener('change', () => {
    coverError.hidden = true;
    const image = coverInput.files[0];
    if (!image) return;
    try {
      files.validateImage(image);
      showCover();
      removeCover.focus();
    } catch (failure) {
      coverInput.value = '';
      showCover();
      coverError.textContent = failure.message;
      coverError.hidden = false;
    }
  });
  removeCover.addEventListener('click', () => {
    coverInput.value = '';
    retainedCover = null;
    coverError.hidden = true;
    showCover();
    coverInput.focus();
  });
  removeAttachment.addEventListener('click', () => {
    fields.attachment.value = '';
    retainedAttachment = null;
    retainedAttachmentName = '';
    showAttachment();
    fields.attachment.focus();
  });
  form.addEventListener('reset', () => requestAnimationFrame(() => {
    updateCourse();
    clearErrors();
    if (editing) { fillOriginal(); return; }
    retainedAttachment = null;
    retainedCover = null;
    coverError.hidden = true;
    outline?.fill();
    showAttachment();
    showCover();
    supervisorId.value = '';
    supervisorId.dispatchEvent(new Event('change'));
  }));
  window.addEventListener('pageshow', () => {
    if (saved) return;
    updateCourse();
    showAttachment();
    showCover();
  });
  window.addEventListener('storage', event => {
    if (editing || saved || saving) return;
    const keys = [IE104.storage.proposalKey, IE104.services.lecturerTopicRepository?.key, null];
    if (keys.includes(event.key)) updateTopicCode();
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (saved || saving) return;
    clearErrors();
    const input = readInput();
    let checked;
    try {
      checked = legacy ? requests.validateProposal(input, legacy) : service.validate(input, original);
    } catch (failure) {
      showErrors([{ message: failure.message }]);
      return;
    }
    if (checked.errors.length) { showErrors(checked.errors); return; }
    const selectedFiles = { attachment: input.attachment, coverImage: currentCover() };
    if (event.submitter !== resubmit) {
      void saveProposal(checked.value, selectedFiles);
      return;
    }
    pending = { value: checked.value, selectedFiles };
    review(pending.value);
    reviewError.hidden = true;
    dialog.showModal();
  });
  dialog.addEventListener('close', () => {
    if (!saved) resubmit.focus();
    pending = null;
  });
  dialog.addEventListener('cancel', event => {
    if (saving) event.preventDefault();
  });

  function showSavedResult() {
    result.hidden = false;
    result.focus();
  }

  successDialog.addEventListener('close', showSavedResult);
  confirm.addEventListener('click', () => {
    if (pending) void saveProposal(pending.value, pending.selectedFiles, true);
  });

  async function saveProposal(value, { attachment, coverImage }, sendingAgain = false) {
    if (saved || saving) return;
    saving = true;
    const resubmitWasDisabled = resubmit.disabled;
    submit.disabled = resubmit.disabled = true;
    if (sendingAgain) confirm.disabled = closeReview.disabled = true;
    const staged = [];
    try {
      if (coverImage instanceof Blob) {
        coverImage = await files.stageImage(coverImage);
        staged.push(coverImage);
      }
      if (attachment instanceof Blob) {
        attachment = await files.stage(attachment);
        staged.push(attachment);
      }
      const input = { ...value, attachment, coverImage, keepAttachmentName: Boolean(retainedAttachmentName) };
      const record = legacy
        ? await requests.updateProposal(editId, input, original.revision, sendingAgain)
        : await service.withWriteLock(() => editing ? service.update(editId, input, original.revision || 0) : service.create(input), { reservesTopicCode: !editing });
      saved = true;
      topicCode.value = record.topicCode || record.id;
      topicCodeNote.hidden = true;
      for (const field of ['attachment', 'coverImage']) {
        const key = original?.[field]?.fileKey;
        if (key && key !== record[field]?.fileKey) void files.discard(key).catch(() => {});
      }
      if (sendingAgain) dialog.close();
      form.querySelectorAll('fieldset').forEach(fieldset => { fieldset.disabled = true; });
      submit.textContent = editing ? 'Đã lưu thay đổi' : 'Đã lưu đề xuất';
      result.replaceChildren(document.createTextNode(sendingAgain ? 'Đã lưu thay đổi và chuyển đề xuất về Chờ duyệt trong bản demo trên trình duyệt này. '
        : editing ? 'Đã lưu thay đổi trên trình duyệt này. '
          : 'Đã lưu đề xuất và thông tin giảng viên đã chọn trên trình duyệt này. '));
      const link = document.createElement('a');
      link.href = service.detailUrl(record.id);
      link.textContent = editing ? 'Xem chi tiết' : 'Xem đề xuất';
      result.append(link);
      successTitle.textContent = sendingAgain ? 'Gửi lại đề xuất thành công' : editing ? 'Cập nhật đề xuất thành công' : 'Gửi đề xuất thành công';
      successLink.href = link.href;
      successLink.textContent = link.textContent;
      successDialog.showModal();
    } catch (failure) {
      if (!saved) await Promise.allSettled(staged.map(ref => files.discard(ref.fileKey)));
      if (sendingAgain) {
        reviewError.textContent = failure.message;
        reviewError.hidden = false;
        reviewError.focus();
      } else {
        showErrors([{ message: failure.message }]);
      }
    } finally {
      saving = false;
      submit.disabled = saved;
      resubmit.disabled = saved || resubmitWasDisabled;
      if (sendingAgain) {
        confirm.disabled = saved;
        closeReview.disabled = false;
      }
    }
  }
  updateCourse();
})();
