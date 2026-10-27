(() => {
  // Mốc và tên giữ chỗ theo wireframe, chưa kết nối dữ liệu nghiệp vụ.
  const today = '2026-10-18';
  const month = document.getElementById('deadline-month');
  const topic = document.getElementById('deadline-topic');
  const range = document.getElementById('upcoming-range');
  const sort = document.getElementById('upcoming-sort');
  const search = document.getElementById('upcoming-search');
  const form = document.getElementById('upcoming-submissions-filters');
  const calendar = document.querySelector('.calendar-table');
  const list = document.querySelector('.upcoming-submissions__cards');
  const results = document.getElementById('upcoming-results');
  const rows = Array.from(list.querySelectorAll('.submission-card'));
  const events = Array.from(calendar.querySelectorAll('.calendar-event')).map((element) => ({
    date: element.closest('td').querySelector('time').dateTime,
    element: element.cloneNode(true),
    submission: element.classList.contains('calendar-event--submission'),
  }));
  const normalize = (text) => text.toLocaleLowerCase('vi').normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').trim();

  function eventNode(event) {
    const wrapper = document.createElement('div');
    wrapper.className = 'calendar-entry';
    wrapper.append(event.element.cloneNode(true));
    const trigger = wrapper.firstElementChild;
    if (!event.submission) return wrapper;
    const row = rows.find((item) => `#${item.id}` === trigger.getAttribute('href'));
    const preview = document.createElement('section');
    preview.className = 'calendar-preview';
    preview.id = `preview-${row.id}`;
    preview.setAttribute('aria-label', `Chi tiết ${row.querySelector('.submission-card__title').textContent}`);
    const heading = document.createElement('h3');
    heading.textContent = row.querySelector('.submission-card__title').textContent;
    const details = document.createElement('dl');
    for (const [label, value] of [['Đề tài', row.querySelector('.submission-card__topic p').textContent], ['Hạn nộp', row.querySelector('.submission-card__deadline p').textContent]]) {
      const term = document.createElement('dt');
      const description = document.createElement('dd');
      term.textContent = label;
      description.textContent = value;
      details.append(term, description);
    }
    const submit = row.querySelector('a').cloneNode(true);
    preview.append(heading, details, submit);
    trigger.setAttribute('aria-controls', preview.id);
    wrapper.append(preview);
    wrapper.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
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

  function renderList() {
    const from = Date.parse(`${today}T00:00:00+07:00`);
    const until = from + Number(range.value) * 86400000;
    const query = normalize(search.value);
    const matched = rows.filter((row) => {
      const date = Date.parse(`${row.querySelector('time').dateTime}T00:00:00+07:00`);
      return date >= from && date <= until && normalize(row.querySelector('.submission-card__title').textContent + ' ' + row.querySelector('.submission-card__topic p').textContent).includes(query);
    }).sort((a, b) => {
      const order = a.querySelector('time').dateTime.localeCompare(b.querySelector('time').dateTime);
      return sort.value === 'han-xa-nhat' ? -order : order;
    });
    list.replaceChildren(...matched);
    if (!matched.length) list.append(document.getElementById('deadlines-filter-empty-template').content.cloneNode(true));
    results.textContent = `Các bài nộp trong ${range.value} ngày sau mốc minh họa 18/10/2026 · ${matched.length} kết quả`;
  }

  function shiftMonth(offset) {
    if (!month.value) month.value = today.slice(0, 7);
    const [year, number] = month.value.split('-').map(Number);
    const date = new Date(year, number - 1 + offset, 1);
    month.value = `${String(date.getFullYear()).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    renderCalendar();
  }
  document.querySelector('.deadline-calendar__previous').addEventListener('click', () => shiftMonth(-1));
  document.querySelector('.deadline-calendar__next').addEventListener('click', () => shiftMonth(1));
  document.querySelector('.deadline-calendar__today').addEventListener('click', () => { month.value = today.slice(0, 7); renderCalendar(); });
  month.addEventListener('change', renderCalendar);
  // Dữ liệu hiện có cùng thuộc một đề tài minh họa nên cả hai lựa chọn đều hiển thị cùng lịch.
  topic.addEventListener('change', renderCalendar);
  range.addEventListener('change', renderList);
  sort.addEventListener('change', renderList);
  search.addEventListener('input', renderList);
  form.addEventListener('submit', (event) => { event.preventDefault(); renderList(); });
  form.addEventListener('reset', () => { requestAnimationFrame(renderList); });
  renderCalendar();
  renderList();
})();
