(() => {
  const app = globalThis.IE104 = globalThis.IE104 || {};
  app.services = app.services || {};

  function today(now = new Date()) {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
  }

  function getState({ projectId = '', month = '' } = {}) {
    if (month && (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month) || month.startsWith('0000'))) throw new Error('Chọn tháng hợp lệ.');
    const topics = app.data.myTopics.filter(topic => ['dang-thuc-hien', 'hoan-thanh'].includes(topic.status) && (app.data.projectProgress.some(item => item.projectId === topic.id) || app.data.projectMilestones.some(item => item.projectId === topic.id)));
    if (projectId && !topics.some(topic => topic.id === projectId)) throw new Error('Đề tài không có dữ liệu lịch phù hợp.');
    const events = [];
    const warnings = [];
    topics.filter(topic => !projectId || topic.id === projectId).forEach(topic => {
      const closed = topic.status === 'hoan-thanh';
      const base = String(topic.detailUrl || '').split('#')[0];
      const milestones = app.data.projectMilestones.find(item => item.projectId === topic.id);
      milestones?.dates.forEach(item => events.push({ id: `${topic.id}-${item.id}`, projectId: topic.id, projectTitle: topic.title, title: item.title, date: item.date, kind: 'milestone', closed, detailUrl: base ? `${base}#tong-quan` : null }));
      if (!app.data.projectProgress.some(item => item.projectId === topic.id)) return;
      try {
        const state = app.services.projectProgress.getState(topic.id);
        state.tasks.forEach(task => events.push({ id: `${topic.id}-${task.id}`, projectId: topic.id, projectTitle: topic.title, title: task.title, date: task.deadline, kind: 'task', closed: closed || task.status === 'da-hoan-thanh', detailUrl: base ? `${base}#tien-do` : null }));
      } catch (failure) { warnings.push(`${topic.id}: ${failure.message}`); }
    });
    events.sort((first, second) => first.date.localeCompare(second.date) || first.projectId.localeCompare(second.projectId) || first.id.localeCompare(second.id));
    return { topics: topics.map(topic => ({ id: topic.id, title: topic.title })), events: events.filter(event => !month || event.date.startsWith(`${month}-`)), warning: [...new Set(warnings)].join(' ') };
  }

  app.services.deadlines = { today, getState };
})();
