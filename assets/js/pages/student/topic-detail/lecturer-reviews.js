(() => {
  const app = globalThis.IE104;
  const panel = document.getElementById('tien-do');
  const projectId = document.body.dataset.projectId;
  if (!panel || !projectId || !app?.storage?.readTeachingRecords) return;
  const section = document.createElement('section');
  section.className = 'content-card lecturer-progress-reviews';
  const heading = document.createElement('h2');
  heading.textContent = 'Nhận xét của giảng viên';
  const content = document.createElement('div');
  section.append(heading, content);
  panel.append(section);
  function render() {
    content.replaceChildren();
    try {
      const reviews = app.storage.readTeachingRecords().find(record => record.projectId === projectId)?.progressReviews || [];
      if (!reviews.length) { const message = document.createElement('p'); message.textContent = 'Chưa có nhận xét tiến độ.'; content.append(message); }
      reviews.forEach(review => {
        const article = document.createElement('article');
        const title = document.createElement('h3');
        title.textContent = review.taskTitle;
        const metadata = document.createElement('p');
        metadata.textContent = `${review.authorName} - ${new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(review.createdAt))}`;
        const text = document.createElement('p');
        text.textContent = review.content;
        text.style.whiteSpace = 'pre-wrap';
        article.append(title, metadata, text);
        content.append(article);
      });
    } catch (failure) { const message = document.createElement('p'); message.textContent = failure.message; message.setAttribute('role', 'alert'); content.append(message); }
  }
  window.addEventListener('pageshow', render);
  window.addEventListener('storage', event => { if ([app.storage.teachingKey, null].includes(event.key)) render(); });
  render();
})();
