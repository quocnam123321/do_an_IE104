(() => {
  const app = globalThis.IE104 ||= {};
  app.shared ||= {};

  const outlineDate = value => value ? value.split('-').reverse().join('/') : '';
  const sampleName = 'de-cuong-de-tai-mau.txt';

  function render(container, record) {
    const outline = record.outline;
    const attachment = typeof record.attachment === 'string'
      ? record.attachment
      : record.attachment?.name || record.attachmentName;
    const attachmentSize = record.attachmentSize ?? record.attachment?.size;
    const semester = record.semester && `Học kỳ ${['he', 'summer'].includes(record.semester) ? '3' : record.semester}`;
    const academicYear = record.academicYear?.replace(/\s*[-–]\s*/, ' – ');
    const fields = {
      ...record,
      englishTitle: outline?.englishTitle,
      topicCode: record.topicCode || record.id,
      semester,
      academicYear,
      academicPeriod: [semester, academicYear].filter(Boolean).join(' · '),
      startDate: outlineDate(outline?.startDate),
      endDate: outlineDate(outline?.endDate),
      methodAndScope: outline?.methodAndScope ?? [outline?.method, outline?.scope || record.scope].filter(Boolean).join('\n\n'),
      plan: outline?.plan,
      attachmentText: attachment,
    };
    for (const field of container.querySelectorAll('[data-proposal-field]')) {
      const value = fields[field.dataset.proposalField];
      const optional = field.hasAttribute('data-optional-field');
      field.textContent = value || (optional ? '' : 'Chưa có thông tin');
      if (optional) field.hidden = !value;
      field.classList.toggle('is-missing', !value);
    }
    for (const section of container.querySelectorAll('[data-optional-section]')) {
      section.hidden = !fields[section.dataset.optionalSection];
    }
    void app.shared.renderProposalCover?.(container.querySelector('.request-topic__image'), record.coverImage);
    renderAttachment(container, {
      name: attachment,
      size: attachmentSize,
      fileKey: record.attachmentFileKey ?? record.attachment?.fileKey,
      sample: record.id === 'DX001' && attachment === sampleName,
      canEdit: record.permissions?.edit,
    });
  }

  function renderAttachment(container, ref) {
    const row = container.querySelector('[data-proposal-attachment]');
    const note = container.querySelector('[data-proposal-attachment-note]');
    const button = row.querySelector('.request-attachments__download');
    const useSample = ref.sample && !ref.fileKey;
    const canDownload = Boolean(ref.name && (ref.fileKey || useSample));
    row.hidden = !ref.name;
    button.disabled = !canDownload;
    let status = '';
    if (!ref.name) status = 'Chưa có tài liệu đính kèm.';
    else if (useSample) status = 'Tệp mẫu của đề xuất DX001.';
    else if (!canDownload) {
      const help = ref.canEdit ? 'Mở Chỉnh sửa đề xuất, chọn lại tệp gốc rồi lưu.' : 'Sinh viên cần đính kèm lại tệp gốc.';
      status = `Tệp này chưa có nội dung để tải xuống. ${help}`;
    }
    note.textContent = status;
    note.hidden = !status;

    async function download() {
      button.disabled = true;
      try {
        const file = useSample ? await readSample() : await app.services.proposalFiles.read(ref);
        if (button.onclick !== download || container.hidden) return;
        app.ui.downloadFile(file);
        note.textContent = status;
        note.hidden = !status;
      } catch (failure) {
        if (button.onclick !== download || container.hidden) return;
        note.hidden = false;
        note.textContent = failure.message;
      } finally {
        if (button.onclick === download) button.disabled = false;
      }
    }

    button.onclick = canDownload ? download : null;
  }

  async function readSample() {
    try {
      const response = await fetch(`../../assets/documents/${sampleName}`);
      if (!response.ok) throw new Error();
      return { blob: await response.blob(), fileName: sampleName };
    } catch {
      throw new Error('Chưa tải được tệp mẫu. Hãy thử lại.');
    }
  }

  app.shared.proposalDetailFields = { render };
})();
