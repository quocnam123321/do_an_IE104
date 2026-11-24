(() => {
  const app = globalThis.IE104;
  if (document.body.dataset.lecturerTopicView !== 'detail' || !app?.services?.lecturerTopicEditor) return;
  const dialogs = { close:document.getElementById('close-registration'), open:document.getElementById('reopen-registration') };
  const status = document.createElement('p'); status.setAttribute('role','status'); status.className = 'topic-editor-status'; status.tabIndex = -1;
  document.querySelector('.request-detail__actions')?.before(status);
  const deadline = document.getElementById('registration-reopen-deadline');
  const datePicker = app.ui?.proposalDatePicker;
  datePicker?.enhanceDate(deadline, { timeZone: 'Asia/Ho_Chi_Minh', preferAbove: true });
  const setDeadlineValidity = message => {
    if (globalThis.IE104Language) globalThis.IE104Language.setCustomValidity(deadline, message);
    else deadline.setCustomValidity(message);
  };
  let pending = null; let busy = false;
  const describe = () => {
    try {
      const topics = app.services.lecturerTopics;
      const topic = topics.get('created', document.body.dataset.topicId);
      if (topics.createdStatus(topic).status === 'registered') {
        status.textContent = '';
        return;
      }
      const state = app.services.publishedTopics.availability(topic);
      status.textContent = state.allowed ? '' : `Tiếp nhận đăng ký: ${state.label}. ${state.reason}`;
    }
    catch (failure) { status.textContent = failure.message; }
  };
  describe();
  window.addEventListener('storage',event => { if ([app.services.lecturerTopicRepository.key,null].includes(event.key)) describe(); });
  for (const [action,dialog] of Object.entries(dialogs)) {
    const button = dialog.querySelector('[data-registration-confirm]'); button.disabled = false; button.removeAttribute('title');
    const error = dialog.querySelector('[data-registration-error]');
    const form = button.form;
    if (action === 'open') {
      form.addEventListener('input', () => {
        setDeadlineValidity('');
        error.hidden = true;
      });
    }
    dialog.addEventListener('close',() => { if (!busy) pending = null; });
    dialog.addEventListener('cancel',event => { if (busy) event.preventDefault(); });
    dialog.addEventListener('keydown',event => {
      if (event.key !== 'Tab' || event.ctrlKey || event.metaKey || event.altKey) return;
      const controls = [...dialog.querySelectorAll('button:not(:disabled),input:not(:disabled)')].filter(node => node.getClientRects().length);
      const target = event.shiftKey && document.activeElement === controls[0] ? controls.at(-1) : !event.shiftKey && document.activeElement === controls.at(-1) ? controls[0] : null;
      if (target) { event.preventDefault(); target.focus({preventScroll:true}); }
    });
    form.addEventListener('submit',async event => {
      event.preventDefault();
      if (!pending || busy || pending.action !== action) return;
      const value = action === 'open' ? datePicker?.read(deadline) ?? deadline.value : '';
      if (action === 'open' && !value) {
        setDeadlineValidity('Nhập ngày và giờ hợp lệ.');
        deadline.reportValidity();
        return;
      }
      busy = true; button.disabled = true; error.hidden = true;
      const controls = [...dialog.querySelectorAll('button,input')].map(node => [node,node.disabled]);
      controls.forEach(([node]) => { node.disabled = true; });
      try {
        const snapshot = pending;
        const commit = () => app.services.lecturerTopicEditor.setRegistration(snapshot.id,action === 'open',value,snapshot.revision,snapshot.ownerId);
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
        if (action === 'open') {
          const timestamp = Date.parse(topic.registration?.deadline);
          const value = Number.isFinite(timestamp) ? new Date(timestamp + 7 * 3600000).toISOString().slice(0, 16) : '';
          setDeadlineValidity('');
          if (datePicker) datePicker.fill(deadline, value);
          else deadline.value = value;
        }
        dialog.showModal();
      } catch (failure) { status.textContent = failure.message; }
    });
  }
})();
