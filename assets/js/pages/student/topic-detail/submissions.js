(() => {
  const app = globalThis.IE104;
  const host = document.querySelector('[data-student-submissions]');
  const service = app?.services?.studentSubmissions;
  if (!host || !service) return;
  const isLivePage = host.dataset.studentSubmissions === 'live';
  const sampleData = app.data.studentWebSubmissions;
  const isSharedSample = !isLivePage && sampleData?.projectId === document.body.dataset.projectId;
  const requirementTemplate = document.getElementById('student-requirement-dialog-template');
  const fileTemplate = document.getElementById('student-submission-file-template');
  const uploadDialog = document.getElementById('student-upload-dialog');
  const successDialog = document.getElementById('student-upload-success');
  const feedbackDialog = document.getElementById('student-feedback-dialog');
  const uploads = new Map();
  let feedbackTrigger;
  let lastSavedId;
  let readVersion = 0;
  const format = new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    hourCycle: 'h23', timeZone: 'Asia/Ho_Chi_Minh',
  });

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

  function time(value, forFeedback = false) {
    const parts = Object.fromEntries(format.formatToParts(new Date(value)).map(part => [part.type, part.value]));
    const date = `${parts.day}/${parts.month}/${parts.year}`;
    const clock = `${parts.hour}:${parts.minute}`;
    const node = element('time', forFeedback ? `${clock} ngày ${date}` : `${date} · ${clock}`);
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
      download: card.querySelector('.submission-board-card__download'),
    };
  }

  function sampleBundle(submission) {
    if (!submission?.id) return null;
    const attachment = app.data.studentWebSubmissions?.attachment(document.body.dataset.projectId, submission);
    if (!attachment) return null;
    const download = fileTemplate.content.querySelector('a').cloneNode(true);
    download.href = '../../assets/files/' + attachment.path;
    download.download = attachment.name;
    return { ...attachment, download };
  }

  function downloadRow(name) {
    const row = fileTemplate.content.querySelector('.submission-dialog__file').cloneNode(true);
    const filename = row.querySelector('[data-submission-filename]');
    filename.textContent = filename.title = name;
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
        const row = downloadRow(name);
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
        const row = downloadRow(name);
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
      const row = downloadRow(fileName);
      const link = row.querySelector('a');
      if (sample) {
        if (sample.download) link.href = sample.download.href;
        link.download = fileName;
      } else {
        const button = downloadButton(link);
        button.disabled = true;
        button.title = 'Chưa có nội dung tệp của lần nộp này.';
        link.replaceWith(button);
        error.textContent = button.title;
        error.hidden = false;
      }
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
    button.disabled = !item.canUpload;
    if (button.disabled) return button;
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-controls', uploadDialog.id);
    button.addEventListener('click', () => {
      const sample = sampleBundle(item.latestSubmission);
      const sampleFiles = sample?.names.map((name, index) => ({
        name,
        url: index
          ? sample.download.href.replace(/\.zip$/, '/') + encodeURIComponent(name)
          : new URL('../../assets/files/bai-nop-minh-hoa.pdf', location.href).href,
      }));
      sharedUpload.open(item, { expectedSavedAt: item.localUpload?.submittedAt, sampleFiles, trigger: button });
    });
    return button;
  }

  function requirementCard(item, badge, status) {
    const card = element('article', undefined, 'requirement-board-card');
    if (item.id) card.id = card.dataset.recordId = item.id;
    const open = element('button', undefined, 'requirement-board-card__open');
    open.type = 'button';
    open.setAttribute('aria-haspopup', 'dialog');
    const heading = element('span', undefined, 'requirement-board-card__header');
    heading.append(element('span', item.title, 'requirement-board-card__title'));
    if (badge) heading.append(deadlineBadge(badge));
    const due = element('span', undefined, 'requirement-board-card__deadline');
    card.classList.toggle('requirement-board-card--overdue', badge === 'danger');
    due.append(boardIcon('calendar'), element('span', 'Hạn nộp:', 'visually-hidden'), item.deadline.cloneNode(true));
    open.append(heading, due);

    const dialog = requirementTemplate.content.firstElementChild.cloneNode(true);
    const details = dialog.querySelector('.submission-dialog__body');
    dialog.querySelector('h2').textContent = item.title;
    dialog.setAttribute('aria-label', item.title);
    if (status) details.prepend(element('p', status));
    details.querySelector('dd').append(item.deadline);
    details.querySelector('.student-submission-content').textContent = item.content || 'Chưa có nội dung yêu cầu.';
    if (item.submitted) {
      const latest = item.latestSubmission;
      const sample = sampleBundle(latest);
      appendSubmittedDetails(details,
        latest?.submittedAt ? time(latest.submittedAt) : null, latest?.fileName, {
          sample, bundle: sample?.names.length > 1 ? sample : null, record: latest,
        });
    }
    if (item.canUpload || item.projectCompleted) {
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
    const { status } = app.services.projectTeams.getState(projectId, { preview: true }).project;
    const canUpload = status === 'dang-thuc-hien';
    const projectCompleted = status === 'hoan-thanh';
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
        projectCompleted,
      });
      replacement.id = card.id;
      card.replaceWith(replacement);
    }
  }

  function submissionFileCard(record, deadline, sample = null) {
    const { files, title, submittedAt } = record;
    const names = sample?.names ?? (files?.length > 1 ? app.ui.submissionZipNames(files) : [files?.[0]?.name ?? record.fileName]);
    const card = element('article', undefined, 'submission-board-card submission-board-sample-card');
    card.dataset.recordId = record.id ?? 'upload:' + record.requirementId;
    if (record.requirementId) card.dataset.requirementId = record.requirementId;
    const header = element('header', undefined, 'submission-board-card__header');
    header.append(element('h5', title, 'submission-board-card__title'));
    if (Number.isFinite(deadline)) header.append(deadlineBadge(Date.parse(submittedAt) > deadline ? 'late' : 'success'));

    const body = element('div', undefined, 'submission-board-card__body');
    const details = element('div', undefined, 'submission-board-card__details');
    const fileLine = element('p', undefined, 'submission-board-card__meta');
    const name = element('span', names[0] || 'Chưa có tên tệp.', 'submission-board-card__filename');
    name.title = name.textContent;
    fileLine.append(boardIcon('file'), name);
    const dateLine = element('p', undefined, 'submission-board-card__meta');
    dateLine.append(boardIcon('calendar'), element('span', 'Ngày nộp:', 'visually-hidden'), time(submittedAt));
    details.append(fileLine, dateLine);
    if (names.length > 1) app.ui.submissionFileList.attach(fileLine, names);

    const actions = element('div', undefined, 'submission-board-card__actions');
    const link = sample?.download ?? fileTemplate.content.querySelector('a').cloneNode(true);
    const download = sample ? link : downloadButton(link);
    download.className = 'submission-board-card__download';
    download.setAttribute('aria-label', 'Tải xuống ' + (names[0] || title));
    const error = element('p', undefined, 'submission-upload__error');
    error.setAttribute('role', 'alert');
    error.hidden = true;
    if (!sample && files?.length) {
      bindUploadDownload(download, error, files, files.length === 1 ? names[0] : archiveName(record.requirementId));
    } else if (!sample) {
      download.disabled = true;
      download.title = 'Chưa có nội dung tệp của lần nộp này.';
    }
    actions.append(download);
    const notes = record.notes ?? record.studentNote;
    if (record.feedback) {
      actions.append(viewFeedbackTrigger(record));
    } else if (notes) {
      const action = element('button', 'Xem ghi chú', 'submission-board-card__feedback');
      action.type = 'button';
      action.setAttribute('aria-haspopup', 'dialog');
      action.setAttribute('aria-label', 'Xem ghi chú: ' + title);
      action.addEventListener('click', () => app.ui.workflowDetails({
        title: 'Xem ghi chú',
        fields: [['Tên bài nộp', title], ['Tệp đã nộp', names.join('\n'), names.length > 1], ['Ghi chú cho giảng viên', notes, true]],
        returnTo: () => [...host.querySelectorAll('[data-record-id]')].find(node => node.dataset.recordId === card.dataset.recordId)?.querySelector('.submission-board-card__feedback'),
      }));
      actions.append(action);
    }
    body.append(details, actions);
    card.append(header, body, error);
    return card;
  }

  function viewFeedbackTrigger(record) {
    const trigger = element('button', undefined, 'submission-board-card__feedback');
    trigger.type = 'button';
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-controls', feedbackDialog.id);
    trigger.setAttribute('aria-label', 'Xem phản hồi: ' + record.title);
    const namespace = 'http://www.w3.org/2000/svg';
    const icon = document.createElementNS(namespace, 'svg');
    icon.setAttribute('class', 'submission-board__icon');
    icon.setAttribute('aria-hidden', 'true');
    icon.setAttribute('focusable', 'false');
    icon.setAttribute('viewBox', '0 0 24 24');
    const shape = document.createElementNS(namespace, 'use');
    shape.setAttribute('href', '#student-submission-eye-icon');
    icon.append(shape);
    trigger.append(icon, element('span', 'Xem phản hồi'));
    trigger.addEventListener('click', () => openFeedback(record, trigger));
    return trigger;
  }

  function openFeedback(record, trigger) {
    const summary = feedbackDialog.querySelector('.student-feedback-dialog__summary');
    summary.querySelector('h3').textContent = record.title;
    summary.querySelector('time').replaceWith(time(record.submittedAt, true));
    feedbackDialog.querySelector('.student-feedback-dialog__content p').textContent = record.feedback;

    const details = feedbackDialog.querySelector('.student-feedback-dialog__details');
    const history = record.feedbackHistory?.slice().reverse().map(entry =>
      [entry.at && time(entry.at).textContent, entry.content].filter(Boolean).join(' · ')).join('\n\n');
    const rows = [
      ['Phản hồi trước', history],
      ['Ghi chú cho giảng viên', record.notes ?? record.studentNote],
    ];
    details.replaceChildren();
    for (const [label, value] of rows) {
      if (!value) continue;
      const row = element('div');
      row.append(element('dt', label), element('dd', value));
      details.append(row);
    }
    details.hidden = !details.childElementCount;
    feedbackTrigger = trigger;
    feedbackDialog.showModal();
  }

  feedbackDialog.addEventListener('close', () => {
    const card = feedbackTrigger?.closest('[data-record-id]');
    if (card && !document.querySelector('dialog[open]')) {
      const currentCard = card.isConnected ? card : [...host.querySelectorAll('[data-record-id]')]
        .find(node => node.dataset.recordId === card.dataset.recordId);
      currentCard?.querySelector('.submission-board-card__feedback')?.focus({ preventScroll: true });
    }
    feedbackTrigger = null;
  });

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
    for (const row of host.querySelectorAll('[data-local-upload]')) row.remove();
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
        if (pendingColumn.contains(card)) submittedColumn.querySelector('.submission-column__list').prepend(card.closest('li'));
      }
      const row = element('li');
      row.dataset.localUpload = id;
      row.append(submissionFileCard(record, deadline));
      (record.feedback ? reviewedColumn.querySelector('.submission-column__list') : waiting).prepend(row);
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
      columnHeading.prepend(app.ui.workflowIcon(variant === 'success' ? 'done' : variant === 'neutral' ? 'pending' : 'progress'));
      const viewport = element('div', undefined, 'submission-column__viewport');
      viewport.tabIndex = 0;
      viewport.setAttribute('role', 'region');
      viewport.setAttribute('aria-labelledby', labelId);
      const list = element('ul', undefined, 'task-column__list submission-column__list');
      if (items.length) {
        items.forEach(item => list.append(newRow(view(item))));
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

  function sampleRows(selector) {
    return new Map([...host.querySelectorAll(selector)].map(card => {
      card.dataset.recordId = card.id;
      return [card.id, card.closest('li')];
    }));
  }

  function updateSampleColumn(selector, rows) {
    const column = host.querySelector(selector);
    const count = column.querySelector('.task-column__count');
    const label = '(' + rows.length + ')';
    if (count.textContent.trim() !== label) count.textContent = label;
    const [first, overflow] = column.querySelectorAll('.submission-column__list');
    const update = (list, items) => {
      if (items.length !== list.children.length || items.some((item, index) => item !== list.children[index])) {
        list.replaceChildren(...items);
      }
    };
    update(first, overflow ? rows.slice(0, 5) : rows);
    if (overflow) update(overflow, rows.slice(5));
  }

  function newRow(card) {
    const row = element('li');
    row.append(card);
    return row;
  }

  function sharedRequirementRow(item, { canUpload, completed }) {
    const badge = !item.submitted && !item.locked && item.overdue ? 'danger' : null;
    const original = sharedRequirementRows.get(item.id);
    const seed = sharedRequirements.get(item.id);
    const submitted = sharedSubmissionsByRequirement.get(item.id);
    if (original && seed && canUpload && !item.locked && !item.localUpload &&
        item.title === seed.title && item.content === seed.content && item.deadline === seed.deadline &&
        item.latestSubmission?.id === submitted?.id &&
        item.latestSubmission?.submittedAt === submitted?.submittedAt &&
        item.latestSubmission?.fileName === submitted?.fileName) {
      const card = original.firstElementChild;
      const oldBadge = card.querySelector('.submission-board__badge');
      if (oldBadge && !oldBadge.classList.contains('submission-board__badge--' + badge)) {
        const trigger = card.querySelector('.requirement-board-card__open');
        if (oldBadge.id && trigger.hasAttribute('aria-describedby')) {
          trigger.setAttribute('aria-describedby', trigger.getAttribute('aria-describedby').split(' ')
            .filter(id => id !== oldBadge.id).join(' '));
        }
        oldBadge.remove();
      }
      if (badge && !oldBadge?.parentNode) card.querySelector('.requirement-board-card__header').append(deadlineBadge(badge));
      card.classList.toggle('requirement-board-card--overdue', badge === 'danger');
      return original;
    }
    return newRow(requirementCard({
      ...item, deadline: time(item.deadline), canUpload: canUpload && !item.locked, projectCompleted: completed,
    }, badge, item.locked ? 'Đã khóa nhận bài' : null));
  }

  function renderSharedSample(state, requirements, submissions, deadlines) {
    if (host.firstChild !== fallback[0]) host.replaceChildren(...fallback);
    const pending = [];
    const submitted = [];
    const active = new Map(requirements.map(item => [item.id, item]));
    // Duyệt theo thứ tự của giao diện sinh viên, rồi thêm các yêu cầu mới.
    for (const id of new Set([...sharedRequirementRows.keys(), ...active.keys()])) {
      const item = active.get(id);
      if (item) (item.submitted ? submitted : pending).push(sharedRequirementRow(item, state));
    }
    const waiting = [];
    const reviewed = [];
    for (const item of submissions) {
      const sample = sampleBundle(item);
      const seed = sharedSubmissions.get(item.id);
      const deadline = deadlines.get(item.requirementId);
      const originalRequirement = sharedRequirements.get(item.requirementId);
      const originalDeadline = originalRequirement && Date.parse(originalRequirement.deadline);
      const row = sample && seed?.title === item.title && seed.feedback === item.feedback && !item.notes &&
        deadline === originalDeadline
        ? sharedSubmissionRows.get(item.id) : null;
      (item.feedback ? reviewed : waiting).push(row ?? newRow(submissionFileCard(item, deadline, sample)));
    }
    updateSampleColumn('.requirements .submission-column--neutral', pending);
    updateSampleColumn('.requirements .submission-column--info', submitted);
    updateSampleColumn('.submissions .submission-column--warning', waiting);
    updateSampleColumn('.submissions .submission-column--success', reviewed);
  }

  function render() {
    const projectId = document.body.dataset.projectId;
    if (!projectId) return;
    const active = host.contains(document.activeElement) ? document.activeElement : null;
    const focused = active?.closest('[data-record-id]')?.dataset.recordId;
    try {
      const state = service.forStudent(projectId);
      if (!isLivePage && !state.hasRecord) {
        if (host.firstChild !== fallback[0]) host.replaceChildren(...fallback);
        renderSampleUploads();
        return;
      }
      const deadlines = new Map(state.requirements.map(item => [item.id, Date.parse(item.deadline)]));
      const requirementsWithUploads = state.requirements.map(item => {
        const record = uploads.get(item.id);
        if (!record) return item;
        if (Date.parse(record.submittedAt) < Date.parse(item.latestSubmission?.submittedAt)) return { ...item, localUpload: record };
        return { ...item, submitted: true, latestSubmission: record, localUpload: record,
          late: Date.parse(record.submittedAt) > deadlines.get(item.id) };
      });
      const local = [...uploads.values()].filter(record => deadlines.has(record.requirementId));
      const allSubmissions = service.visibleSubmissions(projectId, state.submissions, local);
      if (isSharedSample) {
        renderSharedSample(state, requirementsWithUploads, allSubmissions, deadlines);
        lockNotice.hidden = !state.submissionsLocked;
      } else {
        renderLiveBoards(state, deadlines, requirementsWithUploads, allSubmissions);
      }
      for (const card of host.querySelectorAll('[data-record-id]')) {
        if (card.dataset.recordId === focused && !host.contains(document.activeElement)) {
          card.querySelector('.requirement-board-card__open, .submission-board-card__download:not(:disabled), .submission-board-card__feedback')?.focus({ preventScroll: true });
        }
      }
      if (active && !host.contains(document.activeElement)) host.querySelector('.task-board')?.focus({ preventScroll: true });
    } catch (failure) {
      const error = element('p', failure.message, 'student-submission-notice');
      error.setAttribute('role', 'alert');
      host.replaceChildren(error);
    }
  }

  function renderLiveBoards(state, deadlines, requirementsWithUploads, allSubmissions) {
    const notice = element('p', state.submissionsLocked
      ? 'Giảng viên đã khóa nhận bài cho đề tài này.'
      : state.hasDemoDeadlines ? 'Trạng thái hạn mẫu tháng 10 và 11/2026 được tính theo ngày 30/10 và 24/11.'
        : 'Yêu cầu được cập nhật theo dữ liệu giảng viên lưu trên trình duyệt.', 'student-submission-notice');
    notice.hidden = !state.submissionsLocked && !state.hasDemoDeadlines && Boolean(app.data.studentUITCatalog?.myIds
      .some(id => app.data.studentUITCatalog.projectId(id) === document.body.dataset.projectId));
    const requirements = board('Yêu cầu bài nộp', 'requirements', [
      { label: 'Chưa nộp', variant: 'neutral', items: requirementsWithUploads.filter(item => !item.submitted) },
      { label: 'Đã nộp', variant: 'info', items: requirementsWithUploads.filter(item => item.submitted) },
    ], item => {
      const overdue = !item.submitted && !item.locked && item.overdue;
      const badge = overdue ? 'danger' : null;
      const status = item.submitted ? null :
        item.locked ? 'Đã khóa nhận bài' : state.completed ? 'Đề tài đã hoàn thành' : null;
      return requirementCard({
        ...item, deadline: time(item.deadline), canUpload: !item.locked && state.canUpload, projectCompleted: state.completed,
      }, badge, status);
    });
    const submissions = board('Bài nộp của nhóm', 'submissions', [
      { label: 'Chờ phản hồi', variant: 'warning', items: allSubmissions.filter(item => !item.feedback) },
      { label: 'Đã phản hồi', variant: 'success', items: allSubmissions.filter(item => item.feedback) },
    ], item => submissionFileCard(item, deadlines.get(item.requirementId), sampleBundle(item)));
    host.replaceChildren(notice, requirements, submissions);
  }

  if (!isLivePage) prepareSampleRequirements();
  if (!isLivePage && location.protocol === 'file:') return;
  const sharedSeed = isSharedSample ? sampleData.forProject(sampleData.projectId) : null;
  const sharedRequirements = new Map(sharedSeed?.requirements.map(item => [item.id, item]));
  const sharedSubmissions = new Map(sharedSeed?.submissions.map(item => [item.id, item]));
  const sharedSubmissionsByRequirement = new Map(sharedSeed?.submissions.map(item => [item.requirementId, item]));
  const sharedRequirementRows = isSharedSample ? sampleRows('.requirements .requirement-board-card') : null;
  const sharedSubmissionRows = isSharedSample ? sampleRows('.submissions .submission-board-card') : null;
  const lockNotice = element('p', 'Giảng viên đã khóa nhận bài cho đề tài này.', 'student-submission-notice');
  if (isSharedSample) host.prepend(lockNotice);
  const fallback = [...host.childNodes];
  async function refreshUploads() {
    const projectId = document.body.dataset.projectId;
    if (!projectId) return;
    const version = ++readVersion;
    try {
      const records = await service.readUploads(projectId);
      if (version !== readVersion || projectId !== document.body.dataset.projectId) return;
      if (records.length === uploads.size && records.every(record => {
        const previous = uploads.get(record.requirementId);
        return previous?.submittedAt === record.submittedAt && previous.feedbackAt === record.feedbackAt;
      })) return;
      uploads.clear();
      for (const record of records) uploads.set(record.requirementId, record);
      render();
    } catch {
      // Keep the board available even when browser file storage cannot be opened.
    }
  }
  function openCalendarRequirement() {
    if (!isLivePage || location.hash !== '#bai-nop') return;
    const params = new URLSearchParams(location.search);
    const requirementId = params.get('requirement');
    const card = requirementId && document.getElementById(requirementId);
    if (!card?.matches('.requirement-board-card') || !host.contains(card)) return;

    const action = params.get('submissionAction');
    const open = card.querySelector('.requirement-board-card__open');
    card.scrollIntoView({ block: 'nearest' });
    open.focus({ preventScroll: true });

    if (action === 'feedback') {
      const submission = params.get('submission');
      const feedbackCard = [...host.querySelectorAll('.submission-board-card[data-requirement-id]')]
        .find(node => node.dataset.requirementId === requirementId && node.dataset.recordId === submission);
      const feedback = feedbackCard?.querySelector('[aria-controls="student-feedback-dialog"]');
      if (feedback) {
        feedback.click();
        return;
      }
    }
    if (action === 'upload') {
      const upload = card.querySelector('.submission-dialog__submit:not(:disabled)');
      if (upload) {
        upload.click();
        return;
      }
    }
    open.click();
    if (action === 'submitted') {
      const attachment = card.querySelector('.submission-dialog__attachment');
      if (attachment) {
        attachment.tabIndex = -1;
        attachment.focus();
      }
    }
  }

  window.addEventListener('pageshow', async event => {
    render();
    await refreshUploads();
    if (!event.persisted) openCalendarRequirement();
  });
  window.addEventListener('focus', refreshUploads);
  service.onUploadsChanged(projectId => {
    if (projectId === document.body.dataset.projectId) void refreshUploads();
  });
  window.addEventListener('storage', event => {
    const { teachingKey, teamKey, proposalKey, registrationKey } = app.storage;
    if ([teachingKey, teamKey, proposalKey, registrationKey, null].includes(event.key)) render();
  });
  // The approved-project renderer sets the project ID before this deferred script.
  render();
})();
