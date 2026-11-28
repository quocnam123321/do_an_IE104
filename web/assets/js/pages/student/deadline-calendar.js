(() => {
  const service = globalThis.IE104?.services?.deadlines;
  const month = document.getElementById('deadline-month');
  const topic = document.getElementById('deadline-topic');
  const calendar = document.querySelector('.calendar-table');
  const notice = document.querySelector('[data-calendar-status]');
  const dialog = document.getElementById('calendar-event-dialog');
  if (!service || !calendar || !month || !topic || !dialog) return;
  let currentEvent = null;

  function utcDate(year, monthIndex, day) {
    const date = new Date(0);
    date.setUTCFullYear(year, monthIndex, day);
    return date;
  }

  function eventButton(event) {
    const button = document.createElement('button');
    button.type = 'button';
    const kind = event.kind === 'milestone' ? 'topic' : event.kind;
    button.className = `calendar-event calendar-event--${kind}`;
    button.dataset.eventId = event.id;
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-controls', dialog.id);
    const title = document.createElement('strong');
    title.textContent = { task: 'Hạn công việc', topic: 'Mốc đề tài', submission: 'Hạn nộp bài' }[kind];
    const text = document.createElement('span');
    text.textContent = `${event.projectId} - ${event.title}`;
    button.append(title, document.createElement('br'), text);
    button.addEventListener('click', () => {
      currentEvent = event.id;
      dialog.querySelector('h2').textContent = event.title;
      const details = dialog.querySelector('dl');
      details.replaceChildren();
      const deadline = event.deadline
        ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(event.deadline))
        : event.date.split('-').reverse().join('/');
      let status = event.closed ? 'Đã hoàn tất' : 'Đang theo dõi hạn';
      if (event.locked) status = 'Đã khóa nhận bài';
      if (event.submitted) status = 'Đã nộp';
      [['Đề tài', `${event.projectId} - ${event.projectTitle}`], ['Hạn', deadline], ['Theo dõi', status]].forEach(([label, value]) => {
        const term = document.createElement('dt');
        const description = document.createElement('dd');
        term.textContent = label;
        description.textContent = value;
        details.append(term, description);
      });
      const link = dialog.querySelector('[data-calendar-detail]');
      link.hidden = !event.detailUrl;
      if (event.detailUrl) link.href = event.detailUrl;
      else link.removeAttribute('href');
      dialog.showModal();
    });
    return button;
  }

  function render() {
    try {
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month.value) || month.value.startsWith('0000')) throw new Error('Chọn tháng hợp lệ từ năm 0001 đến 9999.');
      const state = service.getState({ projectId: topic.value, month: month.value });
      const selected = topic.value;
      topic.replaceChildren(new Option('Tất cả đề tài', ''), ...state.topics.map(item => new Option(`${item.id} - ${item.title}`, item.id)));
      topic.value = selected;
      const [year, number] = month.value.split('-').map(Number);
      const start = (utcDate(year, number - 1, 1).getUTCDay() + 6) % 7;
      const days = utcDate(year, number, 0).getUTCDate();
      const today = service.today();
      const body = calendar.tBodies[0];
      body.replaceChildren();
      let row;
      for (let index = 0; index < Math.ceil((start + days) / 7) * 7; index += 1) {
        if (index % 7 === 0) row = body.insertRow();
        const cell = row.insertCell();
        const day = index - start + 1;
        if (day < 1 || day > days) { cell.className = 'calendar-table__empty'; continue; }
        const date = `${month.value}-${String(day).padStart(2, '0')}`;
        const time = document.createElement('time');
        time.dateTime = date;
        time.textContent = day;
        cell.append(time);
        if (date === today) { cell.className = 'calendar-table__today'; time.setAttribute('aria-current', 'date'); cell.append(' - Hôm nay'); }
        state.events.filter(event => event.date === date).forEach(event => cell.append(eventButton(event)));
      }
      calendar.caption.textContent = `Tháng ${number}/${year} - Giờ Việt Nam (UTC+7)`;
      notice.textContent = `${state.events.length} mốc trong tháng${state.warning ? `. ${state.warning}` : state.events.length ? '.' : '. Không có hạn phù hợp với bộ lọc.'}`;
      document.body.dataset.calendarReady = 'true';
    } catch (failure) { notice.textContent = failure.message; }
  }

  function shiftMonth(offset) {
    const [year, number] = (month.value || service.today().slice(0, 7)).split('-').map(Number);
    const date = utcDate(year, number - 1 + offset, 1);
    if (date.getUTCFullYear() < 1 || date.getUTCFullYear() > 9999) return;
    month.value = `${String(date.getUTCFullYear()).padStart(4, '0')}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
    render();
  }

  document.querySelectorAll(
    '.deadline-calendar__toolbar :is(input, select, .deadline-calendar__previous, .deadline-calendar__next, .deadline-calendar__today)'
  ).forEach(control => { control.disabled = false; });
  month.value = service.today().slice(0, 7);
  month.min = '0001-01';
  month.max = '9999-12';
  document.querySelector('.deadline-calendar__previous').addEventListener('click', () => shiftMonth(-1));
  document.querySelector('.deadline-calendar__next').addEventListener('click', () => shiftMonth(1));
  document.querySelector('.deadline-calendar__today').addEventListener('click', () => { month.value = service.today().slice(0, 7); render(); });
  month.addEventListener('change', render);
  topic.addEventListener('change', render);
  dialog.addEventListener('close', () => {
    const button = [...calendar.querySelectorAll('[data-event-id]')].find(node => node.dataset.eventId === currentEvent);
    (button || month).focus({ preventScroll: true });
  });
  window.addEventListener('pageshow', render);
  window.addEventListener('storage', event => {
    const { progressKey, teamKey, teachingKey, proposalKey, registrationKey } = globalThis.IE104.storage;
    if ([progressKey, teamKey, teachingKey, proposalKey, registrationKey, null].includes(event.key)) render();
  });
  window.addEventListener('ie104:proposals-updated', render);
  render();
})();
