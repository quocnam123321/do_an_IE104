(() => {
  const app = globalThis.IE104;
  if (!app) return;
  let selected = null;
  async function resolve() {
    selected = null;
    const session = await (await import('../website-session.js')).getWebsiteSession('lecturer');
    if (session?.role !== 'lecturer') return null;
    if (!session.user) {
      selected = { ...app.data.currentLecturer, id: 'GV001', demo: true };
      return selected;
    }
    const teachers = await globalThis.IE104SupervisionEntry.getTeachers();
    selected = teachers.find(item => item.email?.toLowerCase() === session.user.email?.toLowerCase()) || null;
    if (selected) {
      app.data.currentLecturer = { ...selected };
      if (!app.data.projectLecturers.some(item => item.id === selected.id)) app.data.projectLecturers.push({ ...selected });
    }
    return selected;
  }
  app.services.invitationIdentity = { resolve, get current() { return selected; } };
  app.services.invitationIdentity.ready = resolve().catch(() => null);
})();
