(() => {
  const app = globalThis.IE104;
  const params = new URLSearchParams(location.search);
  const projectId = params.get('project'), invitationId = params.get('invitation');
  const host = document.querySelector('[data-invitation-topic]');
  const status = document.querySelector('[data-invitation-detail-status]');
  const service = app.services.projectTeams;
  const overview = host.querySelector('#tong-quan');
  const overviewTemplate = overview.cloneNode(true);
  async function refresh(){
    try{
      const state=await service.invitationDetail(projectId,invitationId);
      const {project}=state;
      document.querySelector('.page-header__topic-name').textContent = project.title;
      document.title = `${project.title} | Lời mời hướng dẫn`;
      app.shared.renderLecturerOverview(overview, {projectId, project, team: state, readOnly: false}, overviewTemplate);
      host.hidden=false;status.textContent='';
    }catch(failure){host.hidden=true;status.textContent=failure.message;}
  }
  window.addEventListener('storage',event=>{if([app.storage.teamKey,null].includes(event.key))refresh();});
  refresh();
})();
