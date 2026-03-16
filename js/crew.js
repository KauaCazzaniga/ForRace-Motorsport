(() => {
    const crewGrid = document.querySelector(".crew-grid");
    if (!crewGrid) return;

    const crewCards = Array.from(document.querySelectorAll(".crew-card"));
    const crewFocusRoot = document.getElementById("crew-focus-root");
    if (!crewFocusRoot || crewCards.length === 0) return;

    // Overlay structure
    const overlay = document.createElement("div");
    overlay.className = "crew-focus-overlay";
    overlay.setAttribute("aria-hidden", "true");

    const card = document.createElement("article");
    card.className = "crew-focus-card";

    const closeButton = document.createElement("button");
    closeButton.className = "crew-focus-close";
    closeButton.innerHTML = "&times;";
    closeButton.setAttribute("aria-label", "Fechar detalhes");

    const media = document.createElement("img");
    media.className = "crew-focus-media";

    const content = document.createElement("div");
    content.className = "crew-focus-content";

    const tag = document.createElement("div");
    tag.className = "tag";

    const title = document.createElement("h2");
    title.className = "crew-focus-title";

    const copy = document.createElement("p");
    copy.className = "crew-focus-copy";

    content.append(tag, title, copy);
    card.append(media, closeButton, content);

    const prevBtn = document.createElement("button");
    prevBtn.className = "focus-nav-btn is-prev";
    prevBtn.innerHTML = "&#8249;";
    prevBtn.setAttribute("aria-label", "Membro anterior");

    const nextBtn = document.createElement("button");
    nextBtn.className = "focus-nav-btn is-next";
    nextBtn.innerHTML = "&#8250;";
    nextBtn.setAttribute("aria-label", "Próximo membro");

    overlay.append(prevBtn, card, nextBtn);
    crewFocusRoot.appendChild(overlay);

    let activeCrewIndex = 0;
    const crewData = [];

    const render = () => {
        const data = crewData[activeCrewIndex];
        if (!data) return;

        title.textContent = data.title;
        tag.textContent = data.tag;
        copy.textContent = data.description;

        if (data.photo) {
            media.style.display = "block";
            window.runFadeSwap(media, "is-fading", 120, () => {
                media.src = data.photo;
                media.alt = data.title;
            });
        } else {
            media.style.display = "none";
        }
    };

    const open = (index) => {
        activeCrewIndex = index;
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

    const next = () => {
        activeCrewIndex = (activeCrewIndex + 1) % crewData.length;
        render();
    };

    const prev = () => {
        activeCrewIndex = (activeCrewIndex - 1 + crewData.length) % crewData.length;
        render();
    };

    crewCards.forEach((el, i) => {
        crewData.push({
            title: el.querySelector("h3")?.textContent || "",
            tag: el.querySelector(".tag")?.textContent || "",
            description: el.querySelector("p")?.textContent || "",
            photo: el.querySelector(".car-photo")?.dataset.gallery || ""
        });

        el.style.cursor = "pointer";
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

    document.addEventListener("keydown", (e) => {
        if (!overlay.classList.contains("is-visible")) return;
        if (e.key === "Escape") close();
        if (e.key === "ArrowRight") next();
        if (e.key === "ArrowLeft") prev();
    });

    if (window.bindHorizontalSwipe) {
        window.bindHorizontalSwipe(overlay, next, prev);
    }
})();
