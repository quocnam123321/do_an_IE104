(() => {
  const service = globalThis.IE104?.services?.evaluations;
  const panel = document.getElementById('ket-qua-danh-gia');
  const projectId = document.body.dataset.projectId;
  if (!service || !panel || !projectId) return;
  const content = panel.querySelector('.evaluation-content');
  const unpublished = panel.querySelector('#evaluation-unpublished-template');
  const failed = panel.querySelector('#evaluation-error-template');
  const published = document.createElement('template');
  content.querySelectorAll(':scope > section').forEach(section => {
    const copy = section.cloneNode(true);
    copy.hidden = false;
    published.content.append(copy);
  });

  function render(retrying = false) {
    content.setAttribute('aria-busy', 'true');
    try {
      const result = service.getResult(projectId);
      panel.dataset.evaluationState = result.status;
      if (result.status === 'unpublished') {
        content.replaceChildren(unpublished.content.cloneNode(true));
        if (retrying) { const title = content.querySelector('h2'); title.tabIndex = -1; title.focus({ preventScroll: true }); }
        return;
      }
      const fragment = published.content.cloneNode(true);
      fragment.querySelector('.evaluation-summary__score').textContent = `${result.score.toFixed(1)} / 10`;
      fragment.querySelector('.evaluation-summary__result').textContent = result.resultLabel;
      const table = fragment.querySelector('.evaluation-details__table');
      table.querySelector('caption').textContent = 'Chi tiết tiêu chí đánh giá đề tài';
      const rows = table.querySelector('tbody');
      rows.replaceChildren(...result.criteria.map(criterion => {
        const row = document.createElement('tr');
        row.dataset.criterionId = criterion.id;
        [criterion.title, `${criterion.weight}%`, criterion.score.toFixed(1), criterion.comment].forEach((text, index) => {
          const cell = document.createElement(index === 0 ? 'th' : 'td');
          if (index === 0) cell.scope = 'row';
          cell.textContent = text;
          row.append(cell);
        });
        return row;
      }));
      const fields = fragment.querySelectorAll('.lecturer-feedback__metadata dd');
      fields[0].textContent = result.lecturerName;
      fields[1].textContent = result.evaluatedAt.split('-').reverse().join('/');
      fragment.querySelector('.lecturer-feedback__content p').textContent = result.feedback;
      fragment.querySelector('.evaluation-attachments__name').textContent = result.attachment?.name || 'Không có tệp đánh giá đính kèm.';
      fragment.querySelector('.evaluation-attachments__download').disabled = true;
      content.replaceChildren(fragment);
      if (retrying) { const title = content.querySelector('h2'); title.tabIndex = -1; title.focus({ preventScroll: true }); }
    } catch (failure) {
      panel.dataset.evaluationState = 'error';
      const fragment = failed.content.cloneNode(true);
      fragment.querySelector('p').textContent = failure.message;
      const retry = document.createElement('button');
      retry.type = 'button';
      retry.textContent = 'Thử lại';
      retry.addEventListener('click', () => render(true));
      fragment.querySelector('a').replaceWith(retry);
      content.replaceChildren(fragment);
      if (retrying) retry.focus({ preventScroll: true });
    } finally {
      content.setAttribute('aria-busy', 'false');
      panel.dataset.evaluationReady = 'true';
    }
  }

  window.addEventListener('pageshow', () => render());
  window.addEventListener('storage', event => { if ([globalThis.IE104.storage.teachingKey, null].includes(event.key)) render(); });
  render();
})();
