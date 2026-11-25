(() => {
  'use strict';

  const page = document.querySelector('.lecturer-overview-page');
  if (!page) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  // Dùng cùng tốc độ (700ms) và đường cong easeOutQuad với trang Hướng nghiên cứu và Tổng quan sinh viên.
  const countDuration = 700;
  const donutDuration = 900;
  const easeOutQuad = t => t * (2 - t);
  const supportsObserver = typeof window.IntersectionObserver === 'function';

  // Theo dõi các frame đang chạy để hủy khi bật Giảm chuyển động.
  const activeFrames = new Set();
  function scheduleFrame(callback) {
    const id = requestAnimationFrame((timestamp) => {
      activeFrames.delete(id);
      callback(timestamp);
    });
    activeFrames.add(id);
    return id;
  }

  function cancelAllFrames() {
    activeFrames.forEach(id => cancelAnimationFrame(id));
    activeFrames.clear();
  }

  /* ==========================================================================
     1. KPI COUNT-UP (.dashboard-summary)
     Đồng bộ tốc độ 700ms + easeOutQuad với trang Hướng nghiên cứu và Sinh viên.
     ========================================================================== */
  const animatedCounters = new WeakSet();
  function animateKpiCounters(container) {
    if (reducedMotion.matches || !container) return;
    const counters = [...container.querySelectorAll('.summary-card__value strong')]
      .map((el) => {
        if (animatedCounters.has(el)) return null;
        const raw = el.textContent.trim();
        if (!/^\d+$/.test(raw)) return null;
        const target = Number.parseInt(raw, 10);
        animatedCounters.add(el);
        return target > 0 ? { el, target } : null;
      })
      .filter(Boolean);

    if (!counters.length) return;

    const start = performance.now();
    counters.forEach(({ el }) => { el.textContent = '0'; });

    const step = (now) => {
      const progress = Math.min(1, Math.max(0, (now - start) / countDuration));
      if (reducedMotion.matches || progress >= 1) {
        counters.forEach(({ el, target }) => { el.textContent = String(target); });
        return;
      }
      const eased = easeOutQuad(progress);
      counters.forEach(({ el, target }) => {
        el.textContent = String(Math.floor(target * eased));
      });
      scheduleFrame(step);
    };
    scheduleFrame(step);
  }

  /* ==========================================================================
     2. BIỂU ĐỒ DONUT TRẠNG THÁI ĐỀ TÀI (.topic-status)
     - Các lát chạy từ 0 khi biểu đồ lần đầu vào vùng nhìn.
     - Tương tác 2 chiều Biểu đồ ↔ Chú giải (chuột & bàn phím), hỗ trợ VI / EN.
     ========================================================================== */
  const chartSection = page.querySelector('.topic-status');
  const chart = chartSection?.querySelector('.topic-status__chart');
  const circles = chart ? [...chart.querySelectorAll('circle')] : [];
  const chartLabelsGroup = chart?.querySelector('g');
  const legendContainer = chartSection?.querySelector('.topic-status__legend');
  const legendRows = legendContainer ? [...legendContainer.querySelectorAll(':scope > div')] : [];

  let donutSwept = false;
  let donutSweeping = false;
  let hoveredIndex = null;
  let lockedIndex = null;
  let readoutGroup = null;

  function formatPercent(count, total) {
    const locale = document.documentElement.lang === 'en' ? 'en-US' : 'vi-VN';
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      maximumFractionDigits: 1,
    }).format(total > 0 ? count / total : 0);
  }

  function readDonutSlices() {
    const counts = legendRows.map((row) => {
      const val = Number.parseInt(row.querySelector('dd')?.textContent.trim() ?? '', 10);
      return Number.isNaN(val) ? 0 : val;
    });
    const total = counts.reduce((sum, n) => sum + n, 0);
    let offset = 0;
    const slices = counts.map((count, index) => {
      const arc = total > 0 ? (count / total) * 100 : 0;
      const start = offset;
      offset += arc;
      const dt = legendRows[index]?.querySelector('dt');
      const label = (dt?.textContent || '').trim();
      return { index, count, arc, start, end: offset, label };
    });
    return { slices, total };
  }

  function ensureReadoutGroup() {
    if (!chart || !chartLabelsGroup) return null;
    if (readoutGroup && readoutGroup.isConnected) return readoutGroup;

    const ns = chart.namespaceURI;
    const g = document.createElementNS(ns, 'g');
    g.classList.add('topic-status__readout');
    g.setAttribute('text-anchor', 'middle');
    g.setAttribute('aria-hidden', 'true');

    const labelEl = document.createElementNS(ns, 'text');
    labelEl.classList.add('topic-status__readout-label');
    labelEl.setAttribute('x', '130');
    labelEl.setAttribute('y', '100');

    const valueEl = document.createElementNS(ns, 'text');
    valueEl.classList.add('topic-status__readout-value');
    valueEl.setAttribute('x', '130');
    valueEl.setAttribute('y', '134');

    const pctEl = document.createElementNS(ns, 'text');
    pctEl.classList.add('topic-status__readout-percent');
    pctEl.setAttribute('x', '130');
    pctEl.setAttribute('y', '154');

    g.append(labelEl, valueEl, pctEl);
    chart.append(g);
    readoutGroup = g;
    return g;
  }

  function setWrappedReadoutLabel(textEl, text) {
    const ns = chart.namespaceURI;
    textEl.replaceChildren();
    const words = text.split(/\s+/).filter(Boolean);
    if (text.length <= 12 || words.length < 2) {
      textEl.setAttribute('y', '104');
      textEl.textContent = text;
      return;
    }
    const mid = Math.ceil(words.length / 2);
    const lines = [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
    textEl.setAttribute('y', '91');
    lines.forEach((line, idx) => {
      const tspan = document.createElementNS(ns, 'tspan');
      tspan.setAttribute('x', '130');
      tspan.setAttribute('dy', idx === 0 ? '0' : '13');
      tspan.textContent = line;
      textEl.append(tspan);
    });
  }

  function applyDonutHighlight(activeIndex) {
    if (!chart || !legendContainer) return;
    const { slices, total } = readDonutSlices();
    const valid = activeIndex !== null && activeIndex >= 0 && activeIndex < slices.length && total > 0;

    chart.classList.toggle('is-slice-active', valid);
    legendContainer.classList.toggle('has-active', valid);

    circles.forEach((circle, i) => {
      circle.classList.toggle('is-active', valid && i === activeIndex);
    });
    legendRows.forEach((row, i) => {
      row.classList.toggle('is-active', valid && i === activeIndex);
      row.setAttribute('aria-pressed', String(lockedIndex === i));
    });

    const g = ensureReadoutGroup();
    if (!g) return;
    if (!valid) {
      g.classList.remove('is-visible');
      return;
    }

    const slice = slices[activeIndex];
    setWrappedReadoutLabel(g.querySelector('.topic-status__readout-label'), slice.label);
    g.querySelector('.topic-status__readout-value').textContent = String(slice.count);
    g.querySelector('.topic-status__readout-percent').textContent = formatPercent(slice.count, total);
    g.classList.add('is-visible');
  }

  function syncActiveHighlight() {
    applyDonutHighlight(hoveredIndex !== null ? hoveredIndex : lockedIndex);
  }

  function hitTestDonut(event) {
    const { slices, total } = readDonutSlices();
    if (!total) return null;
    const rect = chart.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const x = ((event.clientX - rect.left) / rect.width) * 260;
    const y = ((event.clientY - rect.top) / rect.height) * 240;
    const dx = x - 130;
    const dy = y - 120;
    const dist = Math.hypot(dx, dy);
    if (dist < 52 || dist > 106) return null;

    const rad = Math.atan2(dx, -dy);
    const pos = ((rad < 0 ? rad + Math.PI * 2 : rad) / (Math.PI * 2)) * 100;
    for (const slice of slices) {
      if (slice.arc > 0 && pos >= slice.start && pos <= slice.end) {
        return slice.index;
      }
    }
    return null;
  }

  function setupDonutInteraction() {
    if (!chart || !legendRows.length) return;

    // Gắn khả năng tương tác bàn phím + chuột cho 4 dòng chú giải.
    legendRows.forEach((row, index) => {
      row.tabIndex = 0;
      row.setAttribute('role', 'button');
      row.setAttribute('aria-pressed', 'false');

      row.addEventListener('mouseenter', () => {
        hoveredIndex = index;
        syncActiveHighlight();
      });
      row.addEventListener('mouseleave', () => {
        if (hoveredIndex === index) hoveredIndex = null;
        syncActiveHighlight();
      });
      row.addEventListener('focus', () => {
        hoveredIndex = index;
        syncActiveHighlight();
      });
      row.addEventListener('blur', () => {
        if (hoveredIndex === index) hoveredIndex = null;
        syncActiveHighlight();
      });
      row.addEventListener('click', () => {
        lockedIndex = lockedIndex === index ? null : index;
        syncActiveHighlight();
      });
      row.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          lockedIndex = lockedIndex === index ? null : index;
          syncActiveHighlight();
        } else if (event.key === 'Escape' && (lockedIndex !== null || hoveredIndex !== null)) {
          lockedIndex = null;
          hoveredIndex = null;
          syncActiveHighlight();
        }
      });
    });

    // Tính góc chính xác từ tâm Donut để hover/click chuẩn mọi lát (kể cả lát 3,2%).
    chart.addEventListener('mousemove', (event) => {
      const idx = hitTestDonut(event);
      chart.classList.toggle('is-hovering-slice', idx !== null);
      if (idx !== hoveredIndex) {
        hoveredIndex = idx;
        syncActiveHighlight();
      }
    });

    chart.addEventListener('mouseleave', () => {
      chart.classList.remove('is-hovering-slice');
      if (hoveredIndex !== null) {
        hoveredIndex = null;
        syncActiveHighlight();
      }
    });

    chart.addEventListener('click', (event) => {
      const idx = hitTestDonut(event);
      lockedIndex = idx === null || lockedIndex === idx ? null : idx;
      syncActiveHighlight();
    });

    // Đồng bộ lại nhãn trong tâm biểu đồ khi người dùng đổi ngôn ngữ VI ↔ EN.
    const langObserver = new MutationObserver(() => {
      if (hoveredIndex !== null || lockedIndex !== null) {
        syncActiveHighlight();
      }
    });
    langObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['lang'],
    });
  }

  function finishDonutSweep() {
    circles.forEach(circle => circle.style.removeProperty('stroke-dasharray'));
    chart.classList.remove('is-sweeping');
    donutSweeping = false;
  }

  function animateDonutSweep() {
    if (donutSwept || reducedMotion.matches || !chart || chart.parentElement?.hidden) return false;
    if (!readDonutSlices().total) return false;

    donutSwept = true;
    donutSweeping = true;
    chart.classList.add('is-sweeping');
    // CSS điều khiển độ dài đang chạy, SVG giữ tỷ lệ mới nhất từ dữ liệu.
    circles.forEach(circle => circle.style.setProperty('stroke-dasharray', '0 100'));
    chart.classList.remove('is-awaiting-sweep');
    let startTime;

    const step = (now) => {
      if (!donutSweeping) return;
      startTime ??= now;
      const progress = (now - startTime) / donutDuration;
      if (reducedMotion.matches || progress >= 1) {
        finishDonutSweep();
        return;
      }

      const eased = easeOutQuad(progress);
      circles.forEach((circle) => {
        const arc = Number.parseFloat(circle.getAttribute('stroke-dasharray'));
        const visible = arc * eased;
        circle.style.setProperty('stroke-dasharray', `${visible} ${100 - visible}`);
      });

      scheduleFrame(step);
    };

    scheduleFrame(step);
    return true;
  }

  /* ==========================================================================
     3. THANH TIẾN ĐỘ ĐỀ TÀI ĐANG HƯỚNG DẪN (.topic-progress-card progress)
     Chạy từ 0% → giá trị thật (1 lần khi cuộn tới), bảo toàn dịch VI/EN.
     ========================================================================== */
  let progressAnimated = false;
  function animateProgressBars(section) {
    if (progressAnimated || reducedMotion.matches || !section) return;
    const meters = [...section.querySelectorAll('.topic-progress-card progress')];
    if (!meters.length) return;
    progressAnimated = true;

    meters.forEach((meter, index) => {
      const target = Number(meter.value);
      if (!Number.isFinite(target) || target <= 0) return;

      const label = meter.id ? section.querySelector(`label[for="${CSS.escape(meter.id)}"]`) : null;
      const sourceLabel = label
        ? (window.IE104Language?.sourceText(label) || label.textContent).trim()
        : '';
      const hasNumericLabel = /^\d+/.test(sourceLabel);

      const duration = countDuration;
      const delay = index * 45;
      const start = performance.now() + delay;

      meter.value = 0;
      if (label && hasNumericLabel) {
        label.textContent = sourceLabel.replace(/^\d+/, '0');
      }

      const step = (now) => {
        if (!meter.isConnected || reducedMotion.matches) {
          if (meter.isConnected) meter.value = target;
          if (label && label.isConnected && hasNumericLabel) {
            label.textContent = sourceLabel;
          }
          return;
        }
        if (now < start) {
          scheduleFrame(step);
          return;
        }
        const progress = Math.min(1, (now - start) / duration);
        if (progress >= 1) {
          meter.value = target;
          if (label && hasNumericLabel) label.textContent = sourceLabel;
          return;
        }
        const current = Math.floor(target * easeOutQuad(progress));
        meter.value = current;
        if (label && hasNumericLabel) {
          label.textContent = sourceLabel.replace(/^\d+/, String(current));
        }
        scheduleFrame(step);
      };

      scheduleFrame(step);
    });
  }

  /* ==========================================================================
     4. XUẤT HIỆN TỪNG KHỐI KHI CUỘN TRANG (.fade-in-up)
     Giữ khối chào & 4 KPI hiện ngay; các khối dưới hiện êm khi cuộn tới.
     ========================================================================== */
  const revealSections = [...page.querySelectorAll('.fade-in-up')];
  const summarySection = page.querySelector('.dashboard-summary');
  const progressSection = page.querySelector('.supervised-progress');
  let chartObserver;
  let chartInView = false;

  setupDonutInteraction();

  function startDonutWhenVisible() {
    if (chartInView && animateDonutSweep()) chartObserver.disconnect();
  }

  const handleDataUpdate = () => {
    startDonutWhenVisible();
    if (hoveredIndex !== null || lockedIndex !== null) {
      scheduleFrame(syncActiveHighlight);
    }
  };
  window.addEventListener('storage', handleDataUpdate);
  window.addEventListener('ie104:lecturer-topics-updated', handleDataUpdate);
  window.addEventListener('ie104:registrations-updated', handleDataUpdate);
  window.IE104Proposals?.subscribe?.(handleDataUpdate);

  if (reducedMotion.matches || !supportsObserver) {
    return;
  }

  // Khối KPI ở trên cùng chạy đếm số ngay khi trang sẵn sàng.
  animateKpiCounters(summarySection);

  if (chart) {
    const visibleRatio = 0.25;
    chartObserver = new IntersectionObserver((entries) => {
      const entry = entries[entries.length - 1];
      chartInView = entry.isIntersecting && entry.intersectionRatio >= visibleRatio;
      startDonutWhenVisible();
    }, { threshold: visibleRatio });
    chart.classList.add('is-awaiting-sweep');
    chartObserver.observe(chart);
  }

  const revealSection = (section) => {
    section.classList.add('is-visible');
    observer.unobserve(section);
    section.removeEventListener('focusin', revealOnFocus);
    if (section === progressSection) animateProgressBars(section);
  };

  const revealOnFocus = (event) => {
    revealSection(event.currentTarget);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      if (reducedMotion.matches) return;
      entries.forEach(({ isIntersecting, target }) => {
        if (!isIntersecting) return;
        if (!target.classList.contains('is-visible')) {
          revealSection(target);
        }
      });
    },
    { threshold: 0.12 }
  );

  revealSections.forEach((section) => {
    if (section.matches(':focus-within')) {
      if (section === progressSection) animateProgressBars(section);
      return;
    }
    section.classList.add('is-animated');
    section.addEventListener('focusin', revealOnFocus);
    observer.observe(section);
  });

  // Tắt sạch hiệu ứng nếu người dùng bật Giảm chuyển động trong khi đang mở trang.
  reducedMotion.addEventListener(
    'change',
    () => {
      if (!reducedMotion.matches) return;
      observer.disconnect();
      observer.takeRecords();
      chartObserver?.disconnect();
      cancelAllFrames();
      if (donutSweeping) finishDonutSweep();
      chart?.classList.remove('is-awaiting-sweep');
      revealSections.forEach((section) => {
        section.classList.remove('is-animated', 'is-visible');
        section.removeEventListener('focusin', revealOnFocus);
      });
    },
    { once: true }
  );
})();
