(() => {
  const storageKey = "ie104-theme";
  const root = document.documentElement;

  function readTheme() {
    try {
      return localStorage.getItem(storageKey) === "dark" ? "dark" : "light";
    } catch {
      return null;
    }
  }

  // Chạy trong head để áp dụng lựa chọn trước khi trình duyệt vẽ nội dung.
  let theme = readTheme() ?? "light";
  root.dataset.theme = theme;

  document.addEventListener("DOMContentLoaded", () => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "theme-toggle";
    button.setAttribute("aria-label", "Chế độ tối");
    button.title = "Chế độ tối";
    button.innerHTML = `
      <svg data-theme-icon="moon" aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20.9 13.3a9 9 0 0 1-10.2-10.2 9 9 0 1 0 10.2 10.2Z" />
      </svg>
      <svg data-theme-icon="sun" aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4m0-14.2-1.4 1.4M6.3 17.7l-1.4 1.4" />
      </svg>`;
    const moonIcon = button.querySelector('[data-theme-icon="moon"]');
    const sunIcon = button.querySelector('[data-theme-icon="sun"]');

    function applyTheme(value) {
      theme = value;
      root.dataset.theme = theme;
      const isDark = theme === "dark";
      button.setAttribute("aria-pressed", String(isDark));
      moonIcon.toggleAttribute("hidden", isDark);
      sunIcon.toggleAttribute("hidden", !isDark);
    }

    applyTheme(readTheme() ?? theme);
    button.addEventListener("click", () => {
      applyTheme(theme === "dark" ? "light" : "dark");
      try {
        localStorage.setItem(storageKey, theme);
      } catch {
        // Vẫn đổi giao diện trên trang hiện tại nếu trình duyệt chặn lưu trữ.
      }
    });

    window.addEventListener("storage", (event) => {
      if (event.storageArea === localStorage && (event.key === storageKey || event.key === null)) {
        applyTheme(readTheme() ?? theme);
      }
    });
    window.addEventListener("pageshow", (event) => {
      if (event.persisted) applyTheme(readTheme() ?? theme);
    });

    const header = document.querySelector(".site-header .site-header__inner");
    if (header) {
      const action = header.querySelector(":scope > :is(.site-header__login, .account-menu, .mobile-nav)");
      const preferences = document.createElement("div");
      preferences.className = "site-preferences";
      preferences.append(button);
      header.insertBefore(preferences, action);
      header.classList.add("site-header__inner--theme");
    } else {
      const toolbar = document.createElement("div");
      toolbar.className = "theme-toolbar";
      toolbar.append(button);
      document.querySelector("main").before(toolbar);
    }
  });
})();
