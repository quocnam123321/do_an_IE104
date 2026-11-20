(() => {
  const app = globalThis.IE104;
  const host = document.querySelector('[data-student-submissions]');
  const service = app?.services?.studentSubmissions;
  if (!host || !service) return;
  const isLivePage = host.dataset.studentSubmissions === 'live';
  const fallback = [...host.childNodes];
  const format = new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh',
  });

  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  }

  function time(value) {
    const node = element('time', format.format(new Date(value)));
    node.dateTime = value;
    return node;
  }

  function detailCard(id, title, status, date, dateLabel, content) {
    const details = element('details', undefined, 'submission-board-card student-submission-detail');
    details.dataset.recordId = id;
    const summary = element('summary');
    summary.append(element('strong', title), element('span', status, 'student-submission-status'));
    const line = element('p', dateLabel + ' ');
    line.append(time(date));
    details.append(summary, line, ...content);
    return details;
  }

  function board(title, className, columns, view) {
    const section = element('section', undefined, className);
    const heading = element('h3', title, className + '__title');
    const wrapper = element('div', undefined, 'task-board submission-board');
    wrapper.tabIndex = 0;
    wrapper.setAttribute('role', 'region');
    wrapper.setAttribute('aria-label', title);
    const grid = element('div', undefined, 'task-board__columns submission-board__columns submission-board__columns--' + (className === 'requirements' ? 'requirements' : 'files'));
    columns.forEach(({ label, items }, index) => {
      const column = element('section', undefined, 'task-column submission-column submission-column--' + (index ? 'info' : 'neutral'));
      const labelId = 'student-' + className + '-' + index;
      const columnHeading = element('h4', label + ' (' + items.length + ')', 'task-column__title');
      columnHeading.id = labelId;
      const viewport = element('div', undefined, 'submission-column__viewport');
      viewport.tabIndex = 0;
      viewport.setAttribute('role', 'region');
      viewport.setAttribute('aria-labelledby', labelId);
      const list = element('ul', undefined, 'task-column__list submission-column__list');
      if (items.length) {
        items.forEach(item => {
          const row = element('li');
          row.append(view(item));
          list.append(row);
        });
      } else {
        list.append(element('li', 'Chưa có dữ liệu.'));
      }
      viewport.append(list);
      column.append(columnHeading, viewport);
      grid.append(column);
    });
    wrapper.append(grid);
    section.append(heading, wrapper);
    return section;
  }

  function render() {
    const projectId = document.body.dataset.projectId;
    if (!projectId) return;
    const open = new Set([...host.querySelectorAll('details[open][data-record-id]')].map(node => node.dataset.recordId));
    const active = host.contains(document.activeElement) ? document.activeElement : null;
    const focused = active?.closest('[data-record-id]')?.dataset.recordId;
    try {
      const state = service.forStudent(projectId);
      if (!isLivePage && !state.hasRecord) {
        if (host.firstChild !== fallback[0]) host.replaceChildren(...fallback);
        return;
      }
      const notice = element('p', state.submissionsLocked
        ? 'Giảng viên đã khóa nhận bài cho đề tài này.'
        : 'Yêu cầu được cập nhật theo dữ liệu giảng viên lưu trên trình duyệt.', 'student-submission-notice');
      const requirements = board('Yêu cầu bài nộp', 'requirements', [
        { label: 'Chưa nộp', items: state.requirements.filter(item => !item.submitted) },
        { label: 'Đã nộp', items: state.requirements.filter(item => item.submitted) },
      ], item => {
        const status = item.submitted ? 'Đã nộp' :
          item.locked ? 'Đã khóa nhận bài' : state.completed ? 'Đề tài đã hoàn thành' :
          item.overdue ? 'Quá hạn' : 'Chưa nộp';
        return detailCard(item.id, item.title, status, item.deadline, 'Hạn nộp:', [
          element('p', item.content || 'Chưa có nội dung yêu cầu.', 'student-submission-content'),
        ]);
      });
      const submissions = board('Bài nộp của nhóm', 'submissions', [
        { label: 'Chờ phản hồi', items: state.submissions.filter(item => !item.feedback) },
        { label: 'Đã phản hồi', items: state.submissions.filter(item => item.feedback) },
      ], item => detailCard(item.id, item.title, item.feedback ? 'Đã phản hồi' : 'Chờ phản hồi', item.submittedAt, 'Thời điểm nộp:', [
        element('p', item.fileName || 'Chưa có tên tệp.'),
        element('p', item.feedback || 'Chưa có phản hồi của giảng viên.', 'student-submission-content'),
      ]));
      host.replaceChildren(notice, requirements, submissions);
      for (const detail of host.querySelectorAll('details[data-record-id]')) {
        detail.open = open.has(detail.dataset.recordId);
        if (detail.dataset.recordId === focused) detail.querySelector('summary').focus({ preventScroll: true });
      }
      if (active && !host.contains(document.activeElement)) host.querySelector('.task-board').focus({ preventScroll: true });
    } catch (failure) {
      const error = element('p', failure.message, 'student-submission-notice');
      error.setAttribute('role', 'alert');
      host.replaceChildren(error);
    }
  }

  window.addEventListener('pageshow', render);
  window.addEventListener('storage', event => {
    const { teachingKey, teamKey, proposalKey, registrationKey } = app.storage;
    if ([teachingKey, teamKey, proposalKey, registrationKey, null].includes(event.key)) render();
  });
  // The approved-project renderer sets the project ID before this deferred script.
  render();
})();
