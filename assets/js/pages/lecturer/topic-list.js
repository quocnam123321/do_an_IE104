(() => {
  const service = globalThis.IE104?.services?.lecturerTopics;
  const kind = document.body.dataset.lecturerList;
  if (!service || !kind) return;
  const listFilters = { created: service.isListedInCreatedTab, supervised: service.isListedInSupervisedTab };
  const container = document.querySelector('.topic-list');
  const firstCard = container?.querySelector('.topic-card');
  if (!firstCard) return;
  const results = container.closest('[data-topic-results]');
  // Danh sách đã tạo dùng li bọc thẻ, còn danh sách đang hướng dẫn chứa thẻ trực tiếp.
  const listItemFor = card => card.parentElement.matches('li') ? card.parentElement : card;
  const template = listItemFor(firstCard).cloneNode(true);
  const catalogCards = new Map(Array.from(container.querySelectorAll('.topic-card[data-status="catalog"]'),
    card => [card.dataset.topicId, listItemFor(card).cloneNode(true)]));
  function render() {
    let topics;
    try {
      topics = service.list(kind);
      if (results) delete results.dataset.topicSourceError;
    } catch (failure) {
      if (results) results.dataset.topicSourceError = failure.message;
      topics = service.list(kind, { catalogOnly: true });
    }
    topics = topics.filter(listFilters[kind]);
    container.querySelectorAll('.topic-card:not([data-approved-proposal])').forEach(card => {
      if (!topics.some(topic => topic.id === card.dataset.topicId)) listItemFor(card).remove();
    });
    topics.forEach(topic => {
      let card = [...container.querySelectorAll('.topic-card:not([data-approved-proposal])')].find(node => node.dataset.topicId === topic.id);
      const catalogCard = catalogCards.get(topic.id);
      if (catalogCard && !topic.sharedStudentProject && !topic.registration && topic.status !== 'registered') {
        if (!card) container.append(catalogCard.cloneNode(true));
        else if (card.dataset.status !== 'catalog') listItemFor(card).replaceWith(catalogCard.cloneNode(true));
        return;
      }
      const existing = Boolean(card);
      if (!card) {
        const item = template.cloneNode(true);
        card = item.matches('.topic-card') ? item : item.querySelector('.topic-card');
        container.append(item);
      }
      if (kind === 'supervised') {
        card.dataset.sortDate = topic.startsAt || topic.sourceRecord?.supervision?.milestones?.[0] || topic.createdAt || '';
        card.dataset.status = topic.status || '';
        if (existing && topic.sourceRecord && !topic.sharedStudentProject && !topic.demo && !topic.revision) return;
      } else {
        card.dataset.status = topic.status;
      }
      card.dataset.topicId = topic.id;
      const link = card.querySelector('.topic-card__detail-link');
      const title = card.querySelector('.topic-card__title');
      title.textContent = topic.title;
      title.id = `${kind}-topic-${encodeURIComponent(topic.id)}`;
      card.setAttribute('aria-labelledby', title.id);
      card.querySelector('.topic-card__image-placeholder')?.setAttribute('aria-label', `Chưa có ảnh đại diện cho đề tài ${topic.title}`);
      card.dataset.topicType = topic.filterType || topic.topicType;
      card.dataset.course = topic.course;
      card.dataset.hocKy = `${topic.academicYear}-${topic.semester === 'summer' ? '3' : topic.semester}`;
      if (topic.role) card.dataset.role = topic.role;
      const date = card.querySelector('time[datetime]');
      const createdAt = topic.createdAt || '';
      const values = [
        `${topic.displayId || topic.id}`,
        `${topic.courseLabel || topic.typeLabel}`,
        `Học kỳ ${topic.semester === 'summer' ? 'hè' : topic.semester} · ${topic.academicYear.replace(/[-—]/g, '–')}`,
        kind === 'created' ? createdAt.split('T')[0].split('-').reverse().join('/') : topic.representativeName || topic.sourceRecord?.authors?.[0] ? `${topic.representativeName || topic.sourceRecord.authors[0]} · xxxxxxxx` : `${topic.groupName}`,
      ];
      card.querySelectorAll('.topic-card__meta-text').forEach((node, index) => { node.textContent = values[index]; });
      if (kind === 'created') {
        const row = card.querySelectorAll('.topic-card__meta-text')[3]?.closest('.topic-card__meta-item');
        if (row) row.hidden = !Number.isFinite(Date.parse(createdAt));
      }
      if (date) date.dateTime = createdAt;
      card.dataset.createdAt = createdAt;
      const badge = card.querySelector('.topic-card__status');
      badge.textContent = kind === 'created' ? topic.statusLabel : topic.roleLabel;
      badge.className = `topic-card__status topic-card__status--${kind === 'created' ? topic.status : topic.role}`;
      const url = new URL(service.detailUrl(topic), location.href);
      url.searchParams.set('return', location.pathname.split('/').pop() + location.search);
      link.href = url.href;
      link.setAttribute('aria-label', `Xem chi tiết ${topic.title}`);
    });
    document.querySelectorAll('[data-topic-tab-count]').forEach(node => {
      const tabKind = node.dataset.topicTabCount === 'teaching' ? 'supervised' : 'created';
      try {
        let entries;
        try { entries = service.list(tabKind); }
        catch { entries = service.list(tabKind, { catalogOnly: true }); }
        if (tabKind === 'supervised') {
          try {
            entries = [...entries, ...(globalThis.IE104.services.teaching?.listSupervisedProjects() || []).map(entry => entry.project),
              ...(window.IE104Proposals?.getAll() || []).filter(entry => entry.status === 'approved' && !entry.isDatabaseProposal)];
          } catch { /* Vẫn đếm được danh mục mẫu khi không đọc được dữ liệu đã lưu. */ }
        }
        entries = entries.filter(listFilters[tabKind]);
        node.textContent = (globalThis.IE104.topicIdentity?.uniqueTitles(entries) || entries).length;
      } catch { node.textContent = '—'; }
    });
    document.dispatchEvent(new Event('ie104:lecturer-topics-rendered'));
  }
  function refreshReturn(event) {
    const link = event.target.closest('.topic-card__detail-link');
    if (!link || !container.contains(link)) return;
    const url = new URL(link.href);
    url.searchParams.set('return', location.pathname.split('/').pop() + location.search);
    link.href = url.href;
  }
  const createReturn = event => {
    const link = event.target.closest('a[href^="tao-de-tai-giang-vien.html"]');
    if (!link || kind !== 'created') return;
    const url = new URL(link.href); url.searchParams.set('return',location.pathname.split('/').pop()+location.search); link.href = url.href;
  };
  document.addEventListener('pointerdown',createReturn); document.addEventListener('click',createReturn);
  container.addEventListener('click', refreshReturn);
  container.addEventListener('pointerdown', refreshReturn);
  if (!window.UITLecturerCatalog) document.addEventListener('ie104:topics-updated', render);
  const refreshTopics = () => document.dispatchEvent(new Event('ie104:lecturer-topics-updated'));
  window.addEventListener('ie104:lecturer-topics-updated', refreshTopics);
  window.addEventListener('ie104:registrations-updated', refreshTopics);
  window.addEventListener('ie104:registration-rounds-updated', refreshTopics);
  document.addEventListener('ie104:lecturer-topics-updated', () => { render(); document.dispatchEvent(new Event('ie104:topics-updated')); });
  window.addEventListener('storage', event => {
    const app = globalThis.IE104;
    if ([app.services.lecturerTopicRepository?.key, app.storage?.registrationKey, app.storage?.teamKey, app.storage?.teachingKey, null].includes(event.key)) {
      refreshTopics();
    }
  });
  window.addEventListener('pageshow', refreshTopics);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refreshTopics();
  });
  document.addEventListener('DOMContentLoaded', () => globalThis.IE104.services.invitationIdentity?.ready.then(refreshTopics));
  document.addEventListener('ie104:project-team-updated', refreshTopics);
  render();
  document.body.dataset.lecturerTopicsReady = 'true';
})();
