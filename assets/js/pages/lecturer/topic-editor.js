(() => {
  const app = globalThis.IE104;
  const form = document.querySelector('#create-topic-form, #topic-edit-form');
  if (!form || !app?.services?.lecturerTopicEditor) return;
  const service = app.services.lecturerTopicEditor;
  const fileService = app.services.lecturerTopicFiles;
  const editing = form.id === 'topic-edit-form';
  const names = editing
    ? ['ma-de-tai','ten-de-tai','loai-de-tai','mon-hoc','hoc-ky','nam-hoc','mo-ta','muc-tieu','ket-qua-du-kien','yeu-cau-thuc-hien','so-thanh-vien-toi-thieu','so-thanh-vien-toi-da','linh-vuc','cong-nghe-goi-y','mo-dang-ky-luc','dong-dang-ky-luc','ngay-bat-dau-thuc-hien','han-hoan-thanh-de-tai']
    : ['topic-code','topic-name','topic-type','course','semester','academic-year','topic-description','topic-objectives','topic-outcomes','topic-requirements','minimum-members','maximum-members'];
  const keys = ['id','title','topicType','course','semester','academicYear','description','objectives','outcomes','requirements','minMembers','maxMembers','domain','technologies','opensAt','deadline','startsAt','completesAt'];
  const fields = Object.fromEntries(names.map((name, index) => [keys[index], document.getElementById(name)]));
  if (!editing) fields.deadline = document.getElementById('registration-closes');
  const submit = form.querySelector('button[type="submit"]');
  if (!editing) { const cancel = form.querySelector('.topic-form__cancel'); if (cancel) cancel.href = app.services.lecturerTopics.returnUrl('created',new URLSearchParams(location.search).get('return'),location.href); }
  const status = document.createElement('p'); status.className = 'topic-editor-status'; status.setAttribute('role', 'status'); status.tabIndex = -1;
  const error = document.createElement('div'); error.className = 'topic-editor-error'; error.setAttribute('role', 'alert'); error.tabIndex = -1; error.hidden = true;
  form.prepend(error, status);
  let original = null; let saving = false; let dirty = false; let previewUrl; const files = {}; const removed = {};
  const owner = app.data.currentLecturer.id;
  const localDate = value => value ? new Date(Date.parse(value) + 7 * 3600000).toISOString().slice(0,16) : '';
  function select(field, options, value) {
    field.replaceChildren(new Option('Chọn giá trị', ''), ...Object.entries(options).map(([key,label]) => new Option(label,key)));
    field.value = String(value ?? '');
  }
  function read() { return Object.fromEntries(Object.entries(fields).map(([key, field]) => [key, field?.value || ''])); }
  function showErrors(errors) {
    form.querySelectorAll('[aria-invalid]').forEach(node => node.removeAttribute('aria-invalid'));
    const list = document.createElement('ul');
    for (const item of errors) {
      const li = document.createElement('li'); const field = fields[item.field];
      if (field) { field.setAttribute('aria-invalid','true'); const link = document.createElement('a'); link.href = `#${field.id}`; link.textContent = `${form.querySelector(`label[for="${field.id}"]`)?.textContent.trim() || item.field}: ${item.message}`; link.addEventListener('click', event => { event.preventDefault(); field.focus(); }); li.append(link); }
      else li.textContent = item.message;
      list.append(li);
    }
    error.replaceChildren(list); error.hidden = false; (fields[errors[0]?.field] || error).focus();
  }
  try {
    if (editing) original = app.services.lecturerTopics.get('created', new URLSearchParams(location.search).get('topic') ?? 'DA001');
    select(fields.topicType, service.catalog.types, original?.topicType);
    select(fields.course, service.catalog.courses, original?.course);
    select(fields.semester, service.catalog.semesters, original?.semester);
    select(fields.academicYear, Object.fromEntries(service.catalog.years.map(year => [year,year])), original?.academicYear);
    if (original) {
      const heading = document.querySelector('.topic-status'); if (heading) heading.textContent = `Trạng thái đề tài: ${original.statusLabel}`;
      const note = document.querySelector('.demo-notice'); if (note) note.hidden = true;
      const crumb = document.querySelector('.breadcrumb__item:nth-last-child(2) span'); if (crumb) crumb.textContent = original.title;
      const values = { ...original, objectives: original.objectives?.join('\n'), outcomes: original.outcomes?.join('\n'), requirements: original.requirements?.join('\n'), minMembers: original.registration?.minMembers, maxMembers: original.registration?.maxMembers, deadline: localDate(original.registration?.deadline), opensAt: localDate(original.registration?.opensAt), startsAt: localDate(original.startsAt).slice(0,10), completesAt: localDate(original.completesAt) };
      for (const [key,field] of Object.entries(fields)) if (field) field.value = values[key] ?? '';
      fields.id.readOnly = true;
    } else document.querySelectorAll('.topic-supervisor__details dd').forEach((node,index) => { node.textContent = index === 0 ? app.data.currentLecturer.name : 'Chưa có thông tin'; });
    for (const purpose of ['image','attachment']) {
      const fieldset = document.querySelector(purpose === 'image' ? '.topic-form__image, .topic-edit-form__image' : '.topic-form__attachment, [data-editor-attachment]');
      let input = fieldset.querySelector('input[type="file"]');
      if (!input) { const label = document.createElement('label'); label.textContent = purpose === 'image' ? 'Chọn ảnh PNG/JPG' : 'Chọn tài liệu PDF/DOC/DOCX/TXT'; input = document.createElement('input'); input.type = 'file'; input.id = `editor-${purpose}`; label.htmlFor = input.id; fieldset.append(label,input); }
      input.accept = purpose === 'image' ? 'image/png,image/jpeg' : '.pdf,.doc,.docx,.txt';
      const note = document.createElement('p'); note.textContent = original?.[`${purpose}Ref`]?.name || (purpose === 'attachment' ? original?.attachmentName : '') || 'Chưa chọn tệp';
      const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = purpose === 'image' ? 'Gỡ ảnh đã chọn' : 'Gỡ tài liệu';
      const initial = Boolean(original?.[`${purpose}Ref`] || (purpose === 'attachment' && original?.attachmentName));
      remove.disabled = !initial; fieldset.append(note,remove);
      if (editing && purpose === 'image') fieldset.querySelectorAll('.topic-image__actions').forEach(node => { node.hidden = true; });
      const preview = purpose === 'image' ? fieldset.querySelector('.topic-image-placeholder, .topic-image__placeholder') : null;
      const paint = blob => {
        if (!preview) return; if (previewUrl) URL.revokeObjectURL(previewUrl);
        preview.replaceChildren(); if (!blob) { preview.textContent = 'Chưa có ảnh minh họa'; return; }
        previewUrl = URL.createObjectURL(blob); const image = document.createElement('img'); image.src = previewUrl; image.alt = 'Ảnh minh họa đề tài đang chỉnh sửa'; preview.append(image);
      };
      if (original?.imageRef && purpose === 'image') fileService.read(original.id,'image').then(value => { if (!files.image && !removed.image) paint(value?.blob); }).catch(failure => { note.textContent = failure.message; });
      input.addEventListener('change', () => {
        const file = input.files[0]; if (!file) return;
        try { fileService.validate(file,purpose); files[purpose] = file; removed[purpose] = false; note.textContent = file.name; remove.disabled = false; if (purpose === 'image') paint(file); dirty = true; error.hidden = true; }
        catch (failure) { input.value = ''; showErrors([{ message: failure.message }]); }
      });
      remove.addEventListener('click', () => { files[purpose] = null; removed[purpose] = true; input.value = ''; remove.disabled = true; note.textContent = 'Tệp sẽ được gỡ khi lưu thay đổi.'; if (purpose === 'image') paint(null); dirty = true; });
    }
    const courseState = () => { fields.course.disabled = fields.topicType.value !== 'course'; if (fields.course.disabled) fields.course.value = ''; };
    fields.topicType.addEventListener('change', courseState); courseState();
    form.noValidate = true; submit.disabled = false; submit.removeAttribute('title');
    status.textContent = 'Bản demo: dữ liệu và tệp lưu trên trình duyệt này.';
    form.dataset.topicEditorReady = 'true';
  } catch (failure) { submit.disabled = true; showErrors([{ message: failure.message }]); return; }
  form.addEventListener('input', () => { dirty = true; });
  form.addEventListener('submit', async event => {
    event.preventDefault(); if (saving) return;
    const input = read(); const checked = service.validate(input, original);
    if (checked.errors.length) { showErrors(checked.errors); return; }
    error.hidden = true; saving = true; submit.disabled = true; form.setAttribute('aria-busy','true'); status.textContent = 'Đang lưu đề tài…';
    const staged = []; const updates = {}; let committed = false;
    const controls = [...form.querySelectorAll('input,select,textarea,button')].map(node => [node,node.disabled]);
    controls.forEach(([node]) => { node.disabled = true; });
    try {
      for (const purpose of ['image','attachment']) {
        if (removed[purpose]) updates[purpose] = null;
        else if (files[purpose]) { const ref = await fileService.stage(checked.value.id,purpose,files[purpose],owner); staged.push(ref); updates[purpose] = ref; }
      }
      const commit = () => editing ? service.update(original.id,input,original.revision || 0,updates,owner) : service.create(input,updates,owner);
      const topic = navigator.locks?.request ? await navigator.locks.request(app.services.lecturerTopicRepository.key,commit) : commit();
      committed = true; dirty = false; status.textContent = 'Đã lưu đề tài trên trình duyệt này.';
      const old = ['image','attachment'].map(purpose => original?.[`${purpose}Ref`]).filter(ref => ref && Object.values(updates).every(value => value?.key !== ref.key));
      fileService.discard(old).catch(() => {});
      const url = new URL(app.services.lecturerTopics.detailUrl(topic),location.href); url.searchParams.set('return',app.services.lecturerTopics.returnUrl('created',new URLSearchParams(location.search).get('return'),location.href)); location.assign(url);
    } catch (failure) { status.textContent = 'Chưa lưu thay đổi.'; showErrors([{ message: failure.message }]); }
    finally { if (!committed) await fileService.discard(staged).catch(() => {}); saving = false; controls.forEach(([node,disabled]) => { node.disabled = disabled; }); submit.disabled = committed; form.removeAttribute('aria-busy'); }
  });
  window.addEventListener('storage', event => { if (event.key === app.services.lecturerTopicRepository.key || event.key === null) status.textContent = 'Danh sách đề tài đã đổi ở tab khác. Khi lưu, hệ thống sẽ kiểm tra lại phiên bản.'; });
  window.addEventListener('pageshow',event => { if (event.persisted && !dirty && !saving && submit.disabled) location.reload(); });
  window.addEventListener('beforeunload', event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } });
  window.addEventListener('pagehide', () => { if (previewUrl) URL.revokeObjectURL(previewUrl); });
})();
