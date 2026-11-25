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
  const { projectTeams, registrations, proposals, lecturerTopics } = app.services;

  function participantsFor(topic) {
    let members = app.data.projectTeams?.find(team => team.projectId === topic.id)?.members;
    try {
      if (members || topic.source?.startsWith('approved-')) {
        members = projectTeams.getState(topic.id, { preview: location.protocol === 'file:' }).members;
      } else {
        const id = topic.requestId || topic.id;
        if (id.startsWith('DK')) members = registrations.findById(id)?.members;
        if (id.startsWith('DX')) {
          const proposal = proposals.findById(id) || app.services.requests.findStudentProposal(id) || globalThis.IE104Proposals?.getSeed(id);
          members = proposal?.outline?.members || [proposal?.student || app.data.currentStudent];
        }
      }
    } catch { /* Giữ thông tin của hồ sơ khi không đọc được dữ liệu thành viên đã lưu. */ }
    return lecturerTopics.supervisedParticipants(topic, members?.filter(Boolean));
  }

  function createCard(topic, index, template) {
    const item = template.cloneNode(true);
    const article = item.querySelector('.topic-card');
    const title = item.querySelector('.topic-card__title');
    const [code, course, lecturer, group, period] = item.querySelectorAll('.topic-card__meta-row dd');
    const participants = participantsFor(topic);
    const participant = participants.isGroup ? group : lecturer;
    const redundant = participants.isGroup ? lecturer : group;
    redundant.closest('.topic-card__meta-row').remove();
    participant.closest('.topic-card__meta-row').dataset.topicParticipants = '';
    participant.previousElementSibling.querySelector('.visually-hidden').textContent = participants.isGroup ? 'Nhóm thực hiện' : 'Sinh viên thực hiện';
    participant.textContent = participants.label;
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
    const semester = topic.semester ? `Học kỳ ${topic.semester}` : 'Học kỳ chưa xác định';
    period.textContent = [semester, topic.academicYear.replace('-', '–')].filter(Boolean).join(' • ');
    status.className = `topic-card__status topic-card__status--${statusStyles[topic.status]}`;
    status.textContent = topic.statusLabel;
    link.className = 'topic-card__link';
    link.append(...originalLink.childNodes);
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
    storageKey: app.storage.teamKey,
    createCard,
    hideResultSummary: true,
    emptyTitle: 'Bạn chưa có đề tài',
    emptyDescription: 'Đề tài của bạn sẽ xuất hiện trong danh sách này khi có dữ liệu.',
  });
})();
