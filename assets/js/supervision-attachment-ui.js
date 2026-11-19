(() => {
  'use strict';

  const store = window.IE104Supervision;
  const number = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 });

  function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${number.format(bytes / 1024)} KB`;
    return `${number.format(bytes / (1024 * 1024))} MB`;
  }

  function createPicker(host, id) {
    const limitText = formatSize(store.attachmentLimit);
    host.classList.add('supervision__field');
    host.innerHTML = `
      <p class="supervision__label" id="${id}-label">Tệp đính kèm <span class="supervision__hint">(không bắt buộc)</span></p>
      <p class="supervision__hint" id="${id}-hint">Tối đa một tệp, dung lượng ${limitText}.</p>
      <div class="supervision__actions">
        <div class="supervision__file-picker">
          <input type="file" id="${id}" name="attachment" class="visually-hidden supervision__file-input"
            aria-labelledby="${id}-label" aria-describedby="${id}-hint ${id}-error">
          <label for="${id}" class="supervision__button supervision__file-trigger">Chọn tệp</label>
        </div>
        <button type="button" class="supervision__button" data-remove-attachment hidden>Bỏ tệp đính kèm</button>
      </div>
      <p class="supervision__hint supervision__attachment-name" data-selected-attachment hidden></p>
      <p class="supervision__error" id="${id}-error" role="alert" hidden></p>`;
    const input = host.querySelector('input');
    const remove = host.querySelector('[data-remove-attachment]');
    const selected = host.querySelector('[data-selected-attachment]');
    const error = host.querySelector('[role="alert"]');

    function validate() {
      const file = input.files[0];
      const problem = file && (file.size === 0 ? 'Tệp đính kèm đang rỗng.'
        : file.size > store.attachmentLimit ? `Tệp đính kèm phải có dung lượng tối đa ${limitText}.` : '');
      selected.hidden = remove.hidden = !file;
      selected.textContent = file ? `${file.name} · ${formatSize(file.size)}` : '';
      error.hidden = !problem;
      error.textContent = problem || '';
      if (problem) input.setAttribute('aria-invalid', 'true');
      else input.removeAttribute('aria-invalid');
      return !problem;
    }

    input.addEventListener('change', validate);
    input.form.addEventListener('reset', () => queueMicrotask(validate));
    remove.addEventListener('click', () => {
      input.value = '';
      validate();
      input.focus();
    });
    return { getFile: () => input.files[0], validate, focus: () => input.focus() };
  }

  function createDownload(attachment, onError) {
    const group = document.createElement('div');
    group.className = 'supervision__topline supervision__attachment';
    const name = document.createElement('span');
    name.className = 'supervision__attachment-name';
    name.textContent = `${attachment.name} · ${formatSize(attachment.size)}`;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'supervision__button';
    button.textContent = 'Tải tệp';
    button.setAttribute('aria-label', `Tải tệp ${attachment.name}`);
    group.append(name, button);

    button.addEventListener('click', async () => {
      button.disabled = true;
      onError('');
      try {
        const file = await store.getAttachment(attachment);
        const url = URL.createObjectURL(file);
        const link = document.createElement('a');
        link.href = url;
        link.download = attachment.name;
        document.body.append(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch (error) {
        onError(error.message);
      } finally {
        button.disabled = false;
      }
    });
    return group;
  }

  window.IE104SupervisionAttachments = Object.freeze({ createPicker, createDownload });
})();
