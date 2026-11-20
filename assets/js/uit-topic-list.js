(() => {
  const form = document.getElementById('topic-filter-form');
  const search = document.getElementById('topic-search');
  const results = document.querySelector('[data-topic-results]');
  if (!form || !search || !results) return;
  const status = results.querySelector('[data-topic-count]');
  const list = results.querySelector('.topic-list');
  const pagination = results.querySelector('.pagination');
  if (!status || !list || !pagination) return;
  const viewport = list.closest('.topic-list-scroll') || list;
  const controls = Array.from(form.elements).filter(node => node.matches('input, select'));
  const filters = [...new Set(controls.filter(node => node.type === 'checkbox' || (node.tagName === 'SELECT' && node.name !== 'topic_sort')).map(node => node.name))];
  const normalize = value => String(value || '').toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').trim();
  const collator = new Intl.Collator('vi', { numeric: true });
  const orders = { 'name-asc': (a, b) => collator.compare(a.title, b.title), newest: (a, b) => b.date.localeCompare(a.date), oldest: (a, b) => a.date.localeCompare(b.date) };
  const pageSize = 5;
  const originalOrder = new WeakMap(); let nextOrder = 0;
  const requested = Number(new URLSearchParams(location.search).get('page'));
  let page = Number.isSafeInteger(requested) && requested > 0 ? requested : 1;
  function render() {
    const data = new FormData(form);
    const terms = normalize(search.value).split(/\s+/).filter(Boolean);
    const selected = filters.map(name => [name, data.getAll(name).filter(Boolean)]);
    const topics = Array.from(list.children, item => {
      if (!originalOrder.has(item)) originalOrder.set(item, nextOrder++);
      const card = item.matches('.topic-card') ? item : item.querySelector('.topic-card');
      return { item, card, title: card.querySelector('.topic-card__title').textContent.trim(), date: card.querySelector('time[datetime]')?.dateTime || '', terms: normalize([card.querySelector('.topic-card__title').textContent, card.dataset.topicId, ...Array.from(card.querySelectorAll('[data-topic-search-term]'), node => node.textContent)].join(' ')) };
    });
    const matched = topics.filter(topic => selected.every(([name, values]) => !values.length || values.includes(topic.card.getAttribute(`data-${name}`))) && terms.every(term => topic.terms.includes(term)));
    const order = orders[data.get('topic_sort')];
    matched.sort((a, b) => (order ? order(a, b) : 0) || originalOrder.get(a.item) - originalOrder.get(b.item));
    const totalPages = Math.ceil(matched.length / pageSize);
    page = Math.max(1, Math.min(page, totalPages || 1));
    topics.forEach(topic => { topic.item.hidden = true; });
    matched.forEach((topic, index) => { list.append(topic.item); topic.item.hidden = index < (page - 1) * pageSize || index >= page * pageSize; });
    status.textContent = matched.length ? `Hiển thị ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, matched.length)} trên ${matched.length} đề tài` : 'Không tìm thấy đề tài phù hợp. Thử từ khóa khác hoặc xóa bộ lọc.';
    status.hidden = false; status.toggleAttribute('data-empty', !matched.length); viewport.hidden = !matched.length;
    const pages = document.createElement('ul'); pages.className = 'pagination__list';
    const add = (target, text, label, disabled = false) => {
      const item = document.createElement('li');
      const button = document.createElement('button'); button.type = 'button'; button.className = 'pagination__button'; button.textContent = text; button.setAttribute('aria-label', label); button.disabled = disabled;
      if (target === page && /^\d+$/.test(text)) { button.className = 'pagination__current'; button.setAttribute('aria-current', 'page'); }
      button.addEventListener('click', () => { page = target; render(); pagination.querySelector('[aria-current="page"]')?.focus({ preventScroll: true }); });
      item.append(button); pages.append(item);
    };
    add(page - 1, '‹', 'Trang trước', page === 1);
    for (let number = 1; number <= totalPages; number++) add(number, String(number), `Trang ${number}`);
    add(page + 1, '›', 'Trang sau', page >= totalPages);
    pagination.replaceChildren(pages); pagination.hidden = totalPages <= 1; viewport.scrollTop = 0;
    const url = new URL(location.href); if (page > 1) url.searchParams.set('page', String(page)); else url.searchParams.delete('page');
    try { history.replaceState(null, '', url); } catch {}
  }
  search.addEventListener('input', () => { page = 1; render(); });
  controls.filter(node => node !== search).forEach(node => node.addEventListener('change', () => { page = 1; render(); }));
  form.addEventListener('submit', event => { event.preventDefault(); page = 1; render(); });
  form.addEventListener('reset', () => setTimeout(() => { page = 1; render(); }, 0));
  document.addEventListener('ie104:topics-updated', render);
  render();
})();
