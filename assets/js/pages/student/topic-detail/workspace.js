(() => {
  const app = globalThis.IE104;
  const root = document.querySelector('[data-project-content]');
  const notice = document.querySelector('[data-project-notice]');
  if (!root || !notice || !app?.services?.approvedProjects) return;
  const projectId = new URLSearchParams(location.search).get('project') ?? app.data.myTopics[0]?.id ?? 'DA001';
  const sample = app.data.myTopics.find(topic => topic.id === projectId);
  const overview = Object.hasOwn(app.data.studentProjectOverviews, projectId)
    ? app.data.studentProjectOverviews[projectId]
    : null;
  let valid = false;
  let initialized = false;
  const text = (selector, value) => { const node = document.querySelector(selector); if (node) node.textContent = value; };

  const { renderList, renderSupervisors } = app.shared.topicOverview;

  function refresh() {
    try {
      const project = overview || sample?.isArchivedSample
        ? { ...sample, ...overview }
        : app.services.approvedProjects.forStudent(projectId).project;
      document.body.dataset.projectId = project.id;
      document.body.toggleAttribute('data-archived-sample', Boolean(project.isArchivedSample));
      document.title = `${project.title} | Đề tài của tôi`;
      text('[data-project-title]', project.title);
      text('#project-title', project.title);
      void app.shared?.renderProposalCover?.(root.querySelector('.topic-summary__image'), project.coverImage);
      const term = project.semester === 'he' ? 'hè' : project.semester;
      const period = [term && 'Học kỳ ' + term, project.academicYear].filter(Boolean).join(' · ');
      const code = app.services.studentTopicCodes.get(project) || 'Chưa có mã đề tài';
      const fields = [code, project.typeLabel, app.ui.studentCourseLabel(project, true), period];
      root.querySelectorAll('.topic-summary__details dd').forEach((node, index) => {
        node.textContent = fields[index] || 'Chưa có thông tin';
      });
      text('[data-project-status]', project.statusLabel);
      root.querySelector('.topic-summary__status').classList.toggle('topic-summary__status--completed', project.status === 'hoan-thanh');
      text('.project-description__text', project.description || 'Chưa có thông tin');
      renderList(root.querySelector('.topic-objectives .topic-bullet-list'), project.objectives);
      renderList(root.querySelector('.topic-outcomes .topic-bullet-list'), project.outcomes);
      const requirements = root.querySelector('.topic-requirements');
      requirements.hidden = !project.requirements?.trim();
      if (!requirements.hidden) renderList(requirements.querySelector('.topic-bullet-list'), project.requirements);
      root.querySelectorAll('[data-project-method-plan]').forEach(section => {
        const content = project[section.dataset.projectMethodPlan]?.trim() || '';
        section.hidden = !content;
        section.querySelector('p').textContent = content;
      });
      let outlinePanel = root.querySelector('[data-proposal-outline-view]');
      if (!outlinePanel) {
        outlinePanel = document.createElement('section');
        outlinePanel.dataset.proposalOutlineView = '';
        outlinePanel.className = 'proposal-outline-panel';
        requirements.after(outlinePanel);
      }
      app.shared?.proposalOutline?.render(outlinePanel, project);
      text('.topic-team__group-name', project.groupName);
      renderSupervisors(root.querySelector('.project-supervisors'), [
        { role: 'primary', name: project.lecturer, id: project.lecturerId },
        { role: 'secondary', name: project.coSupervisor, id: project.coSupervisorId },
      ]);
      const dates = root.querySelectorAll('.topic-milestones__list dd');
      const milestones = project.milestones || (!project.isArchivedSample && project.createdAt
        ? [new Date(project.createdAt).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })]
        : []);
      dates.forEach((node, index) => { node.textContent = milestones[index] || 'Chưa có mốc thời gian'; });
      notice.hidden = true;
      valid = true;
      if (initialized) { root.hidden = false; document.body.dataset.projectState = 'ready'; }
    } catch (failure) {
      valid = false;
      root.hidden = true;
      delete document.body.dataset.projectId;
      document.body.dataset.projectState = 'error';
      notice.hidden = false;
      notice.textContent = failure.message;
      document.querySelectorAll('dialog[open]').forEach(dialog => dialog.close());
    }
  }

  function initializeSubmissions() {
    const host = root.querySelector('#submissions-section');
    if (sample?.isArchivedSample) {
      const message = document.createElement('p');
      message.textContent = 'Chưa có dữ liệu bài nộp của đề tài này.';
      host.replaceChildren(message);
      host.removeAttribute('data-student-submissions');
      return;
    }
    if (!overview?.submissionTemplate) return;
    const template = document.getElementById(overview.submissionTemplate);
    host.replaceWith(template.content.cloneNode(true));
    const dialogs = document.getElementById('sample-submission-dialogs');
    dialogs.after(dialogs.content.cloneNode(true));
  }

  refresh();
  if (valid) initializeSubmissions();
  document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('keydown', event => {
    if (event.key !== 'Tab' || event.ctrlKey || event.metaKey || event.altKey) return;
    const controls = [...dialog.querySelectorAll('button:not(:disabled), input:not(:disabled):not([type="hidden"]), select:not(:disabled), textarea:not(:disabled), a[href], summary')].filter(node => node.getClientRects().length);
    const target = event.shiftKey && document.activeElement === controls[0] ? controls.at(-1) : !event.shiftKey && document.activeElement === controls.at(-1) ? controls[0] : null;
    if (target) { event.preventDefault(); target.focus({ preventScroll: true }); }
  }));
  document.addEventListener('DOMContentLoaded', () => {
    if (!valid) return;
    initialized = document.body.dataset.teamReady === 'true' && document.getElementById('tien-do').dataset.progressReady === 'true' && document.getElementById('ket-qua-danh-gia').dataset.evaluationReady === 'true';
    if (!initialized) { notice.hidden = false; notice.textContent = 'Chưa tải đủ nội dung đề tài. Hãy tải lại trang để thử lại.'; return; }
    root.hidden = false;
    document.body.dataset.projectState = 'ready';
  });
  window.addEventListener('storage', event => { if ([app.storage.proposalKey, app.storage.registrationKey, app.storage.teamKey, null].includes(event.key)) refresh(); });
  window.addEventListener('pageshow', refresh);
})();
