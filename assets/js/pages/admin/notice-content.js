(() => {
  const articleTags = new Set(["b", "strong", "i", "em", "u", "div", "p", "br", "ul", "ol", "li"]);
  const discardedTags = new Set(["script", "style", "template"]);

  // Keep formatting and uploaded images when copying an article between views.
  // Rebuild the nodes so pasted or stored markup cannot supply attributes or URLs.
  function copyArticle(source, imageFor) {
    const fragment = document.createDocumentFragment();
    for (const node of source.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        fragment.append(node.data);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const tag = node.localName;
        if (tag === "img") {
          const image = imageFor(node.dataset.noticeImage);
          if (image) fragment.append(image);
        } else if (articleTags.has(tag)) {
          const element = document.createElement(tag);
          element.append(copyArticle(node, imageFor));
          fragment.append(element);
        } else if (!discardedTags.has(tag)) {
          fragment.append(copyArticle(node, imageFor));
        }
      }
    }
    return fragment;
  }

  function articleImage(id, file, url) {
    const image = document.createElement("img");
    image.dataset.noticeImage = id;
    image.alt = file.name;
    image.draggable = false;
    if (url) image.src = url;
    return image;
  }

  function renderArticle(target, item, imageFor) {
    if (typeof item.html !== "string") {
      target.textContent = item.body ?? "";
      return;
    }
    const source = document.createElement("template");
    source.innerHTML = item.html;
    const files = new Map((item.images ?? []).map(({ id, file }) => [id, file]));
    target.replaceChildren(copyArticle(source.content, (id) => {
      const file = files.get(id);
      return file && imageFor(id, file);
    }));
  }

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

  globalThis.IE104NoticeContent = { setup, renderArticle, articleImage };
})();
