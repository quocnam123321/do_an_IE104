(() => {
  const app = globalThis.IE104;
  app.ui ||= {};
  const element = (tag, text, className) => {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    if (className) node.className = className;
    return node;
  };
  function shell(title, danger = false) {
    const trigger = document.activeElement;
    const dialog = element('dialog', '', 'invitation-dialog' + (danger ? ' invitation-dialog--danger' : ''));
    const header = element('header', '', 'invitation-dialog__header');
    const heading = element('h2', title); heading.id = 'invitation-dialog-title';
    dialog.setAttribute('aria-labelledby', heading.id);
    const close = element('button', '', 'invitation-dialog__close'); close.type = 'button'; close.setAttribute('aria-label', 'Đóng hộp thoại');
    close.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>';
    close.addEventListener('click', () => dialog.close());
    header.append(heading, close); dialog.append(header); document.body.append(dialog);
    dialog.addEventListener('close', () => { dialog.remove(); if (trigger?.isConnected) trigger.focus({preventScroll:true}); }, {once:true});
    return {dialog, element, close};
  }
  app.ui.invitationSuccess = (title, message) => {
    const {dialog} = shell(title);
    const body = element('div', '', 'invitation-dialog__body'); body.append(element('p', message));
    dialog.classList.add('invitation-dialog--success');
    dialog.append(body);
    dialog.showModal();
  };
  app.ui.confirmInvitation = ({project, rejected, commit, onSaved}) => {
    const {dialog, close} = shell(rejected ? 'Từ chối lời mời' : 'Duyệt lời mời', rejected);
    const form = element('form'); form.noValidate = true;
    const body = element('div', '', 'invitation-dialog__body');
    body.append(element('p', rejected ? 'Bạn có chắc muốn từ chối lời mời này?' : 'Bạn có chắc muốn duyệt lời mời này?'));
    const summary = element('p', '', 'invitation-dialog__summary');
    summary.append(element('strong', `${project.displayId || project.topicCode || project.topicId} - ${project.title}`)); body.append(summary);
    let reason;
    const error = element('p', '', 'invitation-dialog__error'); error.id = 'invitation-decision-error'; error.setAttribute('role','alert'); error.hidden = true;
    if (rejected) {
      const label = element('label', 'Lý do từ chối *'); label.htmlFor = 'invitation-reject-reason';
      reason = element('textarea'); reason.id = label.htmlFor; reason.rows = 4; reason.maxLength = 2000; reason.required = true;
      reason.placeholder = 'Nhập lý do từ chối để sinh viên biết và điều chỉnh';
      reason.setAttribute('aria-describedby', 'invitation-reason-help invitation-decision-error');
      const help = element('p', 'Ít nhất 10 ký tự, không tính khoảng trắng ở hai đầu.', 'invitation-dialog__help'); help.id = 'invitation-reason-help';
      body.append(label, reason, help);
    } else body.append(element('p', 'Sau khi duyệt, bạn sẽ được thêm vào đề tài với vai trò Đồng hướng dẫn.'));
    body.append(error);
    const footer = element('footer', '', 'invitation-dialog__footer');
    const cancel = element('button', 'Hủy', 'invitation-dialog__button'); cancel.type = 'button'; cancel.addEventListener('click', () => dialog.close());
    const submit = element('button', rejected ? 'Xác nhận từ chối' : 'Xác nhận duyệt', 'invitation-dialog__button invitation-dialog__button--' + (rejected ? 'danger' : 'primary')); submit.type = 'submit';
    footer.append(cancel,submit); form.append(body,footer); dialog.append(form);
    let saving = false;
    dialog.addEventListener('cancel', event => { if (saving) event.preventDefault(); });
    form.addEventListener('submit', async event => {
      event.preventDefault(); if (saving) return;
      const note = reason?.value.trim() || '';
      if (rejected && (note.length < 10 || note.length > 2000)) {
        error.textContent = 'Nhập lý do từ chối từ 10 đến 2000 ký tự.'; error.hidden = false; reason.setAttribute('aria-invalid','true'); reason.focus(); return;
      }
      saving = true; error.hidden = true;
      for (const control of [submit,cancel,close,reason].filter(Boolean)) control.disabled = true;
      try {
        await commit(note);
        dialog.close(); await onSaved?.();
        app.ui.invitationSuccess(rejected ? 'Đã từ chối lời mời' : 'Duyệt lời mời thành công', rejected ? 'Kết quả và lý do từ chối đã được cập nhật cho nhóm sinh viên.' : 'Bạn đã được thêm vào đề tài với vai trò Đồng hướng dẫn.');
      } catch (failure) { error.textContent = failure.message; error.hidden = false; }
      finally { saving = false; for (const control of [submit,cancel,close,reason].filter(Boolean)) control.disabled = false; }
    });
    reason?.addEventListener('input', () => { reason.removeAttribute('aria-invalid'); error.hidden = true; });
    dialog.showModal();
  };
})();
