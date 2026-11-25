(() => {
  const month = document.getElementById('deadline-month');
  const topic = document.getElementById('deadline-topic');
  const calendar = document.querySelector('.calendar-table');
  if (!calendar || !month) return;

  let today = calendar.querySelector('time[aria-current="date"]').dateTime;
  const demoNow = Date.parse(`${today}T12:00:00+07:00`);
  const preview = document.getElementById('calendar-preview');
  const overflow = document.getElementById('calendar-overflow');
  const overflowList = overflow?.querySelector('.calendar-overflow__list');
  const overflowClose = overflow?.querySelector('.calendar-preview__close');
  const canPreview = typeof preview?.showPopover === 'function' && !!overflowList;
  const scrollArea = calendar.closest('.calendar-scroll');
  const narrowScreen = window.matchMedia('(max-width: 40rem)');
  const submissionStatuses = {
    pending: { label: 'Chưa nộp', action: 'Nộp bài', target: 'upload' },
    overdue: { label: 'Quá hạn', action: 'Nộp bài', target: 'upload' },
    locked: { label: 'Đã khóa nhận bài' },
    submitted: { label: 'Đã nộp', action: 'Xem bài đã nộp', target: 'submitted' },
    awaiting: { label: 'Chờ phản hồi', action: 'Xem bài đã nộp', target: 'submitted' },
    responded: { label: 'Đã phản hồi', action: 'Xem phản hồi', target: 'feedback' },
  };
  const topicStatuses = {
    'in-progress': 'Đang thực hiện',
    completed: 'Hoàn thành',
  };
  const eventsPerCell = 2;
  const maxAdditionalDeadlines = 4;
  const title = preview?.querySelector('h3');
  const closeButton = preview?.querySelector('.calendar-preview__close');
  const statusBadge = preview?.querySelector('.calendar-preview__status');
  const deadline = preview?.querySelector('.calendar-preview__deadline time');
  const deadlineLabel = document.getElementById('calendar-preview-deadline-label');
  const topicName = preview?.querySelector('.calendar-preview__topic');
  const submittedNote = preview?.querySelector('.calendar-preview__submitted');
  const detailsAction = preview?.querySelector('.calendar-preview__details');
  const primaryAction = preview?.querySelector('.calendar-preview__primary');
  const topics = new Map(Array.from(topic?.options ?? [], (option) => [option.value, option]));
  let detailTrigger;
  let overflowTrigger;
  let positionFrame = 0;
  let displayedMonth = month.value;
  let displayedTopic = topic?.value;

  const sampleEvents = Array.from(calendar.querySelectorAll('.calendar-event'), (element) => {
    const { topic: topicId, status, submitted, deadline: due } = element.dataset;
    const dueTime = Date.parse(due);
    return {
      id: `${topicId}--${element.classList.contains('calendar-event--submission') ? element.hash.slice(1) : 'deadline'}`,
      date: element.closest('td').querySelector('time').dateTime,
      topicId,
      status: status === 'pending' && dueTime < demoNow ? 'overdue' : status,
      due,
      dueTime,
      submitted,
      name: element.querySelector('.calendar-event__title').textContent.trim(),
      element,
    };
  }).sort((first, second) => first.dueTime - second.dueTime);
  let events = sampleEvents;
  let activeEvents = [];
  let activeSnapshot;
  const eventsByDate = new Map();

  function indexEvents() {
    eventsByDate.clear();
    const merged = new Map([...events, ...activeEvents].map(event => [event.id, event]));
    for (const event of [...merged.values()].sort((first, second) => first.due.localeCompare(second.due))) {
      if (!eventsByDate.has(event.date)) eventsByDate.set(event.date, []);
      eventsByDate.get(event.date).push(event);
    }
  }
  indexEvents();

  function formatTime(dateTime) {
    const [year, monthNumber, day] = dateTime.slice(0, 10).split('-');
    const date = `${day}/${monthNumber}/${year}`;
    return dateTime.length > 10 ? `${dateTime.slice(11, 16)} · ${date}` : date;
  }

  function matchesTopic(event) {
    return !displayedTopic || event.topicId === displayedTopic;
  }

  function linkedPage(event, target) {
    const url = new URL(event.element.href);
    url.hash = target;
    return url.href;
  }

  function requirementPage(event, action) {
    const url = new URL(event.detailUrl, location.href);
    url.searchParams.set('requirement', event.requirementId);
    if (action) url.searchParams.set('submissionAction', action);
    if (action === 'feedback' && event.submissionId) url.searchParams.set('submission', event.submissionId);
    return url.href;
  }

  function closePreview(restoreFocus = false) {
    if (!detailTrigger) return;
    const trigger = detailTrigger;
    detailTrigger = null;
    trigger.setAttribute('aria-expanded', 'false');
    if (preview.matches(':popover-open')) preview.hidePopover();
    if (restoreFocus) trigger.focus({ preventScroll: true });
  }

  function closeOverflow(restoreFocus = false) {
    if (!overflowTrigger) return;
    if (overflowList.contains(detailTrigger)) closePreview();
    const trigger = overflowTrigger;
    overflowTrigger = null;
    trigger.setAttribute('aria-expanded', 'false');
    if (overflow.matches(':popover-open')) overflow.hidePopover();
    if (restoreFocus) trigger.focus({ preventScroll: true });
  }

  function anchorVisible(anchor, clippingArea) {
    const area = clippingArea.getBoundingClientRect();
    return anchor.right > Math.max(0, area.left)
      && anchor.left < Math.min(document.documentElement.clientWidth, area.right)
      && anchor.bottom > Math.max(0, area.top)
      && anchor.top < Math.min(window.innerHeight, area.bottom);
  }

  function placePopover(panel, anchor, preferLeft, parent) {
    const edge = 12;
    const gap = 12;
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight;
    const bounds = parent ?? anchor;
    panel.dataset.side = narrowScreen.matches ? 'sheet' : 'right';
    const { width, height } = panel.getBoundingClientRect();
    const leftFits = bounds.left >= width + edge + gap;
    const rightFits = viewportWidth - bounds.right >= width + edge + gap;
    let left;
    let top;

    if (!narrowScreen.matches && (leftFits || rightFits)) {
      const side = leftFits && (preferLeft || !rightFits) ? 'left' : 'right';
      const midpoint = (anchor.top + anchor.bottom) / 2;
      left = side === 'left' ? bounds.left - width - gap : bounds.right + gap;
      top = Math.max(edge, Math.min(midpoint - height / 2, viewportHeight - height - edge));
      panel.dataset.side = side;
      panel.style.setProperty('--preview-caret', `${Math.max(18, Math.min(midpoint - top, height - 18))}px`);
    } else if (parent && (parent.top >= height + edge + gap || viewportHeight - parent.bottom >= height + edge + gap)) {
      left = Math.max(edge, Math.min(parent.left, viewportWidth - width - edge));
      top = parent.top >= height + edge + gap ? parent.top - height - gap : parent.bottom + gap;
      panel.dataset.side = 'stack';
    } else {
      panel.dataset.side = 'sheet';
      return;
    }

    panel.style.setProperty('--preview-x', `${left}px`);
    panel.style.setProperty('--preview-y', `${top}px`);
  }

  function placePopovers() {
    if (overflowTrigger && overflow.matches(':popover-open')) {
      const anchor = overflowTrigger.getBoundingClientRect();
      if (anchorVisible(anchor, scrollArea)) {
        overflow.style.setProperty('--calendar-event-width', `${anchor.width}px`);
        placePopover(overflow, anchor, overflowTrigger.closest('td').cellIndex >= 5);
      } else {
        closeOverflow();
      }
    }

    if (!detailTrigger || !preview.matches(':popover-open')) return;
    const anchor = detailTrigger.getBoundingClientRect();
    const nested = overflowList.contains(detailTrigger);
    if (!anchorVisible(anchor, nested ? overflowList : scrollArea)) {
      closePreview();
      return;
    }
    if (nested) {
      placePopover(preview, anchor, overflow.dataset.side === 'left', overflow.getBoundingClientRect());
    } else {
      placePopover(preview, anchor, detailTrigger.closest('td').cellIndex >= 5);
    }
  }

  function schedulePlacement() {
    if ((!detailTrigger && !overflowTrigger) || positionFrame) return;
    positionFrame = requestAnimationFrame(() => {
      positionFrame = 0;
      placePopovers();
    });
  }

  function openPreview(trigger, event) {
    if (detailTrigger === trigger && preview.matches(':popover-open')) {
      closePreview(true);
      return;
    }

    closePreview();
    if (overflowList.contains(trigger)) {
      // Keep the detail in the native popover tree for layered light dismissal.
      overflow.append(preview);
    } else {
      closeOverflow();
      overflow.after(preview);
    }
    detailTrigger = trigger;
    trigger.setAttribute('aria-expanded', 'true');

    const submission = submissionStatuses[event.status];
    const project = topics.get(event.topicId);
    const status = submission ? event.status : project?.dataset.topicStatus;
    const label = submission?.label ?? topicStatuses[status];
    title.textContent = event.name;
    statusBadge.hidden = !label;
    statusBadge.className = label ? `calendar-preview__status calendar-status--${status}` : 'calendar-preview__status';
    statusBadge.textContent = label ?? '';
    deadlineLabel.textContent = submission ? 'Hạn nộp' : 'Hạn đề tài';
    deadline.dateTime = event.due;
    deadline.textContent = formatTime(event.due);
    const projectTitle = submission || event.kind === 'topic' ? project?.textContent.trim() : '';
    const topicText = [projectTitle, project?.dataset.group].filter(Boolean).join(' · ');
    topicName.textContent = topicText;
    topicName.parentElement.hidden = !topicText;
    submittedNote.hidden = !event.submitted;
    if (event.submitted) {
      const lateLabel = Date.parse(event.submitted) > Date.parse(event.due) ? ' · Nộp sau hạn' : '';
      submittedNote.textContent = `Đã nộp lúc ${formatTime(event.submitted)}${lateLabel}`;
    }

    detailsAction.href = event.requirementId ? requirementPage(event) :
      event.detailUrl ?? (submission ? linkedPage(event, event.element.dataset.details) : event.element.href);
    primaryAction.hidden = !submission?.action || (!event.requirementId && !event.element?.dataset.action);
    if (!primaryAction.hidden) {
      primaryAction.href = event.requirementId ? requirementPage(event, submission.target) :
        linkedPage(event, event.element.dataset.action);
      primaryAction.textContent = submission.action;
    }

    preview.showPopover({ source: trigger });
    placePopovers();
    if (detailTrigger) closeButton.focus({ preventScroll: true });
  }

  function eventNode(event) {
    const clone = event.element?.cloneNode(true) ?? document.createElement('a');
    if (!event.element) {
      clone.className = `calendar-event calendar-event--${event.kind}`;
      clone.href = event.requirementId ? requirementPage(event) : event.detailUrl;
      const projectTitle = topics.get(event.topicId)?.textContent;
      clone.title = event.kind === 'submission' && projectTitle
        ? `${event.name} · ${projectTitle}` : event.name;
      const title = document.createElement('span');
      title.className = 'calendar-event__title';
      clone.append(title);
      if (event.kind === 'topic' && projectTitle) {
        const project = document.createElement('span');
        project.className = 'calendar-event__project';
        project.textContent = projectTitle;
        clone.title = projectTitle;
        clone.append(project);
      }
    }
    clone.querySelector('.calendar-event__title').textContent = event.label ?? event.name;
    if (!canPreview || !event.due) return clone;

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = clone.className;
    if (clone.title) trigger.title = clone.title;
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-controls', preview.id);
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('popovertarget', preview.id);
    trigger.append(...clone.childNodes);
    trigger.addEventListener('click', (click) => {
      click.preventDefault();
      openPreview(trigger, event);
    });
    return trigger;
  }

  function chooseAdditionalDeadlines(events) {
    const reports = events.filter(event => event.kind === 'topic').slice(0, maxAdditionalDeadlines);
    const submissionLimit = maxAdditionalDeadlines - reports.length;
    const candidates = events.filter(event => event.kind === 'submission' && event.detailUrl &&
      topics.get(event.topicId)?.hasAttribute('data-active-deadline-topic'));
    if (candidates.length <= submissionLimit) return [...reports, ...candidates];

    const byStatus = new Map();
    for (const event of candidates) {
      if (!byStatus.has(event.status)) byStatus.set(event.status, event);
    }
    const selected = new Set([...byStatus.values()].slice(0, submissionLimit));
    const titles = new Set([...selected].map(event => event.name));
    for (const event of candidates) {
      if (selected.size === submissionLimit) break;
      if (titles.has(event.name)) continue;
      selected.add(event);
      titles.add(event.name);
    }
    for (const event of candidates) {
      if (selected.size === submissionLimit) break;
      selected.add(event);
    }
    return [...reports, ...candidates.filter(event => selected.has(event))];
  }

  function overflowNode(date, remaining) {
    const createItems = () => remaining.map((event) => {
      const item = document.createElement('li');
      item.append(eventNode(event));
      return item;
    });
    const label = `+${remaining.length} mốc khác`;
    const description = `Xem ${remaining.length} mốc khác ngày ${date.split('-').reverse().join('/')}`;
    if (!canPreview) {
      const group = document.createElement('details');
      const summary = document.createElement('summary');
      summary.className = 'calendar-overflow-trigger';
      summary.textContent = label;
      summary.setAttribute('aria-label', description);
      const list = document.createElement('ul');
      list.className = 'calendar-overflow__list';
      list.append(...createItems());
      group.append(summary, list);
      return group;
    }
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'calendar-overflow-trigger';
    trigger.textContent = label;
    trigger.setAttribute('aria-label', description);
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-controls', overflow.id);
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('popovertarget', overflow.id);
    trigger.addEventListener('click', (click) => {
      click.preventDefault();
      if (overflowTrigger === trigger && overflow.matches(':popover-open')) {
        closeOverflow(true);
        return;
      }
      closePreview();
      closeOverflow();
      overflowTrigger = trigger;
      trigger.setAttribute('aria-expanded', 'true');
      overflowList.replaceChildren(...createItems());
      overflow.showPopover({ source: trigger });
      overflowList.scrollTop = 0;
      placePopovers();
      if (overflowTrigger) overflowClose.focus({ preventScroll: true });
    });
    return trigger;
  }

  function renderCalendar() {
    if (!/^\d{4}-\d{2}$/.test(month.value)) return;
    closePreview();
    closeOverflow();
    displayedMonth = month.value;
    displayedTopic = topic?.value;
    const [year, number] = month.value.split('-').map(Number);
    const start = (new Date(year, number - 1, 1).getDay() + 6) % 7;
    const days = new Date(year, number, 0).getDate();
    const body = calendar.tBodies[0];
    body.replaceChildren();
    let row;
    for (let index = 0; index < Math.ceil((start + days) / 7) * 7; index++) {
      if (index % 7 === 0) row = body.insertRow();
      const cell = row.insertCell();
      const day = index - start + 1;
      if (day < 1 || day > days) { cell.className = 'calendar-table__empty'; continue; }
      const date = `${month.value}-${String(day).padStart(2, '0')}`;
      const time = document.createElement('time');
      time.dateTime = date;
      time.textContent = day;
      cell.append(time);
      if (date === today) {
        cell.className = 'calendar-table__today';
        time.setAttribute('aria-current', 'date');
        cell.append(' · Hôm nay');
      }
      const dayEvents = (eventsByDate.get(date) ?? []).filter(matchesTopic);
      cell.append(...dayEvents.slice(0, eventsPerCell).map(eventNode));
      const additional = chooseAdditionalDeadlines(dayEvents.slice(eventsPerCell));
      if (additional.length) cell.append(overflowNode(date, additional));
    }
    calendar.caption.textContent = `Tháng ${number}/${year} · Giờ Việt Nam (UTC+7)`;
  }

  function shiftMonth(offset) {
    if (!month.value) month.value = today.slice(0, 7);
    const [year, number] = month.value.split('-').map(Number);
    const date = new Date(year, number - 1 + offset, 1);
    month.value = `${String(date.getFullYear()).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    renderCalendar();
  }

  const deadlineService = globalThis.IE104?.services?.deadlines;
  const defaultMonth = month.value;
  let refreshVersion = 0;

  async function refreshActiveDeadlines() {
    const version = ++refreshVersion;
    try {
      const active = await deadlineService.getActiveDeadlines();
      const snapshot = JSON.stringify(active);
      if (version !== refreshVersion || snapshot === activeSnapshot) return;
      if (activeSnapshot === undefined && active.length && month.value === defaultMonth) {
        today = deadlineService.today();
        month.value = today.slice(0, 7);
      }
      activeSnapshot = snapshot;
      const selected = topic.value;
      for (const option of topic.querySelectorAll('[data-active-deadline-topic]')) {
        topics.delete(option.value);
        option.remove();
      }
      for (const project of active) {
        const option = new Option(project.title, project.id);
        option.dataset.activeDeadlineTopic = '';
        option.dataset.topicStatus = 'in-progress';
        if (project.group) option.dataset.group = project.group;
        topics.set(project.id, option);
        topic.add(option);
      }
      topic.value = topics.has(selected) ? selected : '';
      activeEvents = active.flatMap(project => project.events);
      indexEvents();
      renderCalendar();
    } catch {
      // Keep the last calendar available when browser data cannot be read.
    }
  }

  function setupGoogleCalendarDialog() {
    const trigger = document.querySelector('.deadline-calendar__google');
    const dialog = document.getElementById('calendar-export');
    if (!trigger || typeof dialog?.showModal !== 'function') return;

    const search = document.getElementById('calendar-export-search');
    const selectAll = document.getElementById('calendar-export-select-all');
    const list = document.getElementById('calendar-export-events');
    const rowTemplate = document.getElementById('calendar-export-row');
    const monthLabel = dialog.querySelector('.calendar-export__month');
    const empty = dialog.querySelector('.calendar-export__empty');
    const count = dialog.querySelector('.calendar-export__count');
    const feedback = dialog.querySelector('.calendar-export__feedback');
    const add = dialog.querySelector('.calendar-export__add');
    const closeButtons = Array.from(dialog.querySelectorAll('[data-calendar-export-close]'));
    const storageKey = 'ie104-calendar-selection';
    const client = location.protocol === 'file:' ? null : import('./calendar-client.js?v=20261119-calendar-worker');
    const request = client?.then(async (api) => {
      const user = await api.calendarSession();
      return { api, user };
    });
    request?.catch(() => {});
    let rows = [];
    let results = [];
    let busy = false;

    function normalize(value) {
      return value.toLocaleLowerCase('vi').normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').trim();
    }

    function createRow(event) {
      const element = rowTemplate.content.firstElementChild.cloneNode(true);
      const input = element.querySelector('input');
      const time = element.querySelector('time');
      const kind = element.querySelector('.calendar-export__kind');
      const isTopic = event.element.classList.contains('calendar-event--topic');
      element.querySelector('strong').textContent = event.name;
      time.dateTime = event.due;
      time.textContent = formatTime(event.due);
      kind.textContent = isTopic ? 'Hạn đề tài' : 'Bài nộp';
      kind.classList.toggle('calendar-export__kind--topic', isTopic);
      const projectName = topics.get(event.topicId)?.textContent ?? '';
      return { element, input, id: event.id, terms: normalize(`${event.name} ${projectName}`) };
    }

    function updateSelection() {
      const selected = rows.filter(({ input }) => input.checked).length;
      const selectedResults = results.filter(({ input }) => input.checked).length;
      selectAll.disabled = busy || results.length === 0;
      selectAll.checked = results.length > 0 && selectedResults === results.length;
      selectAll.indeterminate = selectedResults > 0 && !selectAll.checked;
      add.disabled = busy || selected === 0;
      const countLabel = `Đã chọn ${selected} mốc`;
      if (count.textContent !== countLabel) count.textContent = countLabel;
      feedback.textContent = '';
    }

    function filterRows() {
      const terms = normalize(search.value).split(/\s+/).filter(Boolean);
      results = rows.filter((row) => {
        row.element.hidden = !terms.every((term) => row.terms.includes(term));
        return !row.element.hidden;
      });
      list.hidden = results.length === 0;
      empty.hidden = !list.hidden;
      if (!empty.hidden) {
        empty.textContent = rows.length ? 'Không tìm thấy mốc phù hợp.' : 'Không có mốc nào cho tháng và đề tài đang chọn.';
      }
      list.scrollTop = 0;
      updateSelection();
    }

    function showRows(selectedIds = []) {
      const [year, number] = displayedMonth.split('-');
      monthLabel.textContent = `Tháng ${Number(number)}/${year}`;
      rows = events.filter((event) => event.date.startsWith(`${displayedMonth}-`)
        && matchesTopic(event) && Number.isFinite(event.dueTime)).map(createRow);
      for (const row of rows) row.input.checked = selectedIds.includes(row.id);
      list.replaceChildren(...rows.map(({ element }) => element));
      filterRows();
    }

    function openDialog(selectedIds = []) {
      closePreview();
      closeOverflow();
      search.value = '';
      showRows(selectedIds);
      dialog.showModal();
    }

    function selectedIds() {
      return rows.filter(({ input }) => input.checked).map(({ id }) => id);
    }

    function feedbackMessage(message) {
      feedback.textContent = message;
      if (message) feedback.scrollIntoView({ block: 'nearest' });
    }

    async function submit(allowConnect = true) {
      const ids = selectedIds();
      if (busy || !ids.length) return;
      if (!request) {
        feedbackMessage('Mở website qua HTTP hoặc HTTPS để sử dụng Google Calendar.');
        return;
      }
      function setBusy(value) {
        busy = value;
        for (const control of [search, ...closeButtons, ...rows.map(({ input }) => input)]) control.disabled = value;
        updateSelection();
        dialog.setAttribute('aria-busy', String(value));
      }
      let message;
      let api;
      setBusy(true);
      feedbackMessage('Đang gửi các mốc đã chọn đến Google Calendar…');
      try {
        const session = await request;
        api = session.api;
        const send = (path, body) => api.calendarRequest(session.user, path, body);
        let response;
        try {
          response = await api.addCalendarEvents(session.user, ids);
        } catch (error) {
          if (!allowConnect || error.code !== 'calendar-connect-required') throw error;
          const { url } = await send('/connect');
          const authorize = new URL(url);
          if (authorize.origin !== 'https://accounts.google.com') throw new Error('Invalid authorization URL');
          sessionStorage.setItem(storageKey, JSON.stringify({ ids, month: displayedMonth, topic: displayedTopic }));
          location.assign(authorize.href);
          message = 'Đang mở trang xác nhận quyền của Google…';
          return;
        }
        const statuses = ['added', 'existing', 'updated', 'failed'];
        const counts = statuses.map((status) => response.results.filter((result) => result.status === status).length);
        const labels = ['Đã thêm', 'Đã có', 'Đã cập nhật', 'Cần thử lại'];
        message = counts.map((number, index) => number ? `${labels[index]} ${number} mốc` : '').filter(Boolean).join(' · ');
        if (counts[3]) {
          const retryIds = response.results.filter(({ status }) => status === 'failed').map(({ id }) => id);
          for (const row of rows) row.input.checked = retryIds.includes(row.id);
        }
      } catch (error) {
        message = api?.calendarMessage(error) ?? 'Không kết nối được dịch vụ lịch. Vui lòng thử lại.';
      } finally {
        setBusy(false);
        feedbackMessage(message);
      }
    }

    async function loadSavedCalendar() {
      if (!request) return;
      try {
        const { api, user } = await request;
        if (user) {
          const { events: saved } = await api.calendarRequest(user, '/events');
          const now = Date.now();
          const samples = new Map(sampleEvents.map((event) => [event.id, event]));
          today = new Date(now + 7 * 3_600_000).toISOString().slice(0, 10);
          events = saved.map(({ id, topic: topicId, due, name, path }) => {
            const sample = samples.get(id);
            const element = sample?.element ?? document.createElement('a');
            if (!sample) {
              const number = id.split('--requirement-')[1];
              const label = document.createElement('span');
              label.className = 'calendar-event__title';
              element.className = 'calendar-event calendar-event--submission';
              element.href = new URL('../../' + path, location.href);
              element.dataset.details = `submission-requirements-${number}`;
              element.dataset.action = `submission-upload-${number}`;
              element.append(label);
            }
            const dueTime = Date.parse(due);
            const status = element.dataset.status ?? 'pending';
            return { id, element, name, topicId, due, dueTime, date: due.slice(0, 10),
              submitted: sample?.submitted,
              status: status === 'pending' && dueTime < now ? 'overdue' : status };
          }).sort((first, second) => first.dueTime - second.dueTime);
          indexEvents();
          renderCalendar();
          if (dialog.open && !busy) showRows(selectedIds());
        }
      } catch {
        // Dữ liệu HTML mẫu vẫn xem được khi chưa triển khai dịch vụ.
      }
    }

    async function resumeAuthorization() {
      const url = new URL(location.href);
      const result = url.searchParams.get('calendar');
      if (!result) return;
      url.searchParams.delete('calendar');
      history.replaceState(history.state, '', url);
      let pending;
      try {
        pending = JSON.parse(sessionStorage.getItem(storageKey));
        sessionStorage.removeItem(storageKey);
      } catch {
        return;
      }
      if (!pending || !Array.isArray(pending.ids)) return;
      await calendarLoaded;
      month.value = pending.month;
      if (topic) topic.value = pending.topic ?? '';
      renderCalendar();
      if (dialog.open) showRows(pending.ids);
      else openDialog(pending.ids);
      if (result === 'connected') {
        if (selectedIds().length) await submit(false);
        else feedbackMessage('Đã kết nối Google Calendar. Hãy chọn mốc muốn thêm.');
      } else {
        feedbackMessage(result === 'account-mismatch'
          ? 'Chọn tài khoản Google có cùng email với tài khoản IE104.'
          : 'Chưa kết nối được Google Calendar. Bạn có thể bấm Thêm lịch để thử lại.');
      }
    }

    trigger.addEventListener('click', () => openDialog());
    search.addEventListener('input', filterRows);
    list.addEventListener('change', updateSelection);
    selectAll.addEventListener('change', () => {
      for (const { input } of results) input.checked = selectAll.checked;
      updateSelection();
    });
    for (const button of closeButtons) {
      button.addEventListener('click', () => dialog.close());
    }
    dialog.addEventListener('cancel', (event) => {
      if (busy) event.preventDefault();
    });
    dialog.addEventListener('close', () => trigger.focus({ preventScroll: true }));
    add.addEventListener('click', () => submit());
    trigger.disabled = false;
    const calendarLoaded = loadSavedCalendar();
    void resumeAuthorization();
  }

  if (canPreview) {
    overflow.hidden = false;
    preview.hidden = false;
    preview.addEventListener('toggle', () => {
      if (!preview.matches(':popover-open')) closePreview();
    });
    overflow.addEventListener('toggle', () => {
      if (!overflow.matches(':popover-open')) closeOverflow();
    });
    preview.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      closePreview(true);
    });
    overflow.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      if (detailTrigger) closePreview(true);
      else closeOverflow(true);
    });
    closeButton.addEventListener('click', () => closePreview(true));
    overflowClose.addEventListener('click', () => closeOverflow(true));
    window.addEventListener('resize', schedulePlacement);
    window.addEventListener('scroll', schedulePlacement, { passive: true });
    scrollArea.addEventListener('scroll', schedulePlacement, { passive: true });
    overflowList.addEventListener('scroll', schedulePlacement, { passive: true });
  }

  document.querySelector('.deadline-calendar__previous')?.addEventListener('click', () => shiftMonth(-1));
  document.querySelector('.deadline-calendar__next')?.addEventListener('click', () => shiftMonth(1));
  document.querySelector('.deadline-calendar__today')?.addEventListener('click', () => {
    month.value = today.slice(0, 7);
    renderCalendar();
  });
  month.addEventListener('change', renderCalendar);
  topic?.addEventListener('change', renderCalendar);
  renderCalendar();
  if (deadlineService && topic && globalThis.IE104.services.studentSubmissions) {
    const { storage, services } = globalThis.IE104;
    const dataKeys = [storage.teachingKey, storage.teamKey, storage.proposalKey, storage.registrationKey, null];
    services.studentSubmissions.onUploadsChanged(refreshActiveDeadlines);
    window.addEventListener('pageshow', refreshActiveDeadlines);
    window.addEventListener('focus', refreshActiveDeadlines);
    window.addEventListener('storage', event => {
      if (dataKeys.includes(event.key)) void refreshActiveDeadlines();
    });
    void refreshActiveDeadlines();
  }
  setupGoogleCalendarDialog();
})();
