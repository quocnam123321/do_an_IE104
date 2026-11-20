(() => {
  const form = document.getElementById('topic-filter-form');
  const search = document.getElementById('topic-search');
  const results = document.querySelector('[data-topic-results]');
  if (!form || !search || !results) return;

  const status = results.querySelector('[data-topic-count]');
  const list = results.querySelector('.topic-list');
  if (!status || !list) return;

  const teachingCount = document.querySelector('[data-topic-tab-count="teaching"]');
  const createdCount = document.querySelector('[data-topic-tab-count="created"]');
  const teacherTopics = window.TeacherTopicStore;
  const proposals = window.IE104Proposals;
  const teaching = window.IE104?.services?.teaching;

  function refreshTabCounts() {
    if (teachingCount && teaching && proposals) {
      const approved = proposals.getAll().filter(record => record.status === 'approved').length;
      teachingCount.textContent = `(${teaching.listActiveProjects().length + approved})`;
    }
    if (createdCount && teacherTopics) {
      try {
        createdCount.textContent = `(${teacherTopics.read().length})`;
      } catch {
        createdCount.textContent = '';
      }
    }
  }

  proposals?.subscribe(refreshTabCounts);
  window.addEventListener('pageshow', refreshTabCounts);
  window.addEventListener('storage', event => {
    if (event.key === teacherTopics?.key || event.key === null) refreshTabCounts();
  });
  refreshTabCounts();

  const viewport = list.closest('.topic-list-scroll') || list;
  const pagination = results.querySelector('.pagination');
  const pager = pagination?.querySelector('.pagination__list');
  const previous = pager?.firstElementChild;
  const next = pager?.lastElementChild;
  const pageSize = 5;
  let page = 1;
  const controls = Array.from(form.elements).filter((control) => control.matches('input, select'));
  const filters = [...new Set(controls
    .filter((control) => control.type === 'checkbox' ||
      (control.tagName === 'SELECT' && control.name !== 'topic_sort'))
    .map((control) => control.name))];

  const normalize = (value) => value.toLocaleLowerCase('vi').normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').trim();
  const collator = new Intl.Collator('vi', { numeric: true });

  const readTopics = () => Array.from(list.children, (item) => {
    const card = item.matches('.topic-card') ? item : item.querySelector('.topic-card');
    const title = card.querySelector('.topic-card__title').textContent.trim();
    const extraTerms = Array.from(card.querySelectorAll('[data-topic-search-term]'),
      field => field.dataset.topicSearchTerm || field.textContent);

    return {
      item,
      title,
      terms: normalize([title, card.dataset.topicId, ...extraTerms].join(' ')),
      date: card.querySelector('time[datetime]')?.dateTime || '',
      fields: new Map(filters.map((name) => [name, card.getAttribute(`data-${name}`)])),
    };
  });
  let topics = readTopics();

  const orders = {
    'name-asc': (first, second) => collator.compare(first.title, second.title),
    newest: (first, second) => second.date.localeCompare(first.date),
    oldest: (first, second) => first.date.localeCompare(second.date),
  };
  function render(focusPage = false) {
    const data = new FormData(form);
    const terms = normalize(search.value).split(/\s+/).filter(Boolean);
    const selected = filters.map((name) => [name, data.getAll(name).filter(Boolean)]);
    const matches = topics.filter(topic => {
      // Kết hợp các nhóm lọc, chấp nhận bất kỳ lựa chọn nào trong cùng nhóm.
      const matchesFilters = selected.every(([name, values]) =>
        !values.length || values.includes(topic.fields.get(name)));
      const matchesSearch = terms.every((term) => topic.terms.includes(term));
      return matchesFilters && matchesSearch;
    });
    const order = data.get('topic_sort');
    if (orders[order]) matches.sort(orders[order]);
    const total = matches.length;
    const pageCount = pager ? Math.max(1, Math.ceil(total / pageSize)) : 1;
    page = Math.min(page, pageCount);
    const start = (page - 1) * pageSize;
    const visible = pager ? matches.slice(start, start + pageSize) : matches;
    for (const topic of topics) topic.item.hidden = true;
    for (const topic of visible) {
      topic.item.hidden = false;
      list.append(topic.item);
    }
    const message = total
      ? `Hiển thị ${start + 1}–${start + visible.length} / ${total} đề tài. Trang ${page}/${pageCount}.`
      : topics.length ? 'Không tìm thấy đề tài phù hợp. Thử từ khóa khác hoặc xóa bộ lọc.' : 'Chưa có đề tài trong danh sách này.';
    if (status.textContent !== message) status.textContent = message;
    status.toggleAttribute('data-empty', total === 0);
    viewport.hidden = total === 0;
    if (pager) {
      const before = previous.querySelector('button');
      const after = next.querySelector('button');
      before.disabled = page === 1;
      before.dataset.page = page - 1;
      after.disabled = page === pageCount;
      after.dataset.page = page + 1;
      const numbers = Array.from({ length: pageCount }, (_, index) => {
        const number = index + 1;
        const item = document.createElement('li');
        const current = number === page;
        const control = document.createElement(current ? 'span' : 'button');
        control.textContent = number;
        control.className = current ? 'pagination__current' : 'pagination__button';
        control.setAttribute('aria-label', `Trang ${number}`);
        if (current) {
          control.setAttribute('aria-current', 'page');
          control.tabIndex = -1;
        } else {
          control.type = 'button';
          control.dataset.page = number;
        }
        item.append(control);
        return item;
      });
      pager.replaceChildren(previous, ...numbers, next);
      pagination.hidden = total === 0;
      if (focusPage) pager.querySelector('[aria-current="page"]').focus({ preventScroll: true });
    }
    viewport.scrollTop = 0;
  }

  function applyFilters() {
    page = 1;
    render();
  }
  pager?.addEventListener('click', event => {
    const button = event.target.closest('button[data-page]');
    if (!button || button.disabled) return;
    page = Number(button.dataset.page);
    render(true);
  });
  search.addEventListener('input', applyFilters);
  for (const control of controls) {
    if (control !== search) control.addEventListener('change', applyFilters);
  }
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    applyFilters();
  });
  // Sự kiện reset xảy ra trước khi trình duyệt khôi phục giá trị mặc định.
  form.addEventListener('reset', () => window.setTimeout(applyFilters, 0));
  // Các màn nối dữ liệu demo có thể thêm thẻ hoặc cập nhật trạng thái từ tab khác.
  document.addEventListener('ie104:topics-updated', () => {
    topics = readTopics();
    render();
  });

  const inProgress = form.querySelector('#status-in-progress');
  if (inProgress && window.location.hash === '#de-tai-dang-thuc-hien') {
    inProgress.checked = true;
  }
  status.hidden = false;
  render();
})();
