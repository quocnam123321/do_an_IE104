(() => {
  const app = globalThis.IE104 ||= {};
  const ui = app.ui ||= {};

  ui.createTopicListEmpty = (anchor, form, search, copy) => {
    const panel = document.createElement('section');
    panel.className = 'topic-list-empty';
    if (copy.id) panel.id = copy.id;
    panel.hidden = true;

    const title = document.createElement('h3');
    const description = document.createElement('p');
    const clear = document.createElement('button');
    clear.type = 'button';
    clear.textContent = 'Xóa tìm kiếm và bộ lọc';
    clear.addEventListener('click', () => {
      search.focus({ preventScroll: true });
      form.reset();
    });
    panel.append(title, description, clear);
    anchor.after(panel);

    return (hasResults, hasItems) => {
      panel.hidden = hasResults;
      if (hasResults) return;
      title.textContent = hasItems ? copy.noResultsTitle || 'Không tìm thấy đề tài' : copy.emptyTitle;
      description.textContent = hasItems
        ? 'Thử từ khóa khác hoặc thay đổi bộ lọc đang chọn.'
        : copy.emptyDescription;
      clear.hidden = !hasItems;
    };
  };
})();
