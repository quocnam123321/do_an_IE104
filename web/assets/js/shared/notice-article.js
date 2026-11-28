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

  globalThis.IE104NoticeArticle = { copyArticle, renderArticle, articleImage };
})();
