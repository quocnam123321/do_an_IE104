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
    values[0].textContent = `${topic.id} - ${topic.typeLabel}`;
    values[1].textContent = topic.courseLabel;
    values[2].textContent = `Học kỳ ${topic.semester}`;
    values[3].textContent = topic.lecturer;
    link.setAttribute('href', topic.detailUrl);
    link.setAttribute('aria-label', `Xem chi tiết ${topic.title}`);
    return item;
  }

  app.ui.initTopicList({
    query: app.services.topics.listOpenTopics,
    createCard,
    emptyTitle: 'Chưa có đề tài mở đăng ký',
    emptyDescription: 'Các đề tài sẽ xuất hiện ở đây khi được mở đăng ký.',
  });
})();
