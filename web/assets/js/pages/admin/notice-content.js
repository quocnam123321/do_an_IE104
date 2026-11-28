(() => {
  const { copyArticle, renderArticle, articleImage } = globalThis.IE104NoticeArticle;

  function setup(element, toolbar, reportError) {
    const picker = toolbar.querySelector('input[type="file"]');
    const insert = toolbar.querySelector("#admin-notice-insert-image");
    const format = toolbar.querySelectorAll("[data-notice-format]");
    const files = new Map();
    let caret;
    let session = 0;
    let busy = false;

    function rememberCaret() {
      const selection = document.getSelection();
      if (!selection.rangeCount || !element.contains(selection.getRangeAt(0).commonAncestorContainer)) return;
      caret = selection.getRangeAt(0).cloneRange();
      for (const button of format) {
        button.setAttribute("aria-pressed", String(document.queryCommandState(button.dataset.noticeFormat)));
      }
    }

    function restoreCaret() {
      element.focus();
      const range = caret?.cloneRange() ?? document.createRange();
      if (!caret || !element.contains(range.commonAncestorContainer)) {
        range.selectNodeContents(element);
        range.collapse(false);
      }
      const selection = document.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }

    function reset(item = {}) {
      session += 1;
      busy = false;
      caret = undefined;
      for (const { url } of files.values()) URL.revokeObjectURL(url);
      files.clear();
      for (const button of format) button.setAttribute("aria-pressed", "false");
      renderArticle(element, item, (id, file) => {
        if (!files.has(id)) files.set(id, { file, url: URL.createObjectURL(file) });
        return articleImage(id, file, files.get(id).url);
      });
    }

    function read() {
      const images = new Map();
      const snapshot = document.createElement("div");
      snapshot.append(copyArticle(element, (id) => {
        const entry = files.get(id);
        if (!entry) return;
        images.set(id, { id, file: entry.file });
        return articleImage(id, entry.file);
      }));
      return { body: element.innerText.trim(), html: snapshot.innerHTML, images: [...images.values()] };
    }

    document.addEventListener("selectionchange", rememberCaret);
    toolbar.addEventListener("mousedown", (event) => {
      if (event.target.closest("button")) event.preventDefault();
    });
    for (const button of format) {
      button.addEventListener("click", () => {
        restoreCaret();
        document.execCommand(button.dataset.noticeFormat);
        rememberCaret();
      });
    }
    element.addEventListener("paste", (event) => {
      event.preventDefault();
      document.execCommand("insertText", false, event.clipboardData.getData("text/plain"));
    });
    element.addEventListener("dragover", (event) => event.preventDefault());
    element.addEventListener("drop", (event) => event.preventDefault());
    element.addEventListener("click", (event) => {
      if (!event.target.matches("img")) return;
      const range = document.createRange();
      range.selectNode(event.target);
      element.focus();
      const selection = document.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      rememberCaret();
    });
    insert.addEventListener("click", () => {
      if (!busy) picker.click();
    });
    picker.addEventListener("change", async () => {
      const [file] = picker.files;
      picker.value = "";
      if (!file) return;
      const error = globalThis.IE104AdminNotices.validateImage(file);
      if (error) {
        reportError(error, insert);
        return;
      }
      const opened = session;
      const url = URL.createObjectURL(file);
      const id = "image-" + (files.size + 1);
      const image = articleImage(id, file, url);
      busy = true;
      try {
        await image.decode();
        if (opened !== session) return;
        restoreCaret();
        // Use the browser's editing command so inserting an image supports undo.
        if (!document.execCommand("insertHTML", false, image.outerHTML)) {
          reportError("Không thể chèn ảnh. Hãy thử lại.", insert);
          return;
        }
        files.set(id, { file, url });
        rememberCaret();
      } catch {
        if (opened === session) reportError("Không thể mở ảnh này. Hãy chọn ảnh khác.", insert);
      } finally {
        if (opened === session) busy = false;
        if (files.get(id)?.url !== url) URL.revokeObjectURL(url);
      }
    });
    return { element, reset, read, get busy() { return busy; } };
  }

  globalThis.IE104NoticeContent = { setup };
})();
