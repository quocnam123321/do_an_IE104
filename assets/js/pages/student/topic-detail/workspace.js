(() => {
  const app = globalThis.IE104;
  const root = document.querySelector('[data-project-content]');
  const notice = document.querySelector('[data-project-notice]');
  if (!root || !notice || !app?.services?.approvedProjects) return;
  const projectId = new URLSearchParams(location.search).get('project') ?? 'DA001';
  const sample = app.data.myTopics.find(topic => topic.id === projectId);
  const overview = Object.hasOwn(app.data.studentProjectOverviews, projectId)
    ? app.data.studentProjectOverviews[projectId]
    : null;
  let valid = false;
  let initialized = false;
  const text = (selector, value) => { const node = document.querySelector(selector); if (node) node.textContent = value; };

  function renderList(list, value) {
    const items = String(value ?? '').split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    list.replaceChildren(...(items.length ? items : ['Chưa có thông tin']).map(item => {
      const row = document.createElement('li');
      row.textContent = item;
      return row;
    }));
  }

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
      const fields = [project.displayId || project.id, project.typeLabel, project.courseLabel, period];
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
      let outlinePanel = root.querySelector('[data-proposal-outline-view]');
      if (!outlinePanel) {
        outlinePanel = document.createElement('section');
        outlinePanel.dataset.proposalOutlineView = '';
        outlinePanel.className = 'proposal-outline-panel';
        requirements.after(outlinePanel);
      }
      app.shared?.proposalOutline?.render(outlinePanel, project);
      text('.topic-team__group-name', project.groupName);
      const instructors = root.querySelector('.supervisor-list');
      instructors.replaceChildren(...[
        ['primary', project.lecturer, project.lecturerId],
        ['secondary', project.coSupervisor, project.coSupervisorId],
      ].filter(([, name]) => name).map(([role, name, id]) => supervisorCard(name, role, id)));
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

  function supervisorCard(name, roleKind, lecturerId) {
    const lecturer = app.data.projectLecturers.find(profile =>
      profile.name === name && (!lecturerId || profile.id === lecturerId));
    const department = lecturer?.department?.trim().replace(/^Bộ môn(?:\s*:\s*|\s+|$)/i, '');
    const item = document.createElement('li');
    item.className = 'supervisor-list__item';
    const article = document.createElement('article');
    article.className = 'supervisor-card';
    const avatar = document.createElement('div');
    avatar.className = 'supervisor-card__avatar';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = name.trim().split(/\s+/).slice(-2).map(part => part[0]).join('');
    const content = document.createElement('div');
    content.className = 'supervisor-card__content';
    const title = document.createElement('h3');
    title.className = 'supervisor-card__name';
    title.textContent = name;
    const role = document.createElement('p');
    role.className = `supervisor-card__role supervisor-card__role--${roleKind}`;
    role.textContent = roleKind === 'primary' ? 'Hướng dẫn chính' : 'Đồng hướng dẫn';
    const details = document.createElement('p');
    details.className = 'supervisor-card__department';
    details.textContent = department || 'Chưa cập nhật bộ môn';
    content.append(title, details, role);
    article.append(avatar, content);
    item.append(article);
    return item;
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
    if (!overview) return;
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
