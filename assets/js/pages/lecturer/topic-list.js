(() => {
  const service = globalThis.IE104?.services?.lecturerTopics;
  const kind = document.body.dataset.lecturerList;
  if (!service || !kind) return;
  const container = document.querySelector('.topic-list');
  const firstCard = container?.querySelector('.topic-card');
  if (!firstCard) return;
  // Danh sách đã tạo dùng li bọc thẻ, còn danh sách đang hướng dẫn chứa thẻ trực tiếp.
  const listItemFor = card => card.parentElement.matches('li') ? card.parentElement : card;
  const template = listItemFor(firstCard).cloneNode(true);
  function render() {
    let topics;
    const results = container.closest('[data-topic-results]');
    try { topics = service.list(kind); if (results) delete results.dataset.topicSourceError; }
    catch (failure) { container.replaceChildren(); if (results) results.dataset.topicSourceError = failure.message; return; }
    container.querySelectorAll('.topic-card:not([data-approved-proposal])').forEach(card => {
      if (!topics.some(topic => topic.id === card.dataset.topicId)) listItemFor(card).remove();
    });
    topics.forEach(topic => {
      let card = [...container.querySelectorAll('.topic-card:not([data-approved-proposal])')].find(node => node.dataset.topicId === topic.id);
      if (!card) {
        const item = template.cloneNode(true);
        card = item.matches('.topic-card') ? item : item.querySelector('.topic-card');
        container.append(item);
      }
      if (card.dataset.topicId === topic.id && topic.sourceRecord && !topic.revision) return;
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
      card.dataset.status = kind === 'created' ? topic.status : topic.status === 'hoan-thanh' ? 'completed' : 'in-progress';
      if (topic.role) card.dataset.role = topic.role;
      const values = [
        `Mã đề tài: ${topic.displayId || topic.id}`,
        `${topic.course ? 'Môn học' : 'Hình thức tốt nghiệp'}: ${topic.course ? topic.courseLabel : topic.typeLabel}`,
        `Học kỳ ${topic.semester === 'summer' ? 'hè' : topic.semester} - ${topic.academicYear}`,
        kind === 'created' ? `Ngày tạo: ${topic.createdAt.split('-').reverse().join('/')}` : `Nhóm thực hiện: ${topic.groupName}`,
      ];
      if (topic.sourceRecord) {
        values.splice(0, values.length, `Mã đề tài: ${topic.id}`, `Tác giả: ${topic.sourceRecord.authors.join(', ')}`,
          `GVHD theo nguồn: ${topic.sourceRecord.advisors.join(', ') || 'Chưa công bố trong nguồn'}`, `${topic.typeLabel}${topic.sourceRecord.cohort ? ' - Khóa ' + topic.sourceRecord.cohort : ' - Năm ' + topic.sourceRecord.year}`);
      }
      card.querySelectorAll('.topic-card__meta-text').forEach((node, index) => { node.textContent = values[index]; });
      const date = card.querySelector('time[datetime]'); if (date) date.dateTime = topic.createdAt;
      card.dataset.createdAt = topic.createdAt;
      const badge = card.querySelector('.topic-card__status');
      badge.textContent = kind === 'created' ? topic.statusLabel : topic.roleLabel;
      badge.className = `topic-card__status topic-card__status--${kind === 'created' ? topic.status : topic.role}`;
      const url = new URL(service.detailUrl(topic), location.href);
      url.searchParams.set('return', location.pathname.split('/').pop() + location.search);
      link.href = url.href;
      link.setAttribute('aria-label', `Xem chi tiết ${topic.title}`);
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
  window.addEventListener('ie104:lecturer-topics-updated', () => document.dispatchEvent(new Event('ie104:lecturer-topics-updated')));
  document.addEventListener('ie104:lecturer-topics-updated', () => { render(); document.dispatchEvent(new Event('ie104:topics-updated')); });
  window.addEventListener('storage',event => { if (event.key === globalThis.IE104.services.lecturerTopicRepository?.key || event.key === null) document.dispatchEvent(new Event('ie104:lecturer-topics-updated')); });
  window.addEventListener('pageshow',() => document.dispatchEvent(new Event('ie104:lecturer-topics-updated')));
  render();
  document.body.dataset.lecturerTopicsReady = 'true';
})();
