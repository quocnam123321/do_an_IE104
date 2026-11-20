(() => {
  const app = globalThis.IE104;
  if (!app?.services?.projectTeams || !app.storage?.readTeachingRecords) return;

  function forStudent(projectId, now = new Date()) {
    const team = app.services.projectTeams.getState(projectId);
    const studentCode = app.data.currentStudent?.code;
    if (!studentCode || !team.members.some(member => member.code === studentCode)) {
      throw new Error('Sinh viên hiện tại không thuộc nhóm thực hiện đề tài này.');
    }

    const record = app.storage.readTeachingRecords().find(item => item.projectId === projectId);
    const completed = team.project.status === 'hoan-thanh';
    const submissionsLocked = Boolean(record?.submissionsLocked);
    const submissions = record?.submissions || [];
    const requirements = (record?.requirements || []).filter(item => !item.deletedAt).map(item => ({
      id: item.id,
      title: item.title,
      content: item.content,
      deadline: item.deadline,
      submitted: submissions.some(submission => submission.requirementId === item.id) || ['submitted', 'reviewed'].includes(item.sourceStage),
      locked: submissionsLocked || item.locked,
      overdue: !completed && Date.parse(item.deadline) < now.getTime(),
    }));
    requirements.sort((first, second) => Date.parse(first.deadline) - Date.parse(second.deadline));
    return { hasRecord: Boolean(record), completed, submissionsLocked, requirements, submissions };
  }

  app.services.studentSubmissions = { forStudent };
})();
