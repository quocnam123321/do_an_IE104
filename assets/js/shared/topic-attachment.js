(() => {
  const app = globalThis.IE104 ||= {};
  const ui = app.ui ||= {};
  const sampleName = 'Báo cáo đồ án minh họa.pdf';
  const samplePath = '../../assets/files/bai-nop-minh-hoa.pdf';

  ui.createTopicAttachment = section => {
    const row = section.querySelector('[data-topic-attachment]');
    const name = section.querySelector('[data-topic-attachment-name]');
    const empty = section.querySelector('[data-topic-attachment-empty]');
    const button = section.querySelector('[data-topic-attachment-download]');
    const status = section.querySelector('[data-topic-attachment-status]');
    let current;

    async function render(topic, readAttachment) {
      const attachmentName = topic.attachmentName || topic.attachmentRef?.name;
      const sample = !attachmentName && topic.attachmentRef === undefined &&
        topic.ownerId === 'GV001' && (topic.catalogId || topic.id) === 'ISE-002';
      const fileName = attachmentName || (sample ? sampleName : '');
      const key = topic.attachmentRef?.key;
      if (current?.id === topic.id && current.fileName === fileName && current.key === key && current.sample === sample) return;
      const selection = { id: topic.id, fileName, key, sample, readAttachment };
      current = selection;
      status.textContent = '';
      name.textContent = fileName;
      row.hidden = !fileName;
      empty.hidden = Boolean(fileName);
      button.disabled = !sample;
      if (!attachmentName) return;

      try {
        const file = await readAttachment();
        if (current !== selection) return;
        button.disabled = !file;
        if (!file) status.textContent = 'Chưa có tệp tài liệu thực để tải xuống';
      } catch (failure) {
        if (current === selection) status.textContent = failure.message;
      }
    }

    button.addEventListener('click', async () => {
      const selection = current;
      if (!selection || button.disabled) return;
      status.textContent = '';
      button.disabled = true;
      try {
        let file;
        if (selection.sample) {
          const response = await fetch(samplePath);
          if (response.ok) file = { blob: await response.blob(), fileName: selection.fileName };
        } else {
          file = await selection.readAttachment();
        }
        if (current !== selection) return;
        if (!file) throw new Error('Chưa có tệp tài liệu thực để tải xuống');
        ui.downloadFile(file);
        status.textContent = 'Đã bắt đầu tải tài liệu.';
      } catch (failure) {
        if (current === selection) status.textContent = failure.message;
      } finally {
        if (current === selection) button.disabled = false;
      }
    });

    return render;
  };
})();
