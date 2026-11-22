(() => {
  const form = document.getElementById('topic-filter-form');
  const search = document.getElementById('topic-search');
  const results = document.querySelector('[data-topic-results]');
  if (!form || !search || !results) return;
  const status = results.querySelector('[data-topic-count]');
  const list = results.querySelector('.topic-list');
  const pagination = results.querySelector('.pagination');
  if (!status || !list || !pagination) return;
  const catalog = window.UITLecturerCatalog;
  const isSupervised = document.body.dataset.lecturerList === 'supervised';
  function refreshCodes() { for (const card of list.querySelectorAll('.topic-card:not([data-approved-proposal])')) {
    const record = catalog?.records.find(topic => topic.id === card.dataset.topicId);
    if (!record) continue;
    if (document.body.classList.contains('teacher-created-topics-page') && card.dataset.status !== 'catalog') continue;
    const [code, course] = card.querySelectorAll('.topic-card__meta-text');
    code.textContent = catalog.formatCode(record.topicType, record.code);
    if (!document.body.classList.contains('teacher-created-topics-page')) course.textContent = record.courseLabel || 'Không áp dụng';
    card.querySelector('.topic-card__meta[aria-label]')?.setAttribute('aria-label', `Thông tin đề tài ${code.textContent}`);
  } }
  const viewport = list.closest('.topic-list-scroll') || list;
  const controls = Array.from(form.elements).filter(node => node.matches('input, select'));
  const filterControls = controls.filter(node => node.type === 'checkbox' || node.type === 'radio' || (node.tagName === 'SELECT' && node.name !== 'topic_sort'));
  const filters = [...new Set(filterControls.map(node => node.name).filter(Boolean))];
  const filterTitle = document.getElementById('topic-filters-title');
  const baseFilterTitle = filterTitle ? filterTitle.textContent.trim() : '';
  const filterCountNode = document.createElement('span');
  filterCountNode.className = 'topic-filters__count';
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  let pageEnterTimer = 0;
  let pageEnterHandler = null;
  const normalize = value => String(value || '').toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').trim();
  const collator = new Intl.Collator('vi', { numeric: true });
  const byDate = direction => (a, b) => {
    if (!isSupervised) return direction * a.date.localeCompare(b.date);
    if (Number.isNaN(a.date) || Number.isNaN(b.date)) return Number.isNaN(a.date) - Number.isNaN(b.date);
    return direction * (a.date - b.date);
  };
  const orders = { 'name-asc': (a, b) => collator.compare(a.title, b.title), newest: byDate(-1), oldest: byDate(1) };
  const pageSize = 5;
  const originalOrder = new WeakMap(); let nextOrder = 0;
  const requested = Number(new URLSearchParams(location.search).get('page'));
  let page = Number.isSafeInteger(requested) && requested > 0 ? requested : 1;

  function countActiveFilters() {
    return filterControls.reduce((total, node) => {
      if (node.disabled) return total;
      if (node.type === 'checkbox' || node.type === 'radio') {
        return total + (node.checked && node.value.trim() !== '' ? 1 : 0);
      }
      if (node.tagName === 'SELECT') {
        if (node.multiple) {
          return total + Array.from(node.selectedOptions).filter(option => option.value.trim() !== '').length;
        }
        return total + (node.value.trim() !== '' ? 1 : 0);
      }
      return total;
    }, 0);
  }

  function updateFilterTitle() {
    if (!filterTitle) return;
    const count = countActiveFilters();
    if (count > 0) {
      filterCountNode.textContent = `(${count})`;
      filterTitle.replaceChildren(`${baseFilterTitle} `, filterCountNode);
    } else {
      filterTitle.textContent = baseFilterTitle;
    }
  }

  function clearPageTransition() {
    if (pageEnterTimer) {
      clearTimeout(pageEnterTimer);
      pageEnterTimer = 0;
    }
    if (pageEnterHandler) {
      list.removeEventListener('animationend', pageEnterHandler);
      pageEnterHandler = null;
    }
    list.classList.remove('topic-list--page-entering');
  }

  function triggerPageTransition(visibleCards) {
    if (reducedMotion?.matches || !visibleCards.length) return;
    const viewportRect = viewport.getBoundingClientRect();
    if (viewportRect.height > 0) {
      for (const card of visibleCards) {
        if (card.getBoundingClientRect().top < viewportRect.bottom) {
          card.classList.add('topic-card--page-settled');
        }
      }
    }
    void list.offsetWidth;
    list.classList.add('topic-list--page-entering');
    pageEnterHandler = event => {
      if (event.target !== list) return;
      clearPageTransition();
    };
    list.addEventListener('animationend', pageEnterHandler);
    pageEnterTimer = setTimeout(clearPageTransition, 260);
  }

  function render(options = {}) {
    refreshCodes();
    const animatePageChange = Boolean(options && options.animatePageChange);
    updateFilterTitle();
    clearPageTransition();
    const data = new FormData(form);
    const terms = normalize(search.value).split(/\s+/).filter(Boolean);
    const selected = filters.map(name => [name, data.getAll(name).filter(Boolean)]);
    const topics = Array.from(list.children, item => {
      if (!originalOrder.has(item)) originalOrder.set(item, nextOrder++);
      const card = item.matches('.topic-card') ? item : item.querySelector('.topic-card');
      const date = isSupervised ? Date.parse(card.dataset.sortDate) : card.dataset.createdAt || card.querySelector('time[datetime]')?.dateTime || '';
      return { item, card, title: card.querySelector('.topic-card__title').textContent.trim(), date, terms: normalize([card.querySelector('.topic-card__title').textContent, card.dataset.topicId, ...Array.from(card.querySelectorAll('[data-topic-search-term]'), node => node.textContent)].join(' ')) };
    });
    topics.sort((a, b) => originalOrder.get(a.item) - originalOrder.get(b.item));
    const unique = window.IE104?.topicIdentity?.uniqueTitles(topics) || topics;
    const matched = unique.filter(topic => selected.every(([name, values]) => !values.length || values.includes(topic.card.getAttribute(`data-${name}`))) && terms.every(term => topic.terms.includes(term)));
    const order = orders[data.get('topic_sort')];
    matched.sort((a, b) => (order ? order(a, b) : 0) || originalOrder.get(a.item) - originalOrder.get(b.item));
    const totalPages = Math.ceil(matched.length / pageSize);
    page = Math.max(1, Math.min(page, totalPages || 1));
    topics.forEach(topic => {
      topic.item.hidden = true;
      topic.card.classList.remove('topic-card--page-settled');
    });
    const visibleCards = [];
    matched.forEach((topic, index) => {
      list.append(topic.item);
      const hidden = index < (page - 1) * pageSize || index >= page * pageSize;
      topic.item.hidden = hidden;
      if (!hidden) visibleCards.push(topic.card);
    });
    const tabCount = document.querySelector(
      document.body.classList.contains('teacher-created-topics-page')
        ? '[data-topic-tab-count="created"]' : '[data-topic-tab-count="teaching"]');
    if (tabCount) tabCount.textContent = unique.length;
    status.textContent = matched.length ? `Hiển thị ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, matched.length)} trên ${matched.length} đề tài` : 'Không tìm thấy đề tài phù hợp. Thử từ khóa khác hoặc xóa bộ lọc.';
    if (results.dataset.topicSourceError) {
      status.append(` · Danh sách có thể chưa cập nhật. ${results.dataset.topicSourceError}`);
    }
    status.hidden = false; status.toggleAttribute('data-empty', !matched.length); viewport.hidden = !matched.length;
    const pages = document.createElement('ul'); pages.className = 'pagination__list';
    const add = (target, text, label, disabled = false) => {
      const item = document.createElement('li');
      const button = document.createElement('button'); button.type = 'button'; button.className = 'pagination__button'; button.textContent = text; button.setAttribute('aria-label', label); button.disabled = disabled;
      if (target === page && /^\d+$/.test(text)) { button.className = 'pagination__current'; button.setAttribute('aria-current', 'page'); }
      button.addEventListener('click', () => {
        const nextPage = Math.max(1, Math.min(target, totalPages || 1));
        if (nextPage === page) return;
        page = nextPage;
        render({ animatePageChange: true });
        pagination.querySelector('[aria-current="page"]')?.focus({ preventScroll: true });
      });
      item.append(button); pages.append(item);
    };
    add(page - 1, '‹', 'Trang trước', page === 1);
    for (let number = 1; number <= totalPages; number++) add(number, String(number), `Trang ${number}`);
    add(page + 1, '›', 'Trang sau', page >= totalPages);
    pagination.replaceChildren(pages); pagination.hidden = totalPages <= 1; viewport.scrollTop = 0;
    if (animatePageChange) triggerPageTransition(visibleCards);
    const url = new URL(location.href); if (page > 1) url.searchParams.set('page', String(page)); else url.searchParams.delete('page');
    try { history.replaceState(null, '', url); } catch {}
  }
  search.addEventListener('input', () => { page = 1; render(); });
  controls.filter(node => node !== search).forEach(node => node.addEventListener('change', () => { page = 1; render(); }));
  form.addEventListener('submit', event => { event.preventDefault(); page = 1; render(); });
  form.addEventListener('reset', () => setTimeout(() => { page = 1; render(); }, 0));
  document.addEventListener('ie104:topics-updated', () => render());
  window.addEventListener('pageshow', event => { if (event.persisted) render(); });
  render();
})();
