(() => {
  const app = globalThis.IE104 ||= {};
  app.shared ||= {};

  async function renderProposalCover(frame, ref) {
    if (!frame) return;
    const previous = frame.querySelector('img[data-proposal-cover]');
    if (previous?.dataset.proposalCover === ref?.fileKey) return;
    previous?.remove();
    if (!ref?.fileKey) return;

    const image = document.createElement('img');
    image.dataset.proposalCover = ref.fileKey;
    image.alt = '';
    image.hidden = true;
    frame.append(image);
    let url;
    try {
      const { blob } = await app.services.proposalFiles.read(ref);
      if (image.parentElement !== frame || !frame.isConnected) return;
      url = URL.createObjectURL(blob);
      image.src = url;
      await image.decode();
      image.hidden = false;
    } catch {
      image.remove();
    } finally {
      if (url) URL.revokeObjectURL(url);
    }
  }

  app.shared.renderProposalCover = renderProposalCover;
})();
