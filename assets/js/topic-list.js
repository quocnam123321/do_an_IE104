(() => {
  const form = document.getElementById('topic-filter-form');
  const search = document.getElementById('topic-search');
  const results = document.querySelector('[data-topic-results]');
  if (!form || !search || !results) return;
  const count = results.querySelector('[data-topic-count]');
  const list = results.querySelector('.topic-list');
  const pagination = results.querySelector('.pagination');
  const viewport = list?.closest('.topic-list-scroll');
  const sort = document.getElementById('topic-sort');
  if (!list || !count || !viewport) return;
  const controls = [...form.elements].filter(node => node.matches('input,select'));
  const groups = [...new Set(controls.filter(node => node.type === 'checkbox' || (node.tagName === 'SELECT' && node !== sort)).map(node => node.name))];
  const normalize = value => String(value || '').toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').trim();
  const collator = new Intl.Collator('vi',{ numeric: true });
  let page = 1;
  function readUrl() {
    const params = new URLSearchParams(location.search);
    search.value = params.get('topic_search') || '';
    if (sort && [...sort.options].some(option => option.value === params.get('topic_sort'))) sort.value = params.get('topic_sort');
    for (const control of controls.filter(node => groups.includes(node.name))) {
      if (control.type === 'checkbox') control.checked = params.getAll(control.name).includes(control.value);
      else if (params.has(control.name)) control.value = params.get(control.name);
    }
    const requested = Number(params.get('page')); page = Number.isInteger(requested) && requested > 0 ? requested : 1;
  }
  function writeUrl() {
    const url = new URL(location.href);
    for (const key of [...groups,'topic_search','topic_sort','page']) url.searchParams.delete(key);
    const values = new FormData(form);
    for (const name of groups) for (const value of values.getAll(name)) if (value) url.searchParams.append(name,value);
    if (search.value.trim()) url.searchParams.set('topic_search',search.value.trim());
    if (sort?.value) url.searchParams.set('topic_sort',sort.value);
    if (page > 1) url.searchParams.set('page',String(page));
    try { history.replaceState(null,'',url); } catch {}
  }
  function render(updateUrl = false) {
    const values = new FormData(form); const terms = normalize(search.value).split(/\s+/).filter(Boolean);
    const items = [...list.children].map(item => ({ item, card: item.matches('.topic-card') ? item : item.querySelector('.topic-card') })).filter(entry => entry.card);
    const matching = items.filter(({ card }) => terms.every(term => normalize([card.dataset.topicId,card.querySelector('.topic-card__title')?.textContent,...[...card.querySelectorAll('[data-topic-search-term]')].map(node => node.textContent)].join(' ')).includes(term)) && groups.every(name => { const selected = values.getAll(name).filter(Boolean); return !selected.length || selected.includes(card.getAttribute(`data-${name}`)); }));
    const order = sort?.value;
    matching.sort((a,b) => order === 'name-asc' ? collator.compare(a.card.querySelector('.topic-card__title').textContent,b.card.querySelector('.topic-card__title').textContent) : (order === 'newest' ? -1 : 1) * String(a.card.dataset.createdAt || a.card.querySelector('time')?.dateTime || '').localeCompare(String(b.card.dataset.createdAt || b.card.querySelector('time')?.dateTime || '')));
    const pages = Math.max(1,Math.ceil(matching.length / 5)); page = Math.min(page,pages);
    const visible = matching.slice((page-1)*5,page*5);
    items.forEach(({ item }) => { item.hidden = true; });
    matching.forEach(({ item }) => list.append(item)); visible.forEach(({ item }) => { item.hidden = false; });
    count.hidden = false;
    count.textContent = results.dataset.topicSourceError || (matching.length ? `Hiển thị ${(page-1)*5+1}–${Math.min(page*5,matching.length)} trên ${matching.length} đề tài` : 'Không tìm thấy đề tài phù hợp. Thử từ khóa khác hoặc xóa bộ lọc.');
    viewport.hidden = !matching.length || Boolean(results.dataset.topicSourceError); viewport.scrollTop = 0;
    if (pagination) {
      const ul = document.createElement('ul'); ul.className = 'pagination__list';
      for (const [target,label] of [[page-1,'‹'],...Array.from({length:pages},(_,index) => [index+1,String(index+1)]),[page+1,'›']]) {
        const li = document.createElement('li'); li.className = 'pagination__item'; const button = document.createElement('button'); button.type = 'button'; button.className = target === page ? 'pagination__current' : 'pagination__button'; button.textContent = label; button.disabled = target < 1 || target > pages; button.setAttribute('aria-label',label === '‹' ? 'Trang trước' : label === '›' ? 'Trang sau' : `Trang ${target}`);
        if (target === page) button.setAttribute('aria-current','page'); button.addEventListener('click',() => { page = target; render(true); pagination.querySelector('[aria-current]')?.focus({preventScroll:true}); }); li.append(button); ul.append(li);
      }
      pagination.replaceChildren(ul); pagination.hidden = pages <= 1;
    }
    if (updateUrl) writeUrl();
  }
  search.addEventListener('input',() => { page = 1; render(true); });
  form.addEventListener('change',() => { page = 1; render(true); });
  sort?.addEventListener('change',() => { page = 1; render(true); });
  form.addEventListener('submit',event => { event.preventDefault(); page = 1; render(true); });
  form.addEventListener('reset',() => setTimeout(() => { page = 1; render(true); },0));
  document.addEventListener('ie104:topics-updated',() => render());
  window.addEventListener('popstate',() => { readUrl(); render(); });
  readUrl();
  const active = form.querySelector('#status-in-progress'); if (active && location.hash === '#de-tai-dang-thuc-hien') active.checked = true;
  render();
})();
