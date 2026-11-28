(() => {
  const storageKey = "ie104-language";
  const root = document.documentElement;
  const catalog = globalThis.ie104English ?? {};
  const patterns = globalThis.ie104EnglishPatterns ?? [];
  const attributes = ["alt", "title", "placeholder", "aria-label", "aria-description", "aria-valuetext", "label"];
  const descriptionSelector = 'meta[name="description"]';
  const ignored = [
    "script", "style", "noscript", "[contenteditable]", '[translate="no"]',
    ".topic-card__title", ".page-header__topic-name", ".team-member__name",
    ".supervisor-dialog__name", ".student-evaluation-comment", "[data-upload-filename]",
  ].join(", ");
  const textSources = new WeakMap();
  const attributeSources = new WeakMap();
  const implicitOptions = new WeakMap();
  const validityMessages = new Map();

  function readLanguage() {
    try {
      return localStorage.getItem(storageKey) === "en" ? "en" : "vi";
    } catch {
      return null;
    }
  }

  function english(source) {
    const key = source.trim().replace(/\s+/g, " ");
    if (!key) return source;
    let translation = Object.hasOwn(catalog, key) ? catalog[key] : null;
    if (translation === null) {
      for (const [pattern, replacement] of patterns) {
        const result = key.replace(pattern, replacement);
        if (result !== key) {
          translation = result;
          break;
        }
      }
    }
    if (translation === null && key.includes(" | ")) {
      const parts = key.split(" | ");
      const translated = parts.map(english).join(" | ");
      if (translated !== key) translation = translated;
    }
    return translation === null ? source : source.replace(/\S[\s\S]*\S|\S/, () => translation);
  }

  let language = readLanguage() ?? "vi";

  function sourceText(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const previous = textSources.get(node);
      return previous?.translated === node.data ? previous.source : node.data;
    }
    return Array.from(node.childNodes, sourceText).join("");
  }

  // Renderers that read labels from the DOM can keep using the original source.
  globalThis.IE104Language = Object.freeze({
    sourceText,
    optionLabel(option) {
      const label = option.getAttribute("label");
      if (label === null) return sourceText(option).trim().replace(/\s+/g, " ");
      const previous = attributeSources.get(option)?.get("label");
      return previous?.translated === label ? previous.source : label;
    },
    setCustomValidity(control, source) {
      if (source) validityMessages.set(control, source);
      else validityMessages.delete(control);
      control.setCustomValidity(language === "en" ? english(source) : source);
    },
  });

  function translateText(node) {
    const element = node.parentElement;
    if (!element || element.closest(ignored) || element.closest("textarea")) return;

    const displayed = node.data;
    const previous = textSources.get(node);
    const source = previous?.translated === displayed ? previous.source : displayed;
    const updated = language === "en" ? english(source) : source;

    if (updated !== source) textSources.set(node, { source, translated: updated });
    else textSources.delete(node);

    // Option.value falls back to its text if no value attribute is present.
    if (element.tagName === "OPTION") {
      if (language === "en" && updated !== source && !element.hasAttribute("value")) {
        const value = element.value;
        implicitOptions.set(element, value);
        element.value = value;
      } else if (language === "vi" && implicitOptions.has(element)) {
        if (element.value === implicitOptions.get(element)) element.removeAttribute("value");
        implicitOptions.delete(element);
      }
    }

    if (updated !== displayed) node.data = updated;
  }

  function translateAttribute(element, name) {
    if (element.closest(ignored)) return;
    const displayed = element.getAttribute(name);
    let sources = attributeSources.get(element);
    const previous = sources?.get(name);
    const source = previous?.translated === displayed ? previous.source : displayed;
    if (source === null) {
      sources?.delete(name);
      return;
    }
    const updated = language === "en" ? english(source) : source;
    if (updated !== source) {
      if (!sources) {
        sources = new Map();
        attributeSources.set(element, sources);
      }
      sources.set(name, { source, translated: updated });
    } else {
      sources?.delete(name);
    }

    if (updated !== displayed) element.setAttribute(name, updated);
  }

  function translateElement(element) {
    for (const attribute of attributes) {
      if (element.hasAttribute(attribute)) translateAttribute(element, attribute);
    }
    if (element.matches(descriptionSelector)) translateAttribute(element, "content");
  }

  function translateTree(tree) {
    if (tree.nodeType === Node.TEXT_NODE) {
      translateText(tree);
      return;
    }
    if (tree.nodeType !== Node.ELEMENT_NODE || tree.closest(ignored)) return;
    translateElement(tree);
    const walker = document.createTreeWalker(tree, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        return node.nodeType === Node.ELEMENT_NODE && node.matches(ignored)
          ? NodeFilter.FILTER_REJECT
          : NodeFilter.FILTER_ACCEPT;
      },
    });
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.nodeType === Node.TEXT_NODE) translateText(node);
      else translateElement(node);
    }
  }

  function isLocalizedAttribute(element, name) {
    return attributes.includes(name) || (name === "content" && element.matches(descriptionSelector));
  }

  const observer = new MutationObserver((changes) => {
    observer.disconnect();
    const added = new Set();
    for (const change of changes) {
      if (change.type === "childList") {
        for (const node of change.addedNodes) if (node.isConnected) added.add(node);
      } else if (change.target.isConnected) {
        if (change.type === "characterData") translateText(change.target);
        if (change.type === "attributes" && isLocalizedAttribute(change.target, change.attributeName)) {
          translateAttribute(change.target, change.attributeName);
        }
      }
    }
    for (const node of added) translateTree(node);
    observe();
  });

  function observe() {
    observer.observe(root, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...attributes, "content"],
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    const container = document.querySelector(".site-header .site-preferences, .theme-toolbar");
    if (!container) return;

    const toggle = document.createElement("button");
    const label = document.createElement("span");
    toggle.className = "language-toggle";
    toggle.type = "button";
    toggle.translate = false;
    toggle.append(label);
    container.append(toggle);

    function applyLanguage(next) {
      observer.disconnect();
      language = next;
      root.lang = language;
      const isEnglish = language === "en";
      label.lang = isEnglish ? "vi" : "en";
      label.textContent = isEnglish ? "VI" : "EN";
      const name = isEnglish ? "Switch to Vietnamese" : "Chuyển sang tiếng Anh";
      toggle.setAttribute("aria-label", name);
      toggle.title = name;
      translateTree(root);
      for (const [control, source] of validityMessages) {
        if (control.isConnected && control.validity.customError) {
          control.setCustomValidity(language === "en" ? english(source) : source);
        } else {
          validityMessages.delete(control);
        }
      }
      observe();
      document.dispatchEvent(new Event("ie104:languagechange"));
    }

    toggle.addEventListener("click", () => {
      applyLanguage(language === "en" ? "vi" : "en");
      try {
        localStorage.setItem(storageKey, language);
      } catch {
        // The current page can still switch language when storage is blocked.
      }
    });

    window.addEventListener("storage", (event) => {
      if (event.key === storageKey || event.key === null) {
        const saved = readLanguage();
        if (saved && saved !== language) applyLanguage(saved);
      }
    });
    window.addEventListener("pageshow", (event) => {
      if (event.persisted) applyLanguage(readLanguage() ?? language);
    });

    // Initializers can read the original markup before translating the rendered interface.
    setTimeout(() => applyLanguage(readLanguage() ?? language), 0);
  });
})();
