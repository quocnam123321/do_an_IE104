(() => {
  const app = globalThis.IE104;
  const ui = app?.ui?.lecturerWorkspace;
  if (!ui) return;
  const { el, field, button, modal, service } = ui;
  const panel = ui.region('evaluation-section', 'ket-qua-danh-gia');
  let form;
  let loadedRevision;
  let loadedProject;
  let current;
  let publishButton;
  function input() {
    const values = new FormData(form);
    return { scores: Object.fromEntries(current.criteria.map(item => [item.id, values.get(`score-${item.id}`)])), comments: Object.fromEntries(current.criteria.map(item => [item.id, values.get(`comment-${item.id}`)])), feedback: values.get('feedback'), resultLabel: values.get('resultLabel') };
  }
  function preview() {
    const checked = service.validateEvaluation(input(), current.criteria);
    form.querySelector('output').textContent = checked.errors.length ? 'Chưa đủ điểm hợp lệ' : `${checked.value.score.toFixed(1)} / 10`;
    publishButton.disabled = ui.dirty || !current.draft;
  }
  ui.subscribe(state => {
    if (state && loadedProject === state.projectId && ui.dirty) {
      ui.notify('Đánh giá đang có thay đổi chưa lưu. Nếu dữ liệu ở tab khác thay đổi, hãy tải lại trang sau khi sao chép phần đang nhập.');
      return;
    }
    panel.replaceChildren();
    if (!state) return;
    if (state.readOnly) { panel.append(el('p', 'Chưa có dữ liệu đánh giá của đề tài này.', 'teaching-card')); return; }
    current = state;
    loadedRevision = state.revision;
    loadedProject = state.projectId;
    const source = state.draft || state.publication;
    const card = el('section', '', 'teaching-card');
    card.append(el('h2', 'Đánh giá đề tài'), el('p', state.publication ? `Đã công bố: ${state.publication.score.toFixed(1)} / 10 - ${state.publication.resultLabel}` : 'Chưa công bố kết quả.'));
    if (state.draft) card.append(el('p', `Bản nháp lưu lúc ${ui.date(state.draft.savedAt)}. Lưu nháp không thay đổi kết quả SV đang xem.`));
    form = el('form');
    form.id = 'teaching-evaluation-form';
    const error = el('p', '', 'teaching-error');
    error.setAttribute('role', 'alert');
    error.dataset.teachingError = '';
    error.tabIndex = -1;
    const tableWrap = el('div', '', 'teaching-table-wrap');
    const table = el('table', '', 'teaching-table');
    table.append(el('caption', 'Tiêu chí đánh giá - điểm theo thang 10'));
    const head = el('thead');
    const headings = el('tr');
    ['Tiêu chí', 'Trọng số', 'Điểm và nhận xét'].forEach(text => { const th = el('th', text); th.scope = 'col'; headings.append(th); });
    head.append(headings);
    const body = el('tbody');
    state.criteria.forEach(criterion => {
      const saved = source?.criteria.find(item => item.id === criterion.id);
      const row = el('tr');
      const title = el('th', criterion.title);
      title.scope = 'row';
      const fields = el('td');
      field(fields, `score-${criterion.id}`, `Điểm ${criterion.title}`, 'number', saved?.score ?? '', { required: true, min: '0', max: '10', step: '0.1' });
      field(fields, `comment-${criterion.id}`, `Nhận xét ${criterion.title}`, 'textarea', saved?.comment || '', { rows: 2, maxLength: 2000 });
      row.append(title, el('td', `${criterion.weight}%`), fields);
      body.append(row);
    });
    table.append(head, body);
    tableWrap.append(table);
    const total = el('output');
    total.id = 'teaching-total-score';
    total.setAttribute('aria-live', 'polite');
    const fields = el('div', '', 'teaching-fields');
    fields.append(el('p', 'Điểm tổng kết'), total);
    field(fields, 'resultLabel', 'Kết quả công bố', 'text', source?.resultLabel || '', { maxLength: 100, placeholder: 'Ví dụ: Đạt yêu cầu' });
    field(fields, 'feedback', 'Nhận xét chung của giảng viên', 'textarea', source?.feedback || '', { maxLength: 2000, rows: 5 });
    const actions = el('div', '', 'teaching-actions');
    const save = el('button', 'Lưu bản nháp', 'topic-dialog__btn topic-dialog__btn--primary');
    save.type = 'submit';
    publishButton = button('Công bố kết quả', () => modal('Công bố kết quả đánh giá', 'Xác nhận công bố', dialogBody => {
      dialogBody.append(el('p', `${state.project.title} - ${state.project.groupName}`), el('p', `${state.draft.score.toFixed(1)} / 10 - ${state.draft.resultLabel || 'Chưa nhập kết quả'}`), el('p', 'Kết quả công bố sẽ thay thế kết quả SV đang xem.'));
    }, (_, snapshot) => service.publish(snapshot.projectId, snapshot.revision)), !state.draft);
    actions.append(save, publishButton, button('Bỏ thay đổi chưa lưu', () => { if (!ui.dirty || window.confirm('Bỏ phần đánh giá chưa lưu?')) { ui.dirty = false; ui.refresh(); } }));
    form.append(error, tableWrap, fields, actions);
    form.addEventListener('input', () => { ui.dirty = true; preview(); });
    form.addEventListener('submit', event => {
      event.preventDefault();
      const snapshot = { projectId: loadedProject, revision: loadedRevision };
      try {
        service.saveDraft(snapshot.projectId, input(), snapshot.revision);
        ui.dirty = false;
        ui.refresh();
        ui.notify('Đã lưu bản nháp trên trình duyệt. SV chỉ thấy kết quả đã công bố.');
      } catch (failure) { error.textContent = failure.message; error.focus(); }
    });
    card.append(form);
    panel.append(card);
    preview();
  });
  document.body.dataset.lecturerReady = 'true';
})();
