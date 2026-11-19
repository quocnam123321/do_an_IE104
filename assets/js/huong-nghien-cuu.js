(() => {
  const searchInput = document.getElementById('research-search-input');
  const departmentSelect = document.getElementById('research-department-select');
  const groupSelect = document.getElementById('research-group-select');
  const emptyState = document.getElementById('research-empty-state');
  const cards = Array.from(document.querySelectorAll('.research-grid .research-card'));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const animateStatistics = () => {
    const numbers = [...document.querySelectorAll('.research-stats strong')];
    if (reducedMotion.matches || !numbers.length) return;

    const counters = numbers.map((number) => {
      const finalText = number.textContent.trim();
      const digits = finalText.startsWith('0') ? finalText.length : 1;
      const final = document.createElement('span');
      final.className = 'research-stat-final';
      final.textContent = finalText;

      // Nội dung hỗ trợ đọc màn hình luôn là số liệu cuối cùng.
      const display = document.createElement('span');
      display.className = 'research-stat-count';
      display.setAttribute('aria-hidden', 'true');
      display.textContent = '0'.padStart(digits, '0');
      number.replaceChildren(final, display);

      return { number, finalText, target: Number(finalText), digits, display };
    });

    const duration = 700;
    const start = performance.now();
    const finish = () => {
      cancelAnimationFrame(frame);
      reducedMotion.removeEventListener('change', finish);
      counters.forEach(({ number, finalText }) => { number.textContent = finalText; });
    };

    const tick = (now) => {
      const progress = Math.max(0, (now - start) / duration);
      if (progress >= 1) {
        finish();
        return;
      }

      const eased = progress * (2 - progress);
      counters.forEach(({ target, digits, display }) => {
        display.textContent = String(Math.floor(target * eased)).padStart(digits, '0');
      });
      frame = requestAnimationFrame(tick);
    };

    let frame = requestAnimationFrame(tick);
    reducedMotion.addEventListener('change', finish, { once: true });
  };

  animateStatistics();

  if (!searchInput || !departmentSelect || !groupSelect || cards.length === 0) {
    return;
  }

  const normalizeText = (value) =>
    String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase()
      .trim();

  const cardMetadata = cards.map((card) => {
    let department = '';
    let group = '';

    const directionCount = card.querySelector('.research-area-count');
    if (directionCount) {
      const totalDirections = card.querySelectorAll('.research-directions li').length;
      directionCount.textContent = `${totalDirections} hướng`;
    }

    card.querySelectorAll('.research-affiliations > div').forEach((row) => {
      const term = row.querySelector('dt')?.textContent.trim();
      const desc = row.querySelector('dd')?.textContent.trim() || '';
      if (term === 'Bộ môn') {
        department = desc;
      } else if (term === 'Nhóm nghiên cứu') {
        group = desc;
      }
    });

    // Số hướng là thông tin giao diện, không phải từ khóa của giảng viên.
    const cardText = (card.textContent || '').replace(directionCount?.textContent || '', '');
    const searchableText = normalizeText(cardText);
    const rawText = cardText.toLowerCase();

    return {
      card,
      department,
      group,
      searchableText,
      rawText
    };
  });

  const invitationEntry = window.IE104SupervisionEntry;
  if (invitationEntry) {
    const invitationLinks = cards.map((card) => {
      const heading = card.querySelector('h2');
      if (!heading || !card.id) return null;

      heading.id ||= `${card.id}-name`;
      const actions = document.createElement('div');
      actions.className = 'research-card__contact';
      const link = document.createElement('a');
      link.className = 'research-card__contact-link';
      link.textContent = 'Liên hệ xin hướng dẫn';
      link.setAttribute('aria-describedby', heading.id);
      actions.append(link);
      card.append(actions);
      return { id: card.id, link };
    }).filter(Boolean);

    const updateInvitationLinks = () => {
      const destination = invitationEntry.hasStudentSession()
        ? invitationEntry.getComposeUrl
        : invitationEntry.getLoginUrl;
      invitationLinks.forEach(({ id, link }) => { link.href = destination(id); });
    };
    updateInvitationLinks();
    window.addEventListener('pageshow', updateInvitationLinks);
  }

  const grid = cards[0].parentElement;
  const cardAnimations = new WeakMap();
  const pendingCards = new Set();

  const revealCard = (card, delay) => {
    if (reducedMotion.matches || typeof card.animate !== 'function' || card.contains(document.activeElement)) {
      return;
    }

    cardAnimations.get(card)?.cancel();
    cardAnimations.set(card, card.animate(
      [
        { opacity: 0.4, translate: '0 32px' },
        { opacity: 1, translate: '0 0' }
      ],
      { duration: 320, delay, easing: 'cubic-bezier(0.2, 0, 0, 1)', fill: 'backwards' }
    ));
  };

  const rowObserver = typeof IntersectionObserver === 'function'
    ? new IntersectionObserver((entries, observer) => {
        const enteringRows = new Set(entries
          .filter(({ target, isIntersecting }) => isIntersecting && pendingCards.has(target))
          .map(({ target }) => target.offsetTop));
        if (!enteringRows.size) return;

        const columnsByRow = new Map();
        // Đọc vị trí hàng từ lưới hiện tại để tính đúng cột sau khi lọc hoặc đổi kích thước.
        cards.filter((card) => !card.hidden).forEach((card) => {
          const rowTop = card.offsetTop;
          if (!enteringRows.has(rowTop)) return;

          const column = columnsByRow.get(rowTop) ?? 0;
          columnsByRow.set(rowTop, column + 1);
          if (pendingCards.delete(card)) {
            observer.unobserve(card);
            revealCard(card, column * 80);
          }
        });
      })
    : null;

  const observeRows = (visibleCards) => {
    if (reducedMotion.matches || !rowObserver) return;

    rowObserver.disconnect();
    rowObserver.takeRecords();
    pendingCards.clear();
    visibleCards.forEach((card) => {
      pendingCards.add(card);
      rowObserver.observe(card);
    });
  };

  observeRows(cards.filter((card) => !card.hidden));

  reducedMotion.addEventListener('change', () => {
    if (!reducedMotion.matches) return;

    rowObserver?.disconnect();
    rowObserver?.takeRecords();
    pendingCards.clear();
    cards.forEach((card) => cardAnimations.get(card)?.cancel());
  });

  grid.addEventListener('focusin', ({ target }) => {
    cardAnimations.get(target.closest('.research-card'))?.cancel();
  });

  const applyFilters = () => {
    const queryRaw = searchInput.value.trim().toLowerCase();
    const queryNorm = normalizeText(queryRaw);
    const selectedDepartment = departmentSelect.value;
    const selectedGroup = groupSelect.value;

    const visibleCards = [];
    let resultsChanged = false;

    cardMetadata.forEach(({ card, department, group, searchableText, rawText }) => {
      const matchesDepartment = !selectedDepartment || department === selectedDepartment;
      const matchesGroup = !selectedGroup || group === selectedGroup;
      const matchesSearch =
        !queryNorm || searchableText.includes(queryNorm) || rawText.includes(queryRaw);

      const isVisible = matchesDepartment && matchesGroup && matchesSearch;
      const shouldHide = !isVisible;
      if (card.hidden !== shouldHide) {
        resultsChanged = true;
        card.hidden = shouldHide;
      }
      if (isVisible) visibleCards.push(card);
    });

    const visibleCount = visibleCards.length;
    if (emptyState) {
      emptyState.hidden = visibleCount > 0;
    }
    if (resultsChanged) {
      cards.forEach((card) => cardAnimations.get(card)?.cancel());
      observeRows(visibleCards);
    }
  };

  searchInput.addEventListener('input', applyFilters);
  departmentSelect.addEventListener('change', applyFilters);
  groupSelect.addEventListener('change', applyFilters);
})();
