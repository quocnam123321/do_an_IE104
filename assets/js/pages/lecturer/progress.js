(() => {
  const app = globalThis.IE104;
  const ui = app?.ui?.lecturerWorkspace;
  if (!ui) return;
  const { el, button, field, modal, service } = ui;
  const panel = ui.region('progress-section', 'tien-do');
  const labels = { 'chua-thuc-hien': 'Chưa thực hiện', 'dang-thuc-hien': 'Đang thực hiện', 'da-hoan-thanh': 'Đã hoàn thành' };
  ui.subscribe(state => {
    panel.replaceChildren();
    if (!state) return;
    if (!state.progress) { panel.append(el('p', state.warning || 'Chưa có dữ liệu tiến độ.')); return; }
    const summary = app.services.projectProgress.summarize(state.progress);
    const card = el('section', '', 'teaching-card');
    const header = el('div', '', 'teaching-toolbar');
    header.append(el('h2', 'Tiến độ tổng thể'), button('Nhận xét tiến độ', () => modal('Nhận xét tiến độ', 'Lưu nhận xét', body => {
      const select = field(body, 'taskId', 'Công việc', 'select');
      select.add(new Option('Tiến độ tổng thể', ''));
      state.progress.tasks.forEach(task => select.add(new Option(task.title, task.id)));
      field(body, 'content', 'Nội dung nhận xét', 'textarea', '', { required: true, maxLength: 2000, rows: 6 });
    }, (values, snapshot) => service.addProgressReview(snapshot.projectId, { content: values.get('content'), taskId: values.get('taskId') || null, progressRevision: snapshot.progressRevision }, snapshot.revision))));
    const meter = el('progress');
    meter.max = 100;
    meter.value = summary.percent;
    meter.setAttribute('aria-label', 'Tiến độ tổng thể');
    card.append(header, meter, el('p', `${summary.percent}% hoàn thành - ${summary.completed}/${summary.total} công việc đã hoàn thành`));
    if (summary.method === 'completed-ratio') card.append(el('p', 'Tính theo số công việc đã hoàn thành; một số công việc chưa có phần trăm cụ thể.'));
    panel.append(card);
    const board = el('div', '', 'teaching-board');
    Object.entries(labels).forEach(([status, label]) => {
      const tasks = state.progress.tasks.filter(task => task.status === status);
      const column = el('section', '', 'teaching-column');
      column.append(el('h3', `${label} (${tasks.length})`));
      const list = el('div', '', 'teaching-column-list');
      list.tabIndex = 0;
      list.setAttribute('role', 'region');
      list.setAttribute('aria-label', label);
      tasks.forEach(task => {
        const names = task.assignees?.map(person => `${person.name} - ${person.code}`) || [state.team.members.find(member => member.code === task.assigneeCode)].filter(Boolean).map(person => `${person.name} - ${person.code}`);
        const article = el('article', '', 'teaching-board-card');
        article.append(el('h4', task.title), el('p', `Phụ trách: ${names.join('; ') || task.assigneeCode}`), el('p', `Hạn hoàn thành: ${task.deadline.split('-').reverse().join('/')}`), el('p', Number.isFinite(task.percent) ? `${task.percent}%` : 'Chưa có phần trăm cụ thể'));
        list.append(article);
      });
      if (!tasks.length) list.append(el('p', 'Chưa có công việc.'));
      column.append(list);
      board.append(column);
    });
    panel.append(board);
    const history = el('section', '', 'teaching-card');
    history.append(el('h3', 'Nhận xét của giảng viên'));
    if (!state.progressReviews.length) history.append(el('p', 'Chưa có nhận xét.'));
    state.progressReviews.forEach(review => {
      const article = el('article', '', 'teaching-board-card');
      article.append(el('h4', review.taskTitle), el('p', `${review.authorName} - ${ui.date(review.createdAt)}`), el('p', review.content, 'teaching-prewrap'));
      history.append(article);
    });
    panel.append(history);
  });
})();
