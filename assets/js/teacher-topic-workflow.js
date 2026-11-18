/* Bind behavior to existing markup. Do not rebuild layouts or inject stylesheets. */
(() => {
  'use strict';
  const store = window.TeacherTopicStore;
  const $ = (selector, root = document) => root.querySelector(selector);
  const createForm = $('#create-topic-form');
  const editForm = $('#topic-edit-form');
  const detail = $('.teacher-created-detail-page .topic-detail');
  const list = $('.teacher-created-topics-page .topic-list');
  const form = createForm || editForm;
  if (!store || (!form && !detail && !list)) return;
  const node = (tag, text) => {
    const element = document.createElement(tag);
    if (text !== undefined) element.textContent = text;
    return element;
  };
  const detailURL = id => 'chi-tiet-de-tai-da-tao-giang-vien.html?id=' + encodeURIComponent(id);
  const label = (key, value) => store.catalogs[key]?.[value] || value || 'Chưa có thông tin';
  const demo = 'Dữ liệu demo chỉ lưu trong trình duyệt này, chưa đồng bộ máy chủ.';
  let message = $('#topic-form-notice, #topic-save-notice, .created-detail-note');
  if (!message) {
    message = node('p');
    message.className = 'topic-list__status';
    $('[data-topic-results]')?.prepend(message);
  }
  message.setAttribute('role', 'status');
  message.textContent = demo;
  const error = text => { message.textContent = text + ' ' + demo; message.setAttribute('role', 'alert'); };
  function imageIn(container, data, alt) {
    if (!data) return;
    const image = node('img');
    image.src = data;
    image.alt = alt;
    image.width = 320;
    image.height = 180;
    container.removeAttribute('aria-hidden');
    container.removeAttribute('role');
    container.removeAttribute('aria-label');
    container.replaceChildren(image);
  }
  let records;
  try { records = store.read(); }
  catch (e) {
    error('Không đọc được dữ liệu đã lưu: ' + e.message);
    if (form) for (const control of form.elements) control.disabled = true;
    if (detail) { detail.hidden = true; $('.page-header__actions').hidden = true; }
    return;
  }

  if (list) {
    const templates = new Map([...list.children].map(item => [$('.topic-card', item).dataset.topicId, item.cloneNode(true)]));
    function render() {
      const items = [];
      for (const topic of records) {
        // Clone the original complete card, preserving icons, metadata and CSS hooks.
        const item = (templates.get(topic.id) || templates.values().next().value).cloneNode(true);
        item.hidden = false;
        const card = $('.topic-card', item);
        Object.assign(card.dataset, { topicId: topic.id, topicType: topic.type, course: topic.course,
          status: topic.status, hocKy: topic.year + '-' + topic.semester });
        const title = $('.topic-card__title', card);
        title.textContent = topic.name;
        title.id = 'created-topic-' + items.length;
        card.setAttribute('aria-labelledby', title.id);
        const metadata = card.querySelectorAll('.topic-card__meta-text');
        function setMeta(index, text) {
          const hiddenLabel = $('.visually-hidden', metadata[index]);
          metadata[index].replaceChildren(...(hiddenLabel ? [hiddenLabel] : []), document.createTextNode(text));
        }
        setMeta(0, topic.code);
        setMeta(1, label('course', topic.course));
        setMeta(2, label('semester', topic.semester) + ' • ' + label('year', topic.year));
        const time = $('time', card);
        time.dateTime = topic.created;
        time.textContent = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(topic.created));
        const badge = $('.topic-card__status', card);
        badge.textContent = topic.status === 'closed' ? 'Đã đóng đăng ký' : 'Đang mở đăng ký';
        badge.className = 'topic-card__status topic-card__status--' + (topic.status === 'closed' ? 'closed' : 'open');
        const link = $('.topic-card__detail-link', card);
        link.href = detailURL(topic.id);
        link.setAttribute('aria-label', 'Xem chi tiết ' + topic.name);
        if (topic.image) imageIn($('.topic-card__media', card), topic.image, 'Ảnh minh họa ' + topic.name);
        items.push(item);
      }
      list.replaceChildren(...items);
      document.dispatchEvent(new Event('ie104:topics-updated'));
    }
    render();
    window.addEventListener('storage', event => {
      if (event.key !== store.key && event.key !== null) return;
      try { records = store.read(); render(); } catch (e) { error(e.message); }
    });
    return;
  }

  const id = new URLSearchParams(location.search).get('id');
  // Existing direct links without an ID refer to the original library demo only.
  const topic = records.find(record => record.id === (id === null ? 'DA001' : id));
  if (!createForm && (!topic || (editForm && !id))) {
    error('Không tìm thấy đề tài. Hãy quay lại danh sách và chọn đề tài cần mở.');
    if (form) for (const control of form.elements) control.disabled = true;
    if (detail) { detail.hidden = true; $('.page-header__actions').hidden = true; }
    return;
  }
  if (detail) {
    $('#topic-summary-title').textContent = topic.name;
    const metadata = [topic.code, label('type', topic.type), label('course', topic.course), label('semester', topic.semester), label('year', topic.year)];
    detail.querySelectorAll('.topic-summary__meta dd').forEach((dd, i) => dd.textContent = metadata[i]);
    for (const key of ['description', 'objectives', 'outcomes', 'requirements']) {
      const section = $('.topic-' + key, detail);
      const content = $('p, ul', section);
      const lines = (topic[key] || 'Chưa có thông tin').split('\n');
      if (content.tagName === 'UL') content.replaceChildren(...lines.map(line => node('li', line)));
      else content.replaceChildren(...lines.flatMap((line, i) => i ? [node('br'), document.createTextNode(line)] : [document.createTextNode(line)]));
    }
    $('.topic-registration__members span').textContent = `Nhóm gồm ${topic.minimum}–${topic.maximum} sinh viên`;
    const time = $('.topic-registration time');
    if (topic.closes) {
      time.dateTime = topic.closes + ':00+07:00';
      time.textContent = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(time.dateTime));
    } else { time.removeAttribute('datetime'); time.textContent = 'Chưa có thông tin'; }
    if (topic.image) imageIn($('.topic-summary__image'), topic.image, 'Ảnh minh họa ' + topic.name);
    $('.topic-edit-link').href = 'chinh-sua-de-tai-giang-vien.html?id=' + encodeURIComponent(topic.id);
    const badge = $('.created-detail-heading .status-badge');
    badge.textContent = topic.status === 'closed' ? 'Đã đóng đăng ký' : 'Đang mở đăng ký';
    badge.className = 'status-badge status-badge--' + (topic.status === 'closed' ? 'closed' : 'open');
    document.querySelectorAll('.confirmation-dialog strong').forEach(strong => strong.textContent = topic.name);
    const attachmentName = $('.topic-attachments__file span');
    const download = $('.topic-attachments__download');
    attachmentName.textContent = topic.attachment?.name || 'Chưa có tài liệu đính kèm';
    if (topic.attachment?.data) {
      download.disabled = false;
      download.removeAttribute('title');
      download.onclick = () => {
        const link = node('a'); link.href = topic.attachment.data; link.download = topic.attachment.name;
        document.body.append(link); link.click(); link.remove();
      };
    }
    if (new URLSearchParams(location.search).has('saved')) message.textContent = 'Đã lưu đề tài trong trình duyệt. ' + demo;
    document.title = topic.name + ' | Chi tiết đề tài';
    return;
  }

  const mode = editForm ? 'edit' : 'create';
  const ids = editForm ? {
    code: 'ma-de-tai', name: 'ten-de-tai', type: 'loai-de-tai', course: 'mon-hoc', semester: 'hoc-ky', year: 'nam-hoc',
    description: 'mo-ta', objectives: 'muc-tieu', requirements: 'yeu-cau-thuc-hien', minimum: 'so-thanh-vien-toi-thieu',
    maximum: 'so-thanh-vien-toi-da', opens: 'mo-dang-ky-luc', closes: 'dong-dang-ky-luc', starts: 'ngay-bat-dau-thuc-hien',
    ends: 'han-hoan-thanh-de-tai', field: 'linh-vuc', technology: 'cong-nghe-goi-y',
  } : {
    code: 'topic-code', name: 'topic-name', type: 'topic-type', course: 'course', semester: 'semester', year: 'academic-year',
    description: 'topic-description', objectives: 'topic-objectives', outcomes: 'topic-outcomes', requirements: 'topic-requirements',
    minimum: 'minimum-members', maximum: 'maximum-members', closes: 'registration-closes',
  };
  const fields = Object.fromEntries(Object.entries(ids).map(([key, value]) => [key, document.getElementById(value)]));
  for (const [key, control] of Object.entries(fields)) {
    if (store.catalogs[key]) {
      control.replaceChildren(new Option('Chọn thông tin', ''));
      for (const [value, text] of Object.entries(store.catalogs[key])) control.add(new Option(text, value));
    }
    if (editForm) control.value = topic[key] || '';
  }
  if (fields.field && topic.field) fields.field.add(new Option(topic.field, topic.field, true, true));
  const defaultTopic = { id: '', code: '', name: '', type: '', course: '', semester: '', year: '', description: '', objectives: '',
    outcomes: '', requirements: '', minimum: '2', maximum: '3', opens: '', closes: '', starts: '', ends: '', image: '', attachment: null, status: 'open' };
  const original = editForm ? topic : defaultTopic;
  const submit = $('button[type="submit"]', form);
  submit.disabled = false;
  submit.removeAttribute('title');
  if (editForm) {
    $('.demo-notice').textContent = demo;
    $('.topic-status').textContent = 'Đề tài: ' + topic.code;
    $('.topic-edit-form__cancel').href = detailURL(topic.id);
  }
  let dirty = false, saved = false, busy = false;
  form.addEventListener('input', () => { dirty = true; });
  form.addEventListener('change', () => { dirty = true; });
  window.addEventListener('beforeunload', event => {
    if (dirty && !saved) { event.preventDefault(); event.returnValue = ''; }
  });
  // Use existing native validation UI, including custom cross-field messages.
  form.noValidate = true;
  for (const control of Object.values(fields)) control.addEventListener('input', () => {
    for (const field of Object.values(fields)) { field.setCustomValidity(''); field.removeAttribute('aria-invalid'); }
  });

  let image = original.image, imageBusy = false, version = 0;
  let imageInput = $('#topic-image');
  const preview = $('.topic-image-placeholder, .topic-image__placeholder');
  const emptyPreview = [...preview.childNodes].map(child => child.cloneNode(true));
  const renderPreview = () => {
    if (image) imageIn(preview, image, 'Xem trước ảnh đề tài');
    else preview.replaceChildren(...emptyPreview.map(child => child.cloneNode(true)));
  };
  if (!imageInput) {
    imageInput = node('input'); imageInput.type = 'file'; imageInput.hidden = true;
    imageInput.accept = 'image/png,image/jpeg'; form.append(imageInput);
  }
  const imageNotice = $('#topic-image-notice, #topic-image-hint');
  imageNotice.setAttribute('role', 'status');
  imageNotice.textContent = 'PNG/JPG tối đa 5 MB. Ảnh chỉ được lưu khi lưu đề tài.';
  const imageButtons = document.querySelectorAll('.topic-image__actions button');
  if (imageButtons[0]) { imageButtons[0].disabled = false; imageButtons[0].onclick = () => imageInput.click(); }
  const remove = imageButtons[1] || node('button', 'Gỡ ảnh');
  remove.type = 'button';
  if (!imageButtons[1]) imageInput.parentElement.append(remove);
  function refreshImage() { renderPreview(); remove.disabled = !image && !imageBusy; }
  remove.onclick = () => {
    version++; imageBusy = false; image = ''; imageInput.value = ''; dirty = true;
    imageNotice.textContent = 'Ảnh đã được gỡ khỏi biểu mẫu. Lưu đề tài để áp dụng.'; refreshImage();
  };
  const readFile = file => new Promise((resolve, reject) => {
    const reader = new FileReader(); reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Không đọc được tệp. Hãy chọn lại.'));
    reader.readAsDataURL(file);
  });
  imageInput.onchange = async () => {
    const file = imageInput.files[0]; if (!file) return;
    const current = ++version; imageBusy = true; remove.disabled = false;
    imageNotice.textContent = 'Đang đọc ảnh…';
    try {
      if (!['image/png', 'image/jpeg'].includes(file.type) || file.size > 5 * 1024 * 1024) throw new Error('Chọn PNG/JPG tối đa 5 MB. Ảnh trước vẫn được giữ.');
      const data = await readFile(file);
      await new Promise((resolve, reject) => {
        const img = new Image(); img.onload = resolve; img.onerror = () => reject(new Error('Tệp không phải ảnh hợp lệ.')); img.src = data;
      });
      if (current !== version) return;
      image = data; dirty = true; imageNotice.textContent = 'Ảnh xem trước đã sẵn sàng. Lưu đề tài để áp dụng.';
    } catch (e) { if (current === version) { imageInput.value = ''; imageNotice.textContent = e.message; } }
    finally { if (current === version) { imageBusy = false; refreshImage(); } }
  };
  refreshImage();
  // Optional attachments are read on submit. Keep the original download UI on detail.
  const attachmentInput = $('#topic-attachment');
  if (attachmentInput) $('#topic-attachment-hint').textContent = 'Tài liệu tùy chọn, tối đa 2 MB; lưu cục bộ cùng đề tài.';

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy) return;
    if (imageBusy) { error('Ảnh đang được đọc. Vui lòng chờ rồi lưu lại.'); return; }
    for (const control of Object.values(fields)) { control.setCustomValidity(''); control.removeAttribute('aria-invalid'); }
    const data = { ...original, image };
    for (const [key, control] of Object.entries(fields)) data[key] = control.value.trim();
    try {
      const errors = store.validate(data, store.read(), mode);
      for (const [key, text] of Object.entries(errors)) if (fields[key]) {
        fields[key].setCustomValidity(text); fields[key].setAttribute('aria-invalid', 'true');
      }
      if (!form.checkValidity()) {
        error('Chưa lưu. Kiểm tra các trường được đánh dấu; nội dung đã nhập vẫn được giữ.');
        form.reportValidity(); return;
      }
      if (Object.keys(errors).length) { error(Object.values(errors)[0]); return; }
      const attachment = attachmentInput?.files[0];
      if (attachment && attachment.size > 2 * 1024 * 1024) { error('Tài liệu tối đa 2 MB. Nội dung biểu mẫu vẫn được giữ.'); attachmentInput.focus(); return; }
      busy = true; submit.disabled = true; form.setAttribute('aria-busy', 'true');
      // Freeze the snapshot while reading the optional file, without changing layout.
      const controls = [...form.elements].filter(control => !control.disabled);
      controls.forEach(control => { control.disabled = true; });
      try {
        if (attachment) data.attachment = { name: attachment.name, data: await readFile(attachment) };
        if (!editForm) { data.id = crypto.randomUUID(); data.created = new Date().toISOString(); }
        await store.save(data, original.revision || 0, mode);
        saved = true; dirty = false;
        location.href = detailURL(data.id) + '&saved=1';
      } finally { controls.forEach(control => { control.disabled = false; }); }
    } catch (e) { error('Chưa lưu được: ' + e.message + ' Nội dung đang nhập vẫn được giữ; nếu bộ nhớ đầy, thử gỡ ảnh hoặc chọn tệp nhỏ hơn.'); }
    finally { busy = false; submit.disabled = false; form.removeAttribute('aria-busy'); }
  });
})();
