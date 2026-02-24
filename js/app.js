const fleetGalleryControllers = new Map();

const parseDelimitedList = (value, separator) =>
  (value || "")
    .split(separator)
    .map((item) => item.trim())
    .filter(Boolean);
const runFadeSwap = (element, fadeClassName, swapDelayMs, swap) => {
  element.classList.add(fadeClassName);
  window.setTimeout(() => {
    swap();
    const clearFade = () => element.classList.remove(fadeClassName);
    if (element.complete) {
      window.requestAnimationFrame(clearFade);
    } else {
      element.addEventListener("load", clearFade, { once: true });
      window.setTimeout(clearFade, 280);
    }
  }, swapDelayMs);
};

(() => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const topGap = 18;

  document.addEventListener("click", (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const hash = link.getAttribute("href");
    if (!hash || hash === "#") return;

    const target = document.querySelector(hash);
    if (!target) return;

    event.preventDefault();

    const targetTop = target.getBoundingClientRect().top + window.scrollY;
    const desiredTop = targetTop - topGap;
    const maxScrollTop = document.documentElement.scrollHeight - window.innerHeight;
    const scrollTop = Math.min(Math.max(desiredTop, 0), Math.max(maxScrollTop, 0));

    window.scrollTo({
      top: scrollTop,
      behavior: prefersReducedMotion.matches ? "auto" : "smooth",
    });

    if (window.location.hash !== hash) {
      history.pushState(null, "", hash);
    }
  });
})();

(() => {
  const header = document.querySelector("header");
  const nav = header?.querySelector("nav");
  const quickNav = header?.querySelector(".mobile-quick-nav");
  const toggle = quickNav?.querySelector(".mobile-menu-toggle");
  const panel = header?.querySelector(".mobile-menu-panel");

  if (!header || !nav || !quickNav || !toggle || !panel) return;

  const navLinks = Array.from(nav.querySelectorAll("a"));
  if (navLinks.length === 0) return;

  const used = new Set();
  navLinks.forEach((link) => {
    const href = link.getAttribute("href");
    if (!href) return;

    const label = (link.textContent || "").trim() || link.getAttribute("aria-label") || "Inicio";
    const key = `${href}|${label}`;
    if (used.has(key)) return;
    used.add(key);

    const panelLink = document.createElement("a");
    panelLink.href = href;
    panelLink.textContent = label;
    panel.appendChild(panelLink);
  });

  const closeMenu = () => {
    toggle.setAttribute("aria-expanded", "false");
    panel.classList.remove("is-open");
    panel.setAttribute("aria-hidden", "true");
  };

  const openMenu = () => {
    toggle.setAttribute("aria-expanded", "true");
    panel.classList.add("is-open");
    panel.setAttribute("aria-hidden", "false");
  };

  toggle.addEventListener("click", () => {
    const isOpen = panel.classList.contains("is-open");
    if (isOpen) {
      closeMenu();
      return;
    }
    openMenu();
  });

  panel.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeMenu();
  });

  document.addEventListener("click", (event) => {
    if (!panel.classList.contains("is-open")) return;
    if (header.contains(event.target)) return;
    closeMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (!panel.classList.contains("is-open")) return;
    closeMenu();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 720) closeMenu();
  });
})();

