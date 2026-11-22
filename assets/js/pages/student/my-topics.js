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
    const [code, course, lecturer, group, period] = item.querySelectorAll('.topic-card__meta-row dd');
    const lecturerLabel = lecturer.previousElementSibling.querySelector('.visually-hidden');
    const status = item.querySelector('.topic-card__status');
    const originalLink = item.querySelector('.topic-card__link');
    const link = document.createElement(topic.detailUrl ? 'a' : 'button');
    title.id = `my-topic-${index}`;
    title.textContent = topic.title;
    article.setAttribute('aria-labelledby', title.id);
    article.dataset.topicId = topic.id;
    article.dataset.status = statusStyles[topic.status];
    void app.shared?.renderProposalCover?.(article.querySelector('.topic-card__image'), topic.coverImage);
    const displayId = app.services.studentTopicCodes.get(topic);
    const proposalId = !displayId && [topic.requestId, topic.id].find(id => /^DX(?:-\w|\d)/i.test(id || ''));
    if (proposalId) code.previousElementSibling.querySelector('.visually-hidden').textContent = 'Mã đề xuất';
    code.textContent = displayId || proposalId || 'Chưa có mã đề tài';
    course.textContent = app.ui.studentCourseLabel(topic);
    lecturer.textContent = topic.lecturer;
    group.textContent = topic.groupName;
    const semester = topic.semester ? `Học kỳ ${topic.semester}` : 'Học kỳ chưa xác định';
    period.textContent = [semester, topic.academicYear.replace('-', '–')].filter(Boolean).join(' • ');
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
    return item;
  }

  const presetStatuses = new URLSearchParams(location.search).getAll('status');
  if (new URLSearchParams(location.search).has('status')) document.querySelectorAll('#topic-filter-form input[name="trang-thai"]').forEach(input => { input.checked = presetStatuses.includes(input.value); });

  app.ui.initTopicList({
    query: app.services.topics.listMyTopics,
    createCard,
    hideResultSummary: true,
    emptyTitle: 'Bạn chưa có đề tài',
    emptyDescription: 'Đề tài của bạn sẽ xuất hiện trong danh sách này khi có dữ liệu.',
  });
})();
