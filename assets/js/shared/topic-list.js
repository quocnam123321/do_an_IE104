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

    const showEmpty = app.ui.createTopicListEmpty(list, form, search, config);

    let page = 1;

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

    function refreshLecturers() {
      const allTopics = config.query({}, { pageSize: 10000 }).items;
      const names = [...new Set(allTopics.map(topic => topic.lecturer).filter(Boolean))].sort(new Intl.Collator('vi').compare);
      const previous = [...lecturer.options].map(option => option.value);
      if (previous.length === names.length + 1 && names.every((name, index) => previous[index + 1] === name)) return;
      const selected = lecturer.value;
      lecturer.replaceChildren(new Option('Tất cả giảng viên', ''), ...names.map(name => new Option(name, name)));
      if (names.includes(selected)) lecturer.value = selected;
    }

    function render(options = {}) {
      refreshLecturers();
      const result = config.query(readFilters(), { page, pageSize: 5 });
      app.ui.renderCourseFilters(form, result.courseOptions);
      page = result.page;
      const fragment = document.createDocumentFragment();
      result.items.forEach((topic, index) => fragment.append(config.createCard(topic, (page - 1) * 5 + index, cardTemplate)));
      list.replaceChildren(fragment);
      list.hidden = result.total === 0;
      showEmpty(result.total > 0, result.totalAvailable > 0);
      list.setAttribute('aria-label', `${result.items.length} đề tài trên trang ${page}, cuộn để xem thêm`);
      list.scrollTop = 0;
      summary.textContent = result.total
        ? `${result.total} đề tài - Hiển thị ${result.rangeStart}-${result.rangeEnd} - Trang ${page}/${result.pageCount}`
        : 'Không có đề tài phù hợp.';
      if (result.warning) {
        summary.textContent = config.hideResultSummary ? result.warning : `${summary.textContent} ${result.warning}`;
      }
      summary.classList.toggle('visually-hidden', Boolean(config.hideResultSummary && !result.warning));
      renderPagination(result);
      document.dispatchEvent(new Event('ie104:student-topics-rendered'));
      if (options.focusPagination) pager.querySelector('[aria-current="page"]')?.focus({ preventScroll: true });
    }

    function applyFilters() {
      page = 1;
      render();
    }

    search.addEventListener('input', applyFilters);
    lecturer.addEventListener('change', applyFilters);
    form.addEventListener('change', applyFilters);
    form.addEventListener('submit', event => event.preventDefault());
    form.addEventListener('reset', () => requestAnimationFrame(applyFilters));
    pager.addEventListener('click', event => {
      const button = event.target.closest('button[data-page]');
      if (!button || button.disabled || !pager.contains(button)) return;
      page = Number(button.dataset.page);
      render({ focusPagination: true });
    });
    window.addEventListener('pageshow', applyFilters);
    window.addEventListener('storage', event => { if ([globalThis.IE104?.storage?.registrationKey, globalThis.IE104?.storage?.proposalKey, globalThis.IE104?.storage?.requestKey, config.storageKey, globalThis.IE104?.services?.lecturerTopicRepository?.key, null].includes(event.key) || event.key?.startsWith('ie104.proposal-decision.v1.')) applyFilters(); });
    window.addEventListener('ie104:published-topics-updated', applyFilters);
    form.dataset.topicsInitialized = 'true';
    applyFilters();
  }

  app.ui.initTopicList = initTopicList;
})();
