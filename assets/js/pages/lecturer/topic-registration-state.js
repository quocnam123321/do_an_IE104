(() => {
  const app = globalThis.IE104;
  if (document.body.dataset.lecturerTopicView !== 'detail' || !app?.services?.lecturerTopicEditor) return;
  const dialogs = { close:document.getElementById('close-registration'), open:document.getElementById('reopen-registration') };
  const status = document.createElement('p'); status.setAttribute('role','status'); status.className = 'topic-editor-status'; status.tabIndex = -1;
  document.querySelector('.request-detail__actions')?.before(status);
  const deadline = document.createElement('input'); deadline.type = 'datetime-local'; deadline.id = 'registration-reopen-deadline'; deadline.required = true;
  const label = document.createElement('label'); label.htmlFor = deadline.id; label.textContent = 'Hạn đăng ký mới (giờ Việt Nam)';
  const hint = document.createElement('p'); hint.textContent = 'Chọn hạn còn hiệu lực. Thời điểm mở đã cấu hình vẫn được giữ.';
  dialogs.open.querySelector('form').before(label,deadline,hint);
  let pending = null; let busy = false;
  const describe = () => {
    try { const topic = app.services.lecturerTopics.get('created',document.body.dataset.topicId); const state = app.services.publishedTopics.availability(topic); status.textContent = `Tiếp nhận đăng ký: ${state.label}.${state.allowed ? '' : ` ${state.reason}`}`; }
    catch (failure) { status.textContent = failure.message; }
  };
  describe();
  window.addEventListener('storage',event => { if ([app.services.lecturerTopicRepository.key,null].includes(event.key)) describe(); });
  for (const [action,dialog] of Object.entries(dialogs)) {
    const button = dialog.querySelector('button[type="button"]'); button.disabled = false; button.removeAttribute('title');
    const error = document.createElement('p'); error.setAttribute('role','alert'); error.tabIndex = -1; error.className = 'topic-editor-error'; error.hidden = true; dialog.querySelector('form').before(error);
    dialog.addEventListener('close',() => { if (!busy) pending = null; });
    dialog.addEventListener('cancel',event => { if (busy) event.preventDefault(); });
    dialog.addEventListener('keydown',event => {
      if (event.key !== 'Tab' || event.ctrlKey || event.metaKey || event.altKey) return;
      const controls = [...dialog.querySelectorAll('button:not(:disabled),input:not(:disabled)')].filter(node => node.getClientRects().length);
      const target = event.shiftKey && document.activeElement === controls[0] ? controls.at(-1) : !event.shiftKey && document.activeElement === controls.at(-1) ? controls[0] : null;
      if (target) { event.preventDefault(); target.focus({preventScroll:true}); }
    });
    button.addEventListener('click',async () => {
      if (!pending || busy || pending.action !== action) return;
      busy = true; button.disabled = true; error.hidden = true;
      const controls = [...dialog.querySelectorAll('button,input')].map(node => [node,node.disabled]);
      controls.forEach(([node]) => { node.disabled = true; });
      try {
        const snapshot = pending;
        const commit = () => app.services.lecturerTopicEditor.setRegistration(snapshot.id,action === 'open',deadline.value,snapshot.revision,snapshot.ownerId);
        if (navigator.locks?.request) await navigator.locks.request(app.services.lecturerTopicRepository.key,commit); else commit();
        dialog.close(); pending = null;
        document.dispatchEvent(new Event('ie104:lecturer-topic-state-changed'));
        status.textContent = action === 'open' ? 'Đã lưu trạng thái mở đăng ký trên trình duyệt này.' : 'Đã đóng đăng ký. Các yêu cầu đã gửi vẫn được giữ.'; status.focus({preventScroll:true});
      } catch (failure) { error.textContent = failure.message; error.hidden = false; error.focus(); }
      finally { busy = false; controls.forEach(([node,disabled]) => { node.disabled = disabled; }); button.disabled = false; }
    });
    document.addEventListener('click',event => {
      const trigger = event.target.closest(action === 'open' ? '.registration-reopen-button' : '.registration-close-button');
      if (!trigger || busy) return;
      event.preventDefault();
      try {
        const topic = app.services.lecturerTopics.get('created',document.body.dataset.topicId);
        pending = { id:topic.id,revision:topic.revision || 0,ownerId:app.data.currentLecturer.id,action };
        dialog.querySelector('strong').textContent = topic.title; error.hidden = true;
        deadline.value = topic.registration?.deadline ? new Date(Date.parse(topic.registration.deadline)+7*3600000).toISOString().slice(0,16) : '';
        dialog.showModal();
      } catch (failure) { status.textContent = failure.message; }
    });
  }
})();
