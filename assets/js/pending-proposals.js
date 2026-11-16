(() => {
  const store = window.IE104Proposals;
  const form = document.getElementById('proposal-filter-form');
  const search = document.getElementById('proposal-search');
  const sort = document.getElementById('proposal-sort');
  const list = document.querySelector('.proposal-list');
  const count = document.getElementById('proposal-count');
  const empty = document.getElementById('proposal-empty');
  const pagination = document.querySelector('.pending-proposals .pagination');
  if (!store || !form || !search || !sort || !list || !count || !empty || !pagination) return;

  const viewport = list.closest('.proposal-list-scroll');
  const cardTemplate = list.querySelector('.proposal-card')?.cloneNode(true);
  if (!viewport || !cardTemplate) return;

  const pageSize = 5;
  const note = document.getElementById('proposal-preview-note');
  const demoNote = note?.textContent.trim() || '';
  const filterFields = {
    supervision_role: 'supervisionRole',
    topic_type: 'topicType',
    course: 'course',
  };
  const queryNames = [...Object.keys(filterFields), 'proposal_search', 'proposal_sort', 'page'];
  const validOrders = Array.from(sort.options, (option) => option.value);
  const collator = new Intl.Collator('vi', { numeric: true });
  const normalize = (value) => String(value || '').toLocaleLowerCase('vi').normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').trim();
  let page = 1;

  function readUrl() {
    const params = new URLSearchParams(window.location.search);
    search.value = params.get('proposal_search') || '';
    const requestedOrder = params.get('proposal_sort');
    sort.value = validOrders.includes(requestedOrder) ? requestedOrder : 'oldest';
    for (const name of Object.keys(filterFields)) {
      const selected = params.getAll(name);
      for (const control of form.querySelectorAll(`input[name="${name}"]`)) {
        control.checked = selected.includes(control.value);
      }
    }
    const requestedPage = Number(params.get('page'));
    page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  }

  function pageUrl(nextPage) {
    const url = new URL(window.location.href);
    for (const name of queryNames) url.searchParams.delete(name);
    const data = new FormData(form);
    for (const name of Object.keys(filterFields)) {
      for (const value of data.getAll(name)) url.searchParams.append(name, value);
    }
    if (search.value.trim()) url.searchParams.set('proposal_search', search.value.trim());
    if (sort.value !== 'oldest') url.searchParams.set('proposal_sort', sort.value);
    if (nextPage > 1) url.searchParams.set('page', String(nextPage));
    return url;
  }

  function writeUrl(mode) {
    const url = pageUrl(page);
    if (url.href === window.location.href) return;
    // Một số trình duyệt hạn chế History API khi mở trực tiếp bằng file://.
    try {
      window.history[mode === 'push' ? 'pushState' : 'replaceState'](null, '', url);
    } catch (_) {
      // Bộ lọc vẫn hoạt động trong phiên trang hiện tại.
    }
  }

  function makeCard(proposal) {
    const card = cardTemplate.cloneNode(true);
    card.dataset.proposalId = proposal.id;
    const title = card.querySelector('.proposal-card__title');
    title.id = `proposal-${proposal.id.toLowerCase()}-title`;
    title.textContent = proposal.title;
    card.setAttribute('aria-labelledby', title.id);
    const fields = [
      ['type', `Loại đề tài: ${proposal.topicTypeLabel}`],
      ['course', `Môn học: ${proposal.courseLabel || 'Chưa có thông tin'}`],
      ['student', `Sinh viên: ${proposal.studentName} · ${proposal.studentId}`],
      ['role', `Vai trò của tôi: ${proposal.supervisionRoleLabel}`],
    ];
    for (const [name, value] of fields) {
      card.querySelector(`.proposal-card__${name} .topic-card__meta-text`).textContent = value;
    }
    const sentAt = Date.parse(proposal.submittedAt);
    if (Number.isFinite(sentAt)) {
      const row = document.createElement('p');
      row.className = 'topic-card__meta-item proposal-card__date';
      const time = document.createElement('time');
      time.dateTime = proposal.submittedAt;
      time.textContent = new Intl.DateTimeFormat('vi-VN', {
        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
        timeZone: 'Asia/Ho_Chi_Minh',
      }).format(sentAt);
      row.append('Ngày gửi: ', time);
      card.querySelector('.topic-card__meta').append(row);
    }
    const link = card.querySelector('.proposal-card__detail-link');
    const detailUrl = new URL('chi-tiet-de-xuat-giang-vien.html', window.location.href);
    detailUrl.searchParams.set('ma', proposal.id);
    const returnUrl = pageUrl(page);
    detailUrl.searchParams.set('return', `yeu-cau-cho-duyet.html${returnUrl.search}`);
    link.href = detailUrl.href;
    link.setAttribute('aria-label', `Xem đề xuất ${proposal.title} (${proposal.id})`);
    return card;
  }

  function renderPagination(totalPages) {
    const items = document.createElement('ul');
    items.className = 'pagination__list';
    function addPage(target, text, label, disabled = false, current = false) {
      const item = document.createElement('li');
      item.className = 'pagination__item';
      const control = document.createElement(current ? 'span' : disabled ? 'button' : 'a');
      control.className = current ? 'pagination__current' : 'pagination__button';
      control.textContent = text;
      control.setAttribute('aria-label', label);
      if (current) control.setAttribute('aria-current', 'page');
      else if (disabled) {
        control.type = 'button';
        control.disabled = true;
      } else {
        control.href = pageUrl(target).href;
        control.dataset.proposalPage = String(target);
      }
      item.append(control);
      items.append(item);
    }
    addPage(page - 1, '‹', 'Trang trước', page === 1);
    for (let number = 1; number <= totalPages; number += 1) {
      addPage(number, String(number), `Trang ${number}`, false, number === page);
    }
    addPage(page + 1, '›', 'Trang sau', page === totalPages);
    pagination.replaceChildren(items);
    pagination.hidden = totalPages <= 1;
  }

  function render(urlMode) {
    const pending = store.getAll().filter((proposal) => proposal.status === 'pending');
    if (note) note.textContent = [demoNote, store.getError()].filter(Boolean).join(' ');
    const terms = normalize(search.value).split(/\s+/).filter(Boolean);
    const data = new FormData(form);
    const selected = Object.entries(filterFields).map(([name, field]) =>
      [field, data.getAll(name)]);
    const matching = pending.filter((proposal) => {
      const haystack = normalize([proposal.id, proposal.title, proposal.studentName, proposal.studentId].join(' '));
      return terms.every((term) => haystack.includes(term)) &&
        selected.every(([field, values]) => !values.length || values.includes(proposal[field]));
    });
    // Ngày gửi chỉ được so sánh khi đã có trong dữ liệu; hồ sơ thiếu ngày giữ thứ tự mẫu.
    if (sort.value === 'name-asc') matching.sort((a, b) => collator.compare(a.title, b.title));
    else matching.sort((a, b) => {
      const first = Date.parse(a.submittedAt);
      const second = Date.parse(b.submittedAt);
      const hasFirst = Number.isFinite(first);
      const hasSecond = Number.isFinite(second);
      if (hasFirst !== hasSecond) return hasFirst ? -1 : 1;
      if (!hasFirst) return 0;
      return sort.value === 'newest' ? second - first : first - second;
    });

    const totalPages = Math.max(1, Math.ceil(matching.length / pageSize));
    const previousPage = page;
    page = Math.min(page, totalPages);
    if (urlMode || previousPage !== page) writeUrl(urlMode || 'replace');
    const first = (page - 1) * pageSize;
    const visible = matching.slice(first, first + pageSize);
    list.replaceChildren(...visible.map(makeCard));
    count.textContent = matching.length
      ? `Hiển thị ${first + 1}–${first + visible.length} trên ${matching.length} đề xuất chờ duyệt`
      : '0 đề xuất chờ duyệt phù hợp';
    empty.textContent = pending.length
      ? 'Không tìm thấy đề xuất phù hợp. Thử từ khóa khác hoặc xóa bộ lọc.'
      : 'Không còn đề xuất chờ duyệt trong dữ liệu demo.';
    empty.hidden = matching.length > 0;
    viewport.hidden = matching.length === 0;
    viewport.scrollTop = 0;
    renderPagination(totalPages);
  }

  search.addEventListener('input', () => {
    page = 1;
    render('replace');
  });
  form.addEventListener('change', () => {
    page = 1;
    render('push');
  });
  // Hai điều khiển toolbar nằm ngoài form nhưng liên kết với nó bằng thuộc tính form.
  sort.addEventListener('change', () => {
    page = 1;
    render('push');
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    page = 1;
    render('push');
  });
  form.addEventListener('reset', () => window.setTimeout(() => {
    page = 1;
    render('push');
  }, 0));
  pagination.addEventListener('click', (event) => {
    const link = event.target.closest('a[data-proposal-page]');
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    page = Number(link.dataset.proposalPage);
    render('push');
    viewport.focus({ preventScroll: true });
  });
  window.addEventListener('popstate', () => {
    readUrl();
    render();
  });
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      readUrl();
      render();
    }
  });
  store.subscribe(() => render());
  readUrl();
  render('replace');
})();
