(() => {
  const service = globalThis.IE104?.services?.evaluations;
  const panel = document.getElementById('ket-qua-danh-gia');
  const projectId = document.body.dataset.projectId;
  if (!service || !panel || !projectId) return;
  const preview = location.protocol === 'file:';
  const content = panel.querySelector('.evaluation-content');
  if (preview) {
    const notice = document.createElement('p');
    notice.className = 'evaluation-preview-note';
    notice.textContent = 'Đang xem dữ liệu mẫu. Mở website qua localhost để xem kết quả giảng viên đã lưu.';
    content.before(notice);
  }
  const info = panel.querySelector('#evaluation-info-template');
  const failed = panel.querySelector('#evaluation-error-template');
  const published = panel.querySelector('#evaluation-published-template');

  function renderUnpublished(fragment, result) {
    if (result.supervisor) {
      const row = fragment.querySelector('[data-evaluation-supervisor]');
      row.querySelector('dd').textContent = result.supervisor;
      row.hidden = false;
    }
    if (result.projectStatus === 'dang-thuc-hien') {
      fragment.querySelector('.student-evaluation-unpublished__title').textContent = 'Đề tài đang thực hiện.';
    }
  }

  function renderAttachment(section, file) {
    if (!file) {
      section.remove();
      return;
    }
    section.querySelector('.evaluation-attachments__name').textContent = file.name;
    section.querySelector('.evaluation-attachments__file').prepend(globalThis.IE104.ui.workflowIcon('file'));
    if (!file.assetFile) return;

    const button = section.querySelector('.evaluation-attachments__download');
    const link = document.createElement('a');
    link.className = button.className;
    link.href = '../../assets/files/' + encodeURIComponent(file.assetFile);
    link.download = file.name;
    link.append(...button.childNodes);
    button.replaceWith(link);
    section.querySelector('.evaluation-attachment-note').hidden = true;
  }

  function renderPublished(fragment, result) {
    fragment.querySelectorAll('[data-evaluation-unpublished]').forEach(element => { element.hidden = true; });
    fragment.querySelectorAll('[data-evaluation-published]').forEach(element => { element.hidden = false; });
    fragment.querySelector('[data-evaluation-lecturer]').textContent = result.lecturerName;
    const date = fragment.querySelector('[data-evaluation-date]');
    date.dateTime = result.evaluatedAt;
    date.textContent = result.evaluatedAt.split('-').reverse().join('/');

    fragment.append(published.content.cloneNode(true));
    fragment.querySelector('.evaluation-total__value').textContent = result.score.toFixed(1);
    const resultLabel = fragment.querySelector('[data-evaluation-result]');
    resultLabel.textContent = result.resultLabel;
    if (result.resultLabel.trim().normalize().toLocaleLowerCase('vi-VN') === 'đạt yêu cầu') {
      resultLabel.classList.add('evaluation-info__status', 'evaluation-info__status--success');
    }
    const rows = fragment.querySelector('.evaluation-criteria__table tbody');
    rows.replaceChildren(...result.criteria.map(criterion => {
      const row = document.createElement('tr');
      row.dataset.criterionId = criterion.id;
      const title = document.createElement('th');
      title.scope = 'row';
      title.textContent = criterion.title;
      row.append(title);
      for (const text of [criterion.comment, `${criterion.weight}%`, criterion.score.toFixed(1)]) {
        const cell = document.createElement('td');
        cell.textContent = text;
        row.append(cell);
      }
      return row;
    }));
    fragment.querySelector('.student-evaluation-comment').textContent = result.feedback;
    renderAttachment(fragment.querySelector('.evaluation-attachments'), result.attachment);
  }

  function render(retrying = false) {
    content.setAttribute('aria-busy', 'true');
    try {
      const result = service.getResult(projectId, { preview });
      panel.dataset.evaluationState = result.status;
      const fragment = info.content.cloneNode(true);
      fragment.querySelector('[data-evaluation-group]').textContent = result.groupName || 'Chưa đặt tên nhóm';
      if (result.status === 'published') renderPublished(fragment, result);
      else renderUnpublished(fragment, result);
      content.replaceChildren(fragment);
      if (retrying) {
        const title = content.querySelector('h3');
        title.tabIndex = -1;
        title.focus({ preventScroll: true });
      }
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
