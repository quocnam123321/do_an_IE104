(() => {
  const app = globalThis.IE104 = globalThis.IE104 || {};
  app.ui = app.ui || {};

  function initTopicList(config) {
    const form = document.getElementById('topic-filter-form');
    const search = document.getElementById('topic-search');
    const lecturer = document.getElementById('lecturer-filter');
    const topics = document.querySelector('.topics');
    const list = topics?.querySelector('.topic-list');
    const pagination = topics?.querySelector('.pagination');
    if (!form || !search || !lecturer || !list?.firstElementChild || !pagination || typeof config.query !== 'function') return;
    if (form.dataset.topicsInitialized === 'true') return;

    const cardTemplate = list.firstElementChild.cloneNode(true);
    const pager = pagination.querySelector('.pagination__list');
    const summary = document.createElement('p');
    summary.className = 'topic-results-summary';
    summary.setAttribute('role', 'status');
    summary.setAttribute('aria-live', 'polite');
    summary.setAttribute('aria-atomic', 'true');
    topics.querySelector('.topics__header').append(summary);

    const emptyState = document.createElement('section');
    emptyState.className = 'topic-list-empty';
    emptyState.hidden = true;
    const emptyTitle = document.createElement('h3');
    emptyTitle.textContent = 'Không tìm thấy đề tài';
    const emptyDescription = document.createElement('p');
    emptyDescription.textContent = 'Thử từ khóa khác hoặc thay đổi bộ lọc đang chọn.';
    const clearButton = document.createElement('button');
    clearButton.type = 'button';
    clearButton.textContent = 'Xóa tìm kiếm và bộ lọc';
    emptyState.append(emptyTitle, emptyDescription, clearButton);
    list.after(emptyState);

    let page = 1;
    let currentFilters;

    function readFilters() {
      const values = new FormData(form);
      return {
        keyword: values.get('tu-khoa') || '',
        lecturer: values.get('giang-vien') || '',
        types: values.getAll('loai-de-tai'),
        courses: values.getAll('mon-hoc'),
        statuses: values.getAll('trang-thai'),
        semesters: values.getAll('hoc-ky'),
        sort: values.get('sap-xep') || 'moi-nhat',
      };
    }

    function createPageButton(label, destination, options = {}) {
      const item = document.createElement('li');
      item.className = 'pagination__item';
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'pagination__button';
      button.textContent = label;
      button.dataset.page = destination;
      button.disabled = Boolean(options.disabled);
      button.setAttribute('aria-label', options.description || `Trang ${destination}`);
      if (options.current) {
        button.classList.add('pagination__current');
        button.setAttribute('aria-current', 'page');
      }
      item.append(button);
      return item;
    }

    function renderPagination(result) {
      const fragment = document.createDocumentFragment();
      fragment.append(createPageButton('‹', result.page - 1, { disabled: result.page === 1, description: 'Trang trước' }));
      for (let number = 1; number <= result.pageCount; number += 1) {
        fragment.append(createPageButton(String(number), number, { current: number === result.page }));
      }
      fragment.append(createPageButton('›', result.page + 1, { disabled: result.page >= result.pageCount, description: 'Trang sau' }));
      pager.replaceChildren(fragment);
      pagination.hidden = result.total === 0;
    }

    function render(options = {}) {
      const result = config.query(currentFilters, { page, pageSize: 5 });
      page = result.page;
      const fragment = document.createDocumentFragment();
      result.items.forEach((topic, index) => fragment.append(config.createCard(topic, (page - 1) * 5 + index, cardTemplate)));
      list.replaceChildren(fragment);
      list.hidden = result.total === 0;
      emptyState.hidden = result.total !== 0;
      const noTopics = result.totalAvailable === 0;
      emptyTitle.textContent = noTopics ? config.emptyTitle : 'Không tìm thấy đề tài';
      emptyDescription.textContent = noTopics ? config.emptyDescription : 'Thử từ khóa khác hoặc thay đổi bộ lọc đang chọn.';
      clearButton.hidden = noTopics;
      list.setAttribute('aria-label', `${result.items.length} đề tài trên trang ${page}, cuộn để xem thêm`);
      list.scrollTop = 0;
      summary.textContent = result.total
        ? `${result.total} đề tài - Hiển thị ${result.rangeStart}-${result.rangeEnd} - Trang ${page}/${result.pageCount}`
        : 'Không có đề tài phù hợp.';
      if (result.warning) summary.textContent += ` ${result.warning}`;
      renderPagination(result);
      if (options.focusPagination) pager.querySelector('[aria-current="page"]')?.focus({ preventScroll: true });
    }

    function applyFilters() {
      page = 1;
      currentFilters = readFilters();
      render();
    }

    search.addEventListener('input', applyFilters);
    lecturer.addEventListener('change', applyFilters);
    form.addEventListener('change', applyFilters);
    form.addEventListener('submit', event => event.preventDefault());
    form.addEventListener('reset', () => {
      if (emptyState.contains(document.activeElement)) search.focus({ preventScroll: true });
      requestAnimationFrame(applyFilters);
    });
    clearButton.addEventListener('click', () => form.reset());
    pager.addEventListener('click', event => {
      const button = event.target.closest('button[data-page]');
      if (!button || button.disabled || !pager.contains(button)) return;
      page = Number(button.dataset.page);
      render({ focusPagination: true });
    });
    window.addEventListener('pageshow', applyFilters);
    window.addEventListener('storage', event => { if ([globalThis.IE104?.storage?.registrationKey, globalThis.IE104?.storage?.proposalKey, globalThis.IE104?.storage?.requestKey, null].includes(event.key) || event.key?.startsWith('ie104.proposal-decision.v1.')) applyFilters(); });
    form.dataset.topicsInitialized = 'true';
    applyFilters();
  }

  app.ui.initTopicList = initTopicList;
})();
