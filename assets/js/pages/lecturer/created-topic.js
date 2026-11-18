(() => {
  const service = globalThis.IE104?.services?.lecturerTopics;
  const mode = document.body.dataset.lecturerTopicView;
  if (!service || !mode) return;
  const missing = 'Chưa có thông tin';
  const params = new URLSearchParams(location.search);
  const id = params.has('topic') ? params.get('topic') : 'DA001';
  const setText = (selector, value) => document.querySelectorAll(selector).forEach(node => { node.textContent = value || missing; });
  const listUrl = service.returnUrl('created', params.get('return'), location.href);
  document.body.classList.add('lecturer-routing-page');
  try {
    const topic = service.get('created', id);
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
      const fields = [topic.id, topic.typeLabel, topic.courseLabel, `Học kỳ ${topic.semester}`, topic.academicYear];
      document.querySelectorAll('.topic-summary__meta dd').forEach((node, index) => { node.textContent = fields[index] || missing; });
      const supervisor = ['name', 'faculty', 'email', 'research'];
      document.querySelectorAll('.topic-supervisor__details dd').forEach((node, index) => { node.textContent = topic.supervisor?.[supervisor[index]] || missing; });
      const avatar = document.querySelector('.topic-supervisor__avatar');
      if (avatar && !topic.supervisor) { avatar.textContent = 'GV'; avatar.setAttribute('aria-label', 'Chưa có thông tin giảng viên hướng dẫn'); }
      setText('.topic-description p', topic.description);
      [['.topic-objectives ul', topic.objectives], ['.topic-outcomes ul', topic.outcomes], ['.topic-requirements ul', topic.requirements]].forEach(([selector, items]) => {
        const list = document.querySelector(selector);
        if (!list) return;
        list.replaceChildren(...(items?.length ? items : [missing]).map(text => { const item = document.createElement('li'); item.textContent = text; return item; }));
      });
      setText('.topic-registration__members', topic.registration ? `Nhóm gồm ${topic.registration.minMembers} - ${topic.registration.maxMembers} sinh viên` : missing);
      setText('.topic-registration dd', topic.registration?.deadline ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(topic.registration.deadline)) : missing);
      setText('.topic-attachments__file', topic.attachmentName || 'Chưa có tài liệu đính kèm');
      const badge = document.querySelector('.created-detail-heading .status-badge');
      if (badge) { badge.textContent = topic.statusLabel; badge.className = `status-badge status-badge--${topic.status}`; }
      document.querySelectorAll('.registration-close-button').forEach(button => { button.hidden = topic.status !== 'open'; });
      let reopen = document.querySelector('.registration-reopen-button');
      if (!reopen && topic.status === 'closed') {
        const prototype = document.getElementById('registration-closed-template')?.content.querySelector('.registration-reopen-button');
        if (prototype) { reopen = prototype.cloneNode(true); document.querySelector('.registration-close-button')?.after(reopen); }
      }
      if (reopen) reopen.hidden = topic.status !== 'closed';
      const edit = document.querySelector('.topic-edit-link');
      if (edit) { const url = new URL('chinh-sua-de-tai-giang-vien.html', location.href); url.searchParams.set('topic', topic.id); url.searchParams.set('return', listUrl); edit.href = url.href; }
    }
    document.body.dataset.topicRouteState = 'ready';
  } catch (failure) {
    const container = document.querySelector('main .page-container');
    const title = document.createElement('h1'); title.textContent = 'Không thể mở đề tài';
    const message = document.createElement('p'); message.textContent = failure.message; message.setAttribute('role', 'alert');
    const back = document.createElement('a'); back.href = listUrl; back.textContent = 'Quay lại Đề tài đã tạo';
    container.replaceChildren(title, message, back);
    document.title = 'Không thể mở đề tài';
    document.body.dataset.topicRouteState = 'error';
  }
})();
