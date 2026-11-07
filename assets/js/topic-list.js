(() => {
  const form = document.getElementById('topic-filter-form');
  const search = document.getElementById('topic-search');
  const results = document.querySelector('[data-topic-results]');
  if (!form || !search || !results) return;

  const status = results.querySelector('[data-topic-count]');
  const list = results.querySelector('.topic-list');
  if (!status || !list) return;

  const viewport = list.closest('.topic-list-scroll') || list;
  const pagination = results.querySelector('.pagination');
  const controls = Array.from(form.elements).filter((control) => control.matches('input, select'));
  const filters = [...new Set(controls
    .filter((control) => control.type === 'checkbox' ||
      (control.tagName === 'SELECT' && control.name !== 'topic_sort'))
    .map((control) => control.name))];

  const normalize = (value) => value.toLocaleLowerCase('vi').normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').trim();
  const collator = new Intl.Collator('vi', { numeric: true });

  const topics = Array.from(list.children, (item) => {
    const card = item.matches('.topic-card') ? item : item.querySelector('.topic-card');
    const title = card.querySelector('.topic-card__title').textContent.trim();
    const extraTerms = Array.from(card.querySelectorAll('[data-topic-search-term]'),
      (field) => field.textContent);

    return {
      item,
      title,
      terms: normalize([title, card.dataset.topicId, ...extraTerms].join(' ')),
      date: card.querySelector('time[datetime]')?.dateTime || '',
      fields: new Map(filters.map((name) => [name, card.getAttribute(`data-${name}`)])),
    };
  });

  const orders = {
    'name-asc': (first, second) => collator.compare(first.title, second.title),
    newest: (first, second) => second.date.localeCompare(first.date),
    oldest: (first, second) => first.date.localeCompare(second.date),
  };
  let previousOrder;

  function render() {
    const data = new FormData(form);
    const terms = normalize(search.value).split(/\s+/).filter(Boolean);
    const selected = filters.map((name) => [name, data.getAll(name).filter(Boolean)]);
    let visibleCount = 0;

    for (const topic of topics) {
      // Kết hợp các nhóm lọc, chấp nhận bất kỳ lựa chọn nào trong cùng nhóm.
      const matchesFilters = selected.every(([name, values]) =>
        !values.length || values.includes(topic.fields.get(name)));
      const matchesSearch = terms.every((term) => topic.terms.includes(term));
      topic.item.hidden = !matchesFilters || !matchesSearch;
      if (!topic.item.hidden) visibleCount += 1;
    }

    const order = data.get('topic_sort');
    if (order !== previousOrder) {
      const sorted = orders[order] ? [...topics].sort(orders[order]) : topics;
      for (const topic of sorted) list.append(topic.item);
      previousOrder = order;
    }

    const message = visibleCount
      ? `${visibleCount}/${topics.length} đề tài minh họa`
      : 'Không tìm thấy đề tài phù hợp. Thử từ khóa khác hoặc xóa bộ lọc.';
    if (status.textContent !== message) status.textContent = message;
    status.toggleAttribute('data-empty', visibleCount === 0);
    viewport.hidden = visibleCount === 0;
    if (pagination) pagination.hidden = visibleCount < topics.length;
    viewport.scrollTop = 0;
  }

  search.addEventListener('input', render);
  for (const control of controls) {
    if (control !== search) control.addEventListener('change', render);
  }
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    render();
  });
  // Sự kiện reset xảy ra trước khi trình duyệt khôi phục giá trị mặc định.
  form.addEventListener('reset', () => window.setTimeout(render, 0));

  const inProgress = form.querySelector('#status-in-progress');
  if (inProgress && window.location.hash === '#de-tai-dang-thuc-hien') {
    inProgress.checked = true;
  }
  status.hidden = false;
  render();
})();
