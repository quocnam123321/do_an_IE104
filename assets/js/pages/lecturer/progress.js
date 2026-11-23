(() => {
  const app = globalThis.IE104;
  const panel = document.getElementById('tien-do');
  if (!panel) return;
  const { labels, today, memberIndex, renderMemberPopover, renderCard, fillDetails, fillStats } = app.ui.progressTaskView;
  const progress = app.services.projectProgress;
  const overview = panel.querySelector('.progress-overview');
  const dialog = panel.querySelector('#task-detail-dialog');
  const showComments = app.ui.mountTaskComments(dialog, 'lecturer');
  const board = panel.querySelector('.task-board');
  const tasksById = new Map();
  const columns = [...board.querySelectorAll('.task-column')].map((column, index) => ({
    status: Object.keys(labels)[index],
    list: column.querySelector('.task-column__list'),
    count: column.querySelector('.task-column__count'),
  }));
  const popovers = document.createElement('div');
  board.after(popovers);

  function taskCard(task, people, date, projectId) {
    tasksById.set(task.id, { task, people, projectId });
    return renderCard(task, people, date, dialog.id);
  }

  board.addEventListener('click', event => {
    const trigger = event.target.closest('.task-card__open');
    if (!trigger || dialog.open) return;
    const entry = tasksById.get(trigger.closest('[data-task-id]').dataset.taskId);
    if (!entry) return;
    const { task, people, projectId } = entry;
    fillDetails(dialog, task, people.map(({ member }) => member.name).join(', ') || task.assigneeCode);
    dialog.dataset.taskId = task.id;
    showComments({ projectId, taskId: task.id });
    dialog.showModal();
    dialog.scrollTop = 0;
  });

  dialog.addEventListener('close', () => {
    const card = Array.from(board.querySelectorAll('[data-task-id]')).find(item => item.dataset.taskId === dialog.dataset.taskId);
    (card?.querySelector('.task-card__open') || board).focus({ preventScroll: true });
  });

  function renderCatalogCards() {
    const previous = [...panel.querySelectorAll('.progress-member-popover')];
    const peopleById = new Map(previous.map((node, index) => {
      const member = {
        name: node.querySelector('.progress-member-popover__name').textContent.trim(),
        code: node.querySelector('.progress-member-popover__id').textContent.trim().replace(/^Mã số sinh viên:\s*/, ''),
        role: node.querySelector('.progress-member-popover__role').textContent.includes('Nhóm trưởng') ? 'nhom-truong' : 'thanh-vien',
      };
      return [node.id, { member, index, popoverId: node.id }];
    }));
    previous.forEach(node => node.remove());
    popovers.replaceChildren(...Array.from(peopleById.values(), renderMemberPopover));
    const date = today();
    const tasks = [];
    columns.forEach(({ status, list }) => {
      const cards = Array.from(list.querySelectorAll('.task-card'), (card, index) => {
        const task = {
          id: `${status}-${index}`,
          title: card.querySelector('.task-card__title').textContent.trim(),
          deadline: card.querySelector('time')?.dateTime,
          status,
        };
        tasks.push(task);
        const people = Array.from(card.querySelectorAll('.task-assignee:not(.task-assignee--more)'),
          button => peopleById.get(button.getAttribute('popovertarget'))).filter(Boolean);
        return taskCard(task, [...new Set(people)], date);
      });
      list.replaceChildren(...cards);
      if (!cards.length) list.append(Object.assign(document.createElement('li'), { className: 'task-column__empty', textContent: 'Chưa có công việc.' }));
    });
    fillStats(overview, progress.summarize({ tasks }), tasks, date);
  }

  const ui = app.ui.lecturerWorkspace;
  if (!ui) {
    renderCatalogCards();
    return;
  }
  const { el, field, modal, service } = ui;
  panel.querySelectorAll('.progress-member-popover').forEach(node => node.remove());
  const title = panel.querySelector('h2');
  const work = panel.querySelector('.progress-tasks');
  const meter = overview.querySelector('progress');
  const percentLabel = overview.querySelector('.progress-overview__percent');
  const review = overview.querySelector('.progress-overview__review');
  const message = el('p');
  const summaryNote = el('p', 'Tính theo số công việc đã hoàn thành vì một số công việc chưa có phần trăm cụ thể.', 'progress-overview__note');
  const history = el('section', '', 'progress-overview progress-reviews');
  const reviews = el('div');
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

  ui.subscribe(state => {
    tasksById.clear();
    const hasProgress = Boolean(state?.progress);
    title.hidden = overview.hidden = work.hidden = history.hidden = !hasProgress;
    message.hidden = hasProgress || !state;
    message.textContent = state?.warning || 'Chưa có dữ liệu tiến độ.';
    if (!hasProgress) return;

    title.textContent = `Tiến độ đề tài ${state.project.title}`;
    const date = today();
    const summary = progress.summarize(state.progress);
    meter.max = 100;
    meter.value = summary.percent;
    meter.textContent = `${summary.percent}%`;
    percentLabel.textContent = `${summary.percent}% hoàn thành`;
    fillStats(overview, summary, state.progress.tasks, date);
    summaryNote.hidden = summary.method !== 'completed-ratio';

    const members = new Map(state.team.members.map(member => [member.code, member]));
    for (const task of state.progress.tasks) {
      for (const member of task.assignees || []) {
        if (member.name && member.code && !members.has(member.code)) members.set(member.code, member);
      }
    }
    const people = memberIndex([...members.values()]);
    popovers.replaceChildren(...Array.from(people.values(), renderMemberPopover));
    columns.forEach(({ status, list, count }) => {
      const tasks = state.progress.tasks.filter(task => task.status === status);
      const scrollTop = list.scrollTop;
      count.replaceChildren(count.querySelector('.visually-hidden'), `(${tasks.length})`);
      list.replaceChildren(...tasks.map(task => {
        const codes = task.assignees?.map(member => member.code) ?? task.assigneeCodes ?? [task.assigneeCode];
        const assignees = [...new Set(codes)].map(code => people.get(code)).filter(Boolean);
        return taskCard(task, assignees, date, state.projectId);
      }));
      if (!tasks.length) list.append(el('li', 'Chưa có công việc.', 'task-column__empty'));
      list.scrollTop = scrollTop;
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
