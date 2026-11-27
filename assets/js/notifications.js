(() => {
  const page = document.querySelector('.notifications-page');
  const notifications = window.IE104_NOTIFICATIONS;
  if (!page || !Array.isArray(notifications)) return;

  const title = page.querySelector('#notification-list-title');
  const tools = page.querySelector('.notification-tools');
  const list = page.querySelector('.notification-list__items');
  const footer = page.querySelector('.notification-list__footer');
  const template = list?.firstElementChild?.cloneNode(true);
  if (!title || !tools || !list || !footer || !template) return;

  const pageSize = 12;
  const routes = window.IE104_NOTIFICATION_ROUTES;
  if (!routes) return;
  const categories = routes.categories;
  const mobile = tools.querySelector('.notification-tools__mobile');
  const count = footer.querySelector('p');
  if (!count) return;
  count.setAttribute('role', 'status');
  count.setAttribute('aria-live', 'polite');
  count.setAttribute('aria-atomic', 'true');
  title.tabIndex = -1;

  let pagination = footer.querySelector('.pagination');
  if (!pagination) {
    pagination = document.createElement('nav');
    pagination.className = 'pagination';
    pagination.setAttribute('aria-label', 'Phân trang thông báo');
    footer.append(pagination);
  }

  const empty = document.createElement('div');
  empty.className = 'empty-state';
  const emptyMessage = document.createElement('p');
  emptyMessage.textContent = 'Chưa có thông báo thuộc loại này. Hãy chọn loại khác hoặc xem tất cả thông báo.';
  empty.append(emptyMessage);
  empty.hidden = true;
  list.after(empty);

  const readState = () => routes.read(window.location.href);
  const stateUrl = (category, number) => routes.url(window.location.href, category, number);

  function createCard(notification, filtered) {
    const item = template.cloneNode(true);
    const card = item.querySelector('.notification-card');
    const link = item.querySelector('.notification-card__link');
    const heading = item.querySelector('h2');
    const date = item.querySelector('time');
    const headingId = `notification-${notification.id}-title`;
    card.id = `thong-bao-${notification.id}`;
    card.dataset.category = notification.category;
    card.setAttribute('aria-labelledby', headingId);
    link.setAttribute('aria-labelledby', headingId);
    link.href = `chi-tiet-thong-bao.html?id=${notification.id}${filtered ? '#tu-bo-loc' : ''}`;
    heading.id = headingId;
    heading.textContent = notification.title;
    date.dateTime = notification.date;
    date.textContent = notification.date.split('-').reverse().join('-');
    item.querySelector('.notification-card__summary').textContent = notification.summary;
    return item;
  }

  function addPageControl(container, label, number, current, category, options = {}) {
    const item = document.createElement('li');
    let control;
    if (options.disabled) {
      control = document.createElement('button');
      control.type = 'button';
      control.disabled = true;
    } else if (current) {
      control = document.createElement('span');
      control.setAttribute('aria-current', 'page');
    } else {
      control = document.createElement('a');
      control.className = 'button';
      control.href = stateUrl(category, number).href;
      control.dataset.notificationPage = String(number);
      if (options.rel) control.rel = options.rel;
    }
    control.textContent = label;
    control.setAttribute('aria-label', options.ariaLabel || `Trang ${number}`);
    item.append(control);
    container.append(item);
  }

  function render() {
    const { category, number: requested } = readState();
    const filtered = notifications.filter((item) => !category.value || item.category === category.value);
    const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const number = Math.min(requested, pages);
    const start = (number - 1) * pageSize;
    title.textContent = category.title || category.label;
    document.title = `${title.textContent} | Quản lý đồ án và khóa luận`;

    for (const link of tools.querySelectorAll('.notification-categories a')) {
      const selected = routes.read(link.href).category.value === category.value;
      if (selected) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    }
    if (mobile) mobile.querySelector('summary').textContent = `Loại thông báo · ${category.label}`;

    list.replaceChildren(...filtered.slice(start, start + pageSize).map((item) => createCard(item, Boolean(category.value))));
    list.start = start + 1;
    list.hidden = filtered.length === 0;
    empty.hidden = filtered.length !== 0;
    count.textContent = filtered.length
      ? `Hiển thị ${start + 1}–${Math.min(start + pageSize, filtered.length)} trong ${filtered.length} thông báo`
      : 'Không có thông báo phù hợp.';

    const controls = document.createElement('ul');
    addPageControl(controls, 'Trước', number - 1, false, category, { disabled: number === 1, rel: 'prev', ariaLabel: 'Trang trước' });
    for (let index = 1; index <= pages; index += 1) {
      addPageControl(controls, String(index), index, index === number, category);
    }
    addPageControl(controls, 'Sau', number + 1, false, category, { disabled: number === pages, rel: 'next', ariaLabel: 'Trang sau' });
    pagination.replaceChildren(controls);
    pagination.hidden = pages < 2;

    // Chuẩn hóa chỉ số vượt phạm vi, giữ đường dẫn trang tĩnh khi mở bằng file://.
    if (number !== requested) {
      const url = new URL(window.location.href);
      url.searchParams.set('trang', number);
      window.history.replaceState(null, '', url.href);
    }
  }

  function navigate(url, focusResults) {
    try {
      window.history.pushState(null, '', url.href);
    } catch {
      // Một số trình duyệt không cho pushState sang file HTML khác ở file://.
      window.location.assign(url.href);
      return;
    }
    render();
    if (focusResults) {
      title.focus({ preventScroll: true });
      title.scrollIntoView({ block: 'start' });
    } else if (mobile?.open) {
      mobile.open = false;
      mobile.querySelector('summary').focus();
    }
  }

  page.addEventListener('click', (event) => {
    const link = event.target.closest('a');
    if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target || link.hasAttribute('download')) return;
    const categoryLink = link.closest('.notification-categories');
    const pageLink = link.hasAttribute('data-notification-page');
    if (!categoryLink && !pageLink) return;
    event.preventDefault();
    navigate(new URL(link.href), pageLink);
  });

  window.addEventListener('popstate', render);
  render();
})();
