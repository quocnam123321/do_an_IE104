(() => {
  const app = globalThis.IE104;
  const root = document.querySelector('[data-approved-content]');
  const notice = document.querySelector('[data-approved-notice]');
  if (!root || !notice || !app?.services?.approvedProjects) return;
  const projectId = new URLSearchParams(location.search).get('project');
  let valid = false;
  let initialized = false;
  const text = (selector, value) => { const node = document.querySelector(selector); if (node) node.textContent = value; };

  function refresh() {
    try {
      const definition = app.services.approvedProjects.forStudent(projectId);
      const project = definition.project;
      document.body.dataset.projectId = project.id;
      document.title = `${project.title} | Đề tài của tôi`;
      text('[data-approved-title]', project.title);
      text('#project-title', project.title);
      const fields = [project.id, project.typeLabel, project.courseLabel, project.semester === 'he' ? 'Hè' : project.semester, project.academicYear, project.lecturer, project.statusLabel];
      document.querySelectorAll('.project-summary__meta dd').forEach((node, index) => { node.textContent = fields[index]; node.classList.remove('project-summary__status--completed'); });
      text('.project-description__text', project.description);
      text('.project-objectives__text', project.objectives);
      text('.project-outcomes__text', project.outcomes);
      let outlinePanel = root.querySelector('[data-proposal-outline-view]');
      if (!outlinePanel) {
        outlinePanel = document.createElement('section');
        outlinePanel.dataset.proposalOutlineView = '';
        outlinePanel.className = 'proposal-outline-panel';
        document.querySelector('.project-outcomes').after(outlinePanel);
      }
      app.shared?.proposalOutline?.render(outlinePanel, project);
      text('.project-team__name', project.groupName);
      const instructors = document.querySelector('.supervisor-list');
      const item = document.createElement('li');
      item.className = 'supervisor-list__item';
      const article = document.createElement('article');
      article.className = 'supervisor-card';
      const avatar = document.createElement('div');
      avatar.className = 'supervisor-card__avatar';
      avatar.setAttribute('aria-hidden', 'true');
      avatar.textContent = project.lecturer.trim().split(/\s+/).slice(-2).map(part => part[0]).join('');
      const content = document.createElement('div');
      content.className = 'supervisor-card__content';
      const title = document.createElement('h3');
      title.className = 'supervisor-card__name';
      title.textContent = project.lecturer;
      const role = document.createElement('p');
      role.className = 'supervisor-card__role';
      role.textContent = 'Hướng dẫn chính';
      content.append(title, role);
      article.append(avatar, content);
      item.append(article);
      instructors.replaceChildren(item);
      const dates = document.querySelectorAll('.project-milestones__list dd');
      dates.forEach((node, index) => { node.textContent = index === 0 ? new Date(project.createdAt).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : 'Chưa có mốc thời gian'; });
      notice.hidden = true;
      valid = true;
      if (initialized) { root.hidden = false; document.body.dataset.approvedState = 'ready'; }
    } catch (failure) {
      valid = false;
      root.hidden = true;
      delete document.body.dataset.projectId;
      document.body.dataset.approvedState = 'error';
      notice.hidden = false;
      notice.textContent = failure.message;
      document.querySelectorAll('dialog[open]').forEach(dialog => dialog.close());
    }
  }

  refresh();
  document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('keydown', event => {
    if (event.key !== 'Tab' || event.ctrlKey || event.metaKey || event.altKey) return;
    const controls = [...dialog.querySelectorAll('button:not(:disabled), input:not(:disabled):not([type="hidden"]), select:not(:disabled), textarea:not(:disabled), a[href]')].filter(node => node.getClientRects().length);
    const target = event.shiftKey && document.activeElement === controls[0] ? controls.at(-1) : !event.shiftKey && document.activeElement === controls.at(-1) ? controls[0] : null;
    if (target) { event.preventDefault(); target.focus({ preventScroll: true }); }
  }));
  document.addEventListener('DOMContentLoaded', () => {
    if (!valid) return;
    initialized = document.body.dataset.teamReady === 'true' && document.getElementById('tien-do').dataset.progressReady === 'true' && document.getElementById('ket-qua-danh-gia').dataset.evaluationReady === 'true';
    if (!initialized) { notice.hidden = false; notice.textContent = 'Chưa tải đủ nội dung đề tài. Hãy tải lại trang để thử lại.'; return; }
    root.hidden = false;
    document.body.dataset.approvedState = 'ready';
  });
  window.addEventListener('storage', event => { if ([app.storage.proposalKey, app.storage.registrationKey, app.storage.teamKey, null].includes(event.key)) refresh(); });
  window.addEventListener('pageshow', refresh);
})();
