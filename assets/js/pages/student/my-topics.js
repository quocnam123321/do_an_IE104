(() => {
  const app = globalThis.IE104;
  if (!document.body.classList.contains('student-my-topics-list-page') || !app?.ui?.initTopicList || !app.data?.myTopics) return;
  const statusStyles = {
    'cho-duyet': 'pending',
    'dang-thuc-hien': 'progress',
    'hoan-thanh': 'completed',
    'tu-choi': 'rejected',
    'da-rut': 'withdrawn',
  };

  function createCard(topic, index, template) {
    const item = template.cloneNode(true);
    const article = item.querySelector('.topic-card');
    const title = item.querySelector('.topic-card__title');
    const values = item.querySelectorAll('.topic-card__meta-row dd');
    const lecturerLabel = item.querySelectorAll('.topic-card__meta-row dt .visually-hidden')[1];
    const status = item.querySelector('.topic-card__status');
    const originalLink = item.querySelector('.topic-card__link');
    const link = document.createElement(topic.detailUrl ? 'a' : 'button');
    title.id = `my-topic-${index}`;
    title.textContent = topic.title;
    article.setAttribute('aria-labelledby', title.id);
    article.dataset.topicId = topic.id;
    article.dataset.status = statusStyles[topic.status];
    values[0].textContent = `${topic.id} - ${topic.typeLabel}`;
    values[1].textContent = topic.lecturer;
    values[2].textContent = topic.groupName;
    values[3].textContent = `Học kỳ ${topic.semester === 'he' ? 'hè' : topic.semester} ${topic.academicYear}`;
    lecturerLabel.textContent = topic.lecturerLabel;
    status.className = `topic-card__status topic-card__status--${statusStyles[topic.status]}`;
    status.textContent = topic.statusLabel;
    link.className = 'topic-card__link';
    link.textContent = 'Xem chi tiết ';
    const arrow = document.createElement('span');
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '→';
    link.append(arrow);
    if (topic.detailUrl) {
      link.href = topic.detailUrl;
      link.setAttribute('aria-label', `Xem chi tiết ${topic.title}`);
    } else {
      link.type = 'button';
      link.disabled = true;
    }
    originalLink.replaceWith(link);
    if (topic.id === 'DX001' && ['dang-thuc-hien', 'tu-choi'].includes(topic.status) && topic.feedback) {
      const feedback = document.createElement('p');
      feedback.className = 'topic-card__decision';
      feedback.textContent = topic.status === 'tu-choi' ? `Lý do từ chối: ${topic.feedback}` : topic.feedback;
      item.querySelector('.topic-card__content').append(feedback);
    }
    return item;
  }

  const presetStatuses = new URLSearchParams(location.search).getAll('status');
  if (new URLSearchParams(location.search).has('status')) document.querySelectorAll('#topic-filter-form input[name="trang-thai"]').forEach(input => { input.checked = presetStatuses.includes(input.value); });

  app.ui.initTopicList({
    query: app.services.topics.listMyTopics,
    createCard,
    emptyTitle: 'Bạn chưa có đề tài',
    emptyDescription: 'Đề tài của bạn sẽ xuất hiện trong danh sách này khi có dữ liệu.',
  });
})();
