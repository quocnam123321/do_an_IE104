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
  const projectStatusCodes = { 'dang-thuc-hien': 'in-progress', 'hoan-thanh': 'completed', 'da-rut': 'withdrawn' };
  const projectStatusLabels = { 'in-progress': 'Đang thực hiện', completed: 'Hoàn thành', withdrawn: 'Đã rút' };

  function renderProjectStatus(card) {
    const raw = card.dataset.status;
    const status = projectStatusCodes[raw] || raw || 'unknown';
    card.dataset.status = status;
    const actions = card.querySelector('.topic-card__actions');
    let badge = actions.querySelector('.topic-card__project-status');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'topic-card__project-status';
      actions.prepend(badge);
    }
    if (badge.dataset.status !== status) {
      badge.dataset.status = status;
      badge.textContent = projectStatusLabels[status] || 'Chưa có thông tin';
    }
  }

  function refreshCodes() {
    for (const item of [...list.children]) {
      if (!item.matches('.topic-card') && !item.querySelector('.topic-card')) item.remove();
    }
    for (const card of list.querySelectorAll('.topic-card')) {
      if (card.dataset.topicType === 'master') { (card.parentElement.matches('li') ? card.parentElement : card).remove(); continue; }
      const kind = isSupervised ? 'supervised' : 'created';
      const model = window.IE104.services.lecturerTopics?.list(kind).find(topic => topic.id === card.dataset.topicId || topic.workspaceId === card.dataset.topicId);
      const project = window.IE104.data.myTopics?.find(topic => topic.id === card.dataset.topicId || topic.topicId === card.dataset.topicId);
      const record = model || project || catalog?.records.find(topic => topic.id === card.dataset.topicId);
      const type = record?.topicType || card.dataset.topicType;
      card.dataset.course = catalog.courseKey(card.dataset.course);
      const nodes = card.querySelectorAll('.topic-card__meta-text');
      if (record && nodes[0]) nodes[0].textContent = record.displayId || catalog.formatCode(type, record.code);
      if (nodes[1]) nodes[1].textContent = catalog.subjectLabel(record || { topicType: type, course: card.dataset.course, courseLabel: nodes[1].textContent });
      if (record) {
        if (nodes[2]) nodes[2].textContent = `Học kỳ ${record.semester === 'summer' ? 'hè' : record.semester} · ${String(record.academicYear || '').replace(/[-—]/g, '–')}`;
        card.dataset.topicType = record.topicType;
        card.dataset.course = catalog.courseKey(record.course);
        card.dataset.hocKy = `${String(record.academicYear).replace(/[–—]/g, '-')}-${record.semester === 'summer' ? '3' : record.semester}`;
        if (record.supervisionRole || record.role) card.dataset.role = record.role || record.supervisionRole;
      }
      if (!['course', 'do-an-mon-hoc', 'do-an'].includes(type)) card.dataset.course = '';
      if (isSupervised) renderProjectStatus(card);
      nodes.forEach(node => { node.textContent = node.textContent.trim().replace(/^(Mã đề tài|Môn học|Loại đề tài|Nhóm thực hiện|Tác giả|GVHD theo nguồn|Ngày tạo|Ngày gửi|Vai trò của tôi):\s*/, '').replace(/(Học kỳ[^•·]*)\s[-•]\s(?=20)/, '$1 · '); });
      if (nodes[0]) card.querySelector('.topic-card__meta')?.setAttribute('aria-label', `Thông tin đề tài ${nodes[0].textContent}`);
      if (isSupervised && nodes[3] && record && !card.hasAttribute('data-approved-proposal')) {
        const participants = window.IE104.services.lecturerTopics.supervisedParticipants(record);
        nodes[3].textContent = participants.label;
        card.dataset.participantSearch = participants.studentLabel;
      }
      if (document.body.classList.contains('teacher-created-topics-page')) {
        const createdAt = record ? record.createdAt || '' : card.dataset.createdAt || '';
        const row = nodes[3]?.closest('.topic-card__meta-item');
        if (row) row.hidden = !Number.isFinite(Date.parse(createdAt));
        card.dataset.createdAt = createdAt;
        if (nodes[3]) nodes[3].textContent = createdAt ? createdAt.split('T')[0].split('-').reverse().join('/') : '';

        if (card.dataset.status === 'registered') continue;
        const closed = card.dataset.status === 'closed';
        card.dataset.status = closed ? 'closed' : 'open';
        const badge = card.querySelector('.topic-card__status');
        if (badge) { badge.textContent = closed ? 'Đã đóng đăng ký' : 'Đang mở đăng ký'; badge.className = `topic-card__status topic-card__status--${card.dataset.status}`; }
      }
    }
  }
  const viewport = list.closest('.topic-list-scroll') || list;
  const showEmpty = window.IE104.ui.createTopicListEmpty(viewport, form, search, {
    emptyTitle: isSupervised ? 'Chưa có đề tài hướng dẫn' : 'Chưa có đề tài đã tạo',
    emptyDescription: isSupervised
      ? 'Đề tài được phân công hướng dẫn sẽ xuất hiện tại đây.'
      : 'Đề tài mới sẽ xuất hiện tại đây sau khi được tạo.',
  });
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
  const params = new URLSearchParams(location.search);
  const requested = Number(params.get('page'));
  let page = Number.isSafeInteger(requested) && requested > 0 ? requested : 1;

  if (isSupervised) {
    const statuses = params.getAll('status');
    for (const input of form.querySelectorAll('input[type="checkbox"][name="status"]')) {
      input.checked = statuses.includes(input.value);
    }
    const sort = form.elements.namedItem('topic_sort');
    const requestedSort = params.get('topic_sort');
    if (sort && Object.hasOwn(orders, requestedSort)) sort.value = requestedSort;
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
    clearPageTransition();
    const terms = normalize(search.value).split(/\s+/).filter(Boolean);
    const topics = Array.from(list.children, item => {
      if (!originalOrder.has(item)) originalOrder.set(item, nextOrder++);
      const card = item.matches('.topic-card') ? item : item.querySelector('.topic-card');
      const date = isSupervised ? Date.parse(card.dataset.sortDate) : card.dataset.createdAt || card.querySelector('time[datetime]')?.dateTime || '';
      const title = card.querySelector('.topic-card__title').textContent.trim();
      const fields = Array.from(card.querySelectorAll('[data-topic-search-term], .topic-card__meta-text'), node => node.textContent);
      const terms = normalize([title, card.dataset.topicId, card.dataset.participantSearch, ...fields].join(' '));
      return { item, card, title, date, terms };
    });
    topics.sort((a, b) => originalOrder.get(a.item) - originalOrder.get(b.item));
    const unique = window.IE104?.topicIdentity?.uniqueTitles(topics) || topics;
    window.IE104.ui.renderCourseFilters(form, unique.map(({ card }) => ({
      id: card.dataset.course,
      label: card.querySelectorAll('.topic-card__meta-text')[1]?.textContent.trim(),
    })));
    const filterControls = Array.from(form.elements).filter(node =>
      node.type === 'checkbox' || node.type === 'radio' || (node.tagName === 'SELECT' && node.name !== 'topic_sort'));
    const filters = [...new Set(filterControls.map(node => node.name).filter(Boolean))];
    const data = new FormData(form);
    const selected = filters.map(name => [name, data.getAll(name).filter(Boolean)]);
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
    const hasMatches = matched.length > 0;
    const sourceError = results.dataset.topicSourceError;
    const count = `Hiển thị ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, matched.length)} trên ${matched.length} đề tài`;
    const summary = hasMatches ? count : 'Không có đề tài phù hợp.';
    status.textContent = sourceError ? `${summary} Danh sách có thể chưa cập nhật. ${sourceError}` : summary;
    status.classList.toggle('visually-hidden', !sourceError);
    status.hidden = false;
    viewport.hidden = !hasMatches;
    showEmpty(hasMatches, unique.length > 0);
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
    const url = new URL(location.href);
    if (page > 1) url.searchParams.set('page', String(page));
    else url.searchParams.delete('page');
    if (isSupervised) {
      url.searchParams.delete('status');
      for (const value of data.getAll('status')) url.searchParams.append('status', value);
      const sort = data.get('topic_sort');
      if (sort && sort !== 'newest') url.searchParams.set('topic_sort', sort);
      else url.searchParams.delete('topic_sort');
    }
    try { history.replaceState(null, '', url); } catch {}
  }
  search.addEventListener('input', () => { page = 1; render(); });
  document.addEventListener('change', event => {
    if (event.target.form !== form || event.target === search) return;
    page = 1;
    render();
  });
  form.addEventListener('submit', event => { event.preventDefault(); page = 1; render(); });
  form.addEventListener('reset', () => setTimeout(() => { page = 1; render(); }, 0));
  document.addEventListener('ie104:topics-updated', () => render());
  window.addEventListener('pageshow', event => { if (event.persisted) render(); });
  render();
})();
