(() => {
  const app = globalThis.IE104;
  if (!document.body.classList.contains('student-topic-registration-page') || !app?.ui?.initTopicList || !app.data?.openTopics) return;

  function createCard(topic, index, cardTemplate) {
    const item = cardTemplate.cloneNode(true);
    const article = item.querySelector('.topic-card');
    const title = item.querySelector('.topic-card__title');
    const values = item.querySelectorAll('.topic-card__meta-row dd');
    const link = item.querySelector('.topic-card__link');
    title.id = `open-topic-${index}`;
    title.textContent = topic.title;
    article.setAttribute('aria-labelledby', title.id);
    article.dataset.topicId = topic.id;
    if (topic.source === 'lecturer-created') article.dataset.publishedTopic = topic.id;
    const displayId = app.services.studentTopicCodes.get(topic);
    values[0].textContent = displayId || 'Chưa có mã đề tài';
    values[1].textContent = app.ui.studentCourseLabel(topic);
    values[2].textContent = `Học kỳ ${topic.semester === 'he' ? 'hè' : topic.semester}`;
    values[3].textContent = topic.lecturer;
    link.setAttribute('href', topic.detailUrl);
    link.setAttribute('aria-label', `Xem chi tiết ${topic.title}`);
    return item;
  }

  function refreshLecturers() {
    try { const select = document.getElementById('lecturer-filter'); for (const topic of app.services.publishedTopics?.list() || []) if (![...select.options].some(option => option.value === topic.lecturer)) select.add(new Option(topic.lecturer,topic.lecturer)); } catch {}
  }
  refreshLecturers();
  window.addEventListener('storage',event => { if ([app.services.lecturerTopicRepository?.key,null].includes(event.key)) refreshLecturers(); });
  window.addEventListener('ie104:published-topics-updated',refreshLecturers);

  app.ui.initTopicList({
    query: app.services.topics.listOpenTopics,
    createCard,
    storageKey: globalThis.TeacherTopicStore?.key,
    emptyTitle: 'Chưa có đề tài mở đăng ký',
    emptyDescription: 'Các đề tài sẽ xuất hiện ở đây khi được mở đăng ký.',
  });
})();
