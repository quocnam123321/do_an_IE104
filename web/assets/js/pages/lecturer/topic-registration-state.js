(() => {
  const app = globalThis.IE104;
  if (document.body.dataset.lecturerTopicView !== 'detail' || !app?.services?.lecturerTopicEditor) return;
  const dialogs = { close:document.getElementById('close-registration'), open:document.getElementById('reopen-registration') };
  const successDialog = document.getElementById('registration-success');
  const successTitle = document.getElementById('registration-success-title');
  const actions = document.querySelector('.request-detail__actions');
  const triggerError = document.createElement('p');
  triggerError.setAttribute('role', 'status');
  triggerError.className = 'topic-editor-status';
  triggerError.hidden = true;
  actions?.before(triggerError);
  successDialog.addEventListener('close', () => {
    actions?.querySelector(':is(.registration-close-button, .registration-reopen-button, .topic-edit-link):not([hidden])')
      ?.focus({ preventScroll: true });
  });
  const deadline = document.getElementById('registration-reopen-deadline');
  const legacyDeadline = deadline.closest('.topic-dialog__field');
  const roundDeadline = document.querySelector('[data-round-reopen-time]');
  const datePicker = app.ui?.proposalDatePicker;
  datePicker?.enhanceDate(deadline, { timeZone: 'Asia/Ho_Chi_Minh', preferAbove: true });
  const setDeadlineValidity = message => {
    if (globalThis.IE104Language) globalThis.IE104Language.setCustomValidity(deadline, message);
    else deadline.setCustomValidity(message);
  };
  let pending = null; let busy = false;
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
      const needsDeadline = action === 'open' && !pending.bound;
      const value = needsDeadline ? datePicker?.read(deadline) ?? deadline.value : '';
      if (needsDeadline && !value) {
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
        if (navigator.locks?.request) await navigator.locks.request(app.services.lecturerTopicRepository.key,commit); else await commit();
      } catch (failure) {
        error.textContent = failure.message;
        error.hidden = false;
        error.focus();
        return;
      }
      finally { busy = false; controls.forEach(([node,disabled]) => { node.disabled = disabled; }); button.disabled = false; }
      dialog.close();
      pending = null;
      document.dispatchEvent(new Event('ie104:lecturer-topic-state-changed'));
      successTitle.textContent = action === 'open' ? 'Mở lại đăng ký thành công' : 'Đóng đăng ký thành công';
      successDialog.showModal();
    });
    document.addEventListener('click',event => {
      const trigger = event.target.closest(action === 'open' ? '.registration-reopen-button' : '.registration-close-button');
      if (!trigger || trigger.disabled || busy) return;
      event.preventDefault();
      triggerError.hidden = true;
      try {
        const topic = app.services.lecturerTopics.get('created',document.body.dataset.topicId);
        const bound = Boolean(topic.registration?.roundId);
        pending = { id:topic.id,revision:topic.revision || 0,ownerId:app.data.currentLecturer.id,action,bound };
        dialog.querySelector('strong').textContent = topic.title; error.hidden = true;
        if (action === 'open') {
          legacyDeadline.hidden = bound;
          roundDeadline.hidden = !bound;
          deadline.required = !bound;
          deadline.disabled = bound;
          setDeadlineValidity('');
          if (bound) {
            const academic = globalThis.IE104AdminAcademic;
            const round = academic?.forTopic(topic);
            if (round?.status !== 'open') throw new Error('Đợt đăng ký hiện chưa mở.');
            const time = roundDeadline.querySelector('time');
            time.dateTime = round.end + '+07:00';
            time.textContent = academic.displayTime(round.end);
          } else {
            const timestamp = Date.parse(topic.registration?.deadline);
            const value = Number.isFinite(timestamp) ? new Date(timestamp + 7 * 3600000).toISOString().slice(0, 16) : '';
            if (datePicker) datePicker.fill(deadline, value);
            else deadline.value = value;
          }
        }
        dialog.showModal();
      } catch (failure) {
        triggerError.hidden = false;
        triggerError.textContent = failure.message;
      }
    });
  }
})();
