(() => {
  const app = globalThis.IE104;
  app.shared ||= {};
  const { renderList, renderLecturerSupervisors, renderSupervisedSummary } = app.shared.topicOverview;
  const el = (tag, value, className) => {const node=document.createElement(tag);if(value)node.textContent=value;if(className)node.className=className;return node;};
  function render(overview, { projectId, project, team, readOnly }, overviewTemplate, participants) {
    const isGroup = participants?.isGroup ?? true;
    const originalSample = projectId === 'GV-DT001-N01';
    overview.replaceChildren(...overviewTemplate.cloneNode(true).children);
    const text = (selector, value) => { overview.querySelector(selector).textContent = value; };
    text('#topic-summary-title', project.title);
    const cover = overview.querySelector('.topic-summary__image');
    cover.setAttribute('aria-label', `Ảnh đại diện đề tài ${project.title}`);
    if (!originalSample) {
      const image = el('img', null, 'gv-default-image');
      image.src = '../../assets/images/uit-logo.png';
      image.alt = '';
      cover.replaceChildren(image);
    }
    void app.shared.renderProposalCover(cover, project.coverImage);

    renderSupervisedSummary(overview.querySelector('.topic-summary--supervised'), {
      ...project,
      displayId: project.displayId || project.topicId || project.id,
      courseLabel: window.UITLecturerCatalog?.subjectLabel(project, true) || project.courseLabel,
    });

    const sample = app.data.studentProjectOverviews?.[projectId];
    if (!originalSample) {
      text('.topic-description > p', project.description || sample?.description || 'Chưa có thông tin');
      for (const key of ['objectives', 'outcomes']) {
        renderList(overview.querySelector(`.topic-${key} .topic-bullet-list`), project[key] || sample?.[key]);
      }
      const milestones = app.shared.proposalOutline.milestones(project, sample?.milestones);
      overview.querySelectorAll('.topic-milestones__list dd').forEach((node, index) => {
        node.textContent = milestones[index];
      });
    }

    app.shared.proposalOutline.render(overview.querySelector('[data-proposal-outline-view]'), project);
    overview.querySelectorAll('[data-project-method-plan]').forEach(section => {
      const content = project[section.dataset.projectMethodPlan]?.trim() || '';
      section.hidden = !content;
      section.querySelector('p').textContent = content;
    });

    const supervisors = overview.querySelector('.project-supervisors');
    renderLecturerSupervisors(supervisors, project, readOnly ? null : team);

    const groupName = overview.querySelector('.topic-team__group-name');
    groupName.textContent = participants?.label || project.groupName || 'Chưa có nhóm thực hiện';
    groupName.hidden = !isGroup;
    if (!isGroup) text('#team-title', 'Sinh viên thực hiện');
    const capacity = overview.querySelector('.project-team__note');
    capacity.hidden = !isGroup || !Number.isInteger(team.maxMembers) || team.maxMembers <= 0;
    if (!capacity.hidden) text('[data-team-capacity]', `tối đa ${team.maxMembers} thành viên`);
    const members = overview.querySelector('.topic-team__members');
    const memberTemplate = members.firstElementChild;
    members.replaceChildren(...(team.members.length ? team.members.map(member => {
      const item = memberTemplate.cloneNode(true);
      const avatar = item.querySelector('.team-member__avatar');
      avatar.removeAttribute('role');
      avatar.removeAttribute('aria-label');
      avatar.setAttribute('aria-hidden', 'true');
      avatar.textContent = member.name.trim().split(/\s+/).slice(-2).map(part => part[0]).join('').toUpperCase();
      item.querySelector('.team-member__name').textContent = member.name;
      const code = item.querySelector('.team-member__id');
      code.textContent = (isGroup ? member.code : participants.code) || '';
      code.previousElementSibling.hidden = !code.textContent;
      const role = item.querySelector('.team-member__role');
      role.textContent = member.role === 'nhom-truong' ? 'Nhóm trưởng' : 'Thành viên';
      return item;
    }) : [el('li', 'Chưa có thông tin thành viên nhóm.')]));
  }
  app.shared.renderLecturerOverview = render;
})();
