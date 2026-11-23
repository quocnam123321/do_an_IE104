(() => {
  const service = globalThis.IE104?.services?.lecturerTopics;
  const mode = document.body.dataset.lecturerTopicView;
  if (!service || !mode) return;
  const missing = 'Chưa có thông tin';
  const params = new URLSearchParams(location.search);
  const id = params.has('topic') ? params.get('topic') : (globalThis.IE104.data.lecturerRealDefaultTopicId || 'DA001');
  const setText = (selector, value) => document.querySelectorAll(selector).forEach(node => { node.textContent = value || missing; });
  const dateFormat = new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh',
  });
  const timeFormat = new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'Asia/Ho_Chi_Minh',
  });
  function formatDate(value, includeTime = false) {
    if (!value) return '';
    const instant = new Date(value);
    if (!Number.isFinite(instant.getTime())) return '';
    const day = dateFormat.format(instant);
    return includeTime ? `${day} · ${timeFormat.format(instant)}` : day;
  }
  const listUrl = service.returnUrl('created', params.get('return'), location.href);
  document.body.classList.add('lecturer-routing-page');
  function render() {
  try {
    let readOnly = false;
    const topic = service.get('created', id, mode === 'detail' ? { onSourceError: () => { readOnly = true; } } : undefined);
    document.title = `${topic.title} | ${mode === 'edit' ? 'Chỉnh sửa' : 'Chi tiết'} đề tài`;
    document.body.dataset.topicId = topic.id;
    const detail = new URL(service.detailUrl(topic), location.href);
    detail.searchParams.set('return', listUrl);
    document.querySelectorAll('a[href^="danh-sach-de-tai-da-tao.html"]').forEach(link => { link.href = listUrl; });
    document.querySelectorAll('a[href^="chi-tiet-de-tai-da-tao-giang-vien.html"]').forEach(link => { link.href = detail.href; });
    if (mode === 'edit') {
      const values = {
        'ma-de-tai': topic.id, 'ten-de-tai': topic.title,
        'loai-de-tai': topic.topicType, 'mon-hoc': topic.course,
        'hoc-ky': String(topic.semester), 'nam-hoc': topic.academicYear,
        'ho-ten-giang-vien': topic.supervisor?.name || '', 'khoa-bo-mon': topic.supervisor?.faculty || '',
        'email-lien-he': topic.supervisor?.email || '', 'mo-ta': topic.description || '',
        'muc-tieu': topic.objectives?.join('\n') || '', 'yeu-cau-thuc-hien': topic.requirements?.join('\n') || '',
        'so-thanh-vien-toi-thieu': topic.registration?.minMembers ?? '',
        'so-thanh-vien-toi-da': topic.registration?.maxMembers ?? '',
        'dong-dang-ky-luc': topic.registration?.deadline ? new Date(Date.parse(topic.registration.deadline) + 7 * 3600000).toISOString().slice(0, 16) : '',
      };
      Object.entries(values).forEach(([name, value]) => {
        const input = document.getElementById(name);
        if (!input) return;
        if (input.tagName === 'SELECT') {
          const label = name === 'loai-de-tai' ? topic.typeLabel : name === 'mon-hoc' ? topic.courseLabel : name === 'hoc-ky' ? `Học kỳ ${value}` : value;
          if (value && ![...input.options].some(option => option.value === value)) input.add(new Option(label, value));
        }
        input.value = value;
      });
      document.querySelectorAll('form button[type="submit"]').forEach(button => { button.disabled = true; });
    } else {
      setText('#topic-summary-title', topic.title);
      document.querySelectorAll('.topic-summary__image[role="img"]').forEach(image => image.setAttribute('aria-label', `Chưa có ảnh đại diện cho đề tài ${topic.title}`));
      const proposalType = { graduation: 'do-an-tot-nghiep', thesis: 'khoa-luan' }[topic.topicType];
      const fixedCourses = globalThis.IE104.services.proposals?.catalog.types[proposalType]?.courses;
      const fixedCourse = topic.typeLabel === 'Luận văn thạc sĩ' ? '' : Object.values(fixedCourses || {})[0];
      const semester = topic.semester === '3' || topic.semester === 3 ? 'summer' : topic.semester;
      const year = topic.academicYear?.replace(/\s*[-–]\s*/, ' – ');
      const completion = !topic.finalReportDate && formatDate(topic.completesAt);
      const fields = {
        type: topic.typeLabel,
        course: fixedCourse || window.UITLecturerCatalog.subjectLabel(topic, true),
        code: topic.displayId || topic.id,
        semester: globalThis.IE104.services.lecturerTopicEditor.catalog.semesters[semester],
        year,
        start: formatDate(topic.startsAt),
        progress: formatDate(topic.progressReportDate),
        final: formatDate(topic.finalReportDate),
        completion,
        deadline: formatDate(topic.registration?.deadline, true),
        minMembers: topic.registration?.minMembers,
        maxMembers: topic.registration?.maxMembers,
      };
      for (const [key, value] of Object.entries(fields)) {
        const field = document.querySelector(`[data-topic-field="${key}"]`);
        field.textContent = value || missing;
        field.classList.toggle('is-missing', !value);
      }
      document.querySelector('[data-topic-completion]').hidden = !completion;
      const method = topic.methodAndScope?.trim();
      const plan = topic.plan?.trim();
      document.querySelector('[data-topic-method]').hidden = !method;
      document.querySelector('[data-topic-plan]').hidden = !plan;
      setText('[data-topic-method] p', method);
      setText('[data-topic-plan] p', plan);
      setText('.topic-description p:not([data-topic-source])', topic.description);
      const source = topic.sourceRecord?.summaryUrl || topic.sourceRecord?.sourceUrl;
      const description = document.querySelector('.topic-description');
      if (description && source && !description.querySelector('[data-topic-source]')) {
        const paragraph = document.createElement('p');
        paragraph.dataset.topicSource = '';
        const link = document.createElement('a');
        link.href = source;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = 'Xem hồ sơ tại nguồn UIT';
        paragraph.append(link);
        description.append(paragraph);
      }
      [['.topic-objectives ul', topic.objectives], ['.topic-outcomes ul', topic.outcomes], ['.topic-requirements ul', topic.requirements]].forEach(([selector, items]) => {
        const list = document.querySelector(selector);
        if (!list) return;
        list.replaceChildren(...(items?.length ? items : [missing]).map(text => { const item = document.createElement('li'); item.textContent = text; return item; }));
      });
      const attachmentName = topic.attachmentName || topic.attachmentRef?.name;
      document.querySelector('[data-topic-attachment]').hidden = !attachmentName;
      document.querySelector('[data-topic-attachment-empty]').hidden = Boolean(attachmentName);
      if (attachmentName) setText('.topic-attachments__file span', attachmentName);
      const badge = document.querySelector('[data-topic-status]');
      const status = readOnly ? topic : service.createdStatus(topic);
      if (badge) { badge.textContent = status.statusLabel; badge.className = `status-badge status-badge--${status.status}`; }
      document.querySelectorAll('.registration-close-button').forEach(button => { button.hidden = readOnly || status.status !== 'open'; });
      let reopen = document.querySelector('.registration-reopen-button');
      if (!reopen && topic.status === 'closed') {
        const prototype = document.getElementById('registration-closed-template')?.content.querySelector('.registration-reopen-button');
        if (prototype) { reopen = prototype.cloneNode(true); document.querySelector('.registration-close-button')?.after(reopen); }
      }
      if (reopen) reopen.hidden = readOnly || status.status !== 'closed';
      const edit = document.querySelector('.topic-edit-link');
      if (edit) {
        const url = new URL('chinh-sua-de-tai-giang-vien.html', location.href);
        url.searchParams.set('topic', topic.id);
        url.searchParams.set('return', listUrl);
        edit.href = url.href;
        edit.hidden = readOnly;
      }
    }
    document.body.dataset.topicRouteState = 'ready';
    document.dispatchEvent(new Event('ie104:lecturer-topic-rendered'));
  } catch (failure) {
    const container = document.querySelector('main .page-container');
    const title = document.createElement('h1'); title.textContent = 'Không thể mở đề tài';
    const message = document.createElement('p'); message.textContent = failure.message; message.setAttribute('role', 'alert');
    const back = document.createElement('a'); back.href = listUrl; back.textContent = 'Quay lại Đề tài đã tạo';
    container.replaceChildren(title, message, back);
    document.title = 'Không thể mở đề tài';
    document.body.dataset.topicRouteState = 'error';
  }
  }
  if (mode === 'detail') {
    window.addEventListener('pageshow',render);
    window.addEventListener('ie104:registrations-updated', render);
    document.addEventListener('ie104:lecturer-topic-state-changed',render);
    window.addEventListener('storage', event => {
      const app = globalThis.IE104;
      if ([app.services.lecturerTopicRepository?.key, app.storage?.registrationKey, null].includes(event.key)) render();
    });
  }
  render();
})();
