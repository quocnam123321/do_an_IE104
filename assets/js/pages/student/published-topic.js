(() => {
  const app = globalThis.IE104;
  const root = document.querySelector('[data-published-content]');
  const notice = document.querySelector('[data-published-notice]');
  if (!root || !notice || !app?.services?.publishedTopics) return;
  const id = new URLSearchParams(location.search).get('topic');
  const form = root.querySelector('.registration-form');
  const renderAttachment = app.ui.createTopicAttachment(root.querySelector('.request-attachments'));
  const text = (selector,value) => { const node = root.querySelector(selector); if (node) node.textContent = value || 'Chưa có thông tin'; };
  const timeZone = 'Asia/Ho_Chi_Minh';
  const dateFormat = new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', timeZone,
  });
  const timeFormat = new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone,
  });
  function formatDate(value, includeTime = false) {
    if (!value) return '';
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return '';
    const day = dateFormat.format(date);
    return includeTime ? `${day} · ${timeFormat.format(date)}` : day;
  }

  let ready = false;
  function refresh() {
    try {
      const topic = app.services.publishedTopics.get(id);
      if (!topic) throw new Error('Không tìm thấy đề tài GV có đủ thông tin để đăng ký.');
      form.dataset.topicId = topic.id; form.dataset.catalogSource = 'lecturer-created';
      document.body.dataset.publishedTopic = topic.id;
      root.setAttribute('aria-label',topic.title);
      document.title = `${topic.title} | Đăng ký đề tài`;
      text('#published-topic-title', topic.title);
      const badge = root.querySelector('[data-published-status]');
      badge.textContent = topic.availability.allowed ? 'Đang mở đăng ký' : topic.availability.label;
      badge.dataset.open = String(topic.availability.allowed);
      const final = formatDate(topic.finalReportDate);
      const completion = !final && formatDate(topic.completesAt);
      const deadline = formatDate(topic.registration.deadline, true);
      const fields = {
        type: topic.typeLabel,
        course: app.ui.studentCourseLabel(topic, true),
        semester: topic.semester === 'he' ? 'Học kỳ hè' : `Học kỳ ${topic.semester}`,
        year: topic.academicYear.replace(/\s*[-–]\s*/, ' – '),
        code: app.services.studentTopicCodes.get(topic) || 'Chưa có mã đề tài',
        start: formatDate(topic.startsAt),
        progress: formatDate(topic.progressReportDate),
        final,
        completion,
        deadline,
      };
      for (const [field, value] of Object.entries(fields)) text(`[data-topic-field="${field}"]`, value);
      root.querySelector('[data-topic-completion]').hidden = !completion;
      app.ui.renderRegistrationSupervisor(root, topic.lecturer, topic.supervisor);
      const content = root.querySelectorAll('.detail-body > section.panel .content-box');
      [topic.description,topic.objectives,topic.outcomes,topic.requirements].forEach((value,index) => {
        if (Array.isArray(value)) { const list = document.createElement('ul'); for (const line of value) { const item = document.createElement('li'); item.textContent = line; list.append(item); } content[index].replaceChildren(list); }
        else content[index].textContent = value;
      });
      renderAttachment(topic, () => app.services.lecturerTopicFiles.readPublished(topic.id, 'attachment'));
      if (!ready) {
        const student = topic.isDatabaseTopic ? app.proposalDatabase.student : app.data.currentStudent;
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
