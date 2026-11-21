(() => {
  const app = globalThis.IE104;
  const ui = app?.ui?.lecturerWorkspace;
  if (!ui) return;
  const { el, field, modal, service } = ui;
  const panel = document.getElementById('tien-do');
  const title = panel.querySelector('h2');
  const overview = panel.querySelector('.progress-overview');
  const work = panel.querySelector('.progress-tasks');
  const meter = overview.querySelector('progress');
  const percentLabel = overview.querySelector('.progress-overview__percent');
  const stats = overview.querySelectorAll('.progress-stat dd');
  const review = overview.querySelector('.progress-overview__review');
  const message = el('p');
  const summaryNote = el('p', 'Tính theo số công việc đã hoàn thành vì một số công việc chưa có phần trăm cụ thể.', 'progress-overview__note');
  const history = el('section', '', 'progress-overview progress-reviews');
  const reviews = el('div');
  const labels = { 'chua-thuc-hien': 'Chưa thực hiện', 'dang-thuc-hien': 'Đang thực hiện', 'da-hoan-thanh': 'Đã hoàn thành' };
  const columns = [...work.querySelectorAll('.task-column')].map((column, index) => ({
    status: Object.keys(labels)[index],
    list: column.querySelector('.task-column__list'),
    count: column.querySelector('.task-column__count'),
  }));

  review.removeAttribute('command');
  review.removeAttribute('commandfor');
  review.removeAttribute('aria-controls');
  review.querySelector('span').textContent = 'Nhận xét tiến độ';
  review.addEventListener('click', () => {
    modal('Nhận xét tiến độ', 'Lưu nhận xét', (body, state) => {
      const select = field(body, 'taskId', 'Công việc', 'select');
      select.add(new Option('Tiến độ tổng thể', ''));
      state.progress.tasks.forEach(task => select.add(new Option(task.title, task.id)));
      field(body, 'content', 'Nội dung nhận xét', 'textarea', '', { required: true, maxLength: 2000, rows: 6 });
    }, (values, snapshot) => service.addProgressReview(snapshot.projectId, {
      content: values.get('content'),
      taskId: values.get('taskId') || null,
      progressRevision: snapshot.progressRevision,
    }, snapshot.revision));
  });

  work.querySelector('#task-board-help').textContent =
    'Các công việc được nhóm theo trạng thái. Cuộn dọc trong từng cột và cuộn ngang để xem các cột khác trên màn hình hẹp. Chọn thẻ để xem chi tiết.';
  overview.append(summaryNote);
  history.append(el('h3', 'Nhận xét của giảng viên', 'progress-overview__title'), reviews);
  panel.append(history, message);

  function renderTask(task, state) {
    const assignees = task.assignees ?? (task.assigneeCodes ?? [task.assigneeCode])
      .map(code => state.team.members.find(member => member.code === code)).filter(Boolean);
    const names = assignees.map(person => `${person.name} - ${person.code}`).join('\n') || task.assigneeCode || 'Chưa phân công';
    const completion = Number.isFinite(task.percent) ? `${task.percent}%` : 'Chưa có phần trăm cụ thể';
    const deadline = task.deadline ? task.deadline.split('-').reverse().join('/') : 'Chưa có hạn';
    const item = el('li');
    const card = el('article', '', 'task-card task-card--interactive');
    const heading = el('h5', '', 'task-card__title');
    const open = el('button', task.title, 'task-card__open');
    open.type = 'button';
    open.setAttribute('aria-haspopup', 'dialog');
    open.addEventListener('click', () => app.ui.workflowDetails({
      title: 'Chi tiết công việc',
      fields: [
        ['Tên công việc', task.title],
        ['Người phụ trách', names, assignees.length > 1],
        ['Hạn hoàn thành', deadline],
        ['Trạng thái', labels[task.status]],
        ['Mức hoàn thành', completion],
      ],
      progressHistory: { entries: state.progress.history, taskId: task.id },
      returnTo: () => open,
    }));
    heading.append(open);

    const footer = el('div', '', 'task-card__footer');
    const due = el('p', '', 'task-card__deadline');
    const calendar = app.ui.workflowIcon('calendar');
    calendar.setAttribute('class', 'task-card__icon');
    const dueDate = task.deadline ? el('time', deadline) : el('span', deadline);
    if (task.deadline) dueDate.dateTime = task.deadline;
    due.append(calendar, el('span', 'Hạn hoàn thành', 'visually-hidden'), dueDate);
    const people = el('span', '', 'task-assignees');
    people.append(el('span', `Người phụ trách: ${names}`, 'visually-hidden'));
    const avatars = ['task-assignee__avatar--an', 'task-assignee__avatar--binh'];
    assignees.slice(0, avatars.length).forEach((person, index) => {
      const initials = person.name.trim().split(/\s+/).slice(-2).map(word => word[0]).join('');
      const avatar = el('span', initials, `task-assignee__avatar ${avatars[index]}`);
      avatar.setAttribute('aria-hidden', 'true');
      people.append(avatar);
    });
    if (assignees.length > avatars.length) {
      const more = el('span', `+${assignees.length - avatars.length}`, 'task-assignee__avatar task-assignee__avatar--more');
      more.setAttribute('aria-hidden', 'true');
      people.append(more);
    }
    footer.append(due, people);
    card.append(heading, footer, el('p', completion, 'task-card__completion'));
    item.append(card);
    return item;
  }

  ui.subscribe(state => {
    const hasProgress = Boolean(state?.progress);
    title.hidden = overview.hidden = work.hidden = history.hidden = !hasProgress;
    message.hidden = hasProgress || !state;
    message.textContent = state?.warning || 'Chưa có dữ liệu tiến độ.';
    if (!hasProgress) return;

    title.textContent = `Tiến độ đề tài ${state.project.title}`;
    const summary = app.services.projectProgress.summarize(state.progress);
    meter.max = 100;
    meter.value = summary.percent;
    meter.textContent = `${summary.percent}%`;
    percentLabel.textContent = `${summary.percent}% hoàn thành`;
    [summary.total, summary.completed, summary.remaining].forEach((value, index) => {
      stats[index].textContent = value;
    });
    summaryNote.hidden = summary.method !== 'completed-ratio';

    columns.forEach(({ status, list, count }) => {
      const tasks = state.progress.tasks.filter(task => task.status === status);
      count.replaceChildren(count.querySelector('.visually-hidden'), `(${tasks.length})`);
      list.replaceChildren(...tasks.map(task => renderTask(task, state)));
      if (!tasks.length) list.append(el('li', 'Chưa có công việc.'));
    });
    reviews.replaceChildren();
    if (!state.progressReviews.length) reviews.append(el('p', 'Chưa có nhận xét.'));
    state.progressReviews.forEach(review => {
      const article = el('article', '', 'teaching-board-card');
      article.append(el('h4', review.taskTitle), el('p', `${review.authorName} - ${ui.date(review.createdAt)}`), el('p', review.content, 'teaching-prewrap'));
      reviews.append(article);
    });
  });
})();