(() => {
  const carPhotos = Array.from(document.querySelectorAll(".car-photo[data-gallery]"));
  if (carPhotos.length === 0) return;

  carPhotos.forEach((photo, photoIndex) => {
    const sources = parseDelimitedList(photo.dataset.gallery, ",");
    if (sources.length < 2) return;

    const card = photo.closest(".car, .crew-card");
    if (!card) return;
    if (!card.dataset.cardId) {
      card.dataset.cardId = `car-${photoIndex}`;
    }
    const cardId = card.dataset.cardId;

    const alts = parseDelimitedList(photo.dataset.galleryAlts, "|");
    const placeholder = photo.querySelector("span");
    if (placeholder) placeholder.remove();

    let img = photo.querySelector("img");
    if (!img) {
      img = document.createElement("img");
      photo.prepend(img);
    }

    let currentIndex = 0;
    const dotsWrap = document.createElement("div");
    dotsWrap.className = "car-photo-dots";

    const prevButton = document.createElement("button");
    prevButton.type = "button";
    prevButton.className = "car-photo-control prev";
    prevButton.setAttribute("aria-label", "Foto anterior");
    prevButton.textContent = "<";

    const nextButton = document.createElement("button");
    nextButton.type = "button";
    nextButton.className = "car-photo-control next";
    nextButton.setAttribute("aria-label", "Proxima foto");
    nextButton.textContent = ">";

    const dotButtons = sources.map((_, index) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "car-photo-dot";
      dot.setAttribute("aria-label", `Ir para foto ${index + 1}`);
      dotsWrap.appendChild(dot);
      return dot;
    });

    const setSlide = (index, animate = true) => {
      const nextIndex = (index + sources.length) % sources.length;
      if (nextIndex === currentIndex && img.getAttribute("src")) return;

      const applySlide = () => {
        currentIndex = nextIndex;
        img.src = sources[currentIndex];
        img.alt = alts[currentIndex] || alts[0] || "Foto da frota";
        photo.dataset.activeIndex = String(currentIndex);
        dotButtons.forEach((dot, dotIndex) => {
          dot.classList.toggle("is-active", dotIndex === currentIndex);
        });
      };

      if (!animate) {
        applySlide();
        return;
      }

      runFadeSwap(img, "is-fading", 120, () => {
        applySlide();
      });
    };

    fleetGalleryControllers.set(cardId, {
      setSlide,
      getCurrentIndex: () => currentIndex,
    });

    const stopCardClick = (event) => {
      event.preventDefault();
      event.stopPropagation();
    };

    prevButton.addEventListener("click", (event) => {
      stopCardClick(event);
      setSlide(currentIndex - 1);
    });

    nextButton.addEventListener("click", (event) => {
      stopCardClick(event);
      setSlide(currentIndex + 1);
    });

    dotButtons.forEach((dot, dotIndex) => {
      dot.addEventListener("click", (event) => {
        stopCardClick(event);
        setSlide(dotIndex);
      });
    });

    photo.append(prevButton, nextButton, dotsWrap);
    setSlide(0, false);
  });
})();

