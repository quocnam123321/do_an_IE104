(() => {
  const app = globalThis.IE104;
  const ui = app?.ui?.lecturerWorkspace;
  if (!ui) return;
  const { el, field, modal, service } = ui;
  const template = document.getElementById('ket-qua-danh-gia').cloneNode(true);
  const panel = ui.region('evaluation-section', 'ket-qua-danh-gia');
  let form;
  let loadedRevision;
  let loadedProject;
  let current;
  function input() {
    const values = new FormData(form);
    const source = current.draft || current.publication;
    return {
      scores: Object.fromEntries(current.criteria.map(item => [item.id, values.get(`score-${item.id}`)])),
      comments: Object.fromEntries((source?.criteria || []).map(item => [item.id, item.comment])),
      feedback: values.get('feedback'),
      resultLabel: source?.resultLabel,
    };
  }
  function preview() {
    const checked = service.validateEvaluation(input(), current.criteria);
    form.querySelector('output').textContent = checked.errors.length ? 'Chưa tính / 10' : `${checked.value.score.toFixed(1)} / 10`;
  }
  ui.subscribe(state => {
    if (state && loadedProject === state.projectId && ui.dirty) {
      ui.notify('Đánh giá đang có thay đổi chưa lưu. Nếu dữ liệu ở tab khác thay đổi, hãy tải lại trang sau khi sao chép phần đang nhập.');
      return;
    }
    panel.replaceChildren();
    if (!state) return;
    panel.append(...template.cloneNode(true).children);
    form = panel.querySelector('form');
    if (state.readOnly) {
      form.replaceWith(el('p', 'Chưa có dữ liệu đánh giá của đề tài này.'));
      return;
    }
    current = state;
    loadedRevision = state.revision;
    loadedProject = state.projectId;
    const source = state.draft || state.publication;
    const error = el('p', '', 'teaching-error');
    error.setAttribute('role', 'alert');
    error.dataset.teachingError = '';
    error.tabIndex = -1;
    const table = form.querySelector('table');
    table.caption.textContent = `Tiêu chí đánh giá đề tài của ${state.project.groupName || 'nhóm'}`;
    const body = table.tBodies[0];
    body.replaceChildren();
    state.criteria.forEach(criterion => {
      const saved = source?.criteria.find(item => item.id === criterion.id);
      const row = el('tr');
      const title = el('th', criterion.title);
      title.scope = 'row';
      const fields = el('td');
      field(fields, `score-${criterion.id}`, `Điểm ${criterion.title} / 10`, 'number', saved?.score ?? '', { required: true, min: '0', max: '10', step: '0.1', inputMode: 'decimal', placeholder: 'Nhập điểm' });
      fields.firstElementChild.classList.add('visually-hidden');
      row.append(title, el('td', criterion.description || 'Chưa có mô tả'), el('td', `${criterion.weight}%`), fields);
      body.append(row);
    });
    const total = form.querySelector('output');
    total.removeAttribute('title');
    total.setAttribute('for', state.criteria.map(criterion => `teaching-score-${criterion.id}`).join(' '));
    total.setAttribute('aria-live', 'polite');
    const summary = form.querySelector('.evaluation-total');
    if (state.publication) {
      const publishedAt = state.publication.publishedAt ? ui.date(state.publication.publishedAt) : state.publication.evaluatedAt?.split('-').reverse().join('/');
      summary.append(el('p', publishedAt ? `Đã công bố ngày ${publishedAt}` : 'Đã công bố', 'evaluation-total__status'));
    }
    const comment = form.querySelector('.evaluation-comment');
    const feedback = comment.querySelector('textarea');
    feedback.name = 'feedback';
    feedback.value = source?.feedback || '';
    feedback.maxLength = 2000;
    feedback.required = true;
    const actions = form.querySelector('.evaluation-form__actions');
    const publishButton = el('button', 'Công bố đánh giá', 'evaluation-form__publish');
    publishButton.type = 'submit';
    publishButton.setAttribute('aria-haspopup', 'dialog');
    actions.replaceChildren(publishButton);
    form.prepend(error);
    form.addEventListener('input', () => { ui.dirty = true; error.textContent = ''; preview(); });
    form.addEventListener('submit', event => {
      event.preventDefault();
      const values = input();
      const checked = service.validateEvaluation(values, state.criteria, true);
      if (checked.errors.length) {
        error.textContent = checked.errors.join(' ');
        error.focus();
        return;
      }
      const revision = loadedRevision;
      modal('Công bố đánh giá', 'Xác nhận công bố', body => {
        body.append(el('p', `${state.project.title} · ${state.project.groupName}`));
        body.append(el('p', `Điểm tổng kết: ${checked.value.score.toFixed(1)} / 10`));
      }, (_, snapshot) => {
        service.publish(snapshot.projectId, values, revision);
        ui.dirty = false;
      }, 'Đã công bố đánh giá trên trình duyệt này.');
    });
    preview();
  });
  document.body.dataset.lecturerReady = 'true';
})();
