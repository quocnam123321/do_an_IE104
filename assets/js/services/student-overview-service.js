(() => {
  const app = globalThis.IE104 = globalThis.IE104 || {};
  app.services = app.services || {};

  const statuses = Object.freeze({
    'dang-thuc-hien': 'Đang thực hiện',
    'cho-duyet': 'Chờ duyệt',
    'hoan-thanh': 'Hoàn thành',
    'tu-choi': 'Đã từ chối',
    'da-rut': 'Đã rút',
    'yeu-cau-chinh-sua': 'Yêu cầu chỉnh sửa',
    'da-duyet': 'Đã duyệt',
  });

  function getState({ preview = false } = {}) {
    const { topics, projectProgress, requests } = app.services;
    const result = topics.listMyTopics({}, { pageSize: Number.MAX_SAFE_INTEGER });
    const warnings = result.warning ? [result.warning] : [];
    const counts = Object.fromEntries(Object.keys(statuses).map(status => [status, 0]));
    for (const topic of result.items) {
      if (Object.hasOwn(counts, topic.status)) counts[topic.status] += 1;
    }

    const active = result.items.filter(topic => topic.status === 'dang-thuc-hien').slice(0, 5).map(topic => {
      let progress = null;
      try {
        const projectId = new URL(topic.detailUrl || '', location.href).searchParams.get('project') || topic.id;
        progress = projectProgress.summarize(projectProgress.getState(projectId, { preview }));
      }
      catch (failure) { warnings.push(`${topic.id}: ${failure.message}`); }
      const participants = topics.myTopicParticipants(topic, { preview });
      return { ...topic, progress, participants };
    });

    let requestDates = new Map();
    try {
      requestDates = new Map(requests.recent(result.items).map(record => [record.requestId, record.createdAt]));
    } catch (error) {
      warnings.push(error.message);
    }
    const pending = result.items.filter(topic => topic.status === 'cho-duyet')
      .map(topic => {
        const requestId = topic.requestId || topic.id;
        return { ...topic, requestId, submittedAt: requestDates.get(requestId) || topic.createdAt };
      })
      .sort((first, second) => (Date.parse(second.submittedAt) || 0) - (Date.parse(first.submittedAt) || 0))
      .slice(0, 4);

    return { total: result.total, counts, active, pending, warning: [...new Set(warnings)].join(' ') };
  }

  app.services.overview = { statuses, getState };
})();
