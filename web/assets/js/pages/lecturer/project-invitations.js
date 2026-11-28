(() => {
  const app = globalThis.IE104;
  const host = document.querySelector('[data-project-invitations]');
  if (!host) return;
  const service = app.services.projectTeams;
  const identity = app.services.invitationIdentity;
  const list = host.querySelector('ul');
  const status = host.querySelector('[role="status"]');
  const login = host.querySelector('[data-invitation-login]');
  let generation = 0;
  const reportCount = count => host.dispatchEvent(new CustomEvent('ie104:project-invitation-count', {bubbles:true, detail:count}));
  const text = (tag, value, className) => { const node = document.createElement(tag); node.textContent = value; if (className) node.className = className; return node; };
  const format = new Intl.DateTimeFormat('vi-VN', {day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',hourCycle:'h23',timeZone:'Asia/Ho_Chi_Minh'});
  async function refresh() {
    const current = ++generation;
    try {
      const recipient = await identity.resolve();
      if (current !== generation) return;
      login.hidden = Boolean(recipient);
      if (!recipient) { list.replaceChildren(); reportCount(0); status.textContent = 'Đăng nhập bằng tài khoản giảng viên để xem lời mời.'; return; }
      const entries = service.listInvitations(recipient);
      status.textContent = entries.length ? '' : 'Không có lời mời hướng dẫn đang chờ.';
      list.replaceChildren(...entries.map(entry => {
        const {project,invitation,revision} = entry;
        const card = text('li','','invitation-preview__card');
        const content = text('div','','invitation-preview__content');
        content.append(text('h3',`${project.displayId || project.topicCode || project.topicId} - ${project.title}`), text('p',invitation.message || 'Mời giảng viên tham gia đồng hướng dẫn đề tài của nhóm.','supervision__hint'));
        const time = text('time',format.format(new Date(invitation.createdAt)),'supervision__hint'); time.dateTime=invitation.createdAt; content.append(time);
        const actions = text('div','','invitation-preview__actions');
        const detail = text('a','Xem chi tiết đề tài','supervision__button');
        detail.href = `chi-tiet-loi-moi-huong-dan.html?project=${encodeURIComponent(project.id)}&invitation=${encodeURIComponent(invitation.id)}`;
        actions.append(detail);
        const decisions = text('div','','supervision__actions');
        for (const rejected of [true,false]) {
          const button = text('button', rejected ? 'Từ chối' : 'Đồng ý hướng dẫn', 'supervision__button supervision__button--'+(rejected?'danger':'primary')); button.type='button'; button.setAttribute('aria-haspopup','dialog');
          button.addEventListener('click',()=> app.ui.confirmInvitation({project,rejected,
            commit: note=> service.respondInvitation(project.id,invitation.id,rejected?'rejected':'accepted',note,revision),onSaved:refresh}));
          decisions.append(button);
        }
        actions.append(decisions); card.append(content,actions); return card;
      }));
      reportCount(entries.length);
    } catch (failure) { if(current===generation) { list.replaceChildren(); reportCount(0); status.textContent=failure.message; } }
  }
  window.addEventListener('storage', event=> {if([app.storage.teamKey,null].includes(event.key)) refresh();});
  document.addEventListener('ie104:project-team-updated',refresh);
  window.addEventListener('pageshow',refresh);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
  refresh();
})();
