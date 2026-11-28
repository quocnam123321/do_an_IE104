(() => {
  const app = globalThis.IE104;
  const service = app?.services?.studentSubmissions;
  const formTemplate = document.getElementById('student-upload-form-template');
  const fileTemplate = document.getElementById('student-upload-file-item-template');
  if (!service || !formTemplate || !fileTemplate) return;
  app.ui ||= {};

  function mount(dialog, onSaved) {
    dialog.append(formTemplate.content.cloneNode(true));
    const heading = dialog.querySelector('h2');
    heading.id = dialog.id + '-title';
    dialog.setAttribute('aria-labelledby', heading.id);
    const form = dialog.querySelector('form');
    const attachments = form.querySelector('.submission-upload__attachments');
    const input = form.querySelector('input[type="file"]');
    const picker = form.querySelector('.submission-upload__picker');
    const pickerLabel = form.querySelector('[data-upload-picker-label]');
    const empty = form.querySelector('.submission-upload__empty');
    const list = form.querySelector('.submission-upload__files');
    const submit = form.querySelector('button[type="submit"]');
    const close = dialog.querySelector('.submission-dialog__close');
    const cancel = form.querySelector('[data-upload-cancel]');
    const error = form.querySelector('.submission-upload__error');
    const scope = form.querySelector('.submission-upload__scope');
    const notes = form.elements['ghi-chu'];
    const isFile = location.protocol === 'file:';
    const scopeText = isFile ? 'Mở website qua localhost để lưu bài nộp.' : scope.textContent;
    const projectId = () => document.body.dataset.projectId;
    const databaseScope = 'Tối đa 10 tệp, tổng dung lượng 20 MiB. Giảng viên có thể tải tệp từ thiết bị khác.';
    const currentScope = () => service.usesDatabase(projectId()) ? databaseScope : scopeText;
    let files = [];
    let requirement;
    let savedAt;
    let editing = false;
    let saving = false;
    let loading;
    let loadFailed = false;

    function showError(message = '') {
      error.textContent = message;
      error.hidden = !message;
    }

    function updateControls() {
      close.disabled = cancel.disabled = saving;
      picker.disabled = saving || Boolean(loading) || loadFailed;
      submit.disabled = !files.length || isFile || picker.disabled;
      submit.textContent = saving ? 'Đang lưu…' : editing ? 'Lưu thay đổi' : 'Xác nhận nộp bài';
      notes.readOnly = saving;
      for (const remove of list.querySelectorAll('button')) remove.disabled = saving;
    }

    function renderFiles() {
      const selected = Boolean(files.length);
      attachments.toggleAttribute('data-has-files', selected);
      empty.hidden = selected;
      list.hidden = !selected;
      pickerLabel.textContent = selected ? 'Thêm tệp' : 'Chọn tệp';
      picker.setAttribute('aria-label', pickerLabel.textContent);
      const names = files.length > 1 ? app.ui.submissionZipNames(files) : files.map(file => file.name);
      list.replaceChildren(...names.map((name, index) => {
        const row = fileTemplate.content.firstElementChild.cloneNode(true);
        row.querySelector('[data-upload-filename]').textContent = name;
        const remove = row.querySelector('button');
        remove.setAttribute('aria-label', 'Gỡ tệp ' + name);
        remove.addEventListener('click', () => {
          files.splice(index, 1);
          showError();
          renderFiles();
          (list.querySelectorAll('button')[Math.min(index, files.length - 1)] || picker).focus();
        });
        return row;
      }));
      updateControls();
    }

    picker.addEventListener('click', () => input.click());
    input.addEventListener('change', () => {
      const selected = [...input.files];
      input.value = '';
      const combined = [...files];
      for (const file of selected) {
        if (file.size && !combined.some(previous => previous.name === file.name &&
          previous.size === file.size && previous.lastModified === file.lastModified && previous.type === file.type)) {
          combined.push(file);
        }
      }
      if (service.usesDatabase(projectId())) {
        const { maxFiles, maxBytes } = service.fileLimits;
        if (combined.length > maxFiles || combined.reduce((sum, file) => sum + file.size, 0) > maxBytes) {
          showError('Mỗi lần nộp tối đa 10 tệp với tổng dung lượng 20 MiB.');
          return;
        }
      }
      files = combined;
      showError(selected.some(file => !file.size) ? 'Tệp rỗng không được thêm vào bài nộp.' : '');
      renderFiles();
    });
    close.addEventListener('click', () => dialog.close());
    cancel.addEventListener('click', () => dialog.close());
    dialog.addEventListener('cancel', event => { if (saving) event.preventDefault(); });
    dialog.addEventListener('close', () => {
      if (dialog.open) return;
      loading?.abort();
      loading = null;
      files = [];
    });
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (submit.disabled || saving) return;
      saving = true;
      showError();
      updateControls();
      let record;
      try {
        record = await service.saveUpload(document.body.dataset.projectId, requirement, [...files], notes.value, savedAt);
      } catch (failure) {
        showError(failure.message);
      } finally {
        saving = false;
        updateControls();
      }
      if (!record) return;
      dialog.close();
      onSaved(record, editing);
    });

    async function open(item, { expectedSavedAt = null, sampleFiles = [], trigger } = {}) {
      if (dialog.open) return;
      loading?.abort();
      requirement = item;
      savedAt = expectedSavedAt;
      editing = item.submitted;
      heading.textContent = item.title;
      dialog.toggleAttribute('data-update', editing);
      close.setAttribute('aria-label', editing ? 'Đóng hộp thoại cập nhật bài nộp' : 'Đóng hộp thoại nộp bài');
      form.reset();
      const previous = item.latestSubmission;
      const fromServer = previous?.isDatabaseSubmission && previous.files.length;
      files = fromServer ? [] : [...(previous?.files || [])];
      if (service.usesDatabase(projectId())) notes.maxLength = 2000;
      notes.value = previous?.notes ?? '';
      loadFailed = false;
      showError();
      loading = !isFile && !files.length && (fromServer || sampleFiles.length) ? new AbortController() : null;
      if (loading) {
        scope.textContent = 'Đang tải tệp đã nộp…';
      } else if (!isFile && editing && !files.length) {
        scope.textContent = 'Tệp cũ chưa có trên trình duyệt này. Chọn tệp để cập nhật bài nộp.';
      } else {
        scope.textContent = currentScope();
      }
      renderFiles();
      trigger?.closest('dialog')?.close();
      dialog.showModal();
      if (!loading) return;

      const controller = loading;
      try {
        const loaded = fromServer ? await service.readFiles(projectId(), previous, undefined, controller.signal)
          : await Promise.all(sampleFiles.map(async ({ url, name }) => {
          const response = await fetch(url, { signal: controller.signal });
          if (!response.ok) throw new Error('Không tải được tệp mẫu.');
          const blob = await response.blob();
          if (!blob.size) throw new Error('Tệp mẫu rỗng.');
          return new File([blob], name, { type: blob.type });
        }));
        if (loading === controller) files = loaded;
      } catch {
        if (loading === controller) {
          loadFailed = true;
          showError('Chưa tải được tệp đã nộp. Hãy đóng và mở lại hộp thoại để thử lại.');
        }
      } finally {
        if (loading === controller) {
          loading = null;
          scope.textContent = currentScope();
          renderFiles();
        }
      }
    }
    return { open };
  }

  app.ui.studentUpload = { mount };
})();
