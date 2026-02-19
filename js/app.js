const fleetGalleryControllers = new Map();

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

    history.pushState(null, "", hash);
  });
})();

(() => {
  const carPhotos = Array.from(document.querySelectorAll(".fleet .car-photo[data-gallery]"));
  if (carPhotos.length === 0) return;

  const parseList = (value, separator) =>
    (value || "")
      .split(separator)
      .map((item) => item.trim())
      .filter(Boolean);

  carPhotos.forEach((photo, photoIndex) => {
    const sources = parseList(photo.dataset.gallery, ",");
    if (sources.length < 2) return;

    const card = photo.closest(".car");
    if (!card) return;
    if (!card.dataset.cardId) {
      card.dataset.cardId = `car-${photoIndex}`;
    }
    const cardId = card.dataset.cardId;

    const alts = parseList(photo.dataset.galleryAlts, "|");
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

    const setSlide = (index) => {
      currentIndex = (index + sources.length) % sources.length;
      img.src = sources[currentIndex];
      img.alt = alts[currentIndex] || alts[0] || "Foto da frota";
      photo.dataset.activeIndex = String(currentIndex);
      dotButtons.forEach((dot, dotIndex) => {
        dot.classList.toggle("is-active", dotIndex === currentIndex);
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
    setSlide(0);
  });
})();

(() => {
  const React = window.React;
  const ReactDOM = window.ReactDOM;
  const fleetRoot = document.getElementById("fleet-focus-root");
  const fleetCards = Array.from(document.querySelectorAll(".fleet .car"));

  if (!React || !ReactDOM || !fleetRoot || fleetCards.length === 0) return;

  const { useEffect, useRef, useState } = React;
  const parseList = (value, separator) =>
    (value || "")
      .split(separator)
      .map((item) => item.trim())
      .filter(Boolean);

  const extractCardData = (card) => {
    const photo = card.querySelector(".car-photo");
    const fallbackSrc = photo?.querySelector("img")?.getAttribute("src") || "";
    const fallbackAlt = photo?.querySelector("img")?.getAttribute("alt") || "Carro da frota";
    const gallery = parseList(photo?.dataset.gallery, ",");
    const galleryAlts = parseList(photo?.dataset.galleryAlts, "|");
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

  function FleetFocusOverlay() {
    const [activeCard, setActiveCard] = useState(null);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const enterDelayMs = 35;
    const unmountDelayMs = 360;
    const showTimerRef = useRef(null);
    const unmountTimerRef = useRef(null);
    const activeCardRef = useRef(null);
    const activeImageIndexRef = useRef(0);

    const clearTimers = () => {
      if (showTimerRef.current) {
        window.clearTimeout(showTimerRef.current);
        showTimerRef.current = null;
      }
      if (unmountTimerRef.current) {
        window.clearTimeout(unmountTimerRef.current);
        unmountTimerRef.current = null;
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
      img.alt =
        (cardData.galleryAlts && cardData.galleryAlts[safeIndex]) ||
        cardData.imageAlt ||
        "Carro da frota";
      photo.dataset.activeIndex = String(safeIndex);
    };

    const show = (card) => {
      clearTimers();
      const data = extractCardData(card);
      const maxIndex = Math.max((data.gallery?.length || 1) - 1, 0);
      const startIndex = Math.min(Math.max(data.activeIndex, 0), maxIndex);
      setActiveCard(data);
      setActiveImageIndex(startIndex);
      showTimerRef.current = window.setTimeout(() => setIsVisible(true), enterDelayMs);
    };

    const hide = () => {
      clearTimers();
      const currentCard = activeCardRef.current;
      const selectedIndex = activeImageIndexRef.current;
      syncCardSelection(currentCard, selectedIndex);
      setIsVisible(false);
      unmountTimerRef.current = window.setTimeout(() => setActiveCard(null), unmountDelayMs);
    };

    useEffect(() => {
      const handlers = fleetCards.map((card) => {
        const onClick = () => show(card);
        card.addEventListener("click", onClick);
        return { card, onClick };
      });

      const onKeyDown = (event) => {
        const current = activeCardRef.current;
        if (!current) return;
        if (event.key === "Escape") {
          hide();
        }
        if (event.key === "ArrowRight" && current.gallery.length > 1) {
          setActiveImageIndex((index) => (index + 1) % current.gallery.length);
        }
        if (event.key === "ArrowLeft" && current.gallery.length > 1) {
          setActiveImageIndex((index) => (index - 1 + current.gallery.length) % current.gallery.length);
        }
      };
      document.addEventListener("keydown", onKeyDown);

      return () => {
        clearTimers();
        document.removeEventListener("keydown", onKeyDown);
        handlers.forEach(({ card, onClick }) => {
          card.removeEventListener("click", onClick);
        });
      };
    }, []);

    useEffect(() => {
      activeCardRef.current = activeCard;
    }, [activeCard]);

    useEffect(() => {
      activeImageIndexRef.current = activeImageIndex;
    }, [activeImageIndex]);

    if (!activeCard) return null;

    const gallerySize = activeCard.gallery?.length || 0;
    const currentImageSrc = gallerySize > 0 ? activeCard.gallery[activeImageIndex] : activeCard.imageSrc;
    const currentImageAlt =
      (activeCard.galleryAlts && activeCard.galleryAlts[activeImageIndex]) ||
      activeCard.imageAlt ||
      "Carro da frota";

    return React.createElement(
      "div",
      {
        className: `fleet-focus-overlay ${isVisible ? "is-visible" : ""}`,
        "aria-hidden": "true",
        onClick: hide,
      },
      React.createElement(
        "article",
        {
          className: "fleet-focus-card",
          onClick: (event) => event.stopPropagation(),
        },
        React.createElement(
          "button",
          {
            type: "button",
            className: "fleet-focus-close",
            "aria-label": "Fechar destaque",
            onClick: hide,
          },
          "\u00d7"
        ),
        currentImageSrc
          ? React.createElement("img", {
              className: "fleet-focus-media",
              src: currentImageSrc,
              alt: currentImageAlt,
            })
          : null,
        gallerySize > 1
          ? React.createElement(
              React.Fragment,
              null,
              React.createElement(
                "button",
                {
                  type: "button",
                  className: "fleet-focus-control prev",
                  "aria-label": "Foto anterior",
                  onClick: (event) => {
                    event.stopPropagation();
                    setActiveImageIndex((index) => (index - 1 + gallerySize) % gallerySize);
                  },
                },
                "<"
              ),
              React.createElement(
                "button",
                {
                  type: "button",
                  className: "fleet-focus-control next",
                  "aria-label": "Proxima foto",
                  onClick: (event) => {
                    event.stopPropagation();
                    setActiveImageIndex((index) => (index + 1) % gallerySize);
                  },
                },
                ">"
              ),
              React.createElement(
                "div",
                { className: "fleet-focus-dots" },
                activeCard.gallery.map((_, dotIndex) =>
                  React.createElement("button", {
                    key: `dot-${dotIndex}`,
                    type: "button",
                    className: `fleet-focus-dot ${dotIndex === activeImageIndex ? "is-active" : ""}`,
                    "aria-label": `Ir para foto ${dotIndex + 1}`,
                    onClick: (event) => {
                      event.stopPropagation();
                      setActiveImageIndex(dotIndex);
                    },
                  })
                )
              )
            )
          : null,
        React.createElement(
          "div",
          { className: "fleet-focus-content" },
          activeCard.tag ? React.createElement("div", { className: "tag" }, activeCard.tag) : null,
          React.createElement("h3", { className: "fleet-focus-title" }, activeCard.title),
          React.createElement("p", { className: "fleet-focus-copy" }, activeCard.copy)
        )
      )
    );
  }

  if (typeof ReactDOM.createRoot === "function") {
    ReactDOM.createRoot(fleetRoot).render(React.createElement(FleetFocusOverlay));
  } else {
    ReactDOM.render(React.createElement(FleetFocusOverlay), fleetRoot);
  }
})();
