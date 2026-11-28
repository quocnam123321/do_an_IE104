(() => {
  const app = globalThis.IE104 ||= {};
  app.shared ||= {};

  function renderList(list, value) {
    const lines = Array.isArray(value) ? value : String(value ?? '').split(/\r?\n/);
    const items = lines.map(line => line.trim()).filter(Boolean);
    if (!items.length) items.push('Chưa có thông tin');
    list.replaceChildren(...items.map(text => {
      const item = document.createElement('li');
      item.textContent = text;
      return item;
    }));
  }

  function supervisorCard({ name, role, id, illustrative }) {
    const lecturer = app.data.projectLecturers.find(profile =>
      profile.name === name && (!id || profile.id === id));
    const department = lecturer?.department?.trim().replace(/^Bộ môn(?:\s*:\s*|\s+|$)/i, '');
    const item = document.createElement('li');
    item.className = 'supervisor-list__item';
    item.toggleAttribute('data-supervisor-illustrative', Boolean(illustrative));
    const card = document.createElement('article');
    card.className = 'supervisor-card';
    const avatar = document.createElement('div');
    avatar.className = 'supervisor-card__avatar';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = name.trim().split(/\s+/).slice(-2).map(part => part[0]).join('');
    const content = document.createElement('div');
    content.className = 'supervisor-card__content';
    const title = document.createElement('h3');
    title.className = 'supervisor-card__name';
    title.textContent = name;
    const details = document.createElement('p');
    details.className = 'supervisor-card__department';
    details.textContent = [department || 'Chưa cập nhật bộ môn', illustrative && 'Minh họa'].filter(Boolean).join(' · ');
    content.append(title, details);
    if (role) {
      const badge = document.createElement('p');
      badge.className = `supervisor-card__role supervisor-card__role--${role}`;
      badge.textContent = role === 'primary' ? 'Hướng dẫn chính' : 'Đồng hướng dẫn';
      content.append(badge);
    }
    card.append(avatar, content);
    item.append(card);
    return item;
  }

  function renderSupervisors(section, lecturers) {
    const cards = lecturers.filter(lecturer => lecturer.name?.trim()).map(supervisorCard);
    const list = section.querySelector('.supervisor-list');
    list.replaceChildren(...cards);
    const empty = section.querySelector('[data-supervisors-empty]');
    if (empty) {
      empty.hidden = Boolean(cards.length);
      list.hidden = !cards.length;
    }
  }

  function renderAcceptedSupervisors(section, project, team) {
    const profiles = (team?.supervisorIds || []).map((id, index) => {
      const invitation = team.invitations.find(item => item.lecturerId === id && item.status === 'accepted');
      const profile = app.data.projectLecturers.find(item => item.id === id);
      return { id, name: invitation?.lecturerName || (id === project.lecturerId && project.lecturer) || profile?.name, role: index === 0 ? 'primary' : 'secondary' };
    });
    renderSupervisors(section, profiles);
  }

  function renderLecturerSupervisors(section, project, team) {
    if (team?.invitations) { renderAcceptedSupervisors(section, project, team); return; }
    const profiles = app.data.projectLecturers;
    const known = (team?.supervisorIds || []).map((id, index) => {
      const profile = profiles.find(person => person.id === id);
      const name = (id === project.lecturerId && project.lecturer) || profile?.name;
      const secondary = id === project.lecturerId && project.roleLabel === 'Đồng hướng dẫn';
      return { id, name, role: index === 0 && !secondary ? 'primary' : 'secondary' };
    });
    for (const name of project.sourceRecord?.advisors || []) {
      if (!known.some(person => person.name === name)) known.push({ name });
    }

    // Hồ sơ danh mục có thể chỉ có vai trò của tài khoản mẫu, chưa có tên GVHD từ nguồn.
    if (!team && !known.some(person => person.name)) {
      const owner = profiles.find(person => person.id === project.ownerId);
      if (owner) known.push({ id: owner.id, name: owner.name, role: project.role, illustrative: true });
    }

    const currentLecturerId = app.data.currentLecturer?.id;
    const hasCoSupervisor = known.some(person =>
      person.name && person.role === 'secondary' && person.id !== currentLecturerId);
    if (!hasCoSupervisor) {
      const usedNames = new Set([
        ...known.map(person => person.name),
        ...(team?.members || []).map(member => member.name),
        ...(project.sourceRecord?.authors || []),
      ]);
      const coSupervisor = profiles.find(person => person.id !== currentLecturerId && !usedNames.has(person.name));
      if (coSupervisor) known.push({ id: coSupervisor.id, name: coSupervisor.name, role: 'secondary', illustrative: true });
    }
    renderSupervisors(section, known);
  }

  function renderSupervisedSummary(summary, project) {
    const statuses = { 'dang-thuc-hien': 'Đang thực hiện', 'hoan-thanh': 'Hoàn thành' };
    const roles = { primary: 'Hướng dẫn chính', secondary: 'Đồng hướng dẫn' };
    const roleLabel = project.roleLabel || roles[project.role];
    const badge = summary.querySelector('[data-supervised-role]');
    badge.dataset.supervisedRole = roleLabel === roles.secondary ? 'secondary' : 'primary';
    badge.querySelector('[data-supervised-role-label]').textContent = roleLabel || '';
    badge.hidden = !roleLabel;

    const term = ['he', 'summer'].includes(project.semester) ? 'hè' : project.semester;
    const fields = {
      code: project.displayId,
      type: project.typeLabel,
      course: project.courseLabel,
      status: project.statusLabel || statuses[project.status],
      semester: term && `Học kỳ ${term}`,
      academicYear: project.academicYear,
    };
    summary.querySelectorAll('[data-supervised-field]').forEach(node => {
      node.textContent = fields[node.dataset.supervisedField] || 'Chưa có thông tin';
    });
  }

  app.shared.topicOverview = { renderList, renderSupervisors, renderAcceptedSupervisors, renderLecturerSupervisors, renderSupervisedSummary };
})();
