/* Progressive enhancement: without JS every role section stays readable. */
(() => {
  const section = document.querySelector(".about-audiences");
  const list = section?.querySelector(".about-audiences__navigation ul");
  if (!list) return;

  const tabs = [...list.querySelectorAll('a[href^="#"]')];
  const panels = tabs.map((tab) => document.getElementById(tab.hash.slice(1)));
  if (!tabs.length || panels.some((panel) => !panel)) return;

  list.setAttribute("role", "tablist");
  list.setAttribute("aria-label", "Vai trò sử dụng hệ thống");
  tabs.forEach((tab, index) => {
    tab.parentElement.setAttribute("role", "presentation");
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", panels[index].id);
    panels[index].setAttribute("role", "tabpanel");
    panels[index].setAttribute("aria-labelledby", tab.id);
    panels[index].tabIndex = 0;
  });

  function select(index, { focus = false, updateHash = false } = {}) {
    tabs.forEach((tab, position) => {
      const selected = position === index;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      panels[position].hidden = !selected;
    });
    if (focus) tabs[index].focus();
    if (updateHash) history.replaceState(history.state, "", tabs[index].hash);
  }

  function indexFromHash(hash) {
    const id = hash.slice(1);
    const target = document.getElementById(id);
    return panels.findIndex((panel) => panel.id === id || (target && panel.contains(target)));
  }

  section.addEventListener("click", (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const index = indexFromHash(link.hash);
    if (index < 0) return;
    event.preventDefault();
    // A link in the upcoming panel must not leave focus inside a hidden panel.
    select(index, { focus: true, updateHash: true });
  });

  list.addEventListener("keydown", (event) => {
    const index = tabs.indexOf(event.target);
    if (index < 0) return;
    let next;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft") next = (index + tabs.length - 1) % tabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    else if (event.key === " ") next = index;
    else return;
    event.preventDefault();
    select(next, { focus: true, updateHash: true });
  });

  window.addEventListener("hashchange", () => {
    const index = indexFromHash(location.hash);
    if (index >= 0) {
      const focusedPanel = panels.find((panel) => panel.contains(document.activeElement));
      select(index, { focus: Boolean(focusedPanel && focusedPanel !== panels[index]) });
    }
  });

  const initial = indexFromHash(location.hash);
  select(initial < 0 ? 0 : initial);
  section.classList.add("about-audiences--tabs");
})();
