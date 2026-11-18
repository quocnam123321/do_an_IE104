(() => {
  const service = globalThis.IE104?.services?.lecturerTopics;
  const kind = document.body.dataset.lecturerList;
  if (!service || !kind) return;
  const container = document.querySelector('.topic-list');
  const template = container?.querySelector('.topic-card')?.cloneNode(true);
  if (!container || !template) return;
  function render() {
    const topics = service.list(kind);
    container.querySelectorAll('.topic-card:not([data-approved-proposal])').forEach(card => {
      if (!topics.some(topic => topic.id === card.dataset.topicId)) card.remove();
    });
    topics.forEach(topic => {
      let card = [...container.querySelectorAll('.topic-card:not([data-approved-proposal])')].find(node => node.dataset.topicId === topic.id);
      if (!card) { card = template.cloneNode(true); container.append(card); }
      card.dataset.topicId = topic.id;
      const link = card.querySelector('.topic-card__detail-link');
      const title = card.querySelector('.topic-card__title');
      title.textContent = topic.title;
      title.id = `${kind}-topic-${encodeURIComponent(topic.id)}`;
      card.setAttribute('aria-labelledby', title.id);
      card.querySelector('.topic-card__image-placeholder')?.setAttribute('aria-label', `Chưa có ảnh đại diện cho đề tài ${topic.title}`);
      card.dataset.topicType = topic.topicType;
      card.dataset.course = topic.course;
      card.dataset.hocKy = `${topic.academicYear}-${topic.semester}`;
      card.dataset.status = kind === 'created' ? topic.status : 'in-progress';
      if (topic.role) card.dataset.role = topic.role;
      const values = [
        `Mã đề tài: ${topic.id}`,
        `${topic.course ? 'Môn học' : 'Hình thức tốt nghiệp'}: ${topic.course ? topic.courseLabel : topic.typeLabel}`,
        `Học kỳ ${topic.semester} - ${topic.academicYear}`,
        kind === 'created' ? `Ngày tạo: ${topic.createdAt.split('-').reverse().join('/')}` : `Nhóm thực hiện: ${topic.groupName}`,
      ];
      card.querySelectorAll('.topic-card__meta-text').forEach((node, index) => { node.textContent = values[index]; });
      const badge = card.querySelector('.topic-card__status');
      badge.textContent = kind === 'created' ? topic.statusLabel : topic.roleLabel;
      badge.className = `topic-card__status topic-card__status--${kind === 'created' ? topic.status : topic.role}`;
      const url = new URL(service.detailUrl(topic), location.href);
      url.searchParams.set('return', location.pathname.split('/').pop() + location.search);
      link.href = url.href;
      link.setAttribute('aria-label', `Xem chi tiết ${topic.title}`);
    });
  }
  function refreshReturn(event) {
    const link = event.target.closest('.topic-card__detail-link');
    if (!link || !container.contains(link) || link.closest('[data-approved-proposal]')) return;
    const url = new URL(link.href);
    url.searchParams.set('return', location.pathname.split('/').pop() + location.search);
    link.href = url.href;
  }
  container.addEventListener('click', refreshReturn);
  container.addEventListener('pointerdown', refreshReturn);
  document.addEventListener('ie104:topics-updated', render);
  document.addEventListener('ie104:lecturer-topics-updated', () => { render(); document.dispatchEvent(new Event('ie104:topics-updated')); });
  render();
  document.body.dataset.lecturerTopicsReady = 'true';
})();