(() => {
  const fleetRoot = document.getElementById("fleet-focus-root");
  const fleetCards = Array.from(document.querySelectorAll(".fleet .car"));

  if (!fleetRoot || fleetCards.length === 0) return;

  const extractCardData = (card) => {
    const photo = card.querySelector(".car-photo");
    const fallbackSrc = photo?.querySelector("img")?.getAttribute("src") || "";
    const fallbackAlt = photo?.querySelector("img")?.getAttribute("alt") || "Carro da frota";
    const gallery = parseDelimitedList(photo?.dataset.gallery, ",");
    const galleryAlts = parseDelimitedList(photo?.dataset.galleryAlts, "|");
    const activeIndex = Number.parseInt(photo?.dataset.activeIndex || "0", 10);
    const normalizedGallery = gallery.length > 0 ? gallery : fallbackSrc ? [fallbackSrc] : [];

    return {
      cardId: card.dataset.cardId || "",
      imageSrc: fallbackSrc,
      imageAlt: fallbackAlt,
      gallery: normalizedGallery,
      galleryAlts,
      activeIndex: Number.isFinite(activeIndex) ? activeIndex : 0,
      tag: card.querySelector(".tag")?.textContent?.trim() || "",
      title: card.querySelector("h3")?.textContent?.trim() || "Frota ForRace",
      copy: card.querySelector("p")?.textContent?.trim() || "",
    };
  };

  const enterDelayMs = 35;
  const hideDelayMs = 360;
  let activeCard = null;
  let activeImageIndex = 0;
  let isMounted = false;
  let showTimer = null;
  let hideTimer = null;

  const clearTimers = () => {
    if (showTimer) {
      window.clearTimeout(showTimer);
      showTimer = null;
    }
    if (hideTimer) {
      window.clearTimeout(hideTimer);
      hideTimer = null;
    }
  };

  const syncCardSelection = (cardData, selectedIndex) => {
    if (!cardData) return;
    const gallerySize = cardData.gallery?.length || 0;
    if (gallerySize === 0) return;
    const safeIndex = ((selectedIndex % gallerySize) + gallerySize) % gallerySize;

    if (cardData.cardId && fleetGalleryControllers.has(cardData.cardId)) {
      const controller = fleetGalleryControllers.get(cardData.cardId);
      controller.setSlide(safeIndex);
      return;
    }

    const card = cardData.cardId
      ? document.querySelector(`.fleet .car[data-card-id="${cardData.cardId}"]`)
      : null;
    const photo = card?.querySelector(".car-photo");
    const img = photo?.querySelector("img");
    if (!photo || !img) return;

    img.src = cardData.gallery[safeIndex];
    img.alt = (cardData.galleryAlts && cardData.galleryAlts[safeIndex]) || cardData.imageAlt || "Carro da frota";
    photo.dataset.activeIndex = String(safeIndex);
  };

  const overlay = document.createElement("div");
  overlay.className = "fleet-focus-overlay";
  overlay.setAttribute("aria-hidden", "true");

  const cardEl = document.createElement("article");
  cardEl.className = "fleet-focus-card";

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "fleet-focus-close";
  closeButton.setAttribute("aria-label", "Fechar destaque");
  closeButton.textContent = "×";

  const media = document.createElement("img");
  media.className = "fleet-focus-media";
  media.alt = "Carro da frota";

  const prevButton = document.createElement("button");
  prevButton.type = "button";
  prevButton.className = "fleet-focus-control prev";
  prevButton.setAttribute("aria-label", "Foto anterior");
  prevButton.textContent = "<";

  const nextButton = document.createElement("button");
  nextButton.type = "button";
  nextButton.className = "fleet-focus-control next";
  nextButton.setAttribute("aria-label", "Proxima foto");
  nextButton.textContent = ">";

  const dots = document.createElement("div");
  dots.className = "fleet-focus-dots";

  const content = document.createElement("div");
  content.className = "fleet-focus-content";
  const tag = document.createElement("div");
  tag.className = "tag";
  const title = document.createElement("h3");
  title.className = "fleet-focus-title";
  const copy = document.createElement("p");
  copy.className = "fleet-focus-copy";

  content.append(tag, title, copy);
  cardEl.append(closeButton, media, prevButton, nextButton, dots, content);
  overlay.appendChild(cardEl);
  fleetRoot.appendChild(overlay);

  const updateDots = () => {
    dots.innerHTML = "";
    const gallerySize = activeCard?.gallery?.length || 0;
    if (gallerySize <= 1) return;

    for (let i = 0; i < gallerySize; i += 1) {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = `fleet-focus-dot ${i === activeImageIndex ? "is-active" : ""}`;
      dot.setAttribute("aria-label", `Ir para foto ${i + 1}`);
      dot.addEventListener("click", (event) => {
        event.stopPropagation();
        changeOverlaySlide(() => i);
      });
      dots.appendChild(dot);
    }
  };

  const renderOverlay = () => {
    if (!activeCard) return;
    const gallerySize = activeCard.gallery?.length || 0;
    const currentImageSrc = gallerySize > 0 ? activeCard.gallery[activeImageIndex] : activeCard.imageSrc;
    const currentImageAlt =
      (activeCard.galleryAlts && activeCard.galleryAlts[activeImageIndex]) || activeCard.imageAlt || "Carro da frota";

    media.src = currentImageSrc || "";
    media.alt = currentImageAlt;
    media.style.display = currentImageSrc ? "block" : "none";
    tag.textContent = activeCard.tag || "";
    tag.style.display = activeCard.tag ? "inline-block" : "none";
    title.textContent = activeCard.title;
    copy.textContent = activeCard.copy;

    const hasGallery = gallerySize > 1;
    prevButton.style.display = hasGallery ? "grid" : "none";
    nextButton.style.display = hasGallery ? "grid" : "none";
    dots.style.display = hasGallery ? "flex" : "none";
    updateDots();
  };

  const openOverlay = (card) => {
    clearTimers();
    const data = extractCardData(card);
    const maxIndex = Math.max((data.gallery?.length || 1) - 1, 0);
    activeCard = data;
    activeImageIndex = Math.min(Math.max(data.activeIndex, 0), maxIndex);
    renderOverlay();

    isMounted = true;
    overlay.style.display = "grid";
    showTimer = window.setTimeout(() => {
      overlay.classList.add("is-visible");
    }, enterDelayMs);
  };

  const closeOverlay = () => {
    if (!isMounted) return;
    clearTimers();
    syncCardSelection(activeCard, activeImageIndex);
    overlay.classList.remove("is-visible");
    hideTimer = window.setTimeout(() => {
      overlay.style.display = "none";
      activeCard = null;
      isMounted = false;
    }, hideDelayMs);
  };

  const changeOverlaySlide = (resolver) => {
    const gallerySize = activeCard?.gallery?.length || 0;
    if (gallerySize <= 1) return;

    runFadeSwap(media, "is-fading", 120, () => {
      const next = resolver(activeImageIndex, gallerySize);
      activeImageIndex = (next + gallerySize) % gallerySize;
      renderOverlay();
    });
  };

  overlay.addEventListener("click", closeOverlay);
  cardEl.addEventListener("click", (event) => event.stopPropagation());
  closeButton.addEventListener("click", closeOverlay);
  prevButton.addEventListener("click", (event) => {
    event.stopPropagation();
    changeOverlaySlide((index, size) => (index - 1 + size) % size);
  });
  nextButton.addEventListener("click", (event) => {
    event.stopPropagation();
    changeOverlaySlide((index, size) => (index + 1) % size);
  });

  fleetCards.forEach((card) => {
    card.addEventListener("click", (event) => {
      if (event.target.closest("a, button")) return;
      openOverlay(card);
    });
  });

  document.addEventListener("keydown", (event) => {
    if (!isMounted || !activeCard) return;
    if (event.key === "Escape") closeOverlay();
    if (event.key === "ArrowRight") changeOverlaySlide((index, size) => (index + 1) % size);
    if (event.key === "ArrowLeft") changeOverlaySlide((index, size) => (index - 1 + size) % size);
  });

  overlay.style.display = "none";
})();

