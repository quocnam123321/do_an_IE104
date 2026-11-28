(() => {
  const id = new URLSearchParams(location.search).get('id');
  const archiveDetail = /^\d{2}$/.test(id) && window.IE104_NOTIFICATION_DETAILS?.[id];
  const article = document.querySelector('[data-notice-article]');
  const layout = document.querySelector('[data-notice-layout]');
  const back = document.querySelector('[data-notice-back]');
  const related = document.querySelector('[data-notice-related]');
  const fallback = document.querySelector('[data-notice-fallback]');
  const description = document.querySelector('meta[name="description"]');
  const { readPublished, isPublishedId, onPublicationChange } = globalThis.IE104AcademicNotices;
  const { renderArticle, articleImage } = globalThis.IE104NoticeArticle;
  const urls = [];

  function showArticle(visible) {
    fallback.hidden = visible;
    layout.hidden = !visible;
    back.hidden = !visible;
  }

  if (archiveDetail) {
    document.title = archiveDetail.title;
    description.content = archiveDetail.description;
    article.className = archiveDetail.articleClass;
    article.innerHTML = archiveDetail.html;
    related.innerHTML = archiveDetail.related;
    back.querySelector('.back-link--list').href = archiveDetail.back;
    back.querySelector('.back-link--filtered').href = archiveDetail.filteredBack;
    showArticle(true);
    return;
  }
  if (!isPublishedId(id)) return;

  function objectUrl(file) {
    const url = URL.createObjectURL(file);
    urls.push(url);
    return url;
  }

  function relatedArticle(item) {
    const row = document.querySelector('#published-notice-related-template').content.cloneNode(true);
    const link = row.querySelector('a');
    link.href = `chi-tiet-thong-bao.html?id=${item.id}#tu-bo-loc`;
    link.textContent = item.title;
    const date = row.querySelector('time');
    date.dateTime = item.date;
    date.textContent = item.date.split('-').reverse().join('-');
    return row;
  }

  function renderPublished(item) {
    document.title = item.title;
    description.content = item.summary || item.title;
    article.className = 'notification-detail notification-detail--faculty';
    article.replaceChildren(document.querySelector('#published-notice-template').content.cloneNode(true));
    article.querySelector('h1').textContent = item.title;
    const date = article.querySelector('time');
    date.dateTime = item.publishedAt;
    date.textContent = `${item.date.split('-').reverse().join('/')} - ${item.time}`;
    renderArticle(article.querySelector('.notification-detail__content'), item, (imageId, file) =>
      articleImage(imageId, file, objectUrl(file)));

    if (item.attachment) {
      const attachment = document.createElement('p');
      attachment.className = 'notification-attachments';
      const link = document.createElement('a');
      link.href = objectUrl(item.attachment);
      link.download = item.attachment.name;
      link.textContent = item.attachment.name;
      link.translate = false;
      attachment.append(link);
      article.append(attachment);
    }

    related.replaceChildren(...window.IE104_NOTIFICATIONS
      .filter((notice) => notice.category === item.category).slice(0, 4).map(relatedArticle));
    back.querySelector('.back-link--filtered').href = `thong-bao.html?loai=${item.category}`;
  }

  async function refreshPublication() {
    let item;
    try {
      [item] = await readPublished(id);
    } catch {
      showArticle(false);
      return;
    }
    while (urls.length) URL.revokeObjectURL(urls.pop());
    if (item) renderPublished(item);
    else {
      article.replaceChildren();
      document.title = 'Chi tiết thông báo';
      description.content = '';
    }
    showArticle(Boolean(item));
  }

  fallback.hidden = true;
  onPublicationChange(refreshPublication);
  refreshPublication();
})();
