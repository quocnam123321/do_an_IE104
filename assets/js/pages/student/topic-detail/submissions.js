(() => {
  const app = globalThis.IE104;
  const host = document.querySelector('[data-student-submissions]');
  const service = app?.services?.studentSubmissions;
  if (!host || !service) return;
  const isLivePage = host.dataset.studentSubmissions === 'live';
  const requirementTemplate = document.getElementById('student-requirement-dialog-template');
  const fileTemplate = document.getElementById('student-submission-file-template');
  const uploadDialog = document.getElementById('student-upload-dialog');
  const successDialog = document.getElementById('student-upload-success');
  const uploads = new Map();
  let lastSavedId;
  let readVersion = 0;
  const format = new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh',
  });
  const sizeFormat = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 });
  const samplePdfSize = 30564;

  const deadlineLabels = {
    danger: 'Quá hạn',
    late: 'Nộp sau hạn',
    success: 'Đúng hạn',
  };

  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  }

  function time(value) {
    const node = element('time', format.format(new Date(value)));
    node.dateTime = value;
    return node;
  }

  function deadlineBadge(variant) {
    return element('span', deadlineLabels[variant], 'submission-board__badge submission-board__badge--' + variant);
  }

  function boardIcon(kind) {
    const icon = app.ui.workflowIcon(kind);
    icon.setAttribute('class', 'submission-board__icon');
    return icon;
  }

  function demoBundle(card, firstName) {
    if (!card?.dataset.extraFiles) return null;
    return {
      names: [firstName, ...card.dataset.extraFiles.split('|')],
      sizes: [samplePdfSize, ...card.dataset.extraFileSizes.split('|').map(Number)],
      download: card.querySelector('.submission-board-card__download'),
    };
  }

  function downloadRow(name, size) {
    const row = fileTemplate.content.querySelector('.submission-dialog__file').cloneNode(true);
    const filename = row.querySelector('[data-submission-filename]');
    filename.textContent = filename.title = name;
    if (size !== undefined) {
      const label = row.querySelector('.submission-dialog__file-size');
      label.textContent = size < 1024 ? size + ' B' : size < 1024 ** 2
        ? sizeFormat.format(size / 1024) + ' KB' : sizeFormat.format(size / 1024 ** 2) + ' MB';
      label.hidden = false;
    }
    row.querySelector('a').setAttribute('aria-label', 'Tải xuống ' + name);
    return row;
  }

  function downloadButton(link) {
    const button = element('button', undefined, link.className);
    button.type = 'button';
    if (link.hasAttribute('aria-label')) button.setAttribute('aria-label', link.getAttribute('aria-label'));
    button.append(...link.childNodes);
    return button;
  }

  function archiveName(requirementId) {
    return 'bai-nop-' + requirementId.replace(/[^\w-]/g, '-') + '.zip';
  }

  function bindUploadDownload(button, error, files, fileName) {
    button.addEventListener('click', async () => {
      button.disabled = true;
      error.hidden = true;
      try {
        const blob = files.length === 1 ? files[0] : await app.ui.createSubmissionZip(files);
        app.ui.downloadFile({ blob, fileName });
      } catch (failure) {
        error.textContent = failure.message || 'Chưa tải được tệp. Hãy thử lại.';
        error.hidden = false;
      } finally {
        button.disabled = false;
      }
    });
  }

  function renderAttachments(attachment, fileName, { sample, bundle, record }) {
    const heading = attachment.querySelector('.submission-dialog__attachment-heading');
    const list = attachment.querySelector('.submission-dialog__files');
    const error = attachment.querySelector('.submission-upload__error');
    let downloadAll;
    if (bundle) {
      const folder = bundle.download.href.replace(/\.zip$/, '/');
      bundle.names.forEach((name, index) => {
        const row = downloadRow(name, bundle.sizes[index]);
        const link = row.querySelector('a');
        if (index > 0) link.href = folder + encodeURIComponent(name);
        link.download = name;
        list.append(row);
      });
      downloadAll = fileTemplate.content.querySelector('a').cloneNode(true);
      downloadAll.href = bundle.download.href;
      downloadAll.download = bundle.download.download;
    } else if (record?.files?.length) {
      const { files, requirementId } = record;
      const names = files.length > 1 ? app.ui.submissionZipNames(files) : [files[0].name];
      files.forEach((file, index) => {
        const name = names[index];
        const row = downloadRow(name, file.size);
        const link = row.querySelector('a');
        const button = downloadButton(link);
        bindUploadDownload(button, error, [file], name);
        link.replaceWith(button);
        list.append(row);
      });
      if (files.length > 1) {
        downloadAll = downloadButton(fileTemplate.content.querySelector('a').cloneNode(true));
        bindUploadDownload(downloadAll, error, files, archiveName(requirementId));
      }
    } else if (fileName) {
      const row = downloadRow(fileName, sample ? samplePdfSize : undefined);
      if (!sample) row.querySelector('a').remove();
      list.append(row);
    } else {
      list.replaceWith(element('p', 'Chưa có thông tin tệp đã nộp.'));
    }
    if (list.children.length > 4) list.tabIndex = 0;
    if (downloadAll) {
      downloadAll.className = 'submission-dialog__download-all';
      downloadAll.querySelector('span').textContent = 'Tải tất cả';
      heading.append(downloadAll);
    }
  }

  function appendSubmittedDetails(body, submittedTime, fileName, options = {}) {
    for (const node of body.querySelectorAll('.submission-dialog__submitted-time, .submission-dialog__attachment')) node.remove();
    const label = element('dt', 'Ngày giờ nộp', 'submission-dialog__submitted-time');
    const date = element('dd', undefined, 'submission-dialog__submitted-time');
    date.append(submittedTime || 'Chưa có thông tin ngày giờ nộp.');
    body.querySelector('dl').append(label, date);

    const attachment = fileTemplate.content.firstElementChild.cloneNode(true);
    renderAttachments(attachment, fileName, options);
    body.append(attachment);
  }

  const sharedUpload = app.ui.studentUpload.mount(uploadDialog, uploadSaved);

  function uploadButton(item) {
    const button = element('button', item.submitted ? 'Cập nhật bài nộp' : 'Nộp bài', 'submission-dialog__submit');
    button.type = 'button';
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-controls', uploadDialog.id);
    button.addEventListener('click', () => sharedUpload.open(item, {
      expectedSavedAt: item.localUpload?.submittedAt,
      trigger: button,
    }));
    return button;
  }

  function requirementCard(item, badge, status) {
    const card = element('article', undefined, 'requirement-board-card');
    if (item.id) card.dataset.recordId = item.id;
    const open = element('button', undefined, 'requirement-board-card__open');
    open.type = 'button';
    open.setAttribute('aria-haspopup', 'dialog');
    const heading = element('span', undefined, 'requirement-board-card__header');
    heading.append(element('span', item.title, 'requirement-board-card__title'));
    if (badge) heading.append(deadlineBadge(badge));
    const due = element('span', undefined, 'requirement-board-card__deadline');
    due.append(element('span', 'Hạn nộp:', 'visually-hidden'), item.deadline.cloneNode(true));
    open.append(heading, due);
    if (status) open.append(element('span', status, 'student-submission-status'));

    const dialog = requirementTemplate.content.firstElementChild.cloneNode(true);
    dialog.querySelector('h2').textContent = item.title;
    dialog.setAttribute('aria-label', item.title);
    dialog.querySelector('dd').append(item.deadline);
    dialog.querySelector('.student-submission-content').textContent = item.content || 'Chưa có nội dung yêu cầu.';
    if (item.submitted) {
      const latest = item.latestSubmission;
      appendSubmittedDetails(dialog.querySelector('.submission-dialog__body'),
        latest?.submittedAt ? time(latest.submittedAt) : null, latest?.fileName, { record: latest });
    }
    if (item.canUpload) {
      const footer = element('footer');
      footer.append(uploadButton(item));
      dialog.append(footer);
    }
    open.addEventListener('click', () => dialog.showModal());
    dialog.querySelector('.submission-dialog__close').addEventListener('click', () => dialog.close());
    card.append(open, dialog);
    return card;
  }

  function prepareSampleRequirements() {
    const projectId = document.body.dataset.projectId;
    const canUpload = app.services.projectTeams.getState(projectId, { preview: true }).project.status === 'dang-thuc-hien';
    for (const dialog of host.querySelectorAll('.submission-requirement-dialog[data-submission-card]')) {
      const card = document.getElementById(dialog.dataset.submissionCard);
      const submittedTime = card?.querySelector('time')?.cloneNode(true);
      const fileName = card?.querySelector('.submission-board-card__filename')?.textContent.trim();
      appendSubmittedDetails(dialog.querySelector('.submission-dialog__body'), submittedTime, fileName,
        { sample: true, bundle: demoBundle(card, fileName) });
    }
    for (const card of host.querySelectorAll('.submissions [data-extra-files]')) {
      const filename = card.querySelector('.submission-board-card__filename');
      app.ui.submissionFileList.attach(filename.parentElement, demoBundle(card, filename.textContent.trim()).names);
    }
    for (const dialog of host.querySelectorAll('dialog[data-upload-requirement]')) {
      const id = dialog.dataset.uploadRequirement;
      const details = document.getElementById(id.replace('requirement-', 'submission-requirements-'));
      const title = details.querySelector('h2').textContent.trim();
      const sampleFiles = [...details.querySelectorAll('.submission-dialog__file a[download]')].map(link => ({
        url: link.href,
        name: link.closest('.submission-dialog__file').querySelector('[data-submission-filename]').textContent,
      }));
      const editor = app.ui.studentUpload.mount(dialog, uploadSaved);
      const action = details.querySelector('.submission-dialog__submit');
      action.removeAttribute('command');
      action.removeAttribute('commandfor');
      action.disabled = !canUpload;
      action.addEventListener('click', () => {
        const latestSubmission = uploads.get(id);
        editor.open({ id, title, submitted: Boolean(latestSubmission) || details.hasAttribute('data-submission-card'), latestSubmission }, {
          expectedSavedAt: latestSubmission?.submittedAt,
          sampleFiles,
          trigger: action,
        });
      });
    }
    for (const card of host.querySelectorAll('.requirements .submission-board-sample-card')) {
      const replacement = requirementCard({
        id: card.id,
        title: card.querySelector('.requirement-board-card__title').textContent.trim(),
        deadline: card.querySelector('time').cloneNode(true),
        submitted: Boolean(card.closest('.submission-column--info')),
        canUpload,
      });
      replacement.id = card.id;
      card.replaceWith(replacement);
    }
  }

  function localSubmissionCard(record, deadline) {
    const { files, title, submittedAt } = record;
    const [first] = files;
    const names = files.length > 1 ? app.ui.submissionZipNames(files) : [first.name];
    const card = element('article', undefined, 'submission-board-card submission-board-sample-card');
    card.dataset.recordId = 'upload:' + record.requirementId;
    const header = element('header', undefined, 'submission-board-card__header');
    header.append(element('h5', title, 'submission-board-card__title'),
      deadlineBadge(Date.parse(submittedAt) > deadline ? 'late' : 'success'));

    const body = element('div', undefined, 'submission-board-card__body');
    const details = element('div', undefined, 'submission-board-card__details');
    const fileLine = element('p', undefined, 'submission-board-card__meta');
    const name = element('span', names[0], 'submission-board-card__filename');
    name.title = names[0];
    fileLine.append(boardIcon('file'), name);
    const dateLine = element('p', undefined, 'submission-board-card__meta');
    dateLine.append(boardIcon('calendar'), element('span', 'Ngày nộp:', 'visually-hidden'), time(submittedAt));
    details.append(fileLine, dateLine);
    app.ui.submissionFileList.attach(fileLine, names);

    const actions = element('div', undefined, 'submission-board-card__actions');
    const download = element('button', undefined, 'submission-board-card__download');
    download.type = 'button';
    const icon = fileTemplate.content.querySelector('a svg').cloneNode(true);
    download.append(icon, element('span', 'Tải xuống'));
    const error = element('p', undefined, 'submission-upload__error');
    error.setAttribute('role', 'alert');
    error.hidden = true;
    bindUploadDownload(download, error, files, files.length === 1 ? first.name : archiveName(record.requirementId));
    actions.append(download);
    body.append(details, actions);

    card.append(header, body, error, element('p', 'Đã lưu trên trình duyệt', 'student-submission-status'));
    if (record.feedback) {
      const feedback = element('details');
      feedback.append(element('summary', 'Xem phản hồi'), element('p', record.feedback, 'student-submission-content'));
      card.append(feedback);
    }
    if (record.notes) {
      const notes = element('details');
      notes.append(element('summary', 'Ghi chú cho giảng viên'),
        element('p', record.notes, 'student-submission-content'));
      card.append(notes);
    }
    return card;
  }

  function sampleCardDeadline(card) {
    return Date.parse(card.querySelector('.requirement-board-card__deadline time').dateTime + '+07:00');
  }

  function renderSampleUploads() {
    if (!uploads.size) return;
    const submittedColumn = host.querySelector('.requirements .submission-column--info');
    const pendingColumn = host.querySelector('.requirements .submission-column--neutral');
    const waitingColumn = host.querySelector('.submissions .submission-column--warning');
    const reviewedColumn = host.querySelector('.submissions .submission-column--success');
    const waiting = waitingColumn.querySelector('.submission-column__list');
    for (const row of waiting.querySelectorAll('[data-local-upload]')) row.remove();
    for (const [id, record] of uploads) {
      const card = document.getElementById(id);
      if (!card || !host.contains(card)) continue;
      const trigger = card.querySelector('.requirement-board-card__open');
      const dialog = document.getElementById(trigger.getAttribute('commandfor')) || card.querySelector('dialog');
      const deadline = sampleCardDeadline(card);
      if (dialog.dataset.submissionCard) document.getElementById(dialog.dataset.submissionCard)?.closest('li')?.setAttribute('hidden', '');
      if (dialog.dataset.localUploadAt !== record.submittedAt) {
        appendSubmittedDetails(dialog.querySelector('.submission-dialog__body'), time(record.submittedAt), null, { record });
        dialog.dataset.localUploadAt = record.submittedAt;
        const action = dialog.querySelector('.submission-dialog__submit');
        if (action) action.textContent = 'Cập nhật bài nộp';
        const oldBadge = trigger.querySelector('.submission-board__badge');
        if (oldBadge?.id) {
          const describedBy = trigger.getAttribute('aria-describedby').split(' ').filter(value => value !== oldBadge.id);
          trigger.setAttribute('aria-describedby', describedBy.join(' '));
        }
        oldBadge?.remove();
        card.classList.remove('requirement-board-card--overdue');
        if (Date.parse(record.submittedAt) > deadline) {
          trigger.querySelector('.requirement-board-card__header').append(deadlineBadge('late'));
        }
        if (pendingColumn.contains(card)) submittedColumn.querySelector('.submission-column__list').prepend(card.closest('li'));
      }
      const row = element('li');
      row.dataset.localUpload = id;
      row.append(localSubmissionCard(record, deadline));
      waiting.prepend(row);
    }
    for (const column of [pendingColumn, submittedColumn, waitingColumn, reviewedColumn]) {
      const size = [...column.querySelectorAll('.requirement-board-card, .submission-board-card')]
        .filter(card => !card.closest('li[hidden]')).length;
      column.querySelector('.task-column__count').textContent = '(' + size + ')';
    }
  }

  function uploadSaved(record, editing) {
    readVersion += 1;
    uploads.set(record.requirementId, record);
    lastSavedId = record.requirementId;
    render();
    successDialog.querySelector('h2').textContent = editing ? 'Đã lưu thay đổi' : 'Nộp bài thành công';
    successDialog.showModal();
  }

  successDialog.addEventListener('close', () => {
    const card = [...host.querySelectorAll('.requirement-board-card')]
      .find(node => (node.dataset.recordId || node.id) === lastSavedId);
    (card?.querySelector('.requirement-board-card__open') || host.querySelector('.task-board'))?.focus();
  });

  function detailCard(id, title, status, date, dateLabel, content, badge) {
    const details = element('details', undefined, 'submission-board-card student-submission-detail');
    details.dataset.recordId = id;
    const summary = element('summary');
    const heading = element('span', undefined, 'student-submission-heading');
    heading.append(element('strong', title, 'submission-board-card__title'));
    if (badge) heading.append(deadlineBadge(badge));
    summary.append(heading);
    if (status) summary.append(element('span', status, 'student-submission-status'));
    const line = element('p', dateLabel + ' ');
    line.append(time(date));
    details.append(summary, line, ...content);
    return details;
  }

  function board(title, className, columns, view) {
    const section = element('section', undefined, className);
    const heading = element('h3', title, className + '__title');
    const wrapper = element('div', undefined, 'task-board submission-board');
    wrapper.tabIndex = 0;
    wrapper.setAttribute('role', 'region');
    wrapper.setAttribute('aria-label', title);
    const grid = element('div', undefined, 'task-board__columns submission-board__columns submission-board__columns--' + (className === 'requirements' ? 'requirements' : 'files'));
    columns.forEach(({ label, variant, items }, index) => {
      const column = element('section', undefined, 'task-column submission-column submission-column--' + variant);
      const labelId = 'student-' + className + '-' + index;
      const columnHeading = element('h4', label + ' (' + items.length + ')', 'task-column__title');
      columnHeading.id = labelId;
      const viewport = element('div', undefined, 'submission-column__viewport');
      viewport.tabIndex = 0;
      viewport.setAttribute('role', 'region');
      viewport.setAttribute('aria-labelledby', labelId);
      const list = element('ul', undefined, 'task-column__list submission-column__list');
      if (items.length) {
        items.forEach(item => {
          const row = element('li');
          row.append(view(item));
          list.append(row);
        });
      } else {
        list.append(element('li', 'Chưa có dữ liệu.'));
      }
      viewport.append(list);
      column.append(columnHeading, viewport);
      grid.append(column);
    });
    wrapper.append(grid);
    section.append(heading, wrapper);
    return section;
  }

  function render() {
    const projectId = document.body.dataset.projectId;
    if (!projectId) return;
    const open = new Set([...host.querySelectorAll('details[open][data-record-id]')].map(node => node.dataset.recordId));
    const active = host.contains(document.activeElement) ? document.activeElement : null;
    const focused = active?.closest('[data-record-id]')?.dataset.recordId;
    try {
      const state = service.forStudent(projectId);
      if (!isLivePage && !state.hasRecord) {
        if (host.firstChild !== fallback[0]) host.replaceChildren(...fallback);
        renderSampleUploads();
        return;
      }
      const notice = element('p', state.submissionsLocked
        ? 'Giảng viên đã khóa nhận bài cho đề tài này.'
        : 'Yêu cầu được cập nhật theo dữ liệu giảng viên lưu trên trình duyệt.', 'student-submission-notice');
      const deadlines = new Map(state.requirements.map(item => [item.id, Date.parse(item.deadline)]));
      const requirementsWithUploads = state.requirements.map(item => {
        const record = uploads.get(item.id);
        if (!record) return item;
        if (Date.parse(record.submittedAt) < Date.parse(item.latestSubmission?.submittedAt)) return { ...item, localUpload: record };
        return { ...item, submitted: true, latestSubmission: record, localUpload: record,
          late: Date.parse(record.submittedAt) > deadlines.get(item.id) };
      });
      const requirements = board('Yêu cầu bài nộp', 'requirements', [
        { label: 'Chưa nộp', variant: 'neutral', items: requirementsWithUploads.filter(item => !item.submitted) },
        { label: 'Đã nộp', variant: 'info', items: requirementsWithUploads.filter(item => item.submitted) },
      ], item => {
        const overdue = !item.submitted && !item.locked && item.overdue;
        const badge = overdue ? 'danger' : item.late ? 'late' : null;
        const status = overdue ? null : item.submitted ? 'Đã nộp' :
          item.locked ? 'Đã khóa nhận bài' : state.completed ? 'Đề tài đã hoàn thành' : 'Chưa nộp';
        return requirementCard({ ...item, deadline: time(item.deadline), canUpload: !item.locked && state.canUpload }, badge, status);
      });
      const local = [...uploads.values()].filter(record => deadlines.has(record.requirementId)).map(record => ({ ...record, feedback: state.submissions.find(item => item.id === `SV-UP-${record.requirementId}` && item.submittedAt === record.submittedAt)?.feedback || '' }));
      const remote = state.submissions.filter(item => !local.some(record => item.id === `SV-UP-${record.requirementId}` && item.submittedAt === record.submittedAt));
      const submissions = board('Bài nộp của nhóm', 'submissions', [
        { label: 'Chờ phản hồi', variant: 'warning', items: [...local.filter(item => !item.feedback), ...remote.filter(item => !item.feedback)] },
        { label: 'Đã phản hồi', variant: 'success', items: [...local.filter(item => item.feedback), ...remote.filter(item => item.feedback)] },
      ], item => item.files ? localSubmissionCard(item, deadlines.get(item.requirementId)) :
        detailCard(item.id, item.title, item.feedback ? 'Đã phản hồi' : 'Chờ phản hồi', item.submittedAt, 'Thời điểm nộp:', [
        element('p', item.fileName || 'Chưa có tên tệp.'),
        element('p', item.feedback || 'Chưa có phản hồi của giảng viên.', 'student-submission-content'),
      ], item.late === null ? null : item.late ? 'late' : 'success'));
      notice.hidden = Boolean(app.data.studentUITCatalog?.myIds.some(id => app.data.studentUITCatalog.projectId(id) === document.body.dataset.projectId));
      host.replaceChildren(notice, requirements, submissions);
      for (const card of host.querySelectorAll('[data-record-id]')) {
        if (card.matches('details')) card.open = open.has(card.dataset.recordId);
        if (card.dataset.recordId === focused) {
          card.querySelector('summary, .requirement-board-card__open, .submission-board-card__download')?.focus({ preventScroll: true });
        }
      }
      if (active && !host.contains(document.activeElement)) host.querySelector('.task-board').focus({ preventScroll: true });
    } catch (failure) {
      const error = element('p', failure.message, 'student-submission-notice');
      error.setAttribute('role', 'alert');
      host.replaceChildren(error);
    }
  }

  if (!isLivePage) prepareSampleRequirements();
  if (!isLivePage && location.protocol === 'file:') return;
  const fallback = [...host.childNodes];
  window.addEventListener('pageshow', async () => {
    render();
    const version = ++readVersion;
    try {
      const records = await service.readUploads(document.body.dataset.projectId);
      if (version !== readVersion || !records.length) return;
      for (const record of records) uploads.set(record.requirementId, record);
      render();
    } catch {
      // Keep the board available even when browser file storage cannot be opened.
    }
  });
  window.addEventListener('storage', event => {
    const { teachingKey, teamKey, proposalKey, registrationKey } = app.storage;
    if ([teachingKey, teamKey, proposalKey, registrationKey, null].includes(event.key)) render();
  });
  // The approved-project renderer sets the project ID before this deferred script.
  render();
})();
