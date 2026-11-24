(() => {
  const pages = globalThis.uitNoticeIndex;
  if (!pages?.length) return;

  const params = new URLSearchParams(location.search);
  const articleId = params.get('bai');
  const requested = Number(params.get('trang'));
  const pageIndex = Number.isSafeInteger(requested)
    ? Math.min(pages.length, Math.max(1, requested)) - 1
    : 0;
  const currentPage = pages[pageIndex];
  const fallback = document.querySelector('[data-uit-fallback]');
  const originalHost = 'https://ise.uit.edu.vn';
  const fullDetails = new Map([
    ['vinh-danh-sinh-vien-dat-diem-kltn-cao-nhat-hkii-nam-hoc-2025-2026', 'chi-tiet-thong-bao.html?id=01'],
    ['thong-bao-thoi-gian-bao-ve-khoa-luan-tot-nghiep-hoc-ky-ii-nam-hoc-2025-2026', 'chi-tiet-thong-bao.html?id=02'],
    ['khoa-kh-kttt-k-ho-ch-th-c-hi-n-h-c-ph-n-d-an-hki-nh2025-2026', 'chi-tiet-thong-bao.html?id=03'],
    ['kh-kttt-thong-bao-k-ho-ch-th-c-hi-n-kltn-h-c-ky-i-nam-h-c-2025-2026', 'chi-tiet-thong-bao.html?id=04'],
    ['kh-kttt-thong-tin-h-i-d-ng-b-o-v-khoa-lu-n-t-t-nghi-p-h-c-ky-ii-nam-h-c-2024-2025', 'chi-tiet-thong-bao.html?id=05'],
    ['kh-kttt-thong-bao-k-t-qu-bao-cao-ti-n-d-gi-a-ky-kltn-hkii-nh-22024-2025', 'chi-tiet-thong-bao.html?id=06'],
    ['kh-kttt-t-ng-k-t-l-b-o-v-kltn-hki-nh-2024-2025', 'chi-tiet-thong-bao.html?id=07'],
    ['kh-ktt-h-i-d-ng-b-o-v-kltn-hki-nh-2024-2025', 'chi-tiet-thong-bao.html?id=08'],
    ['kh-kttt-k-ho-ch-h-c-v-d-an-hkii-nam-h-c-2024-2025', 'chi-tiet-thong-bao.html?id=09'],
    ['kh-kttt-thong-bao-h-c-v-kltn-hkii-nh-2024-2025', 'chi-tiet-thong-bao.html?id=10'],
    ['kh-kttt-thong-bao-hd-bao-cao-gi-a-ky-kltn-hki-nh-2024-2025', 'chi-tiet-thong-bao.html?id=11'],
    ['thong-bao-th-c-hi-n-kltn-hki-nam-h-c-2024-2025', 'chi-tiet-thong-bao.html?id=12'],
    ['t-ng-k-t-l-b-o-v-khoa-lu-n-t-t-nghi-p-d-t-2-nam-2023', 'chi-tiet-thong-bao.html?id=13'],
    ['kh-kttt-l-b-o-v-khoa-lu-n-t-t-nghi-p-d-t-2-nam-h-c-2022-2023', 'chi-tiet-thong-bao.html?id=14'],
    ['bao-ve-khoa-luan-tot-nghiep-dot-1-nam-hoc-2022-2023', 'chi-tiet-thong-bao.html?id=15'],
    ['thong-bao-cuoi-ky-khoa-luan-tot-nghiep-hk-i-nam-hoc-2022-2023', 'chi-tiet-thong-bao.html?id=16'],
    ['khoa-lu-n-t-t-nghi-p-hk-i-nam-h-c-2022-2023', 'chi-tiet-thong-bao.html?id=17'],
    ['vinh-danh-sinh-vien-d-t-thanh-tich-cao-trong-l-b-o-v-khoa-lu-n-t-t-nghi-p-d-t-2-nam-h-c-2021-2022-nganh-cntt-khdl', 'chi-tiet-thong-bao.html?id=18'],
    ['tong-ket-le-tot-nghiep-thang-06-2022', 'chi-tiet-thong-bao.html?id=19'],
    ['ket-qua-xet-duyet-de-cuong-kltn-hk2-2021-2022', 'chi-tiet-thong-bao.html?id=20'],
    ['n-p-d-cuong-khoa-lu-n-t-t-nghi-p', 'chi-tiet-thong-bao.html?id=21'],
    ['khoa-lu-n-t-t-nghi-p-hk2-nam-h-c-2021-2022', 'chi-tiet-thong-bao.html?id=22'],
    ['vinh-danh-sinh-vien-d-t-di-m-s-cao-nh-t-b-o-v-kltn-nganh-khdl-khoa-2018', 'chi-tiet-thong-bao.html?id=23'],
    ['thong-bao-khoa-lu-n-t-t-nghi-p-hk1-nam-h-c-2021-2022', 'chi-tiet-thong-bao.html?id=24'],
  ]);

  function select(selector) {
    return document.querySelector(selector);
  }

  function detailUrl(slug, page) {
    if (fullDetails.has(slug)) return fullDetails.get(slug);
    const query = new URLSearchParams({ bai: slug, trang: page });
    return `thong-bao-uit.html?${query}`;
  }

  function formatDate(date) {
    return date.split('-').reverse().join('/');
  }

  function createItem([slug, title, date, imageUrl], page, withImage) {
    const item = document.createElement('li');
    const link = document.createElement('a');
    const heading = document.createElement(withImage ? 'h2' : 'h3');
    const time = document.createElement('time');
    link.href = detailUrl(slug, page);
    heading.lang = 'vi';
    heading.translate = false;
    heading.textContent = title;
    time.dateTime = date;
    time.textContent = formatDate(date);

    if (withImage) {
      const image = document.createElement('img');
      image.src = imageUrl;
      image.alt = '';
      image.loading = 'lazy';
      image.decoding = 'async';
      link.append(image);
    }
    link.append(heading, time);
    item.append(link);
    return item;
  }

  if (articleId !== null) {
    if (fullDetails.has(articleId)) {
      location.replace(fullDetails.get(articleId));
      return;
    }
    const sourcePage = pages.findIndex(page => page.some(([slug]) => slug === articleId));
    if (sourcePage < 0) return;
    const entries = pages[sourcePage];
    const [slug, title, date, imageUrl] = entries.find(([id]) => id === articleId);
    select('#uit-detail-title').textContent = title;
    document.title = title;
    const time = select('[data-uit-date]');
    time.dateTime = date;
    time.textContent = formatDate(date);
    select('[data-uit-original]').href = `${originalHost}/vi/bai-viet/${encodeURIComponent(slug)}`;
    select('[data-uit-breadcrumb]').href = `thong-bao-uit.html?trang=${sourcePage + 1}`;

    if (!new URL(imageUrl).pathname.endsWith('/no-thumbnail-v2.jpg')) {
      const image = select('[data-uit-image]');
      image.src = imageUrl;
      image.hidden = false;
      image.addEventListener('error', () => { image.hidden = true; }, { once: true });
    }

    const nearby = entries.length > 1 ? entries : pages[Math.max(0, sourcePage - 1)];
    const relatedPage = entries.length > 1 ? sourcePage : Math.max(0, sourcePage - 1);
    select('[data-uit-related]').append(...nearby.filter(([id]) => id !== slug).slice(0, 4)
      .map(entry => createItem(entry, relatedPage + 1, false)));
    select('[data-uit-detail]').hidden = false;
  } else {
    select('[data-uit-cards]').append(...currentPage.map(entry => createItem(entry, pageIndex + 1, true)));
    const pager = select('[data-uit-pager]');
    let last = -1;
    pages.forEach((_, index) => {
      if (index !== 0 && index !== pages.length - 1 && Math.abs(index - pageIndex) > 1) return;
      if (index > last + 1) {
        const gap = document.createElement('span');
        gap.textContent = '…';
        gap.setAttribute('aria-hidden', 'true');
        pager.append(gap);
      }
      const link = document.createElement('a');
      link.href = `?trang=${index + 1}`;
      link.textContent = index + 1;
      if (index === pageIndex) link.setAttribute('aria-current', 'page');
      pager.append(link);
      last = index;
    });
    select('[data-uit-list]').hidden = false;
  }
  fallback.hidden = true;
})();
