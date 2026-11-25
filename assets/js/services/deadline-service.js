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
    const warnings = [];
    let approved = [];
    try { approved = app.services.approvedProjects?.list('student') || []; }
    catch (failure) { warnings.push(failure.message); }
    const topics = [...app.data.myTopics, ...approved].filter(topic => ['dang-thuc-hien', 'hoan-thanh'].includes(topic.status) && (app.data.projectProgress.some(item => item.projectId === topic.id) || app.data.projectMilestones.some(item => item.projectId === topic.id) || ['approved-proposal', 'approved-registration'].includes(topic.source)));
    if (projectId && !topics.some(topic => topic.id === projectId)) throw new Error('Đề tài không có dữ liệu lịch phù hợp.');
    const events = [];
    topics.filter(topic => !projectId || topic.id === projectId).forEach(topic => {
      const closed = topic.status === 'hoan-thanh';
      const base = String(topic.detailUrl || '').split('#')[0];
      const milestones = app.data.projectMilestones.find(item => item.projectId === topic.id);
      milestones?.dates.forEach(item => events.push({ id: `${topic.id}-${item.id}`, projectId: topic.id, projectTitle: topic.title, title: item.title, date: item.date, kind: 'milestone', closed, detailUrl: base ? `${base}#tong-quan` : null }));
      try {
        const submissions = app.services.studentSubmissions?.forStudent(topic.id);
        submissions?.requirements.forEach(requirement => events.push({
          id: requirement.id, projectId: topic.id, projectTitle: topic.title, title: requirement.title,
          date: today(new Date(requirement.deadline)), deadline: requirement.deadline, kind: 'submission',
          closed: closed || requirement.submitted, submitted: requirement.submitted, locked: requirement.locked,
          detailUrl: base ? `${base}#bai-nop` : null,
        }));
      } catch (failure) { warnings.push(failure.message); }
      if (!app.data.projectProgress.some(item => item.projectId === topic.id) && !['approved-proposal', 'approved-registration'].includes(topic.source)) return;
      try {
        const state = app.services.projectProgress.getState(topic.id);
        state.tasks.forEach(task => events.push({ id: `${topic.id}-${task.id}`, projectId: topic.id, projectTitle: topic.title, title: task.title, date: task.deadline, kind: 'task', closed: closed || task.status === 'da-hoan-thanh', detailUrl: base ? `${base}#tien-do` : null }));
      } catch (failure) { warnings.push(`${topic.id}: ${failure.message}`); }
    });
    events.sort((first, second) => first.date.localeCompare(second.date) || first.projectId.localeCompare(second.projectId) || first.id.localeCompare(second.id));
    return { topics: topics.map(topic => ({ id: topic.id, title: topic.title })), events: events.filter(event => !month || event.date.startsWith(`${month}-`)), warning: [...new Set(warnings)].join(' ') };
  }

  const vietnamTime = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });

  function dateTime(value) {
    if (!Number.isFinite(Date.parse(value))) return '';
    return vietnamTime.format(new Date(value)).replace(' ', 'T') + '+07:00';
  }

  async function getActiveDeadlines() {
    let approved = [];
    try { approved = app.services.approvedProjects?.list('student') ?? []; }
    catch { /* The bundled projects remain available if saved projects cannot be read. */ }
    const projects = new Map([...app.data.myTopics, ...approved]
      .filter(project => project.status === 'dang-thuc-hien')
      .map(project => [project.id, project]));
    const service = app.services.studentSubmissions;
    const calendars = await Promise.all([...projects.values()].map(async project => {
      let state;
      try { state = service.forStudent(project.id); }
      catch { return null; }
      const base = project.detailUrl?.split('#')[0];
      if (!state.canUpload || !base) return null;
      const uploads = state.requirements.length ? await service.readUploads(project.id).catch(() => []) : [];
      const byRequirement = new Map(uploads.map(upload => [upload.requirementId, upload]));
      const events = [];
      const milestones = app.data.projectMilestones?.find(item => item.projectId === project.id)?.dates ?? [];
      const progressDate = project.outline?.progressReportDate || project.progressReportDate ||
        milestones.find(item => item.id === 'progress-report')?.date;
      const finalDate = project.outline?.finalReportDate || project.outline?.endDate || project.finalReportDate ||
        project.completesAt || milestones.find(item => item.id === 'final-report')?.date;
      const reportDates = [
        ['progress-report', 'Hạn nộp báo cáo tiến độ', 'Báo cáo tiến độ', progressDate],
        ['deadline', 'Hạn nộp báo cáo cuối cùng', 'Báo cáo cuối cùng', finalDate],
      ];
      for (const [id, name, label, value] of reportDates) {
        const due = /^\d{4}-\d{2}-\d{2}$/.test(value ?? '') ? value : dateTime(value);
        if (!due) continue;
        events.push({
          id: `${project.id}--${id}`, topicId: project.id, date: due.slice(0, 10),
          due, name, label, kind: 'topic', detailUrl: `${base}#tong-quan`,
        });
      }

      for (const requirement of state.requirements) {
        const due = dateTime(requirement.deadline);
        if (!due) continue;
        const upload = byRequirement.get(requirement.id);
        const saved = requirement.latestSubmission;
        const useUpload = upload && (!saved || Date.parse(upload.submittedAt) >= Date.parse(saved.submittedAt));
        const latest = useUpload ? upload : saved;
        const feedback = latest?.feedback || (latest?.submittedAt === saved?.submittedAt && saved?.feedback);
        const status = feedback ? 'responded' : latest && latest.calendarStatus !== 'submitted' ? 'awaiting' :
          latest || requirement.submitted ? 'submitted' :
          requirement.locked ? 'locked' : requirement.overdue ? 'overdue' : 'pending';
        events.push({
          id: `${project.id}--${requirement.id}`, topicId: project.id, date: due.slice(0, 10),
          due, name: requirement.title, kind: 'submission', status, submitted: dateTime(latest?.submittedAt),
          requirementId: requirement.id, submissionId: latest?.id ?? (useUpload ? `upload:${requirement.id}` : undefined),
          detailUrl: `${base}#bai-nop`,
        });
      }
      return { id: project.id, title: project.title, group: project.groupName, events };
    }));
    return calendars.filter(calendar => calendar?.events.length);
  }

  app.services.deadlines = { today, getState, getActiveDeadlines };
})();
