(() => {
  const app = globalThis.IE104;
  const form = document.querySelector('#create-topic-form, #topic-edit-form');
  if (!form || !app?.services?.lecturerTopicEditor) return;
  const service = app.services.lecturerTopicEditor;
  const fileService = app.services.lecturerTopicFiles;
  const editing = form.id === 'topic-edit-form';
  const fieldIds = {
    id: 'topic-code', title: 'topic-name', topicType: 'topic-type', course: 'course',
    semester: 'semester', academicYear: 'academic-year', deadline: 'registration-closes',
    startsAt: 'topic-start-date', progressReportDate: 'topic-progress-report-date',
    finalReportDate: 'topic-final-report-date', description: 'topic-description',
    objectives: 'topic-objectives', outcomes: 'topic-outcomes', requirements: 'topic-requirements',
    methodAndScope: 'topic-method-and-scope', plan: 'topic-plan',
    minMembers: 'minimum-members', maxMembers: 'maximum-members',
  };
  const fields = Object.fromEntries(Object.entries(fieldIds).map(([key, id]) => [key, document.getElementById(id)]));
  const datePicker = app.ui?.proposalDatePicker;
  const pickers = app.ui?.proposalPickers;
  const courseOptions = Object.fromEntries(
    Object.keys(service.catalog.courses).map(course => [course, window.UITLecturerCatalog.subjectLabel({ topicType: 'course', course }, true)])
  );
  const fixedCourseTypes = { graduation: 'do-an-tot-nghiep', thesis: 'khoa-luan' };
  const submit = form.querySelector('button[type="submit"]');
  const submitLabel = submit.textContent.trim();
  const successDialog = document.getElementById(editing ? 'topic-updated-dialog' : 'topic-created-dialog');
  const viewSavedTopic = document.getElementById(editing ? 'view-updated-topic' : 'view-created-topic');
  successDialog?.querySelector('.success-dialog__close').addEventListener('click', () => successDialog.close());
  successDialog?.addEventListener('close', () => viewSavedTopic.focus());
  const listUrl = app.services.lecturerTopics.returnUrl('created', new URLSearchParams(location.search).get('return'), location.href);
  document.querySelectorAll('[data-topic-editor-return]').forEach(link => { link.href = listUrl; });
  const status = document.createElement('p'); status.className = 'topic-editor-status'; status.setAttribute('role', 'status'); status.tabIndex = -1;
  const error = document.createElement('div'); error.className = 'topic-editor-error'; error.setAttribute('role', 'alert'); error.tabIndex = -1; error.hidden = true;
  form.prepend(status);
  form.querySelector('.topic-form__actions').before(error);
  let original = null; let saving = false; let dirty = false; let committed = false;
  const files = {};
  const removed = {};
  const pendingFiles = new Map();
  const inlineErrors = new Map();
  const owner = app.data.currentLecturer.id;
  const localDate = value => {
    const timestamp = Date.parse(value);
    return Number.isFinite(timestamp) ? new Date(timestamp + 7 * 3600000).toISOString().slice(0, 16) : '';
  };
  function select(field, options, value, placeholder = field.querySelector('option[value=""]')?.textContent || 'Chọn giá trị') {
    const placeholderOption = new Option(placeholder, '');
    placeholderOption.disabled = field.hasAttribute('data-proposal-picker');
    field.replaceChildren(placeholderOption, ...Object.entries(options).map(([key,label]) => new Option(label,key)));
    field.value = String(value ?? '');
  }
  function read() {
    return Object.fromEntries(Object.entries(fields).map(([key, field]) => {
      if (key === 'id' && original) return [key, original.id];
      const value = datePicker && field?.matches('input[data-proposal-picker]') ? datePicker.read(field) : field?.value;
      return [key, value || ''];
    }));
  }
  function refreshCode() {
    const code = service.nextCode(fields.topicType.value, fields.course.value);
    fields.id.value = code || (fields.topicType.value === 'course' ? 'Chọn môn học' : fields.id.defaultValue);
    return code;
  }
  function showErrors(errors) {
    for (const field of inlineErrors.keys()) clearFieldError(field);
    const fieldMessages = new Map();
    const generalMessages = [];
    for (const item of errors) {
      const field = errorField(item.field);
      if (!field) generalMessages.push(item.message);
      else if (!fieldMessages.has(field) || item.field !== 'id') fieldMessages.set(field, item.message);
    }
    for (const [field, message] of fieldMessages) {
      const note = document.createElement('p');
      note.id = `${field.id}-error`;
      note.className = 'topic-form__field-error';
      note.textContent = message;
      const control = field.closest('.proposal-date-control, .number-stepper') || field;
      control.after(note);
      field.setAttribute('aria-invalid', 'true');
      field.setAttribute('aria-describedby', `${field.getAttribute('aria-describedby') || ''} ${note.id}`.trim());
      inlineErrors.set(field, note);
    }
    error.textContent = generalMessages.join(' ');
    error.hidden = !generalMessages.length;
    const firstInvalid = form.querySelector('[aria-invalid="true"]:not([type="file"])');
    (firstInvalid || error).focus();
  }
  function errorField(key) {
    const field = key === 'id' && !editing ? (fields.topicType.value === 'course' ? fields.course : fields.topicType) : fields[key];
    return pickers?.fieldFor(field) || field;
  }
  function clearFieldError(field) {
    field.removeAttribute('aria-invalid');
    const note = inlineErrors.get(field);
    if (note) {
      const descriptions = (field.getAttribute('aria-describedby') || '').split(/\s+/).filter(id => id && id !== note.id);
      if (descriptions.length) field.setAttribute('aria-describedby', descriptions.join(' '));
      else field.removeAttribute('aria-describedby');
      note.remove();
      inlineErrors.delete(field);
    }
  }
  try {
    if (editing) original = app.services.lecturerTopics.get('created', new URLSearchParams(location.search).get('topic') ?? app.data.lecturerRealDefaultTopicId ?? 'DA001');
    const types = { ...service.catalog.types };
    if (original?.topicType === 'thesis' && original.sourceRecord?.type === 'Luận văn thạc sĩ') {
      types.thesis = original.sourceRecord.type;
    }
    select(fields.topicType, types, original?.topicType);
    select(fields.course, courseOptions, original?.course);
    select(fields.semester, service.catalog.semesters, original?.semester);
    select(fields.academicYear, Object.fromEntries(service.catalog.years.map(year => [year, year.replace('-', ' – ')])), original?.academicYear);
    if (original) {
      const crumb = document.querySelector('.breadcrumb__item:nth-last-child(2) span'); if (crumb) crumb.textContent = original.title;
      const values = {
        ...original,
        id: original.displayId || original.id,
        objectives: original.objectives?.join('\n'),
        outcomes: original.outcomes?.join('\n'),
        requirements: original.requirements?.join('\n'),
        minMembers: original.registration?.minMembers,
        maxMembers: original.registration?.maxMembers,
        deadline: localDate(original.registration?.deadline),
        startsAt: localDate(original.startsAt).slice(0, 10),
        progressReportDate: localDate(original.progressReportDate).slice(0, 10),
        finalReportDate: localDate(original.finalReportDate).slice(0, 10),
      };
      for (const [key, field] of Object.entries(fields)) {
        const value = values[key] ?? '';
        if (datePicker && field.matches('input[data-proposal-picker]')) datePicker.fill(field, value);
        else field.value = value;
      }
      if (!values.progressReportDate && !values.finalReportDate) {
        for (const field of [fields.startsAt, fields.progressReportDate, fields.finalReportDate]) {
          field.required = false;
          field.labels[0].querySelector('.topic-required').hidden = true;
        }
      }
      if (original.semester === '3' || original.semester === 3) fields.semester.value = 'summer';
      const detail = new URL(app.services.lecturerTopics.detailUrl(original), location.href);
      detail.searchParams.set('return', listUrl);
      document.querySelectorAll('[data-topic-editor-detail]').forEach(link => { link.href = detail.href; });
    }
    for (const input of [fields.minMembers, fields.maxMembers]) app.ui?.numberStepper?.enhance(input);
    form.querySelectorAll('[data-topic-file]').forEach(panel => {
      const purpose = panel.dataset.topicFile;
      const trigger = panel.querySelector('.topic-file-picker__trigger');
      const input = trigger.querySelector('input');
      const hint = panel.querySelector('.topic-file-picker__hint');
      const selection = panel.querySelector('.topic-file-picker__selection');
      const name = selection.querySelector('.topic-file-picker__name');
      const remove = selection.querySelector('button');
      const fileError = panel.querySelector('.topic-file-picker__error');
      const initialName = original?.[`${purpose}Ref`]?.name || (purpose === 'attachment' ? original?.attachmentName : '') || '';

      function displayName(filename) {
        name.textContent = filename;
        trigger.hidden = Boolean(filename);
        hint.hidden = Boolean(filename);
        selection.hidden = !filename;
      }

      function reportFileError(message) {
        fileError.textContent = message;
        fileError.hidden = !message;
        if (message) input.setAttribute('aria-invalid', 'true');
        else input.removeAttribute('aria-invalid');
      }

      displayName(initialName);
      input.addEventListener('change', async () => {
        const file = input.files[0];
        if (!file) return;
        reportFileError('');
        pendingFiles.set(purpose, file);
        submit.disabled = true;
        try {
          await fileService.validateSelection(file, purpose);
          if (pendingFiles.get(purpose) !== file) return;
          files[purpose] = file;
          removed[purpose] = false;
          dirty = true;
          displayName(file.name);
          remove.focus();
        } catch (failure) {
          if (pendingFiles.get(purpose) !== file) return;
          input.value = '';
          reportFileError(failure.message);
          input.focus();
        } finally {
          if (pendingFiles.get(purpose) === file) pendingFiles.delete(purpose);
          submit.disabled = saving || pendingFiles.size > 0;
        }
      });
      remove.addEventListener('click', () => {
        delete files[purpose];
        removed[purpose] = Boolean(initialName);
        input.value = '';
        dirty = true;
        reportFileError('');
        displayName('');
        input.focus();
      });
    });
    const courseState = () => {
      const selectedCourse = fields.course.value;
      const type = fields.topicType.value;
      const requireMethodPlan = service.requiresMethodPlan(type, original);
      for (const field of [fields.methodAndScope, fields.plan]) {
        field.required = requireMethodPlan;
        field.labels[0].querySelector('.topic-required').hidden = !requireMethodPlan;
        if (!requireMethodPlan && !field.value.trim() && field.hasAttribute('aria-invalid')) clearFieldError(field);
      }
      fields.course.disabled = type !== 'course';
      if (fields.course.disabled) {
        const fixedCourses = app.services.proposals?.catalog.types[fixedCourseTypes[type]]?.courses;
        const [code, label] = fixedCourses ? Object.entries(fixedCourses)[0] : ['', ''];
        fields.course.replaceChildren(new Option(label || service.catalog.types[type] || 'Chọn loại đề tài trước', code));
      } else {
        select(fields.course, courseOptions, Object.hasOwn(courseOptions, selectedCourse) ? selectedCourse : '', 'Chọn môn học');
      }
      pickers?.syncSelects();
      if (!editing) refreshCode();
    };
    fields.topicType.addEventListener('change', courseState); courseState();
    if (!editing) fields.course.addEventListener('change', refreshCode);
    form.addEventListener('change', () => {
      if (!inlineErrors.size) return;
      const invalidFields = new Set(service.validate(read(), original).errors.map(item => errorField(item.field)));
      for (const field of inlineErrors.keys()) {
        if (!invalidFields.has(field)) clearFieldError(field);
      }
    });
    form.noValidate = true; submit.disabled = false; submit.removeAttribute('title');
    status.textContent = '';
    form.dataset.topicEditorReady = 'true';
  } catch (failure) { submit.disabled = true; showErrors([{ message: failure.message }]); return; }
  form.addEventListener('input', () => { dirty = true; });
  form.addEventListener('submit', async event => {
    event.preventDefault(); if (saving || committed || pendingFiles.size) return;
    const input = read();
    try { if (!editing) input.id = refreshCode(); }
    catch (failure) { showErrors([{ message: failure.message }]); return; }
    const checked = service.validate(input, original);
    if (checked.errors.length) { showErrors(checked.errors); return; }
    for (const field of inlineErrors.keys()) clearFieldError(field);
    error.hidden = true; saving = true; submit.disabled = true; form.setAttribute('aria-busy','true'); status.textContent = 'Đang lưu đề tài…';
    if (!editing) submit.textContent = 'Đang tạo đề tài…';
    const staged = []; const updates = {};
    const controls = [...form.querySelectorAll('input,select,textarea,button')].map(node => [node,node.disabled]);
    controls.forEach(([node]) => { node.disabled = true; });
    pickers?.syncSelects();
    let topic;
    try {
      for (const purpose of ['image','attachment']) {
        if (removed[purpose]) updates[purpose] = null;
        else if (files[purpose]) { const ref = await fileService.stage(checked.value.id,purpose,files[purpose],owner); staged.push(ref); updates[purpose] = ref; }
      }
      const commit = () => editing ? service.update(original.id,input,original.revision || 0,updates,owner) : service.create(input,updates,owner);
      topic = navigator.locks?.request ? await navigator.locks.request(app.services.lecturerTopicRepository.key,commit) : commit();
      committed = true; dirty = false; status.textContent = editing ? '' : 'Đã lưu đề tài trên trình duyệt này.';
      const old = Object.keys(updates).map(purpose => original?.[`${purpose}Ref`]).filter(Boolean);
      fileService.discard(old).catch(() => {});
    } catch (failure) { status.textContent = 'Chưa lưu thay đổi.'; showErrors([{ message: failure.message }]); }
    finally {
      if (!committed) {
        await fileService.discard(staged).catch(() => {});
        submit.textContent = submitLabel;
        controls.forEach(([node,disabled]) => { node.disabled = disabled; });
      }
      saving = false;
      submit.disabled = committed;
      form.removeAttribute('aria-busy');
    }
    if (!committed) return;
    const url = new URL(app.services.lecturerTopics.detailUrl(topic), location.href);
    url.searchParams.set('return', listUrl);
    if (successDialog?.showModal) {
      successDialog.querySelector('.success-dialog__link').href = url.href;
      viewSavedTopic.href = url.href;
      viewSavedTopic.hidden = false;
      submit.hidden = true;
      if (editing) form.querySelector('.topic-form__cancel').hidden = true;
      successDialog.showModal();
    } else {
      location.assign(url);
    }
  });
  window.addEventListener('storage', event => { if (event.key === app.services.lecturerTopicRepository.key || event.key === null) status.textContent = 'Danh sách đề tài đã đổi ở tab khác. Khi lưu, hệ thống sẽ kiểm tra lại phiên bản.'; });
  window.addEventListener('pageshow',event => { if (event.persisted && !dirty && !saving && submit.disabled) location.reload(); });
  window.addEventListener('beforeunload', event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } });
})();
