(() => {
  const app = globalThis.IE104;
  const datePicker = app?.ui?.proposalDatePicker;
  const calendarOptions = { timeZone: 'Asia/Ho_Chi_Minh', timeLabel: 'Giờ nộp (giờ Việt Nam)' };
  const previewDeadline = document.getElementById('create-deadline');
  if (previewDeadline) datePicker?.enhanceDate(previewDeadline, calendarOptions);
  const ui = app?.ui?.lecturerWorkspace;
  if (!ui) {
    if (datePicker) {
      const pending = new Map();
      const observer = new MutationObserver(entries => {
        for (const { target: dialog } of entries) {
          const input = pending.get(dialog);
          if (!dialog.open || !input) continue;
          pending.delete(dialog);
          const field = input.closest('.topic-dialog__field');
          const wrapper = document.createElement('div');
          wrapper.className = 'topic-dialog__field requirement-deadline';
          wrapper.append(...field.childNodes);
          field.replaceWith(wrapper);
          datePicker.enhanceDate(input, calendarOptions);
        }
        if (!pending.size) observer.disconnect();
      });
      for (const input of document.querySelectorAll('input[name="edit-deadline"]')) {
        const dialog = input.closest('dialog');
        if (!dialog) continue;
        pending.set(dialog, input);
        observer.observe(dialog, { attributeFilter: ['open'] });
      }
    }
    return;
  }
  const { el, button, field, modal, service } = ui;
  const uploadsService = app.services.studentSubmissions;
  const panel = ui.region('submissions-section', 'bai-nop');
  let deleteMode = false;
  let loadingRequirement = false;
  let requestVersion = 0;
  let renderedState;
  let renderedUploads;
  const fileChecks = new Set();
  const refreshFiles = () => {
    fileChecks.forEach(check => check());
    void renderWithUploads(ui.state);
  };
  window.addEventListener('focus', refreshFiles);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshFiles(); });
  const localDate = value => new Date(Date.parse(value) + 7 * 3600000).toISOString().slice(0, 16);
  function createSymbolIcon(symbolId) {
    const namespace = 'http://www.w3.org/2000/svg';
    const icon = document.createElementNS(namespace, 'svg');
    icon.setAttribute('aria-hidden', 'true');
    icon.setAttribute('focusable', 'false');
    icon.setAttribute('viewBox', '0 0 24 24');
    const shape = document.createElementNS(namespace, 'use');
    shape.setAttribute('href', `#${symbolId}`);
    icon.append(shape);
    return icon;
  }

  function feedbackEditor(value, autofocus = false) {
    const editor = el('div', '', 'topic-dialog__field');
    field(editor, 'submission-feedback', 'Nội dung phản hồi', 'textarea', value, {
      required: true, maxLength: 2000, rows: 6, autofocus,
    });
    return editor;
  }

  async function editRequirement(item) {
    if (loadingRequirement || !ui.state?.canManageRequirements) return;
    const { projectId, revision } = ui.state;
    let calendarRequirement;
    if (item && location.protocol !== 'file:' && ui.state.submissionsRevision === undefined) {
      loadingRequirement = true;
      try {
        const { loadCalendarRequirement } = await import('../../calendar-client.js?v=20261125-deadline-sync');
        calendarRequirement = await loadCalendarRequirement(projectId, item.id);
      } catch (error) {
        ui.notify(error.message, true);
        return;
      } finally {
        loadingRequirement = false;
      }
      if (ui.state?.projectId !== projectId || ui.state.revision !== revision) {
        ui.notify('Dữ liệu đã thay đổi ở tab khác. Hãy đóng hộp thoại và mở lại để xem bản mới.', true);
        return;
      }
    }
    const initialDeadline = item ? localDate(calendarRequirement?.due || item.deadline) : '';
    let deadline;
    const readDeadline = () => datePicker ? datePicker.read(deadline) : deadline.value;
    modal(item ? 'Sửa yêu cầu bài nộp' : 'Tạo yêu cầu bài nộp', 'Lưu yêu cầu', body => {
      field(body, 'title', 'Tên yêu cầu', 'text', item?.title || '', { required: true, maxLength: 200 });
      field(body, 'content', 'Nội dung yêu cầu', 'textarea', item?.content || '', { required: true, maxLength: 5000, rows: 3 });
      const deadlineField = el('div', '', 'topic-dialog__field requirement-deadline');
      deadline = field(deadlineField, 'deadline', 'Hạn nộp (giờ Việt Nam)', 'datetime-local',
        initialDeadline, { required: true });
      datePicker?.enhanceDate(deadline, { ...calendarOptions, label: deadline.previousElementSibling });
      deadlineField.addEventListener('input', () => deadline.setCustomValidity(''));
      body.append(deadlineField);
    }, async (values, snapshot) => {
      values.set('deadline', readDeadline());
      const input = Object.fromEntries(values);
      const deadlineChanged = input.deadline !== initialDeadline;
      const saveLocal = () => service.saveRequirement(snapshot.projectId, item?.id || null, {
        ...input, deadline: item && !deadlineChanged ? localDate(item.deadline) : input.deadline,
      }, snapshot.submissionsRevision ?? snapshot.revision);
      if (!calendarRequirement || !deadlineChanged) return saveLocal();

      const checked = service.validateRequirement(input);
      if (checked.errors.length) throw new Error(checked.errors.join(' '));
      const current = service.getState(snapshot.projectId);
      if (current.revision !== snapshot.revision) throw new Error('Dữ liệu đã thay đổi ở tab khác. Hãy đóng hộp thoại và mở lại để xem bản mới.');
      if (!current.canManageRequirements) throw new Error('Đề tài đã thay đổi. Hãy mở lại hộp thoại.');
      await calendarRequirement.save(input.deadline);
      try {
        return saveLocal();
      } catch {
        throw new Error('Đã lưu hạn nộp trên dịch vụ lịch. Chưa lưu yêu cầu trên trình duyệt này. Hãy mở lại để thử lưu yêu cầu.');
      }
    }, calendarRequirement ? 'Đã lưu. Sự kiện đã thêm sẽ tự cập nhật trên Google Calendar.'
      : ui.state.submissionsRevision === undefined ? undefined : 'Đã lưu yêu cầu bài nộp.', {
      className: 'requirement-form-dialog',
      closeIcon: createSymbolIcon('submission-feedback-close-icon'),
      beforeSubmit() {
        deadline.setCustomValidity(readDeadline() ? '' : 'Nhập ngày và giờ hợp lệ, ví dụ 30/11/2026 · 23:59.');
        return deadline.reportValidity();
      },
    });
  }
  function confirmDeleteRequirement(item) {
    const descriptionId = 'lecturer-delete-requirement-description';
    modal('Xóa yêu cầu bài nộp', 'Xác nhận xóa', body => {
      const question = el('p', 'Bạn có muốn xóa yêu cầu bài nộp ', 'topic-dialog__desc');
      question.id = descriptionId;
      question.append(el('strong', item.title), '?');
      body.append(question);
    }, (_, snapshot) => uploadsService.deleteUnsubmittedRequirement(snapshot.projectId, item.id,
      snapshot.submissionsRevision ?? snapshot.revision),
    ui.state.submissionsRevision === undefined ? undefined : 'Đã xóa yêu cầu.', {
      showCancel: false,
      className: 'requirement-delete-dialog',
      submitVariant: 'danger',
      descriptionId,
      closeIcon: createSymbolIcon('submission-feedback-close-icon'),
    });
  }

  function setAcceptance(item, locked) {
    const action = locked ? 'Khóa nhận bài' : 'Mở nhận bài';
    modal(action, 'Xác nhận', body => {
      body.append(el('p', item ? `${action} cho yêu cầu “${item.title}”?` : `${action} cho toàn bộ đề tài?`));
    }, (_, snapshot) => service.setLocked(snapshot.projectId, item?.id || null, locked,
      snapshot.submissionsRevision ?? snapshot.revision),
    ui.state.submissionsRevision === undefined ? undefined : (locked ? 'Đã khóa nhận bài.' : 'Đã mở nhận bài.'));
  }
  function submissionTime(value) {
    const time = el('time', ui.date(value).replace(' - ', ' · '));
    time.dateTime = value;
    return time;
  }

  async function readSampleFile(path, fileName) {
    const response = await fetch('../../assets/files/' + path);
    if (!response.ok) throw new Error('Không tải được tệp mẫu.');
    return { blob: await response.blob(), fileName };
  }

  function requirementAttachments(submission, projectId) {
    const sample = app.data.studentWebSubmissions?.attachment(projectId, submission);
    const upload = submission.files;
    const names = sample?.names ?? (upload?.length > 1
      ? app.ui.submissionZipNames(upload)
      : [upload?.[0]?.name ?? submission.fileName]);
    const section = el('section', '', 'requirement-view-dialog__attachments');
    const heading = el('div', '', 'requirement-view-dialog__attachment-heading');
    heading.append(el('h3', 'Tệp đã nộp'));
    const error = el('p', '', 'teaching-error');
    error.setAttribute('role', 'alert');

    function download(label, fileName, samplePath, fileIndex) {
      const className = fileIndex === undefined ? 'requirement-view-dialog__download-all'
        : 'topic-dialog__btn topic-dialog__btn--secondary';
      const control = button('', async () => {
        control.disabled = true;
        error.textContent = '';
        try {
          const file = sample ? await readSampleFile(samplePath, fileName)
            : await readUploadFile(projectId, submission, fileIndex);
          if (control.isConnected && ui.state?.projectId === projectId) app.ui.downloadFile(file);
        } catch (failure) {
          error.textContent = failure.message;
        } finally {
          control.disabled = false;
        }
      });
      control.className = className;
      control.setAttribute('aria-label', fileName && fileIndex !== undefined ? `${label} ${fileName}` : label);
      control.append(app.ui.workflowIcon('download'), el('span', label));
      return control;
    }

    if (names.length > 1) heading.append(download('Tải tất cả', sample?.name, sample?.path));
    const list = el('ul', '', 'requirement-view-dialog__files');
    list.setAttribute('aria-label', 'Tệp đã nộp');
    if (names.length > 4) list.tabIndex = 0;
    names.forEach((name, index) => {
      if (!name) return;
      const row = el('li');
      const line = el('p', '', 'requirement-view-dialog__filename');
      const filename = el('span', name);
      filename.title = name;
      line.append(app.ui.workflowIcon('file'), filename);
      row.append(line);
      if (sample || upload) {
        const path = sample && (index === 0 ? 'bai-nop-minh-hoa.pdf'
          : sample.path.replace(/\.zip$/, '/') + encodeURIComponent(name));
        row.append(download('Tải xuống', name, path, index));
      }
      list.append(row);
    });
    section.append(heading, list.children.length ? list : el('p', 'Chưa có thông tin tệp đã nộp.'), error);
    return section;
  }

  function viewRequirement(item, latestSubmission, state) {
    const dialog = el('dialog', '', 'topic-dialog requirement-view-dialog');
    const header = el('header', '', 'topic-dialog__header');
    const title = el('h2', item.title);
    title.id = 'lecturer-requirement-title';
    dialog.setAttribute('aria-labelledby', title.id);
    const close = button('', () => dialog.close());
    close.className = 'topic-dialog__close';
    close.setAttribute('aria-label', 'Đóng hộp thoại chi tiết yêu cầu bài nộp');
    close.append(createSymbolIcon('submission-feedback-close-icon'));
    header.append(title, close);

    const body = el('div', '', 'requirement-view-dialog__body');
    const dates = el('dl');
    const deadline = el('dd');
    deadline.append(submissionTime(item.deadline));
    dates.append(el('dt', 'Hạn nộp'), deadline);
    const description = el('section');
    description.append(el('h3', 'Nội dung yêu cầu'),
      el('p', item.content || 'Chưa có nội dung yêu cầu.', 'teaching-prewrap'));
    body.append(dates, description);
    if (latestSubmission) {
      const submittedAt = el('dd');
      submittedAt.append(submissionTime(latestSubmission.submittedAt));
      dates.append(el('dt', 'Ngày giờ nộp'), submittedAt);
      body.append(requirementAttachments(latestSubmission, state.projectId));
    }

    const footer = el('footer', '', 'topic-dialog__actions');
    if (item.locked || state.submissionsRevision !== undefined) {
      footer.append(button(item.locked ? 'Mở nhận bài' : 'Khóa nhận bài', () => {
        dialog.close();
        setAcceptance(item, !item.locked);
      }, !state.canManageRequirements));
    }
    const edit = button('Sửa yêu cầu', () => {
      dialog.close();
      editRequirement(item);
    }, !state.canManageRequirements);
    edit.className = 'topic-dialog__btn topic-dialog__btn--primary';
    footer.append(edit);

    dialog.append(header, body, footer);
    dialog.addEventListener('close', () => dialog.remove(), { once: true });
    document.body.append(dialog);
    dialog.showModal();
  }
  function board(title, groups, cardBuilder, kind = 'requirements') {
    const isRequirements = kind === 'requirements';
    const section = el('section', '', kind);
    const header = el('header', '', `${kind}__header`);
    header.append(el('h3', title, `${kind}__title`));
    const viewport = el('div', '', 'task-board submission-board');
    viewport.tabIndex = 0;
    viewport.setAttribute('role', 'region');
    viewport.setAttribute('aria-label', title);
    const variant = isRequirements ? 'requirements' : 'files';
    const columns = el('div', '', `task-board__columns submission-board__columns submission-board__columns--${variant}`);
    const accents = isRequirements ? ['neutral', 'info'] : ['warning', 'success'];
    groups.forEach((group, index) => {
      const column = el('section', '', `task-column submission-column submission-column--${accents[index]}`);
      const heading = el('h4', '', 'task-column__title');
      const iconKind = isRequirements ? ['pending', 'progress'][index] : ['progress', 'done'][index];
      const icon = app.ui.workflowIcon(iconKind);
      if (isRequirements) {
        icon.setAttribute('class', 'task-column__icon');
        heading.append(icon, el('span', group.title));
      } else {
        heading.append(icon, group.title);
      }
      const list = el('div', '', 'task-column__list submission-column__list teaching-column-list');
      list.tabIndex = 0;
      list.setAttribute('role', 'region');
      list.setAttribute('aria-label', group.title);
      group.items.forEach(item => list.append(cardBuilder(item)));
      if (!group.items.length) list.append(el('p', 'Chưa có dữ liệu.'));
      column.append(heading, list);
      columns.append(column);
    });
    viewport.append(columns);
    section.append(header, viewport);
    return section;
  }
  async function renderWithUploads(state) {
    const version = ++requestVersion;
    let uploads = [];
    let uploadError = '';
    if (state && !state.readOnly) {
      try {
        uploads = await uploadsService.readUploads(state.projectId, 'lecturer');
      } catch {
        uploadError = 'Chưa đọc được tệp do sinh viên nộp trên trình duyệt này.';
      }
    }
    if (version !== requestVersion) return;
    const signature = JSON.stringify([uploadError, uploads.map(item =>
      [item.requirementId, item.submittedAt, item.feedbackAt])]);
    if (state === renderedState && signature === renderedUploads) return;
    renderedState = state;
    renderedUploads = signature;
    render(state, uploads, uploadError);
  }

  async function readUploadFile(projectId, upload, fileIndex) {
    if (upload.isDatabaseSubmission) {
      const files = await uploadsService.readFiles(projectId, upload, fileIndex);
      if (fileIndex !== undefined) {
        const names = app.ui.submissionZipNames(upload.files);
        return { blob: files[0], fileName: names[fileIndex] };
      }
      if (files.length === 1) return { blob: files[0], fileName: files[0].name };
      return { blob: await app.ui.createSubmissionZip(files), fileName: 'bai-nop-' + upload.requirementId + '.zip' };
    }
    const records = await uploadsService.readUploads(projectId, 'lecturer');
    const current = records.find(item => item.requirementId === upload.requirementId);
    if (!current || current.submittedAt !== upload.submittedAt) throw new Error('Bài nộp đã thay đổi. Hãy tải lại danh sách trước khi tải tệp.');
    const files = current.files;
    if (files.length === 1) return { blob: files[0], fileName: files[0].name };
    if (fileIndex !== undefined) {
      const names = app.ui.submissionZipNames(files);
      return { blob: files[fileIndex], fileName: names[fileIndex] };
    }
    return { blob: await app.ui.createSubmissionZip(files),
      fileName: 'bai-nop-' + upload.requirementId.replace(/[^\w-]/g, '-') + '.zip' };
  }

  function render(state, uploads, uploadError) {
    fileChecks.clear();
    const activeElement = document.activeElement;
    const restoreModeFocus = panel.contains(activeElement) && activeElement.matches('.workflow-delete-mode');
    panel.replaceChildren();
    if (!state) return;
    const toolbar = el('div', '', 'requirements__actions');
    const mode = button(deleteMode ? 'Xong' : 'Xóa', () => {
      deleteMode = !deleteMode;
      ui.refresh();
    }, !state.canManageRequirements);
    mode.classList.add('workflow-delete-mode');
    mode.setAttribute('aria-pressed', String(deleteMode));
    if (deleteMode) {
      const check = createSymbolIcon('requirements-done-icon');
      check.setAttribute('class', 'requirements__btn-icon');
      mode.classList.add('requirements__done-link');
      mode.prepend(check);
    }
    const create = button('+ Tạo yêu cầu', () => editRequirement(null), !state.canManageRequirements);
    create.classList.add('workflow-primary-action');
    toolbar.append(mode, create);
    if (state.submissionsLocked && state.canManageRequirements && !state.readOnly) {
      toolbar.append(button('Mở nhận bài toàn đề tài', () => setAcceptance(null, false)));
    }
    const requirements = state.requirements.filter(item => !item.deletedAt);
    const activeRequirements = new Map(requirements.map(item => [item.id, item]));
    const local = uploads.filter(item => activeRequirements.has(item.requirementId) && item.files?.length)
      .map(item => ({ ...item, id: 'upload:' + item.requirementId }));
    const submissions = uploadsService.visibleSubmissions(state.projectId, state.submissions, local);
    const latestSubmissions = new Map();
    for (const submission of submissions) {
      const { requirementId, submittedAt } = submission;
      if (!requirementId) continue;
      const current = latestSubmissions.get(requirementId);
      if (!current || Date.parse(submittedAt) > Date.parse(current.submittedAt)) {
        latestSubmissions.set(requirementId, submission);
      }
    }
    const now = Date.now();
    const demoReference = item => app.data.studentUITCatalog?.submissionReferenceTime(item);
    const stage = item => {
      return latestSubmissions.has(item.id) ? 'submitted' : item.sourceStage || 'pending';
    };
    const requirementsBoard = board('Yêu cầu bài nộp', [['pending', 'Chưa nộp'], ['submitted', 'Đã nộp']].map(([id, title]) => ({ title, items: requirements.filter(item => id === 'pending' ? stage(item) === 'pending' : stage(item) !== 'pending') })), item => {
      const card = el('article', '', 'requirement-board-card');
      card.dataset.requirementId = item.id;
      const hasSubmissions = stage(item) !== 'pending';
      const deadline = Date.parse(item.deadline);
      const overdue = !hasSubmissions && (state.submissionProjectStatus || state.project.status) !== 'hoan-thanh' &&
        !state.submissionsLocked && !item.locked && (demoReference(item) ?? now) > deadline;
      const latest = latestSubmissions.get(item.id);
      const late = latest && Date.parse(latest.submittedAt) > deadline;
      card.classList.toggle('requirement-board-card--overdue', overdue);

      const open = el('button', '', 'requirement-board-card__open');
      open.type = 'button';
      open.setAttribute('aria-haspopup', 'dialog');
      open.addEventListener('click', () => viewRequirement(item, latest, state));
      const heading = el('span', '', 'requirement-board-card__header');
      heading.append(el('span', item.title, 'requirement-board-card__title'));
      if (overdue) heading.append(el('span', 'Quá hạn', 'submission-board__badge submission-board__badge--danger'));
      if (late) heading.append(el('span', 'Nộp sau hạn', 'submission-board__badge submission-board__badge--late'));

      const date = el('span', '', 'requirement-board-card__deadline');
      const calendar = app.ui.workflowIcon('calendar');
      calendar.setAttribute('class', 'submission-board__icon');
      date.append(calendar, el('span', 'Hạn nộp:', 'visually-hidden'), submissionTime(item.deadline));
      open.append(heading, date);
      card.append(open);

      if (deleteMode && !hasSubmissions) {
        const remove = button('−', () => confirmDeleteRequirement(item),
          !state.canManageRequirements || Boolean(uploadError));
        remove.classList.add('workflow-requirement-remove');
        remove.setAttribute('aria-label', `Xóa yêu cầu: ${item.title}`);
        card.append(remove);
      }
      return card;
    });
    const header = requirementsBoard.querySelector('header');
    header.append(toolbar);
    const notice = state.readOnly ? 'Chưa có dữ liệu yêu cầu và bài nộp cho nhóm này.'
      : state.submissionsLocked ? 'Toàn bộ đề tài đang khóa nhận bài.'
      : !state.canManageRequirements ? 'Đề tài đã hoàn thành. Không mở nhận bài mới.' : null;
    if (notice) header.after(el('p', notice, 'submission-board-demo-note'));
    panel.append(requirementsBoard);
    if (restoreModeFocus) mode.focus({ preventScroll: true });
    if (uploadError) panel.append(el('p', uploadError, 'submission-board-demo-note'));
    const feedbackLocked = (state.submissionProjectStatus || state.project.status) === 'hoan-thanh';
    const submissionsBoard = board('Bài đã nộp', [false, true].map(reviewed => ({ title: reviewed ? 'Đã phản hồi' : 'Chờ phản hồi', items: submissions.filter(item => Boolean(item.feedback) === reviewed) })), item => {
      const sample = app.data.studentWebSubmissions?.attachment(state.projectId, item);
      const names = sample?.names ?? (item.files?.length > 1
        ? app.ui.submissionZipNames(item.files)
        : [item.files?.[0]?.name ?? item.fileName]);
      const fileNames = names.join(', ');
      const card = el('article', '', 'teaching-board-card');
      card.dataset.submissionId = item.id;
      const fileLine = el('p', '', 'workflow-submission-file');
      const firstName = el('span', names[0], 'submission-board-card__filename');
      firstName.title = firstName.textContent;
      fileLine.append(app.ui.workflowIcon('file'), firstName);
      const submitted = el('p', '', 'workflow-submission-date');
      submitted.append(app.ui.workflowIcon('calendar'), el('span', 'Ngày nộp:', 'visually-hidden'), submissionTime(item.submittedAt));
      card.append(el('h5', item.title), fileLine, submitted);
      app.ui.submissionFileList.attach(fileLine, names);
      const requirement = activeRequirements.get(item.requirementId);
      if (requirement) {
        const late = Date.parse(item.submittedAt) > Date.parse(requirement.deadline);
        const badge = el('span', late ? 'Nộp sau hạn' : 'Đúng hạn', 'workflow-due-badge');
        if (late) badge.classList.add('submission-board__badge', 'submission-board__badge--late');
        badge.title = `Hạn nộp: ${ui.date(requirement.deadline)}. Ngày nộp: ${ui.date(item.submittedAt)}.`;
        card.append(badge);
      }
      if (!item.requirementId) card.append(el('p', 'Bài mẫu chưa liên kết yêu cầu.'));
      const files = globalThis.IE104.services.submissionFiles;
      const hasFileSource = Boolean(sample || item.files);
      let downloading = false;
      let checking = false;
      const fileStatus = el('p', 'Đang kiểm tra tệp…');
      fileStatus.dataset.fileStatus = 'checking';
      const retryFile = button('Kiểm tra lại tệp', async () => {
        await checkFile();
        if (retryFile.isConnected && fileStatus.dataset.fileStatus === 'ready') ui.notify('Tệp đã sẵn sàng để tải.');
      });
      retryFile.hidden = true;
      const downloadLabel = el('span', 'Tải xuống');
      const download = button('', async () => {
        if (downloading || !files) return;
        downloading = true;
        download.disabled = true;
        downloadLabel.textContent = 'Đang chuẩn bị…';
        try {
          let file;
          if (item.files) file = await readUploadFile(state.projectId, item);
          else if (sample) file = await readSampleFile(sample.path, sample.name);
          else file = await files.read(state.projectId, item.id);
          if (!download.isConnected || ui.state?.projectId !== state.projectId) return;
          globalThis.IE104.ui.downloadFile(file);
        } catch (failure) {
          if (download.isConnected) ui.notify(failure.message, true);
        } finally {
          downloading = false;
          downloadLabel.textContent = 'Tải xuống';
          if (download.isConnected) checkFile();
        }
      }, true);
      download.className = 'submission-board-card__download';
      const downloadIcon = app.ui.workflowIcon('download');
      downloadIcon.setAttribute('class', 'submission-board__icon');
      download.append(downloadIcon, downloadLabel);
      download.dataset.downloadSubmission = item.id;
      download.title = 'Đang kiểm tra nội dung tệp bài nộp.';
      async function checkFile() {
        if (checking || downloading || !download.isConnected) return;
        checking = true;
        download.disabled = true;
        retryFile.hidden = true;
        try {
          if (!files) throw new Error('Chưa tải được chức năng đọc tệp. Hãy tải lại trang.');
          const result = hasFileSource ? { available: true } : await files.availability(state.projectId, item.id);
          if (!download.isConnected) return;
          download.disabled = !result.available;
          download.title = result.available ? `Tải ${fileNames}` : result.reason;
          fileStatus.textContent = result.available ? 'Tệp đã sẵn sàng.' : 'Chưa có nội dung tệp.';
          fileStatus.dataset.fileStatus = result.available ? 'ready' : 'missing';
        } catch (failure) {
          if (!download.isConnected) return;
          download.title = failure.message;
          fileStatus.textContent = 'Không đọc được tệp đã lưu.';
          fileStatus.dataset.fileStatus = 'error';
          retryFile.hidden = false;
        } finally { checking = false; }
      }
      const hasFeedback = Boolean(item.feedback);
      const feedbackLabel = hasFeedback ? 'Xem phản hồi' : 'Phản hồi';
      const dialogTitle = hasFeedback ? feedbackLabel : 'Phản hồi bài nộp';
      const submitLabel = hasFeedback ? 'Sửa phản hồi' : 'Lưu phản hồi';
      const feedbackButton = button('', () => modal(dialogTitle, submitLabel, body => {
        const summary = el('div', '', 'submission-feedback-dialog__summary');
        const [day, clock] = ui.date(item.submittedAt).split(' - ');
        const time = el('time', `${clock} ngày ${day}`);
        time.dateTime = item.submittedAt;
        const submittedAt = el('p', 'Đã nộp lúc ');
        submittedAt.append(time);
        summary.append(el('h3', requirement?.title ?? item.title), submittedAt);
        body.append(summary);
        if (hasFeedback) {
          const readout = el('section', '', 'submission-feedback-dialog__readout');
          readout.append(el('h3', 'Nội dung phản hồi'), el('p', item.feedback, 'teaching-prewrap'));
          body.append(readout);
        } else {
          body.append(feedbackEditor('', true));
        }
        if (item.notes) body.append(el('p', item.notes, 'teaching-prewrap'));
        item.feedbackHistory?.slice().reverse().forEach(previous => body.append(el('p', `${previous.at ? ui.date(previous.at) : 'Phản hồi trước'}: ${previous.content}`, 'teaching-prewrap')));
      }, (values, snapshot) => {
        const feedback = values.get('submission-feedback');
        return item.files ? uploadsService.reviewUpload(snapshot.projectId, item, feedback)
          : service.saveFeedback(snapshot.projectId, item.id, feedback, snapshot.revision);
      }, item.isDatabaseSubmission ? 'Đã lưu phản hồi.' : undefined, {
        showCancel: false,
        submitDisabled: feedbackLocked,
        className: 'submission-feedback-dialog',
        closeIcon: createSymbolIcon('submission-feedback-close-icon'),
        beforeSubmit({ form, submitButton, heading }) {
          const readout = form.querySelector('.submission-feedback-dialog__readout');
          if (!readout) return;
          readout.replaceWith(feedbackEditor(item.feedback));
          heading.textContent = 'Sửa phản hồi';
          submitButton.textContent = 'Lưu thay đổi';
          form.elements.namedItem('submission-feedback').focus();
          return false;
        },
      }), feedbackLocked && !hasFeedback);
      feedbackButton.className = 'submission-board-card__feedback';
      feedbackButton.classList.toggle('submission-board-card__feedback--view', hasFeedback);
      feedbackButton.setAttribute('aria-haspopup', 'dialog');
      const feedbackIcon = createSymbolIcon(hasFeedback ? 'submission-feedback-eye-icon' : 'submission-feedback-edit-icon');
      feedbackIcon.setAttribute('class', 'submission-board__icon');
      feedbackButton.append(feedbackIcon, el('span', feedbackLabel));
      const actions = el('div', '', 'workflow-submission-actions');
      actions.append(download, feedbackButton, fileStatus, retryFile);
      card.append(actions);
      queueMicrotask(checkFile);
      fileChecks.add(checkFile);
      return card;
    }, 'submissions');
    if (feedbackLocked && submissions.length) {
      submissionsBoard.querySelector('header').after(el('p',
        'Đề tài đã hoàn thành. Bạn có thể xem phản hồi và tải bài đã nộp.', 'submission-board-demo-note'));
    }
    panel.append(submissionsBoard);
    if (submissions.some(item => !item.files && !app.data.studentWebSubmissions?.attachment(state.projectId, item))) {
      panel.append(el('p', 'Các bài nộp chỉ có tên tệp sẽ hiện nút tải khi tìm thấy nội dung tệp đã lưu.'));
    }
  }

  ui.subscribe(renderWithUploads);
  uploadsService.onUploadsChanged(projectId => {
    if (projectId === ui.state?.projectId) void renderWithUploads(ui.state);
  });
})();
