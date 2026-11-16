(() => {
  const app = globalThis.IE104;
  const list = document.querySelector('.requests .request-list');
  if (!list || !app?.services?.requests || !app.services.topics) return;
  function reveal() {
    const section = list.closest('details');
    if (section && location.hash === `#${section.id}`) section.open = true;
  }
  function render() {
    try {
      const topics = app.services.topics.listMyTopics({}, { page: 1, pageSize: Number.MAX_SAFE_INTEGER });
      const requests = app.services.requests.recent(topics.items);
      list.replaceChildren(...requests.map((request, index) => {
        const item = document.createElement('li');
        item.className = 'request-list__item';
        const article = document.createElement('article');
        article.className = 'request-card';
        const title = document.createElement('h3');
        title.id = `request-list-${index}-title`;
        title.textContent = request.title;
        article.setAttribute('aria-labelledby', title.id);
        article.dataset.requestId = request.requestId;
        const details = document.createElement('dl');
        details.className = 'request-card__meta';
        [['Mã yêu cầu', request.requestId], ['Loại yêu cầu', request.requestType], ['Trạng thái xét duyệt', request.statusLabel], ['Phản hồi gần nhất', request.feedback || 'Chưa có phản hồi.']].forEach(([label, value]) => {
          const term = document.createElement('dt');
          const description = document.createElement('dd');
          term.textContent = label;
          description.textContent = value;
          details.append(term, description);
        });
        const link = document.createElement('a');
        link.href = request.detailUrl;
        link.textContent = `Xem yêu cầu ${request.requestId}`;
        article.append(title, details, link);
        item.append(article);
        return item;
      }));
      if (!requests.length) { const empty = document.createElement('li'); empty.textContent = 'Chưa có đăng ký hoặc đề xuất.'; list.append(empty); }
      list.dataset.requestListReady = 'true';
    } catch (failure) { list.textContent = failure.message; }
  }
  window.addEventListener('pageshow', render);
  window.addEventListener('hashchange', reveal);
  window.addEventListener('storage', event => { if ([app.storage.requestKey, app.storage.proposalKey, app.storage.registrationKey, null].includes(event.key) || event.key?.startsWith('ie104.proposal-decision.v1.')) render(); });
  render();
  reveal();
})();
