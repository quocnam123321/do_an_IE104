(() => {
  const app = window.IE104 ||= {};
  const ui = app.ui ||= {};
  const setText = (selector, text) => { document.querySelector(selector).textContent = text; };

  function displayDate(value) {
    const [date, time] = value.split('T');
    const day = date.split('-').reverse().join('/');
    return time ? `${day} · ${time}` : day;
  }

  function setDate(element, value) {
    element.dateTime = value;
    element.textContent = displayDate(value);
  }

  let cloneNumber = 0;
  // Mỗi thẻ có dialog riêng, kể cả khi số bản ghi vượt số thẻ HTML mẫu.
  function cloneWithDialogs(template) {
    const suffix = `-demo-${++cloneNumber}`;
    const roots = [template.cloneNode(true)];
    const dialogs = new Map();
    for (let index = 0; index < roots.length; index++) {
      roots[index].querySelectorAll('[commandfor]').forEach(button => {
        const id = button.getAttribute('commandfor');
        if (dialogs.has(id)) return;
        const dialog = document.getElementById(id);
        if (!dialog?.matches('dialog')) return;
        const copy = dialog.cloneNode(true);
        dialogs.set(id, copy);
        roots.push(copy);
      });
    }
    const ids = new Map();
    roots.forEach(root => [root, ...root.querySelectorAll('[id]')].forEach(node => {
      if (node.id) ids.set(node.id, node.id + suffix);
    }));
    roots.forEach(root => [root, ...root.querySelectorAll('*')].forEach(node => {
      if (node.id) node.id = ids.get(node.id);
      for (const attr of ['for', 'form', 'aria-labelledby', 'aria-describedby', 'aria-controls', 'commandfor']) {
        if (node.hasAttribute(attr)) node.setAttribute(attr, node.getAttribute(attr).split(/\s+/).map(id => ids.get(id) || id).join(' '));
      }
    }));
    dialogs.forEach(dialog => { dialog.removeAttribute('open'); document.body.append(dialog); });
    return roots[0];
  }

  function keepCards(column, count, withDialogs = false) {
    const list = column.querySelector('.task-column__list');
    const template = list.firstElementChild;
    const kept = withDialogs
      ? Array.from({ length: count }, () => cloneWithDialogs(template))
      : Array.from(list.children).slice(0, count);
    list.replaceChildren(...kept);
    list.removeAttribute('aria-label');
    column.querySelectorAll('.submission-column__overflow').forEach(overflow => overflow.remove());
    const countLabel = column.querySelector('.task-column__count');
    const label = countLabel.querySelector('.visually-hidden');
    countLabel.replaceChildren(...(label ? [label] : []), `(${count})`);
    return kept;
  }

  function renderProgress(tasks) {
    const columns = document.querySelectorAll('#progress-section .task-column');
    const groups = [tasks.notStarted, tasks.inProgress, tasks.completed];
    columns.forEach((column, index) => {
      const entries = groups[index];
      const list = column.querySelector('.task-column__list');
      const cards = keepCards(column, entries.length);
      entries.forEach(([title, due], position) => {
        const existing = cards[position];
        const item = existing ?? cards[0].cloneNode(true);
        const card = item.querySelector('.task-card');
        const heading = card.querySelector('.task-card__title');
        heading.textContent = title;
        card.classList.remove('task-card--overdue');
        card.querySelector('.task-card__overdue')?.remove();
        setDate(card.querySelector('time'), due);
        if (!existing) {
          heading.id = `demo-task-${index + 1}-${position + 1}-title`;
          card.setAttribute('aria-labelledby', heading.id);
          list.append(item);
        }
      });
    });
    const total = groups.reduce((count, entries) => count + entries.length, 0);
    const done = tasks.completed.length;
    const percent = Math.round(done / total * 100);
    const meter = document.querySelector('#topic-progress');
    meter.max = total;
    meter.value = done;
    meter.textContent = `${percent}%`;
    setText('.progress-overview__percent', `${percent}% hoàn thành`);
    const stats = document.querySelectorAll('.progress-stat dd');
    [total, done, total - done].forEach((count, index) => {
      stats[index].textContent = count;
    });
  }

  function renderRequirements(deliverables) {
    const groups = [deliverables.filter(item => !item.submittedAt), deliverables.filter(item => item.submittedAt)];
    for (const mode of ['normal', 'delete']) {
      const columns = document.querySelectorAll(`#requirements-${mode}-content .submission-column`);
      columns.forEach((column, index) => {
        const entries = groups[index];
        keepCards(column, entries.length, true).forEach((item, position) => {
          const entry = entries[position];
          const card = item.querySelector('.requirement-board-card');
          card.querySelector('.requirement-board-card__title').textContent = entry.title;
          card.classList.remove('requirement-board-card--overdue');
          card.querySelector('.submission-board__badge--danger')?.remove();
          setDate(card.querySelector('time'), entry.due);
          if (mode === 'delete') {
            card.querySelector('.requirement-board-card__remove').setAttribute('aria-label', `Xóa yêu cầu: ${entry.title}`);
            const dialog = document.getElementById(card.querySelector('[commandfor]').getAttribute('commandfor'));
            dialog.querySelector('.topic-dialog__desc strong').textContent = entry.title;
            return;
          }
          const view = document.getElementById(card.querySelector('[commandfor]').getAttribute('commandfor'));
          const edit = document.getElementById(view.querySelector('[commandfor^="edit-"]').getAttribute('commandfor'));
          for (const [prefix, dialog] of [['view', view], ['edit', edit]]) {
            dialog.querySelector(`[id^="${prefix}-name-"]`).value = entry.title;
            dialog.querySelector(`[id^="${prefix}-content-"]`).value = entry.description;
            dialog.querySelector(`[id^="${prefix}-deadline-"]`).value = prefix === 'edit' ? entry.due : displayDate(entry.due);
          }
        });
      });
    }
  }

  function renderSubmissions(deliverables) {
    const groups = [
      deliverables.filter(item => item.submittedAt && !item.feedback),
      deliverables.filter(item => item.feedback),
    ];
    document.querySelectorAll('.submissions .submission-column').forEach((column, index) => {
      const entries = groups[index];
      const onTimeBadge = column.querySelector('.submission-board__badge--success');
      const lateBadge = column.querySelector('.submission-board__badge--danger');
      keepCards(column, entries.length, true).forEach((item, position) => {
        const entry = entries[position];
        const card = item.querySelector('.submission-board-card');
        card.querySelector('.submission-board-card__title').textContent = entry.title;
        const badge = entry.submittedAt > entry.due ? lateBadge : onTimeBadge;
        card.querySelector('.submission-board__badge').replaceWith(badge.cloneNode(true));
        const file = card.querySelector('.submission-board-card__filename');
        file.textContent = entry.file;
        file.title = entry.file;
        setDate(card.querySelector('time'), entry.submittedAt);
        card.querySelector('.submission-board-card__download').setAttribute('aria-label', `Tải xuống ${entry.file}`);
        const button = card.querySelector('.submission-board-card__feedback');
        button.setAttribute('aria-label', `${entry.feedback ? 'Xem phản hồi' : 'Phản hồi'}: ${entry.title}`);
        const dialog = document.getElementById(button.getAttribute('commandfor'));
        dialog.querySelector('[name="submission-choice"]').value = entry.title;
        dialog.querySelector('.topic-dialog__info-row strong').textContent = entry.file;
        setDate(dialog.querySelector('time'), entry.submittedAt);
        dialog.querySelector('[name="submission-comment"]').value = entry.feedback || '';
      });
    });
  }

  ui.renderSupervisedDemo = record => {
    const work = record.supervision;
    document.querySelector('.topic-requirements').hidden = false;
    setText('[data-supervised-technology]', `Công nghệ gợi ý · ${record.technology}`);
    const requestedReturn = new URLSearchParams(location.search).get('return');
    const listUrl = new URL('danh-sach-de-tai-dang-huong-dan.html', location.href);
    let returnUrl = listUrl.href;
    try {
      const candidate = new URL(requestedReturn || listUrl.href, location.href);
      if (candidate.origin === listUrl.origin && candidate.pathname === listUrl.pathname) returnUrl = candidate.href;
    } catch { /* Giữ liên kết danh sách khi tham số quay lại không hợp lệ. */ }
    document.querySelector('.back-link').href = returnUrl;
    document.querySelectorAll('.topic-milestones time').forEach((time, index) => setDate(time, work.milestones[index]));
    setText('#tien-do > h2', `Tiến độ đề tài ${record.title} · ${work.group}`);
    renderProgress(work.tasks);
    setText('#bai-nop > h2', `Bài nộp đề tài ${record.title} · ${work.group}`);
    renderRequirements(work.deliverables);
    renderSubmissions(work.deliverables);
    setText('.evaluation-info__list > div:first-child dd', work.group);
    setText('.evaluation-criteria__table caption', `Tiêu chí đánh giá đề tài của ${work.group}`);
    document.querySelectorAll('.evaluation-criteria__table tbody tr').forEach((row, index) => {
      row.cells[1].textContent = work.criteria[index];
    });
    document.querySelector('#evaluation-comment').value = work.comment;
    const [title, group] = document.querySelectorAll('#publish-evaluation dd');
    title.textContent = record.title;
    group.textContent = work.group;
  };
})();
