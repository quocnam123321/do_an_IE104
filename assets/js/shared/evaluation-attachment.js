(() => {
  const app = globalThis.IE104 = globalThis.IE104 || {};
  app.ui ||= {};

  app.ui.bindEvaluationAttachmentDownload = (section, attachment) => {
    const control = section.querySelector('.evaluation-attachments__download');
    const note = section.querySelector('.evaluation-attachment-note');
    const databaseFile = attachment.id && attachment.projectId;
    if ((databaseFile || attachment.fileKey) && Number.isSafeInteger(attachment.size) && attachment.size > 0) {
      control.disabled = false;
      note.hidden = true;
      control.addEventListener('click', async () => {
        control.disabled = true;
        note.hidden = true;
        try {
          const file = databaseFile
            ? { fileName: attachment.name, blob: await app.proposalDatabase.readEvaluationAttachment(attachment.projectId, attachment.id) }
            : await app.services.proposalFiles.read(attachment);
          if (control.isConnected) app.ui.downloadFile(file);
        } catch {
          note.textContent = 'Không thể tải tệp đánh giá. Hãy thử lại.';
          note.hidden = false;
        } finally {
          control.disabled = false;
        }
      });
    } else if (typeof attachment.assetFile === 'string' && /^[a-z0-9][a-z0-9._-]*$/i.test(attachment.assetFile)) {
      const link = document.createElement('a');
      link.className = control.className;
      link.href = '../../assets/files/' + encodeURIComponent(attachment.assetFile);
      link.download = attachment.name;
      link.append(...control.childNodes);
      control.replaceWith(link);
      note.hidden = true;
    } else {
      note.hidden = false;
    }
  };
})();
