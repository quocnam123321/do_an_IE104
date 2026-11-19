(() => {
  const app = globalThis.IE104 = globalThis.IE104 || {};
  app.services = app.services || {};

  function getState() {
    const result = app.services.topics.listMyTopics({}, { page: 1, pageSize: Number.MAX_SAFE_INTEGER });
    const topics = result.items;
    const counts = { total: topics.length, active: 0, approved: 0, pending: 0, rejected: 0, withdrawn: 0 };
    topics.forEach(topic => {
      if (topic.status === 'dang-thuc-hien') counts.active += 1;
      if (['dang-thuc-hien', 'hoan-thanh'].includes(topic.status)) counts.approved += 1;
      if (topic.status === 'cho-duyet') counts.pending += 1;
      if (topic.status === 'tu-choi') counts.rejected += 1;
      if (topic.status === 'da-rut') counts.withdrawn += 1;
    });
    const warnings = result.warning ? [result.warning] : [];
    const active = topics.filter(topic => topic.status === 'dang-thuc-hien').map(topic => {
      let percent = null;
      try { percent = app.services.projectProgress.summarize(app.services.projectProgress.getState(topic.id)).percent; }
      catch (failure) { warnings.push(`${topic.id}: ${failure.message}`); }
      return { ...topic, percent };
    });
    let recent = topics.filter(topic => topic.requestId || ['cho-duyet', 'tu-choi'].includes(topic.status)).slice(0, 5).map(topic => ({ ...topic, requestType: topic.requestId?.startsWith('DK-') ? 'Đăng ký đề tài' : 'Đề xuất đề tài' }));
    try { if (app.services.requests) recent = app.services.requests.recent(topics).slice(0, 5); }
    catch (error) { warnings.push(error.message); }
    return { counts, active, recent, warning: [...new Set(warnings)].join(' ') };
  }

  app.services.overview = { getState };
})();
