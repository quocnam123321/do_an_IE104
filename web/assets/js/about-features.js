/* Progressive enhancement cho hai mục "Các chức năng chính" (#chuc-nang)
   và "Các bước thực hiện đồ án trên hệ thống" (.about-workflow):
   - Không có JS hoặc bật giảm chuyển động: hiển thị tĩnh đầy đủ ngay lập tức.
   - Có JS: trượt tiêu đề, hiện thẻ/bước lệch nhịp khi cuộn tới, chảy vạch tiến trình dọc theo cuộn
     và quầng sáng mềm đi theo vị trí chuột. */
(() => {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const canAnimate = typeof Element.prototype.animate === "function";

  // Helper gắn quầng sáng mềm đi theo con trỏ chuột
  const attachPointerSpotlight = (elements) => {
    elements.forEach((el) => {
      let spotFrame = 0;
      let lastX = 0;
      let lastY = 0;

      el.addEventListener(
        "pointermove",
        (event) => {
          if (event.pointerType !== "mouse" || reducedMotion.matches) return;
          lastX = event.clientX;
          lastY = event.clientY;
          if (spotFrame) return;
          spotFrame = requestAnimationFrame(() => {
            spotFrame = 0;
            const rect = el.getBoundingClientRect();
            if (!rect.width || !rect.height) return;
            el.style.setProperty("--spot-x", `${Math.round(lastX - rect.left)}px`);
            el.style.setProperty("--spot-y", `${Math.round(lastY - rect.top)}px`);
          });
        },
        { passive: true }
      );
    });
  };

  /* ==========================================================================
     1. MỤC "CÁC CHỨC NĂNG CHÍNH" (#chuc-nang.about-features)
        & MỤC "NHÓM PHÁT TRIỂN" (.about-team)
     ========================================================================== */
  const initCardGridSection = ({
    sectionSelector,
    cardSelector,
    iconSelector,
    pendingHeaderClass
  }) => {
    const section = document.querySelector(sectionSelector);
    if (!section) return;

    const header = section.querySelector(":scope > .section-header");
    const cards = [...section.querySelectorAll(cardSelector)];
    if (!cards.length) return;

    attachPointerSpotlight(cards);

    let headerRevealed = false;
    const revealedCards = new WeakSet();
    const runningAnimations = [];
    let headerObserver = null;
    let cardObserver = null;

    const revealHeader = ({ animate = true } = {}) => {
      if (headerRevealed) return;
      headerRevealed = true;
      headerObserver?.disconnect();
      section.classList.remove(pendingHeaderClass);

      if (!animate || reducedMotion.matches || !canAnimate || !header) return;
      runningAnimations.push(
        header.animate(
          [
            { opacity: 0, translate: "0 20px" },
            { opacity: 1, translate: "0 0" }
          ],
          {
            duration: 420,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
            fill: "backwards"
          }
        )
      );
    };

    const revealRowContaining = (seedCard, { animate = true } = {}) => {
      if (revealedCards.has(seedCard)) return;

      const seedRect = seedCard.getBoundingClientRect();
      const rowPeers = cards
        .filter((card) => {
          if (revealedCards.has(card)) return false;
          if (!animate) return true;
          const rect = card.getBoundingClientRect();
          return Math.abs(rect.top - seedRect.top) <= 14;
        })
        .map((card) => ({ card, left: card.getBoundingClientRect().left }))
        .sort((a, b) => a.left - b.left);

      rowPeers.forEach(({ card }, colIndex) => {
        revealedCards.add(card);
        cardObserver?.unobserve(card);
        card.classList.remove("is-scroll-pending");

        if (!animate || reducedMotion.matches || !canAnimate) return;

        const delay = colIndex * 85;
        runningAnimations.push(
          card.animate(
            [
              { opacity: 0, translate: "0 26px" },
              { opacity: 1, translate: "0 0" }
            ],
            {
              duration: 460,
              delay,
              easing: "cubic-bezier(0.22, 1, 0.36, 1)",
              fill: "backwards"
            }
          )
        );

        const icon = iconSelector ? card.querySelector(iconSelector) : null;
        if (icon) {
          runningAnimations.push(
            icon.animate(
              [
                { transform: "scale(0.86)" },
                { transform: "scale(1)" }
              ],
              {
                duration: 400,
                delay: delay + 55,
                easing: "cubic-bezier(0.22, 1, 0.36, 1)",
                fill: "backwards"
              }
            )
          );
        }
      });
    };

    const revealAllImmediately = () => {
      headerObserver?.disconnect();
      cardObserver?.disconnect();
      headerRevealed = true;
      section.classList.remove(pendingHeaderClass);
      cards.forEach((card) => {
        revealedCards.add(card);
        card.classList.remove("is-scroll-pending");
      });
    };

    section.addEventListener("focusin", () => {
      revealHeader({ animate: false });
      cards.forEach((card) => {
        if (!revealedCards.has(card)) {
          revealedCards.add(card);
          cardObserver?.unobserve(card);
          card.classList.remove("is-scroll-pending");
        }
      });
    });

    reducedMotion.addEventListener("change", () => {
      if (reducedMotion.matches) {
        runningAnimations.forEach((anim) => anim.cancel());
        runningAnimations.length = 0;
        revealAllImmediately();
      }
    });

    if (reducedMotion.matches || !("IntersectionObserver" in window)) {
      revealAllImmediately();
      return;
    }

    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;

    if (header) {
      const headerRect = header.getBoundingClientRect();
      if (headerRect.top > viewportHeight * 0.88) {
        section.classList.add(pendingHeaderClass);
        headerObserver = new IntersectionObserver(
          (entries) => {
            if (entries.some((entry) => entry.isIntersecting)) {
              revealHeader({ animate: true });
            }
          },
          { rootMargin: "0px 0px -8% 0px", threshold: 0.15 }
        );
        headerObserver.observe(header);
      } else {
        headerRevealed = true;
      }
    } else {
      headerRevealed = true;
    }

    cardObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          revealHeader({ animate: true });
          revealRowContaining(entry.target, { animate: true });
        });
      },
      { rootMargin: "0px 0px -48px 0px", threshold: 0.18 }
    );

    cards.forEach((card) => {
      const rect = card.getBoundingClientRect();
      if (rect.top > viewportHeight * 0.86) {
        card.classList.add("is-scroll-pending");
        cardObserver.observe(card);
      } else {
        revealedCards.add(card);
      }
    });
  };

  /* ==========================================================================
     2. MỤC "CÁC BƯỚC THỰC HIỆN ĐỒ ÁN TRÊN HỆ THỐNG" (.about-workflow)
     ========================================================================== */
  const initWorkflowSection = () => {
    const section = document.querySelector(".about-workflow");
    if (!section) return;

    const header = section.querySelector(":scope > .section-header");
    const list = section.querySelector(".about-workflow__steps");
    const steps = [...section.querySelectorAll(".workflow-step")];
    const cards = [...section.querySelectorAll(".workflow-step__card")];
    if (!list || !steps.length) return;

    attachPointerSpotlight(cards);

    let headerRevealed = false;
    const revealedSteps = new WeakSet();
    const runningAnimations = [];
    let headerObserver = null;
    let stepObserver = null;
    let progressFrame = 0;

    const updateTimelineProgress = () => {
      progressFrame = 0;
      if (reducedMotion.matches) {
        list.style.setProperty("--workflow-progress", "100%");
        steps.forEach((step) => step.classList.add("is-reached"));
        return;
      }

      const rect = list.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
      if (!rect.height || !viewportHeight) return;

      // Vạch tiến trình chảy dọc theo tầm nhìn (từ 78% chiều cao màn hình)
      const triggerY = viewportHeight * 0.76;
      const rawRatio = (triggerY - rect.top) / rect.height;
      const clamped = Math.min(1, Math.max(0, rawRatio));
      list.style.setProperty("--workflow-progress", `${(clamped * 100).toFixed(1)}%`);

      steps.forEach((step) => {
        const node = step.querySelector(".workflow-step__node");
        if (!node) return;
        const nodeRect = node.getBoundingClientRect();
        const nodeCenter = nodeRect.top + nodeRect.height / 2;
        if (nodeCenter <= triggerY + 12 || revealedSteps.has(step)) {
          step.classList.add("is-reached");
        } else {
          step.classList.remove("is-reached");
        }
      });
    };

    const scheduleTimelineProgress = () => {
      if (progressFrame) return;
      progressFrame = requestAnimationFrame(updateTimelineProgress);
    };

    const revealHeader = ({ animate = true } = {}) => {
      if (headerRevealed) return;
      headerRevealed = true;
      headerObserver?.disconnect();
      section.classList.remove("about-workflow--header-pending");

      if (!animate || reducedMotion.matches || !canAnimate || !header) return;
      runningAnimations.push(
        header.animate(
          [
            { opacity: 0, translate: "0 20px" },
            { opacity: 1, translate: "0 0" }
          ],
          {
            duration: 420,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
            fill: "backwards"
          }
        )
      );
    };

    const revealStep = (step, index, { animate = true } = {}) => {
      if (revealedSteps.has(step)) return;
      revealedSteps.add(step);
      stepObserver?.unobserve(step);
      step.classList.remove("is-scroll-pending");
      step.classList.add("is-reached");
      scheduleTimelineProgress();

      if (!animate || reducedMotion.matches || !canAnimate) return;

      const card = step.querySelector(".workflow-step__card");
      const node = step.querySelector(".workflow-step__node");
      const connector = step.querySelector(".workflow-step__connector");
      const icon = step.querySelector(".workflow-step__icon");
      const isCompact = window.matchMedia("(max-width: 48rem)").matches;
      const horizontalOffset = isCompact ? 18 : index % 2 === 0 ? -24 : 24;

      if (node) {
        runningAnimations.push(
          node.animate(
            [
              { opacity: 0, transform: "scale(0.72)" },
              { opacity: 1, transform: "scale(1)" }
            ],
            {
              duration: 380,
              easing: "cubic-bezier(0.22, 1, 0.36, 1)",
              fill: "backwards"
            }
          )
        );
      }

      if (connector) {
        runningAnimations.push(
          connector.animate(
            [
              { opacity: 0, transform: "translateY(-50%) scaleX(0)" },
              { opacity: 1, transform: "translateY(-50%) scaleX(1)" }
            ],
            {
              duration: 340,
              delay: 45,
              easing: "cubic-bezier(0.22, 1, 0.36, 1)",
              fill: "backwards"
            }
          )
        );
      }

      if (card) {
        runningAnimations.push(
          card.animate(
            [
              { opacity: 0, translate: `${horizontalOffset}px 18px` },
              { opacity: 1, translate: "0 0" }
            ],
            {
              duration: 460,
              delay: 60,
              easing: "cubic-bezier(0.22, 1, 0.36, 1)",
              fill: "backwards"
            }
          )
        );
      }

      if (icon) {
        runningAnimations.push(
          icon.animate(
            [
              { transform: "scale(0.86)" },
              { transform: "scale(1)" }
            ],
            {
              duration: 400,
              delay: 110,
              easing: "cubic-bezier(0.22, 1, 0.36, 1)",
              fill: "backwards"
            }
          )
        );
      }
    };

    const revealAllImmediately = () => {
      headerObserver?.disconnect();
      stepObserver?.disconnect();
      headerRevealed = true;
      section.classList.remove("about-workflow--header-pending");
      list.style.setProperty("--workflow-progress", "100%");
      steps.forEach((step) => {
        revealedSteps.add(step);
        step.classList.remove("is-scroll-pending");
        step.classList.add("is-reached");
      });
    };

    section.addEventListener("focusin", () => {
      revealHeader({ animate: false });
      steps.forEach((step, idx) => {
        if (!revealedSteps.has(step)) {
          revealStep(step, idx, { animate: false });
        }
      });
    });

    reducedMotion.addEventListener("change", () => {
      if (reducedMotion.matches) {
        runningAnimations.forEach((anim) => anim.cancel());
        runningAnimations.length = 0;
        revealAllImmediately();
      }
    });

    if (reducedMotion.matches || !("IntersectionObserver" in window)) {
      revealAllImmediately();
      return;
    }

    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;

    if (header) {
      const headerRect = header.getBoundingClientRect();
      if (headerRect.top > viewportHeight * 0.88) {
        section.classList.add("about-workflow--header-pending");
        headerObserver = new IntersectionObserver(
          (entries) => {
            if (entries.some((entry) => entry.isIntersecting)) {
              revealHeader({ animate: true });
            }
          },
          { rootMargin: "0px 0px -8% 0px", threshold: 0.15 }
        );
        headerObserver.observe(header);
      } else {
        headerRevealed = true;
      }
    } else {
      headerRevealed = true;
    }

    stepObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          revealHeader({ animate: true });
          const idx = steps.indexOf(entry.target);
          revealStep(entry.target, idx < 0 ? 0 : idx, { animate: true });
        });
      },
      { rootMargin: "0px 0px -44px 0px", threshold: 0.2 }
    );

    steps.forEach((step) => {
      const rect = step.getBoundingClientRect();
      if (rect.top > viewportHeight * 0.86) {
        step.classList.add("is-scroll-pending");
        stepObserver.observe(step);
      } else {
        revealedSteps.add(step);
        step.classList.add("is-reached");
      }
    });

    window.addEventListener("scroll", scheduleTimelineProgress, { passive: true });
    window.addEventListener("resize", scheduleTimelineProgress, { passive: true });
    updateTimelineProgress();
  };

  /* ==========================================================================
     3. MỤC "TRẢI NGHIỆM TỪ GÓC NHÌN SINH VIÊN" (.about-feedback)
        Hỗ trợ vuốt touchpad / cảm ứng ngang tự nhiên + nút điều hướng + dots
     ========================================================================== */
  const initFeedbackCarousel = () => {
    const section = document.querySelector(".about-feedback");
    if (!section) return;

    const header = section.querySelector(":scope > .section-header");
    const viewport = section.querySelector("[data-feedback-viewport]");
    const track = section.querySelector("[data-feedback-track]");
    const cards = [...section.querySelectorAll(".feedback-card")];
    const dotsContainer = section.querySelector("[data-feedback-dots]");
    const prevBtn = section.querySelector("[data-feedback-prev]");
    const nextBtn = section.querySelector("[data-feedback-next]");
    const controls = section.querySelector(".about-feedback__controls");
    if (!viewport || !track || !cards.length) return;

    attachPointerSpotlight(cards);

    let stepOffsets = [];
    let currentIndex = 0;
    let scrollTicking = 0;

    const computeSteps = () => {
      if (!cards.length) return;
      const baseLeft = cards[0].offsetLeft;
      const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
      const rawOffsets = cards.map((card) =>
        Math.min(maxScroll, Math.max(0, Math.round(card.offsetLeft - baseLeft)))
      );

      // Lọc các vị trí cuộn trùng nhau ở cuối dải (khi 3 thẻ cuối đã chạm biên phải)
      stepOffsets = [];
      rawOffsets.forEach((offset) => {
        if (!stepOffsets.length || Math.abs(offset - stepOffsets[stepOffsets.length - 1]) > 8) {
          stepOffsets.push(offset);
        }
      });
      if (!stepOffsets.length) stepOffsets = [0];

      if (dotsContainer) {
        dotsContainer.innerHTML = "";
        stepOffsets.forEach((_, idx) => {
          const dot = document.createElement("button");
          dot.type = "button";
          dot.className = "about-feedback__dot";
          dot.dataset.feedbackDot = String(idx);
          dot.setAttribute("aria-label", `Xem vị trí chia sẻ ${idx + 1} trên ${stepOffsets.length}`);
          dotsContainer.append(dot);
        });
      }
    };

    const syncControlsFromScroll = () => {
      scrollTicking = 0;
      if (!stepOffsets.length) computeSteps();

      const scrollLeft = track.scrollLeft;
      const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);

      // Tìm bước gần vị trí cuộn hiện tại nhất
      let bestIdx = 0;
      let minDiff = Infinity;
      stepOffsets.forEach((offset, idx) => {
        const diff = Math.abs(scrollLeft - offset);
        if (diff < minDiff) {
          minDiff = diff;
          bestIdx = idx;
        }
      });
      currentIndex = bestIdx;

      if (dotsContainer) {
        const dots = [...dotsContainer.querySelectorAll(".about-feedback__dot")];
        dots.forEach((dot, idx) => {
          const active = idx === currentIndex;
          dot.classList.toggle("is-active", active);
          if (active) dot.setAttribute("aria-current", "true");
          else dot.removeAttribute("aria-current");
        });
      }

      const atStart = scrollLeft <= 6;
      const atEnd = scrollLeft >= maxScroll - 6;
      if (prevBtn) prevBtn.disabled = atStart;
      if (nextBtn) nextBtn.disabled = atEnd;

      viewport.classList.toggle("has-fade-left", !atStart);
      viewport.classList.toggle("has-fade-right", !atEnd);
    };

    const scrollToStep = (targetIndex) => {
      if (!stepOffsets.length) computeSteps();
      const clampedIdx = Math.min(stepOffsets.length - 1, Math.max(0, targetIndex));
      currentIndex = clampedIdx;
      track.scrollTo({
        left: stepOffsets[clampedIdx],
        behavior: reducedMotion.matches ? "instant" : "smooth"
      });
    };

    track.addEventListener(
      "scroll",
      () => {
        if (scrollTicking) return;
        scrollTicking = requestAnimationFrame(syncControlsFromScroll);
      },
      { passive: true }
    );

    prevBtn?.addEventListener("click", () => scrollToStep(currentIndex - 1));
    nextBtn?.addEventListener("click", () => scrollToStep(currentIndex + 1));

    dotsContainer?.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-feedback-dot]");
      if (!btn) return;
      const idx = Number(btn.dataset.feedbackDot);
      if (!Number.isNaN(idx)) scrollToStep(idx);
    });

    track.addEventListener("keydown", (event) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        scrollToStep(currentIndex + 1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        scrollToStep(currentIndex - 1);
      } else if (event.key === "Home") {
        event.preventDefault();
        scrollToStep(0);
      } else if (event.key === "End") {
        event.preventDefault();
        scrollToStep(stepOffsets.length - 1);
      }
    });

    const handleResize = () => {
      computeSteps();
      syncControlsFromScroll();
    };
    window.addEventListener("resize", handleResize, { passive: true });
    document.fonts?.ready.then(handleResize);
    handleResize();

    // Hiệu ứng cuộn xuống tới khu vực
    let headerRevealed = false;
    let contentRevealed = false;
    const runningAnimations = [];
    let headerObserver = null;
    let contentObserver = null;

    const revealHeader = ({ animate = true } = {}) => {
      if (headerRevealed) return;
      headerRevealed = true;
      headerObserver?.disconnect();
      section.classList.remove("about-feedback--header-pending");

      if (!animate || reducedMotion.matches || !canAnimate || !header) return;
      runningAnimations.push(
        header.animate(
          [
            { opacity: 0, translate: "0 20px" },
            { opacity: 1, translate: "0 0" }
          ],
          {
            duration: 420,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
            fill: "backwards"
          }
        )
      );
    };

    const revealContent = ({ animate = true } = {}) => {
      if (contentRevealed) return;
      contentRevealed = true;
      contentObserver?.disconnect();
      revealHeader({ animate });
      section.classList.remove("about-feedback--scroll-pending");

      if (!animate || reducedMotion.matches || !canAnimate) return;

      cards.slice(0, 4).forEach((card, idx) => {
        runningAnimations.push(
          card.animate(
            [
              { opacity: 0, translate: "0 24px" },
              { opacity: 1, translate: "0 0" }
            ],
            {
              duration: 460,
              delay: idx * 80,
              easing: "cubic-bezier(0.22, 1, 0.36, 1)",
              fill: "backwards"
            }
          )
        );
      });

      if (controls) {
        runningAnimations.push(
          controls.animate(
            [
              { opacity: 0, translate: "0 14px" },
              { opacity: 1, translate: "0 0" }
            ],
            {
              duration: 380,
              delay: 220,
              easing: "cubic-bezier(0.22, 1, 0.36, 1)",
              fill: "backwards"
            }
          )
        );
      }
    };

    const revealAllImmediately = () => {
      headerObserver?.disconnect();
      contentObserver?.disconnect();
      headerRevealed = true;
      contentRevealed = true;
      section.classList.remove("about-feedback--header-pending", "about-feedback--scroll-pending");
    };

    section.addEventListener("focusin", () => {
      revealContent({ animate: false });
    });

    reducedMotion.addEventListener("change", () => {
      if (reducedMotion.matches) {
        runningAnimations.forEach((anim) => anim.cancel());
        runningAnimations.length = 0;
        revealAllImmediately();
      }
    });

    if (reducedMotion.matches || !("IntersectionObserver" in window)) {
      revealAllImmediately();
      return;
    }

    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
    const sectionRect = section.getBoundingClientRect();

    if (sectionRect.top > viewportHeight * 0.86) {
      section.classList.add("about-feedback--header-pending", "about-feedback--scroll-pending");
      headerObserver = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            revealHeader({ animate: true });
          }
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
      );
      if (header) headerObserver.observe(header);

      contentObserver = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            revealContent({ animate: true });
          }
        },
        { rootMargin: "0px 0px -48px 0px", threshold: 0.18 }
      );
      contentObserver.observe(viewport);
    } else {
      revealAllImmediately();
    }
  };

  initCardGridSection({
    sectionSelector: "#chuc-nang.about-features",
    cardSelector: ".feature-card",
    iconSelector: ".feature-card__icon",
    pendingHeaderClass: "about-features--header-pending"
  });
  initWorkflowSection();
  initCardGridSection({
    sectionSelector: ".about-team",
    cardSelector: ".member-card",
    iconSelector: ".member-card__avatar-wrap",
    pendingHeaderClass: "about-team--header-pending"
  });
  initFeedbackCarousel();
})();
