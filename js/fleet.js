(() => {
    const fleetGrid = document.querySelector(".fleet");
    if (!fleetGrid) return;

    const fleetCards = Array.from(fleetGrid.querySelectorAll(".car"));
    const fleetFocusRoot = document.getElementById("fleet-focus-root");
    if (!fleetFocusRoot || fleetCards.length === 0) return;

    // Overlay structure
    const overlay = document.createElement("div");
    overlay.className = "fleet-focus-overlay";
    overlay.setAttribute("aria-hidden", "true");

    const card = document.createElement("article");
    card.className = "fleet-focus-card";

    const closeButton = document.createElement("button");
    closeButton.className = "fleet-focus-close";
    closeButton.innerHTML = "&times;";
    closeButton.setAttribute("aria-label", "Fechar detalhes");

    const media = document.createElement("img");
    media.className = "fleet-focus-media";

    const dotsGrid = document.createElement("div");
    dotsGrid.className = "fleet-focus-dots";

    const content = document.createElement("div");
    content.className = "fleet-focus-content";

    const title = document.createElement("h2");
    title.className = "fleet-focus-title";

    const copy = document.createElement("p");
    copy.className = "fleet-focus-copy";

    content.append(title, copy, dotsGrid);
    card.append(media, closeButton, content);

    const prevBtn = document.createElement("button");
    prevBtn.className = "focus-nav-btn is-prev";
    prevBtn.innerHTML = "&#8249;";
    prevBtn.setAttribute("aria-label", "Carro anterior");

    const nextBtn = document.createElement("button");
    nextBtn.className = "focus-nav-btn is-next";
    nextBtn.innerHTML = "&#8250;";
    nextBtn.setAttribute("aria-label", "Próximo carro");

    overlay.append(prevBtn, card, nextBtn);
    fleetFocusRoot.appendChild(overlay);

    let activeFleetIndex = 0;
    let activePhotoIndex = 0;
    const fleetData = [];

    const render = () => {
        const data = fleetData[activeFleetIndex];
        if (!data) return;

        title.textContent = data.title;
        copy.textContent = data.description;

        window.runFadeSwap(media, "is-fading", 120, () => {
            media.src = data.gallery[activePhotoIndex];
            media.alt = data.alts[activePhotoIndex] || data.title;
        });

        // Dots
        dotsGrid.innerHTML = "";
        if (data.gallery.length > 1) {
            data.gallery.forEach((_, i) => {
                const dot = document.createElement("button");
                dot.className = `fleet-focus-dot ${i === activePhotoIndex ? "is-active" : ""}`;
                dot.addEventListener("click", () => {
                    activePhotoIndex = i;
                    render();
                });
                dotsGrid.appendChild(dot);
            });
        }
    };

    const next = () => {
        activeFleetIndex = (activeFleetIndex + 1) % fleetData.length;
        activePhotoIndex = 0;
        render();
    };

    const prev = () => {
        activeFleetIndex = (activeFleetIndex - 1 + fleetData.length) % fleetData.length;
        activePhotoIndex = 0;
        render();
    };

    const open = (index) => {
        activeFleetIndex = index;
        activePhotoIndex = 0;
        render();
        if (window.lockBodyScroll) window.lockBodyScroll();
        overlay.classList.add("is-visible");
        overlay.setAttribute("aria-hidden", "false");
    };

    const close = () => {
        overlay.classList.remove("is-visible");
        overlay.setAttribute("aria-hidden", "true");
        if (window.unlockBodyScroll) window.unlockBodyScroll();
    };

    // Extract data and bind clicks
    fleetCards.forEach((el, i) => {
        const gallery = window.parseDelimitedList(el.querySelector(".car-photo")?.dataset.gallery, ",");
        const alts = window.parseDelimitedList(el.querySelector(".car-photo")?.dataset.galleryAlts, "|");

        fleetData.push({
            title: el.querySelector("h3")?.textContent || "Carro",
            description: el.querySelector("p")?.textContent || "",
            gallery: gallery.length ? gallery : [el.querySelector("img")?.src],
            alts: alts
        });

        el.addEventListener("click", (e) => {
            if (e.target.closest("a, button")) return;
            open(i);
        });
    });

    closeButton.addEventListener("click", close);
    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) close();
    });

    prevBtn.addEventListener("click", prev);
    nextBtn.addEventListener("click", next);

    if (window.bindHorizontalSwipe) {
        window.bindHorizontalSwipe(overlay, next, prev);
    }

    // Keyboard
    document.addEventListener("keydown", (e) => {
        if (!overlay.classList.contains("is-visible")) return;
        if (e.key === "Escape") close();
        if (e.key === "ArrowRight") next();
        if (e.key === "ArrowLeft") prev();
    });
})();
