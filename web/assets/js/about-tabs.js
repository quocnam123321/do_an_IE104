/* Progressive enhancement: without JS every role section stays readable. */
(() => {
  const section = document.querySelector(".about-audiences");
  const header = section?.querySelector(":scope > .section-header");
  const nav = section?.querySelector(".about-audiences__navigation");
  const list = nav?.querySelector("ul");
  if (!section || !nav || !list) return;

  const tabs = [...list.querySelectorAll('a[href^="#"]')];
  const panels = tabs.map((tab) => document.getElementById(tab.hash.slice(1)));
  if (!tabs.length || panels.some((panel) => !panel)) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  list.setAttribute("role", "tablist");
  list.setAttribute("aria-label", "Vai trò sử dụng hệ thống");
  tabs.forEach((tab, index) => {
    tab.parentElement.setAttribute("role", "presentation");
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", panels[index].id);
    panels[index].setAttribute("role", "tabpanel");
    panels[index].setAttribute("aria-labelledby", tab.id);
    panels[index].tabIndex = 0;
  });

  // 1. Pill chỉ báo trượt mượt giữa 3 tab vai trò
  let pill = nav.querySelector(":scope > .about-audiences__pill");
  if (!pill) {
    pill = document.createElement("span");
    pill.className = "about-audiences__pill";
    pill.setAttribute("aria-hidden", "true");
    nav.append(pill);
  }

  let currentIndex = 0;
  let pillFrame = 0;

  const updatePill = () => {
    const activeTab = tabs[currentIndex];
    if (!activeTab) return;
    const navRect = nav.getBoundingClientRect();
    const tabRect = activeTab.getBoundingClientRect();
    if (!navRect.width || !tabRect.width) {
      section.classList.remove("about-audiences--pill-visible");
      return;
    }
    const x = tabRect.left - navRect.left;
    const y = tabRect.top - navRect.top;
    nav.style.setProperty("--tab-pill-x", `${x}px`);
    nav.style.setProperty("--tab-pill-y", `${y}px`);
    nav.style.setProperty("--tab-pill-w", `${tabRect.width}px`);
    nav.style.setProperty("--tab-pill-h", `${tabRect.height}px`);
    section.classList.add("about-audiences--pill-visible");
  };

  const schedulePillUpdate = () => {
    cancelAnimationFrame(pillFrame);
    pillFrame = requestAnimationFrame(updatePill);
  };

  // 2. Lưu giá trị gốc để đếm số & vẽ biểu đồ trong khung minh họa aria-hidden
  const panelMetrics = panels.map((panel) => {
    const numbers = [
      ...panel.querySelectorAll(".audience-dashboard__stats strong"),
      ...panel.querySelectorAll(".audience-dashboard__chart-total")
    ].map((node) => ({
      node,
      finalText: node.textContent.trim(),
      target: Number(node.textContent.trim())
    }));

    const circles = [...panel.querySelectorAll(".audience-dashboard__chart [pathLength]")].map(
      (circle) => {
        const finalDash = circle.getAttribute("stroke-dasharray") || "";
        const [segStr] = finalDash.trim().split(/\s+/);
        return {
          circle,
          pathLength: Number(circle.getAttribute("pathLength")) || 6,
          segLength: Number(segStr) || 0,
          finalDash
        };
      }
    );

    const chart = panel.querySelector(".audience-dashboard__chart");
    const bars = [...panel.querySelectorAll(".audience-dashboard__progress i")];
    const preview =
      panel.querySelector(".about-audience__preview") ||
      panel.querySelector(".about-audience__coming-soon");
    const benefitItems = [...panel.querySelectorAll(".about-audience__benefits > li")];

    return { panel, numbers, circles, chart, bars, preview, benefitItems };
  });

  let activeAnimations = [];
  let headerAnimations = [];
  let countFrame = 0;
  let countDelayTimer = 0;

  const restoreFinalMetrics = () => {
    cancelAnimationFrame(countFrame);
    clearTimeout(countDelayTimer);
    countFrame = 0;
    countDelayTimer = 0;
    activeAnimations.forEach((anim) => anim.cancel());
    activeAnimations = [];
    panelMetrics.forEach(({ numbers, circles }) => {
      numbers.forEach(({ node, finalText }) => {
        node.textContent = finalText;
      });
      circles.forEach(({ circle, finalDash }) => {
        circle.style.strokeDasharray = "";
        if (finalDash) circle.setAttribute("stroke-dasharray", finalDash);
      });
    });
  };

  const animateHeader = () => {
    section.classList.remove("about-audiences--header-pending");
    if (reducedMotion.matches || typeof Element.prototype.animate !== "function") return;

    headerAnimations.forEach((anim) => anim.cancel());
    headerAnimations = [];

    if (header) {
      headerAnimations.push(
        header.animate(
          [
            { opacity: 0, translate: "0 20px" },
            { opacity: 1, translate: "0 0" }
          ],
          { duration: 420, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "backwards" }
        )
      );
    }

    headerAnimations.push(
      nav.animate(
        [
          { opacity: 0, translate: "0 16px" },
          { opacity: 1, translate: "0 0" }
        ],
        {
          duration: 400,
          delay: 90,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "backwards"
        }
      )
    );
  };

  const animatePanel = (index, { isScrollEntrance = false } = {}) => {
    section.classList.remove("about-audiences--scroll-pending");
    restoreFinalMetrics();
    if (reducedMotion.matches) return;

    const metrics = panelMetrics[index];
    if (!metrics) return;
    const { numbers, circles, chart, bars, preview, benefitItems } = metrics;
    const canAnimate = typeof Element.prototype.animate === "function";
    const startOpacity = isScrollEntrance ? 0 : 0.35;
    const liftDistance = isScrollEntrance ? 26 : 18;

    if (canAnimate && preview) {
      activeAnimations.push(
        preview.animate(
          [
            { opacity: startOpacity, translate: `0 ${liftDistance}px` },
            { opacity: 1, translate: "0 0" }
          ],
          {
            duration: isScrollEntrance ? 480 : 360,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
            fill: "backwards"
          }
        )
      );
    }

    if (canAnimate && benefitItems.length) {
      benefitItems.forEach((item, idx) => {
        activeAnimations.push(
          item.animate(
            [
              { opacity: startOpacity, translate: `0 ${isScrollEntrance ? 22 : 16}px` },
              { opacity: 1, translate: "0 0" }
            ],
            {
              duration: isScrollEntrance ? 420 : 320,
              delay: (isScrollEntrance ? 90 : 50) + idx * (isScrollEntrance ? 90 : 75),
              easing: "cubic-bezier(0.22, 1, 0.36, 1)",
              fill: "backwards"
            }
          )
        );
      });
    }

    if (canAnimate && bars.length) {
      bars.forEach((bar, idx) => {
        activeAnimations.push(
          bar.animate(
            [{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }],
            {
              duration: 740,
              delay: (isScrollEntrance ? 160 : 110) + idx * 95,
              easing: "cubic-bezier(0.22, 1, 0.36, 1)",
              fill: "backwards"
            }
          )
        );
      });
    }

    if (canAnimate && chart) {
      activeAnimations.push(
        chart.animate(
          [
            { opacity: 0.45, transform: "scale(0.92)" },
            { opacity: 1, transform: "scale(1)" }
          ],
          {
            duration: 560,
            delay: isScrollEntrance ? 90 : 0,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
            fill: "backwards"
          }
        )
      );
    }

    if (numbers.length || circles.length) {
      const duration = 720;
      const runMetricsSweep = () => {
        const start = performance.now();
        const tick = (now) => {
          const progress = Math.min(1, Math.max(0, (now - start) / duration));
          if (progress >= 1) {
            numbers.forEach(({ node, finalText }) => {
              node.textContent = finalText;
            });
            circles.forEach(({ circle, finalDash }) => {
              if (finalDash) circle.setAttribute("stroke-dasharray", finalDash);
            });
            countFrame = 0;
            return;
          }
          const eased = progress * (2 - progress);
          numbers.forEach(({ node, target }) => {
            node.textContent = String(Math.round(target * eased));
          });
          circles.forEach(({ circle, pathLength, segLength }) => {
            const drawn = (segLength * eased).toFixed(3);
            const rest = Math.max(0, pathLength - segLength * eased).toFixed(3);
            circle.setAttribute("stroke-dasharray", `${drawn} ${rest}`);
          });
          countFrame = requestAnimationFrame(tick);
        };
        countFrame = requestAnimationFrame(tick);
      };

      numbers.forEach(({ node }) => {
        node.textContent = "0";
      });
      circles.forEach(({ circle, pathLength }) => {
        circle.setAttribute("stroke-dasharray", `0 ${pathLength}`);
      });

      if (isScrollEntrance) {
        countDelayTimer = window.setTimeout(runMetricsSweep, 100);
      } else {
        runMetricsSweep();
      }
    }
  };

  // 3. Tương tác Spotlight liên kết thẻ bên phải với phần minh họa bên trái
  panels.forEach((panel) => {
    const content = panel.querySelector(".about-audience__content");
    if (!content) return;
    panel.querySelectorAll(".about-audience__benefits > li[data-spotlight]").forEach((item) => {
      const target = item.dataset.spotlight;
      item.addEventListener("pointerenter", () => {
        content.dataset.activeSpotlight = target;
      });
      item.addEventListener("pointerleave", () => {
        if (content.dataset.activeSpotlight === target) {
          delete content.dataset.activeSpotlight;
        }
      });
    });
  });

  const clearAllSpotlights = () => {
    section.querySelectorAll(".about-audience__content[data-active-spotlight]").forEach((node) => {
      delete node.dataset.activeSpotlight;
    });
  };

  let headerRevealed = false;
  let contentRevealed = false;
  let headerObserver = null;
  let contentObserver = null;

  const revealHeaderIfNeeded = () => {
    if (headerRevealed) return;
    headerRevealed = true;
    headerObserver?.disconnect();
    animateHeader();
  };

  const revealContentIfNeeded = () => {
    if (contentRevealed) return;
    contentRevealed = true;
    contentObserver?.disconnect();
    revealHeaderIfNeeded();
    animatePanel(currentIndex, { isScrollEntrance: true });
  };

  function select(index, { focus = false, updateHash = false, animate = false } = {}) {
    const changed = index !== currentIndex;
    currentIndex = index;
    clearAllSpotlights();

    tabs.forEach((tab, position) => {
      const selected = position === index;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      panels[position].hidden = !selected;
    });

    updatePill();
    if (focus) tabs[index].focus();
    if (updateHash) history.replaceState(history.state, "", tabs[index].hash);

    if (animate) {
      headerObserver?.disconnect();
      contentObserver?.disconnect();
      headerRevealed = true;
      section.classList.remove("about-audiences--header-pending");
      if (!contentRevealed) {
        contentRevealed = true;
        animatePanel(index, { isScrollEntrance: true });
      } else if (changed) {
        animatePanel(index);
      }
    }
  }

  function indexFromHash(hash) {
    const id = hash.slice(1);
    const target = document.getElementById(id);
    return panels.findIndex((panel) => panel.id === id || (target && panel.contains(target)));
  }

  section.addEventListener("click", (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const index = indexFromHash(link.hash);
    if (index < 0) return;
    event.preventDefault();
    select(index, { focus: !list.contains(link), updateHash: true, animate: true });
  });

  list.addEventListener("keydown", (event) => {
    const index = tabs.indexOf(event.target);
    if (index < 0) return;
    let next;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft") next = (index + tabs.length - 1) % tabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    else if (event.key === " ") next = index;
    else return;
    event.preventDefault();
    select(next, { focus: true, updateHash: true, animate: true });
  });

  // Đảm bảo khi người dùng nhấn Tab bằng bàn phím vào khu vực thì hiện đầy đủ ngay, không che phần tử đang focus.
  section.addEventListener("focusin", () => {
    revealHeaderIfNeeded();
    revealContentIfNeeded();
  });

  window.addEventListener("hashchange", () => {
    const index = indexFromHash(location.hash);
    if (index >= 0) {
      const focusedPanel = panels.find((panel) => panel.contains(document.activeElement));
      select(index, {
        focus: Boolean(focusedPanel && focusedPanel !== panels[index]),
        animate: true
      });
    }
  });

  reducedMotion.addEventListener("change", () => {
    if (reducedMotion.matches) {
      headerObserver?.disconnect();
      contentObserver?.disconnect();
      headerRevealed = true;
      contentRevealed = true;
      section.classList.remove(
        "about-audiences--header-pending",
        "about-audiences--scroll-pending"
      );
      headerAnimations.forEach((anim) => anim.cancel());
      headerAnimations = [];
      restoreFinalMetrics();
    }
  });

  window.addEventListener("resize", schedulePillUpdate, { passive: true });
  if ("ResizeObserver" in window) {
    const observer = new ResizeObserver(schedulePillUpdate);
    observer.observe(nav);
    tabs.forEach((tab) => observer.observe(tab));
  }
  document.fonts?.ready.then(schedulePillUpdate);

  const initial = indexFromHash(location.hash);
  select(initial < 0 ? 0 : initial);
  section.classList.add("about-audiences--tabs");

  pill.getBoundingClientRect();
  requestAnimationFrame(() => section.classList.add("about-audiences--pill-ready"));

  // 4. Kích hoạt hiệu ứng đúng khoảnh khắc người dùng cuộn xuống thấy khu vực vai trò
  if (!reducedMotion.matches && "IntersectionObserver" in window) {
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
    const navRect = nav.getBoundingClientRect();
    const activePanel = panels[currentIndex];
    const panelRect = activePanel.getBoundingClientRect();

    // Nếu thanh tab còn nằm sâu dưới màn hình đầu, chờ cuộn tới mới trượt tiêu đề + thanh tab lên.
    if (navRect.top > viewportHeight * 0.88) {
      section.classList.add("about-audiences--header-pending");
      headerObserver = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            revealHeaderIfNeeded();
          }
        },
        { rootMargin: "0px 0px -10% 0px", threshold: 0.1 }
      );
      headerObserver.observe(nav);
    } else {
      headerRevealed = true;
    }

    // Chỉ chạy hiệu ứng khung biểu đồ + đếm số + hiện thẻ khi vùng nội dung thực sự lọt vào tầm mắt (~28%).
    if (panelRect.top > viewportHeight * 0.72) {
      section.classList.add("about-audiences--scroll-pending");
      contentObserver = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            revealContentIfNeeded();
          }
        },
        { rootMargin: "0px 0px -48px 0px", threshold: 0.25 }
      );
      contentObserver.observe(activePanel);
    } else {
      revealContentIfNeeded();
    }
  } else {
    headerRevealed = true;
    contentRevealed = true;
  }
})();
