(() => {
  const app = globalThis.IE104;
  const ui = app?.ui?.lecturerWorkspace;
  const stepper = app?.ui?.numberStepper;
  if (!ui) {
    document.querySelectorAll('#evaluation-section input[type="number"]').forEach(input => stepper?.enhance(input));
    return;
  }
  const { el, button, field, modal, service } = ui;
  const template = document.getElementById('ket-qua-danh-gia').cloneNode(true);
  const panel = ui.region('evaluation-section', 'ket-qua-danh-gia');
  const successDialog = document.getElementById('evaluation-published-dialog');
  successDialog.querySelector('button').addEventListener('click', () => successDialog.close());
  successDialog.addEventListener('close', () => panel.querySelector('.evaluation-form__publish')?.focus({ preventScroll: true }));
  let loadedProject;
  let editingPublished = false;

  function labelAction(control, label, iconName) {
    const ns = 'http://www.w3.org/2000/svg';
    const icon = document.createElementNS(ns, 'svg');
    icon.setAttribute('aria-hidden', 'true');
    icon.setAttribute('focusable', 'false');
    icon.setAttribute('viewBox', '0 0 24 24');
    const shape = document.createElementNS(ns, 'use');
    shape.setAttribute('href', '#evaluation-' + iconName + '-icon');
    icon.append(shape);
    control.append(icon, el('span', label));
  }

  function attachmentPicker(section, initial, readOnly) {
    const trigger = section.querySelector('.topic-file-picker__trigger');
    const input = trigger.querySelector('input');
    const hint = section.querySelector('.topic-file-picker__hint');
    const selection = section.querySelector('.topic-file-picker__selection');
    const name = selection.querySelector('.topic-file-picker__name');
    const remove = selection.querySelector('.topic-file-picker__remove');
    const error = section.querySelector('.topic-file-picker__error');
    let selected = initial;

    function showSelection(message = '') {
      name.textContent = selected?.name || '';
      selection.hidden = !selected;
      trigger.hidden = Boolean(readOnly || selected);
      hint.hidden = Boolean(selected);
      error.textContent = message;
      error.hidden = !message;
      if (message) input.setAttribute('aria-invalid', 'true');
      else input.removeAttribute('aria-invalid');
    }

    showSelection();
    if (readOnly) {
      remove.hidden = true;
      if (initial) {
        section.querySelector('.evaluation-attachments__download').hidden = false;
        app.ui.bindEvaluationAttachmentDownload(section, initial);
      } else {
        hint.textContent = 'Chưa có tệp đánh giá đính kèm.';
      }
      return;
    }
    input.addEventListener('change', () => {
      const file = input.files[0];
      if (!file) return;
      if (!file.size || !file.name.trim()) {
        input.value = '';
        showSelection('Tệp đính kèm bị rỗng hoặc không hợp lệ. Hãy chọn tệp khác.');
        input.focus();
        return;
      }
      selected = file;
      ui.dirty = true;
      showSelection();
      remove.focus();
    });
    remove.addEventListener('click', () => {
      selected = null;
      input.value = '';
      ui.dirty = true;
      showSelection();
      input.focus();
    });
    return () => selected;
  }

  function render(state) {
    panel.replaceChildren();
    if (!state) return;
    panel.append(...template.cloneNode(true).children);
    const form = panel.querySelector('form');
    if (state.readOnly) {
      form.replaceWith(el('p', 'Chưa có dữ liệu đánh giá của đề tài này.'));
      return;
    }
    loadedProject = state.projectId;
    const completed = state.project.status === 'hoan-thanh';
    const published = state.publication;
    const readOnly = completed && published && !editingPublished;
    const source = readOnly ? published : state.draft || published;
    const criteria = readOnly ? published.criteria : state.criteria;
    const table = form.querySelector('table');
    table.caption.textContent = `Tiêu chí đánh giá đề tài của ${state.project.groupName || 'nhóm'}`;
    const body = table.tBodies[0];
    body.replaceChildren();
    criteria.forEach(criterion => {
      const saved = source?.criteria.find(item => item.id === criterion.id);
      const row = el('tr');
      const title = el('th', criterion.title);
      title.scope = 'row';
      const fields = el('td');
      if (readOnly) {
        fields.textContent = criterion.score.toFixed(1);
      } else {
        field(fields, `score-${criterion.id}`, `Điểm ${criterion.title} / 10`, 'number', saved?.score ?? '', { required: true, min: '0', max: '10', step: '0.1', inputMode: 'decimal', placeholder: 'Nhập điểm' });
        fields.firstElementChild.classList.add('visually-hidden');
      }
      const description = criterion.description || state.criteria.find(item => item.id === criterion.id && item.title === criterion.title)?.description;
      row.append(title, el('td', description || 'Chưa có mô tả'), el('td', `${criterion.weight}%`), fields);
      body.append(row);
    });
    body.querySelectorAll('input[type="number"]').forEach(input => stepper?.enhance(input));
    const total = form.querySelector('#total-score');
    total.removeAttribute('for');
    if (!readOnly) total.setAttribute('for', criteria.map(criterion => `teaching-score-${criterion.id}`).join(' '));
    const resultRow = form.querySelector('[data-evaluation-result-row]');
    const result = resultRow.querySelector('[data-evaluation-result]');
    const resultLabel = String(published?.resultLabel || '').trim();
    result.textContent = resultLabel;
    if (resultLabel.normalize().toLocaleLowerCase('vi-VN') === 'đạt yêu cầu') {
      result.classList.add('evaluation-info__status', 'evaluation-info__status--success');
    }

    function updateTotal(score) {
      total.value = score === null ? 'Chưa tính' : score.toFixed(1);
      total.classList.toggle('evaluation-total__value--pending', score === null);
      resultRow.hidden = !resultLabel || editingPublished || score !== published?.score;
    }

    const status = el('p', null, 'evaluation-form__status');
    const publishedAt = published?.publishedAt ? ui.date(published.publishedAt) : published?.evaluatedAt?.split('-').reverse().join('/');
    if (completed) {
      const badge = el('span', published ? 'Đã công bố' : 'Chưa công bố', 'lecturer-evaluation__status');
      badge.classList.toggle('lecturer-evaluation__status--published', Boolean(published));
      status.append(badge);
      if (publishedAt) status.append(el('span', publishedAt));
    } else if (published) {
      status.textContent = publishedAt ? `Đã công bố ngày ${publishedAt}` : 'Đã công bố';
    } else {
      status.hidden = true;
    }
    const comment = form.querySelector('.evaluation-comment');
    const feedback = comment.querySelector('textarea');
    const originalAttachment = published?.attachment ?? null;
    const selectedAttachment = attachmentPicker(form.querySelector('.lecturer-evaluation__attachment'), originalAttachment, readOnly);
    const actions = form.querySelector('.evaluation-form__actions');
    if (readOnly) {
      updateTotal(published.score);
      const readout = el('p', published.feedback, 'lecturer-evaluation__comment');
      readout.translate = false;
      feedback.replaceWith(readout);
      const edit = button('', () => {
        editingPublished = true;
        render(ui.state);
        panel.querySelector('input[name^="score-"], textarea')?.focus();
      });
      edit.className = 'evaluation-form__publish';
      labelAction(edit, 'Sửa kết quả đánh giá', 'edit');
      actions.replaceChildren(status, edit);
      form.addEventListener('submit', event => event.preventDefault());
      return;
    }

    feedback.name = 'feedback';
    feedback.value = source?.feedback || '';
    feedback.maxLength = 2000;
    feedback.required = true;
    const revising = completed && Boolean(published);
    const publishLabel = revising ? 'Công bố lại' : 'Công bố đánh giá';
    const publishButton = el('button', null, 'evaluation-form__publish');
    labelAction(publishButton, publishLabel, 'publish');
    publishButton.type = 'submit';
    publishButton.setAttribute('aria-haspopup', 'dialog');
    actions.replaceChildren(status, publishButton);
    if (revising) {
      const cancel = button('Hủy', () => {
        editingPublished = false;
        ui.dirty = false;
        render(ui.state);
        panel.querySelector('.evaluation-form__publish')?.focus();
      });
      actions.insertBefore(cancel, publishButton);
    }
    const error = el('p', '', 'teaching-error');
    error.setAttribute('role', 'alert');
    error.dataset.teachingError = '';
    error.tabIndex = -1;
    form.prepend(error);

    function input() {
      const values = new FormData(form);
      return {
        scores: Object.fromEntries(criteria.map(item => [item.id, values.get(`score-${item.id}`)])),
        comments: Object.fromEntries((source?.criteria || []).map(item => [item.id, item.comment])),
        feedback: values.get('feedback'),
        resultLabel: source?.resultLabel,
      };
    }
    function preview() {
      const checked = service.validateEvaluation(input(), criteria);
      updateTotal(checked.errors.length ? null : checked.value.score);
    }

    form.addEventListener('input', () => { ui.dirty = true; error.textContent = ''; preview(); });
    form.addEventListener('submit', event => {
      event.preventDefault();
      const values = input();
      const checked = service.validateEvaluation(values, criteria, true);
      if (checked.errors.length) {
        error.textContent = checked.errors.join(' ');
        error.focus();
        return;
      }
      const attachment = selectedAttachment();
      const confirmation = modal(publishLabel, revising ? 'Xác nhận công bố lại' : 'Xác nhận công bố', body => {
        const summary = el('div', null, 'publish-evaluation__summary');
        const project = el('div');
        project.append(el('h3', state.project.title), el('p', state.project.groupName));
        const score = el('dl', null, 'publish-evaluation__score');
        score.append(el('dt', 'Điểm tổng kết'), el('dd', `${checked.value.score.toFixed(1)} / 10`));
        summary.append(project, score);
        body.append(summary);
        if (attachment) {
          const file = el('div', null, 'publish-evaluation__file');
          const fileName = el('p', attachment.name);
          fileName.translate = false;
          file.append(el('h3', 'Tệp đánh giá đính kèm'), fileName);
          body.append(file);
        }
        if (!completed) body.append(el('p', 'Sau khi công bố, đề tài sẽ chuyển sang trạng thái Hoàn thành.', 'publish-evaluation__note'));
      }, async (_, snapshot) => {
        const changed = attachment !== originalAttachment;
        const files = app.services.proposalFiles;
        let staged;
        try {
          if (changed && attachment) {
            try { staged = await files.stage(attachment); }
            catch { throw new Error('Không thể lưu tệp đánh giá. Hãy kiểm tra quyền lưu trữ rồi thử lại.'); }
            if (!confirmation.open) throw new Error('Đã hủy công bố đánh giá.');
          }
          if (changed) values.attachment = staged ?? null;
          service.publish(snapshot.projectId, values, snapshot.revision);
        } catch (failure) {
          if (staged) await files.discard(staged.fileKey).catch(() => {});
          throw failure;
        }
        if (changed && originalAttachment?.fileKey) {
          void files.discard(originalAttachment.fileKey).catch(() => {});
        }
        editingPublished = false;
        ui.dirty = false;
      }, 'Đã công bố đánh giá trên trình duyệt này.', {
        className: 'publish-evaluation-dialog',
        showCancel: false,
        onSuccess: () => successDialog.showModal(),
      });
    });
    preview();
  }

  ui.subscribe(state => {
    if (state && loadedProject === state.projectId && ui.dirty) {
      ui.notify('Đánh giá đang có thay đổi chưa lưu. Nếu dữ liệu ở tab khác thay đổi, hãy tải lại trang sau khi sao chép phần đang nhập.');
      return;
    }
    if (!state || loadedProject !== state.projectId) editingPublished = false;
    render(state);
  });
  document.body.dataset.lecturerReady = 'true';
})();
