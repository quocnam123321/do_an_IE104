(() => {
  const app = globalThis.IE104;
  const root = document.querySelector('[data-published-content]');
  const notice = document.querySelector('[data-published-notice]');
  if (!root || !notice || !app?.services?.publishedTopics) return;
  const id = new URLSearchParams(location.search).get('topic');
  const form = root.querySelector('.registration-form');
  const text = (selector,value) => { const node = root.querySelector(selector); if (node) node.textContent = value || 'Chưa có thông tin'; };
  let ready = false;
  function refresh() {
    try {
      const topic = app.services.publishedTopics.get(id);
      if (!topic) throw new Error('Không tìm thấy đề tài GV có đủ thông tin để đăng ký.');
      form.dataset.topicId = topic.id; form.dataset.catalogSource = 'lecturer-created';
      document.body.dataset.publishedTopic = topic.id;
      root.setAttribute('aria-label',topic.title);
      document.title = `${topic.title} | Đăng ký đề tài`;
      text('.summary h2',topic.title);
      const { maxMembers } = topic.registrationRules;
      const mode = maxMembers === 1 ? 'Cá nhân' : 'Cá nhân hoặc theo nhóm';
      const code = app.services.studentTopicCodes.get(topic) || 'Chưa có mã đề tài';
      const values = [code,topic.typeLabel,app.ui.studentCourseLabel(topic, true),mode,topic.semester === 'he' ? 'Hè' : topic.semester,topic.academicYear];
      root.querySelectorAll('.summary__meta dd').forEach((node,index) => { node.textContent = values[index]; });
      text('.supervisor__profile h4',topic.lecturer);
      text('.supervisor__profile p',topic.supervisor.faculty);
      root.querySelectorAll('.supervisor__info-row dd').forEach((node,index) => { node.textContent = (index ? topic.supervisor.email : topic.supervisor.research) || 'Chưa có thông tin'; });
      const content = root.querySelectorAll('.detail-body > section.panel .content-box');
      [topic.description,topic.objectives,topic.outcomes,topic.requirements].forEach((value,index) => {
        if (Array.isArray(value)) { const list = document.createElement('ul'); for (const line of value) { const item = document.createElement('li'); item.textContent = line; list.append(item); } content[index].replaceChildren(list); }
        else content[index].textContent = value;
      });
      const file = root.querySelector('.topic-attachments__file');
      const icon = file.querySelector('svg')?.cloneNode(true);
      file.replaceChildren(); if (icon) file.append(icon); file.append(document.createTextNode(topic.attachmentName || 'Chưa có tài liệu đính kèm'));
      const status = root.querySelector('[data-published-availability]');
      status.textContent = `${topic.availability.label}. Hạn đăng ký: ${new Intl.DateTimeFormat('vi-VN',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',timeZone:'Asia/Ho_Chi_Minh'}).format(new Date(topic.registration.deadline))}.`;
      status.dataset.closed = String(!topic.availability.allowed);
      if (!ready) {
        const student = app.data.currentStudent;
        root.querySelector('#student-code').value = student?.code || '';
        root.querySelector('#student-name').value = student?.name || '';
      }
      notice.hidden = true;
      if (ready) root.hidden = false;
      document.dispatchEvent(new Event('ie104:published-topic-rendered'));
    } catch (failure) {
      root.hidden = true; delete form.dataset.topicId;
      notice.hidden = false; notice.textContent = failure.message;
      document.body.dataset.publishedState = 'error';
      document.querySelectorAll('dialog[open]').forEach(dialog => dialog.close());
    }
  }
  refresh();
  document.addEventListener('DOMContentLoaded',() => {
    if (!form.dataset.topicId || form.dataset.enrollmentReady !== 'true') return;
    ready = true; root.hidden = false; document.body.dataset.publishedState = 'ready';
  });
  document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('keydown',event => {
    if (event.key !== 'Tab' || event.ctrlKey || event.metaKey || event.altKey) return;
    const controls = [...dialog.querySelectorAll('button:not(:disabled),input:not(:disabled)')].filter(node => node.getClientRects().length);
    const target = event.shiftKey && document.activeElement === controls[0] ? controls.at(-1) : !event.shiftKey && document.activeElement === controls.at(-1) ? controls[0] : null;
    if (target) { event.preventDefault(); target.focus({preventScroll:true}); }
  }));
  window.addEventListener('storage',event => { if ([app.services.lecturerTopicRepository.key,null].includes(event.key)) refresh(); });
  window.addEventListener('ie104:published-topics-updated',refresh);
  window.addEventListener('pageshow',refresh);
})();
