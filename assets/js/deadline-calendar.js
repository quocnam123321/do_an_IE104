(() => {
  // Mốc và tên giữ chỗ theo wireframe, chưa kết nối dữ liệu nghiệp vụ.
  const today = '2026-10-18';
  const month = document.getElementById('deadline-month');
  const topic = document.getElementById('deadline-topic');
  const calendar = document.querySelector('.calendar-table');
  if (!calendar || !month) return;

  const events = Array.from(calendar.querySelectorAll('.calendar-event')).map((element, index) => {
    const date = element.closest('td').querySelector('time').dateTime;
    const rawText = element.textContent.replace(/\s+/g, ' ').trim();
    const titleMatch = rawText.match(/-\s*(.+)$/);
    const title = titleMatch ? titleMatch[1].trim() : rawText;
    const [year, monthNum, day] = date.split('-');
    return {
      id: `submission-${index + 1}`,
      date,
      title,
      topicName: '[Tên đề tài tương ứng]',
      deadlineLabel: `${day}/${monthNum}/${year} · hh:mm`,
      element: element.cloneNode(true),
      submission: element.classList.contains('calendar-event--submission'),
    };
  });

  function eventNode(event) {
    const wrapper = document.createElement('div');
    wrapper.className = 'calendar-entry';
    wrapper.append(event.element.cloneNode(true));
    const trigger = wrapper.firstElementChild;
    if (!event.submission) return wrapper;

    const preview = document.createElement('section');
    preview.className = 'calendar-preview';
    preview.id = `preview-${event.id}`;
    preview.setAttribute('aria-label', `Chi tiết ${event.title}`);

    const heading = document.createElement('h3');
    heading.textContent = event.title;

    const details = document.createElement('dl');
    for (const [label, value] of [['Đề tài', event.topicName], ['Hạn nộp', event.deadlineLabel]]) {
      const term = document.createElement('dt');
      const description = document.createElement('dd');
      term.textContent = label;
      description.textContent = value;
      details.append(term, description);
    }

    const submit = document.createElement('a');
    submit.className = 'upcoming-submissions__submit';
    submit.href = 'chi-tiet-de-tai-sinh-vien.html#submission-form-section';
    submit.setAttribute('aria-label', `Nộp bài: ${event.title}`);
    submit.setAttribute('aria-describedby', 'deadline-demo-notice');
    submit.textContent = 'Nộp bài';

    preview.append(heading, details, submit);
    trigger.setAttribute('aria-controls', preview.id);
    wrapper.append(preview);

    wrapper.addEventListener('keydown', (evt) => {
      if (evt.key === 'Escape') {
        trigger.focus();
        wrapper.classList.add('calendar-entry--dismissed');
      }
    });
    wrapper.addEventListener('pointerenter', () => wrapper.classList.remove('calendar-entry--dismissed'));
    wrapper.addEventListener('focusin', () => wrapper.classList.remove('calendar-entry--dismissed'));
    return wrapper;
  }

  function renderCalendar() {
    if (!/^\d{4}-\d{2}$/.test(month.value)) return;
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
      events.filter((event) => event.date === date).forEach((event) => cell.append(eventNode(event)));
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

  document.querySelector('.deadline-calendar__previous')?.addEventListener('click', () => shiftMonth(-1));
  document.querySelector('.deadline-calendar__next')?.addEventListener('click', () => shiftMonth(1));
  document.querySelector('.deadline-calendar__today')?.addEventListener('click', () => {
    month.value = today.slice(0, 7);
    renderCalendar();
  });
  month.addEventListener('change', renderCalendar);
  // Dữ liệu hiện có cùng thuộc một đề tài minh họa nên cả hai lựa chọn đều hiển thị cùng lịch.
  topic?.addEventListener('change', renderCalendar);
  renderCalendar();
})();
