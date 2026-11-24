(() => {
  const id = new URLSearchParams(location.search).get('id');
  if (!id || !/^\d{2}$/.test(id)) return;

  const detail = window.IE104_NOTIFICATION_DETAILS?.[id];
  if (!detail) return;

  const article = document.querySelector('[data-notice-article]');
  const layout = document.querySelector('[data-notice-layout]');
  const back = document.querySelector('[data-notice-back]');

  document.title = detail.title;
  document.querySelector('meta[name="description"]').content = detail.description;
  article.className = detail.articleClass;
  article.innerHTML = detail.html;
  document.querySelector('[data-notice-related]').innerHTML = detail.related;
  back.querySelector('.back-link--list').href = detail.back;
  back.querySelector('.back-link--filtered').href = detail.filteredBack;

  document.querySelector('[data-notice-fallback]').hidden = true;
  layout.hidden = false;
  back.hidden = false;
})();
