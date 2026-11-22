(() => {
  const app = globalThis.IE104 ||= {};
  const ui = app.ui ||= {};
  const order = new Intl.Collator('vi', { numeric: true });
  const visibleLimit = 4;
  const disclosure = document.createElement('template');
  disclosure.innerHTML = `
    <details class="topic-filters__more">
      <summary>
        <span class="topic-filters__more-label">Xem thêm</span>
        <span class="topic-filters__less-label">Ẩn bớt</span>
        <span class="visually-hidden"> môn học</span>
        <svg class="topic-filters__more-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
      </summary>
      <div class="topic-filters__more-options"></div>
    </details>`;

  function createOption(name, id, caption, checked) {
    const row = document.createElement('div');
    row.className = 'topic-filters__option';
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.name = name;
    input.value = id;
    input.checked = checked;
    const text = document.createElement('span');
    text.className = 'topic-filters__option-text';
    text.textContent = caption;
    label.append(input, text);
    row.append(label);
    return row;
  }

  ui.renderCourseFilters = (form, courses) => {
    const group = form.querySelector('[data-course-filter]');
    const options = group?.querySelector('.topic-filters__options');
    if (!options) return;

    const byId = new Map();
    for (const { id, label } of courses) {
      if (id && !byId.has(id)) byId.set(id, label || id);
    }
    const entries = [...byId].sort((a, b) => order.compare(a[1], b[1]) || order.compare(a[0], b[0]));
    const previous = [...options.querySelectorAll('input')];
    if (previous.length === entries.length && entries.every(([id, label], index) =>
      previous[index].value === id && previous[index].nextElementSibling.textContent === label)) return;

    const focused = document.activeElement;
    const restoreFocus = options.contains(focused);
    const checked = new Set(previous.filter(input => input.checked).map(input => input.value));
    const rows = entries.map(([id, label]) => createOption(group.dataset.courseFilter, id, label, checked.has(id)));
    const visible = rows.slice(0, visibleLimit);
    if (rows.length > visibleLimit) {
      const more = disclosure.content.firstElementChild.cloneNode(true);
      more.open = Boolean(options.querySelector('details[open]')) ||
        entries.slice(visibleLimit).some(([id]) => checked.has(id) || (restoreFocus && id === focused.value));
      more.querySelector('.topic-filters__more-options').append(...rows.slice(visibleLimit));
      visible.push(more);
    }

    options.replaceChildren(...visible);
    group.hidden = !rows.length;
    if (restoreFocus) {
      const inputs = [...options.querySelectorAll('input')];
      const target = inputs.find(input => input.value === focused.value)
        || options.querySelector('summary') || inputs[0] || form.querySelector('button[type="reset"]');
      target?.focus({ preventScroll: true });
    }
  };
})();