(() => {
  const projectRoot = document.getElementById("project-focus-root");
  const projectCards = Array.from(document.querySelectorAll(".project-card[data-gallery]"));
  if (!projectRoot || projectCards.length === 0) return;

  const overlay = document.createElement("div");
  overlay.className = "project-focus-overlay";
  overlay.setAttribute("aria-hidden", "true");

  const card = document.createElement("article");
  card.className = "project-focus-card";
  card.style.position = "relative";

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "project-focus-close";
  closeButton.setAttribute("aria-label", "Fechar projeto");
  closeButton.textContent = "X";

  const mediaWrap = document.createElement("div");
  mediaWrap.className = "project-focus-media-wrap";
  const media = document.createElement("img");
  media.className = "project-focus-media";
  media.alt = "Foto do projeto";

  const prevButton = document.createElement("button");
  prevButton.type = "button";
  prevButton.className = "project-focus-control prev";
  prevButton.setAttribute("aria-label", "Foto anterior");
  prevButton.textContent = "<";

  const nextButton = document.createElement("button");
  nextButton.type = "button";
  nextButton.className = "project-focus-control next";
  nextButton.setAttribute("aria-label", "Proxima foto");
  nextButton.textContent = ">";

  const dots = document.createElement("div");
  dots.className = "project-focus-dots";
  mediaWrap.append(media, prevButton, nextButton, dots);

  const content = document.createElement("div");
  content.className = "project-focus-content";
  const tag = document.createElement("div");
  tag.className = "tag";
  const title = document.createElement("h3");
  const shortCopy = document.createElement("p");
  shortCopy.className = "project-focus-copy";
  const detailCopy = document.createElement("p");
  detailCopy.className = "project-focus-copy";

  const rentWidget = document.createElement("div");
  rentWidget.className = "project-rent-widget";
  const rentTitle = document.createElement("h4");
  rentTitle.textContent = "Aluga-se";
  const rentText = document.createElement("p");
  const rentCta = document.createElement("a");
  rentCta.className = "cta";
  rentCta.href = "https://wa.me/5511945339281";
  rentCta.target = "_blank";
  rentCta.rel = "noopener";
  rentCta.textContent = "Consultar disponibilidade";
  rentWidget.append(rentTitle, rentText, rentCta);

  content.append(tag, title, shortCopy, detailCopy, rentWidget);
  card.append(closeButton, mediaWrap, content);
  overlay.appendChild(card);
  projectRoot.appendChild(overlay);

  let activeData = null;
  let activeIndex = 0;

  const renderDots = () => {
    dots.innerHTML = "";
    const size = activeData?.gallery?.length || 0;
    if (size <= 1) return;
    for (let i = 0; i < size; i += 1) {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = `project-focus-dot ${i === activeIndex ? "is-active" : ""}`;
      dot.setAttribute("aria-label", `Ir para foto ${i + 1}`);
      dot.addEventListener("click", (event) => {
        event.stopPropagation();
        changeSlide(() => i);
      });
      dots.appendChild(dot);
    }
  };

  const render = () => {
    if (!activeData) return;
    const size = activeData.gallery.length;
    const src = activeData.gallery[activeIndex] || "";
    const alt = activeData.alts[activeIndex] || activeData.alts[0] || "Foto do projeto";

    media.src = src;
    media.alt = alt;
    tag.textContent = activeData.tag;
    title.textContent = activeData.title;
    shortCopy.textContent = activeData.shortCopy;
    detailCopy.textContent = activeData.detail;
    rentText.textContent = activeData.rentLabel;
    if (activeData.rentUrl) {
      rentWidget.style.display = "block";
      rentCta.href = activeData.rentUrl;
      rentCta.style.pointerEvents = "auto";
      rentCta.style.opacity = "1";
      rentCta.textContent = "Consultar disponibilidade";
      rentCta.removeAttribute("aria-disabled");
      rentCta.setAttribute("target", "_blank");
      rentCta.setAttribute("rel", "noopener");
    } else {
      rentWidget.style.display = "none";
      rentCta.removeAttribute("href");
      rentCta.style.pointerEvents = "none";
      rentCta.style.opacity = "0.6";
      rentCta.textContent = "Locacao indisponivel";
      rentCta.setAttribute("aria-disabled", "true");
      rentCta.removeAttribute("target");
      rentCta.removeAttribute("rel");
    }

    const hasGallery = size > 1;
    prevButton.style.display = hasGallery ? "grid" : "none";
    nextButton.style.display = hasGallery ? "grid" : "none";
    dots.style.display = hasGallery ? "flex" : "none";
    renderDots();
  };

  const open = (data) => {
    activeData = data;
    activeIndex = 0;
    render();
    overlay.style.display = "grid";
    window.setTimeout(() => overlay.classList.add("is-visible"), 20);
  };

  const close = () => {
    overlay.classList.remove("is-visible");
    window.setTimeout(() => {
      overlay.style.display = "none";
      activeData = null;
    }, 280);
  };

  const changeSlide = (resolver) => {
    const size = activeData?.gallery?.length || 0;
    if (size <= 1) return;
    runFadeSwap(media, "is-fading", 110, () => {
      const nextIndex = resolver(activeIndex, size);
      activeIndex = (nextIndex + size) % size;
      render();
    });
  };

  projectCards.forEach((el) => {
    const gallery = parseDelimitedList(el.dataset.gallery, ",");
    if (gallery.length === 0) return;
    const alts = parseDelimitedList(el.dataset.galleryAlts, "|");
    const rentLabel = el.dataset.rentLabel || "Disponivel sob consulta.";
    const rentUrl = el.dataset.rentUrl || "";

    if (rentUrl) {
      const preview = document.createElement("div");
      preview.className = "project-rent-preview";

      const previewTitle = document.createElement("h4");
      previewTitle.textContent = "Aluga-se";
      preview.append(previewTitle);
      const summaryElement = el.querySelector("p");
      if (summaryElement) {
        summaryElement.insertAdjacentElement("afterend", preview);
      } else {
        const titleElement = el.querySelector("h3");
        if (titleElement) {
          titleElement.insertAdjacentElement("afterend", preview);
        } else {
          el.appendChild(preview);
        }
      }
    }

    const data = {
      gallery,
      alts,
      tag: el.querySelector(".tag")?.textContent?.trim() || "Projeto",
      title: el.querySelector("h3")?.textContent?.trim() || "Projeto ForRace",
      shortCopy: el.querySelector("p")?.textContent?.trim() || "",
      detail: el.dataset.detail || "",
      rentLabel,
      rentUrl,
    };
    el.addEventListener("click", (event) => {
      if (event.target.closest("a, button")) return;
      open(data);
    });
  });

  closeButton.addEventListener("click", close);
  overlay.addEventListener("click", close);
  card.addEventListener("click", (event) => event.stopPropagation());
  prevButton.addEventListener("click", (event) => {
    event.stopPropagation();
    changeSlide((index, size) => (index - 1 + size) % size);
  });
  nextButton.addEventListener("click", (event) => {
    event.stopPropagation();
    changeSlide((index, size) => (index + 1) % size);
  });

  document.addEventListener("keydown", (event) => {
    if (!activeData) return;
    if (event.key === "Escape") close();
    if (event.key === "ArrowRight") changeSlide((index, size) => (index + 1) % size);
    if (event.key === "ArrowLeft") changeSlide((index, size) => (index - 1 + size) % size);
  });

  overlay.style.display = "none";
})();

