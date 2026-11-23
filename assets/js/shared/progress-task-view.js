(() => {
  const ui = globalThis.IE104.ui;
  const labels = {
    'chua-thuc-hien': 'Chưa bắt đầu',
    'dang-thuc-hien': 'Đang thực hiện',
    'da-hoan-thanh': 'Đã hoàn thành',
  };
  const avatarColors = ['task-assignee__avatar--an', 'task-assignee__avatar--binh'];

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function calendar(className) {
    const svg = ui.workflowIcon('calendar');
    svg.setAttribute('class', className);
    return svg;
  }

  function deadlineDate(value) {
    if (!value) return element('span', '', 'Chưa có hạn');
    const time = element('time', '', value.split('-').reverse().join('/'));
    time.dateTime = value;
    return time;
  }

  function today() {
    return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).format();
  }

  function isOverdue(task, date) {
    return task.status !== 'da-hoan-thanh' && Boolean(task.deadline) && task.deadline < date;
  }

  function fillStats(overview, summary, tasks, date) {
    const counts = {
      total: summary.total,
      completed: summary.completed,
      remaining: summary.remaining,
      overdue: tasks.filter(task => isOverdue(task, date)).length,
    };
    overview.querySelectorAll('[data-progress-stat]').forEach(node => {
      node.textContent = counts[node.dataset.progressStat];
    });
  }

  function memberAvatar({ member, index }, className) {
    const initials = member.name.trim().split(/\s+/).slice(-2).map(part => part[0]).join('').toUpperCase();
    const avatar = element('span', `${className} ${avatarColors[index % avatarColors.length]}`, initials);
    avatar.setAttribute('aria-hidden', 'true');
    return avatar;
  }

  function renderMemberPopover(person) {
    const { member, popoverId } = person;
    const popover = element('div', 'progress-member-popover');
    popover.id = popoverId;
    popover.setAttribute('popover', '');
    popover.setAttribute('role', 'dialog');
    const info = element('div', 'progress-member-popover__info');
    const name = element('p', 'progress-member-popover__name', member.name);
    name.id = popover.id + '-name';
    popover.setAttribute('aria-labelledby', name.id);
    info.append(name, element('p', 'progress-member-popover__id', 'MSSV: ' + (member.code || 'Chưa có thông tin')),
      element('p', 'progress-member-popover__role', member.role === 'nhom-truong' ? 'Nhóm trưởng' : 'Thành viên'));
    const close = element('button', 'progress-member-popover__close', '×');
    close.type = 'button';
    close.setAttribute('aria-label', 'Đóng thông tin thành viên');
    close.setAttribute('popovertarget', popover.id);
    close.setAttribute('popovertargetaction', 'hide');
    popover.append(memberAvatar(person, 'progress-member-popover__avatar'), info, close);
    return popover;
  }

  function memberIndex(members) {
    return new Map(members.map((member, index) => [
      member.code, { member, index, popoverId: 'progress-task-member-' + index },
    ]));
  }

  function renderAssignees(task, people) {
    const group = element('div', 'task-assignees');
    const names = people.map(({ member }) => member.name).join(', ');
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', 'Người phụ trách: ' + (names || task.assigneeCode || 'Chưa phân công'));
    for (const person of people) {
      const { member, popoverId } = person;
      const button = element('button', 'task-assignee');
      button.type = 'button';
      button.title = member.name;
      button.setAttribute('aria-label', 'Xem thông tin ' + member.name + (member.code ? ', mã số sinh viên ' + member.code : ''));
      button.setAttribute('aria-haspopup', 'dialog');
      button.setAttribute('popovertarget', popoverId);
      button.append(memberAvatar(person, 'task-assignee__avatar'));
      group.append(button);
    }
    return group;
  }

  function renderCard(task, people, date, dialogId, headerAction) {
    const item = element('li');
    const card = element('article', 'task-card task-card--interactive');
    card.dataset.taskId = task.id;
    const header = element('header', 'task-card__header');
    const title = element('h5', 'task-card__title');
    const open = element('button', 'task-card__open', task.title);
    open.type = 'button';
    open.dataset.progressAction = 'view';
    open.setAttribute('aria-label', 'Chi tiết công việc: ' + task.title);
    open.setAttribute('aria-haspopup', 'dialog');
    open.setAttribute('aria-controls', dialogId);
    title.append(open);
    header.append(title);

    if (isOverdue(task, date)) {
      card.classList.add('task-card--overdue');
      header.append(element('span', 'task-card__overdue', 'Quá hạn'));
    }
    if (headerAction) header.append(headerAction);

    const footer = element('div', 'task-card__footer');
    const due = element('p', 'task-card__deadline');
    due.append(calendar('task-card__icon'), element('span', 'visually-hidden', 'Hạn hoàn thành: '), deadlineDate(task.deadline));
    footer.append(due);
    if (people.length) footer.append(renderAssignees(task, people));
    card.append(header, footer);
    item.append(card);
    return item;
  }

  function fillDetails(dialog, task, assignees) {
    const badge = dialog.querySelector('[data-task-detail-status]');
    badge.dataset.status = task.status;
    badge.textContent = labels[task.status];
    dialog.querySelector('#task-detail-title').textContent = task.title;
    dialog.querySelector('[data-task-detail-assignees]').textContent = assignees || 'Chưa phân công';
    dialog.querySelector('[data-task-detail-description]').textContent = task.description?.trim() || 'Chưa có mô tả.';
    dialog.querySelector('[data-task-detail-deadline]').replaceChildren(
      calendar('task-detail-dialog__calendar'), deadlineDate(task.deadline),
    );
  }

  ui.progressTaskView = { labels, today, memberIndex, renderMemberPopover, renderCard, fillDetails, fillStats };
})();
