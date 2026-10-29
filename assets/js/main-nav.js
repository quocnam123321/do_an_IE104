/* Shared underline for the public header; links keep their native navigation. */
(() => {
  const mobile = window.matchMedia("(max-width: 48rem)");

  document.querySelectorAll(".main-nav").forEach((nav) => {
    const links = [...nav.querySelectorAll(".main-nav__list a[href]")];
    const indicator = nav.querySelector(".main-nav__indicator");
    const menu = nav.closest(".main-nav-menu");
    const toggle = menu?.querySelector(".main-nav-menu__toggle");
    if (!indicator || !links.length) return;

    let hoveredLink = null;
    let compact = mobile.matches;
    let layoutFrame = 0;
    let animationFrame = 0;

    const focusedLink = () => links.find((link) => link === document.activeElement);
    const currentLink = () => links.find((link) => link.getAttribute("aria-current") === "page");
    const restingLink = () => focusedLink() || currentLink();

    function moveIndicator(link) {
      if (!link || mobile.matches || !nav.getClientRects().length) return false;
      const navRect = nav.getBoundingClientRect();
      const linkRect = link.getBoundingClientRect();
      const style = getComputedStyle(link);
      const insetLeft = parseFloat(style.paddingLeft) + parseFloat(style.borderLeftWidth);
      const insetRight = parseFloat(style.paddingRight) + parseFloat(style.borderRightWidth);

      // Only the absolutely positioned indicator changes size, never a tab.
      nav.style.setProperty("--indicator-x", `${linkRect.left - navRect.left + insetLeft}px`);
      nav.style.setProperty("--indicator-width", `${Math.max(0, linkRect.width - insetLeft - insetRight)}px`);
      return true;
    }

    function refreshLayout() {
      layoutFrame = 0;
      // ResizeObserver can run before a media-query change event is delivered.
      if (compact !== mobile.matches) {
        syncMenu();
        return;
      }
      cancelAnimationFrame(animationFrame);
      nav.classList.remove("main-nav--animated");
      const positioned = moveIndicator(focusedLink() || hoveredLink || currentLink());
      nav.classList.toggle("main-nav--enhanced", positioned);
      if (!positioned) return;

      // Commit initial geometry before enabling transitions in the next frame.
      indicator.getBoundingClientRect();
      animationFrame = requestAnimationFrame(() => nav.classList.add("main-nav--animated"));
    }

    function scheduleLayout() {
      if (!layoutFrame) layoutFrame = requestAnimationFrame(refreshLayout);
    }

    links.forEach((link) => {
      link.addEventListener("pointerenter", (event) => {
        if (event.pointerType === "touch") return;
        hoveredLink = link;
        moveIndicator(link);
      });
      link.addEventListener("pointerdown", () => moveIndicator(link));
      link.addEventListener("focus", () => moveIndicator(link));
    });

    nav.addEventListener("pointerleave", () => {
      hoveredLink = null;
      moveIndicator(restingLink());
    });
    nav.addEventListener("focusout", () => {
      // The new activeElement is available after the focus event sequence.
      queueMicrotask(() => moveIndicator(focusedLink() || hoveredLink || currentLink()));
    });

    function syncMenu() {
      compact = mobile.matches;
      hoveredLink = null;
      if (menu) {
        const linkHadFocus = Boolean(focusedLink());
        const toggleHadFocus = document.activeElement === toggle;
        menu.open = !mobile.matches;
        if (mobile.matches && linkHadFocus) toggle?.focus();
        if (!mobile.matches && toggleHadFocus) currentLink()?.focus();
      }
      refreshLayout();
    }

    menu?.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || !mobile.matches || !menu.open) return;
      menu.open = false;
      toggle?.focus();
    });
    menu?.addEventListener("toggle", scheduleLayout);
    mobile.addEventListener("change", syncMenu);
    window.addEventListener("resize", scheduleLayout);
    window.addEventListener("pageshow", scheduleLayout);

    if ("ResizeObserver" in window) {
      const observer = new ResizeObserver(scheduleLayout);
      observer.observe(nav);
      nav.querySelectorAll(".main-nav__list, .main-nav__list > li, .main-nav__list a").forEach((element) => observer.observe(element));
    }
    // A translation or CSS/class change may move tabs without resizing nav.
    const mutations = new MutationObserver(scheduleLayout);
    mutations.observe(nav.querySelector(".main-nav__list"), {
      subtree: true, childList: true, characterData: true, attributes: true,
      attributeFilter: ["aria-current", "class", "style", "dir"]
    });
    if (document.fonts) {
      document.fonts.ready.then(scheduleLayout);
      document.fonts.addEventListener("loadingdone", scheduleLayout);
    }

    syncMenu();
  });
})();