(() => {
  const widgets = Array.from(document.querySelectorAll(".service-widget[data-whatsapp]"));
  if (widgets.length === 0) return;

  widgets.forEach((widget) => {
    const url = widget.dataset.whatsapp;
    if (!url) return;

    widget.addEventListener("click", (event) => {
      if (event.target.closest("a, button")) return;
      window.open(url, "_blank", "noopener");
    });

    widget.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      window.open(url, "_blank", "noopener");
    });

    widget.setAttribute("tabindex", "0");
    widget.setAttribute("role", "link");
    widget.setAttribute("aria-label", "Abrir atendimento de locacao no WhatsApp");
  });
})();

(() => {
  const carouselContainers = Array.from(
    document.querySelectorAll(".fleet, .grid, .projects-grid, .crew-grid, .service-widgets")
  );
  if (carouselContainers.length === 0) return;

  const isMobileViewport = window.matchMedia("(max-width: 720px)");
  const setups = [];

  carouselContainers.forEach((container) => {
    const cards = Array.from(container.children).filter((element) =>
      element.matches(".car, .card, .project-card, .crew-card, .service-widget")
    );
    if (cards.length <= 1) return;

    const dots = document.createElement("div");
    dots.className = "mobile-carousel-dots";
    dots.setAttribute("aria-hidden", "true");

    let activeIndex = 0;
    let ticking = false;

    const dotButtons = cards.map((_, index) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "mobile-carousel-dot";
      dot.setAttribute("aria-label", `Ir para card ${index + 1}`);
      dots.appendChild(dot);
      return dot;
    });

    const setActiveDot = (index) => {
      if (index === activeIndex) return;
      activeIndex = index;
      dotButtons.forEach((button, buttonIndex) => {
        button.classList.toggle("is-active", buttonIndex === activeIndex);
      });
    };

    const getClosestCardIndex = () => {
      const containerCenter = container.scrollLeft + container.clientWidth / 2;
      let closestIndex = 0;
      let smallestDistance = Number.POSITIVE_INFINITY;

      cards.forEach((card, index) => {
        const cardCenter = card.offsetLeft + card.offsetWidth / 2;
        const distance = Math.abs(cardCenter - containerCenter);
        if (distance < smallestDistance) {
          smallestDistance = distance;
          closestIndex = index;
        }
      });

      return closestIndex;
    };

    const updateDotVisibility = () => {
      const hasOverflow = container.scrollWidth - container.clientWidth > 8;
      const shouldShow = isMobileViewport.matches && hasOverflow;

      dots.classList.toggle("is-visible", shouldShow);
      dots.setAttribute("aria-hidden", String(!shouldShow));

      if (shouldShow) {
        setActiveDot(getClosestCardIndex());
      }
    };

    const onScroll = () => {
      if (!dots.classList.contains("is-visible")) return;
      if (ticking) return;
      ticking = true;

      window.requestAnimationFrame(() => {
        ticking = false;
        setActiveDot(getClosestCardIndex());
      });
    };

    dotButtons.forEach((dot, index) => {
      dot.addEventListener("click", () => {
        cards[index].scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      });
    });

    container.insertAdjacentElement("afterend", dots);
    dotButtons[0].classList.add("is-active");
    container.addEventListener("scroll", onScroll, { passive: true });
    setups.push(updateDotVisibility);
  });

  if (setups.length === 0) return;

  const refreshAll = () => {
    setups.forEach((refresh) => refresh());
  };

  if (typeof isMobileViewport.addEventListener === "function") {
    isMobileViewport.addEventListener("change", refreshAll);
  } else if (typeof isMobileViewport.addListener === "function") {
    isMobileViewport.addListener(refreshAll);
  }

  window.addEventListener("resize", refreshAll);
  window.addEventListener("load", refreshAll);
  refreshAll();
})();

(() => {
  const agendaLists = Array.from(document.querySelectorAll(".agenda-block .agenda-list"));
  if (agendaLists.length === 0) return;

  const collapsedItemsCount = 5;

  agendaLists.forEach((list, listIndex) => {
    const items = Array.from(list.querySelectorAll("li"));
    if (items.length <= collapsedItemsCount) return;

    let isExpanded = false;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "agenda-toggle";

    const render = () => {
      items.forEach((item, itemIndex) => {
        const shouldHide = !isExpanded && itemIndex >= collapsedItemsCount;
        item.classList.toggle("is-collapsed-hidden", shouldHide);
      });
      button.textContent = isExpanded ? "Ver menos datas" : "Ver mais datas";
      button.setAttribute("aria-expanded", String(isExpanded));
      button.setAttribute("aria-controls", list.id);
    };

    if (!list.id) {
      list.id = `agenda-list-${listIndex + 1}`;
    }

    button.addEventListener("click", () => {
      isExpanded = !isExpanded;
      render();
    });

    list.insertAdjacentElement("afterend", button);
    render();
  });
})();

