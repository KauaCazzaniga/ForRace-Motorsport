(() => {
    const projectRoot = document.getElementById("project-focus-root");
    const projectCards = Array.from(document.querySelectorAll(".project-card[data-gallery]"));
    if (!projectRoot || projectCards.length === 0) return;

    // Create Overlay
    const overlay = document.createElement("div");
    overlay.className = "project-focus-overlay";
    overlay.setAttribute("aria-hidden", "true");

    const card = document.createElement("article");
    card.className = "project-focus-card";

    const header = document.createElement("div");
    header.className = "project-focus-header";
    header.innerHTML = `<span class="project-focus-header-label">ForRace Motorsport</span><span class="project-focus-header-title">Detalhes do projeto</span>`;

    const closeButton = document.createElement("button");
    closeButton.className = "project-focus-close";
    closeButton.textContent = "X";

    const mediaWrap = document.createElement("div");
    mediaWrap.className = "project-focus-media-wrap";
    const media = document.createElement("img");
    media.className = "project-focus-media";
    const mediaVideo = document.createElement("iframe");
    mediaVideo.className = "project-focus-media project-focus-video";
    mediaVideo.style.display = "none";
    mediaVideo.setAttribute("allow", "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture");
    mediaVideo.setAttribute("allowfullscreen", "true");

    const dots = document.createElement("div");
    dots.className = "project-focus-dots";
    mediaWrap.append(media, mediaVideo, dots);

    const content = document.createElement("div");
    content.className = "project-focus-content";
    const title = document.createElement("h3");
    const projectInfo = document.createElement("div");
    projectInfo.className = "project-info";
    const shortCopy = document.createElement("p");
    shortCopy.className = "project-focus-copy project-focus-summary";
    const detailCopy = document.createElement("p");
    detailCopy.className = "project-focus-copy";
    projectInfo.append(shortCopy, detailCopy);

    const trackHeading = document.createElement("div");
    trackHeading.className = "project-track-heading";
    trackHeading.textContent = "Autódromos";
    const trackButtons = document.createElement("div");
    trackButtons.className = "project-track-buttons";
    const trackNote = document.createElement("p");
    trackNote.className = "project-focus-copy project-track-note";

    const rentWidget = document.createElement("div");
    rentWidget.className = "project-focus-rent-widget";
    rentWidget.innerHTML = `
        <div class="rent-info">
            <span class="rent-badge">ALUGA-SE</span>
            <p class="rent-label"></p>
        </div>
        <a class="rent-cta" href="" target="_blank" rel="noopener">
            WhatsApp
            <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12.04 3a8.94 8.94 0 0 0-7.8 13.33L3 21l4.83-1.27A8.94 8.94 0 1 0 12.04 3zm0 1.8a7.14 7.14 0 1 1 0 14.28 7.1 7.1 0 0 1-3.64-1l-.27-.16-2.84.74.76-2.77-.18-.29a7.12 7.12 0 0 1-1.12-3.8A7.14 7.14 0 0 1 12.04 4.8zm4.1 9.15c-.22-.11-1.28-.63-1.47-.7-.2-.07-.34-.11-.49.11-.14.22-.56.7-.69.85-.12.14-.25.16-.46.05-.22-.1-.9-.33-1.7-1.06-.62-.56-1.04-1.26-1.16-1.47-.12-.22-.01-.33.09-.43.09-.09.22-.25.33-.37.11-.12.14-.21.22-.35.07-.14.03-.27-.02-.38-.06-.11-.49-1.18-.67-1.61-.18-.43-.36-.37-.49-.37h-.42c-.14 0-.38.05-.58.27-.2.22-.76.74-.76 1.8 0 1.05.78 2.07.89 2.21.11.14 1.54 2.35 3.73 3.29.52.22.93.35 1.25.45.52.16 1 .14 1.38.09.42-.06 1.28-.52 1.46-1.03.18-.5.18-.93.12-1.03-.05-.1-.2-.16-.42-.27z"/></svg>
        </a>
    `;

    content.append(title, projectInfo, trackHeading, trackButtons, trackNote, rentWidget);
    card.append(header, closeButton, mediaWrap, content);

    const prevBtn = document.createElement("button");
    prevBtn.className = "focus-nav-btn is-prev";
    prevBtn.innerHTML = "&#8249;";
    prevBtn.setAttribute("aria-label", "Projeto anterior");

    const nextBtn = document.createElement("button");
    nextBtn.className = "focus-nav-btn is-next";
    nextBtn.innerHTML = "&#8250;";
    nextBtn.setAttribute("aria-label", "Próximo projeto");

    overlay.append(prevBtn, card, nextBtn);
    projectRoot.appendChild(overlay);

    let activeCardIndex = 0;
    let activePhotoIndex = 0;
    let activeTrackIndex = 0;
    let activeView = "project"; // "project" or "track"
    const projectDataList = [];

    const render = () => {
        const data = projectDataList[activeCardIndex];
        if (!data) return;

        title.textContent = data.title;
        shortCopy.textContent = data.shortCopy;
        detailCopy.textContent = data.detail;

        // Media logic
        const isTrackView = activeView === "track";
        const tracks = data.tracks || [];
        const currentTrack = tracks[activeTrackIndex];

        // Specific video logic (example from original)
        const shouldShowVideo = (activeCardIndex === 0 && isTrackView && activeTrackIndex === 2) ||
            (activeCardIndex === 1 && isTrackView && activeTrackIndex === 0);

        if (shouldShowVideo) {
            media.style.display = "none";
            mediaVideo.style.display = "block";
            mediaVideo.src = (activeCardIndex === 1) ? "https://www.youtube.com/embed/0NaIWkdqVAs" : "https://www.youtube.com/embed/2hlKoQCpf9I?start=136";
        } else {
            mediaVideo.style.display = "none";
            mediaVideo.removeAttribute("src");
            media.style.display = "block";
            window.runFadeSwap(media, "is-fading", 120, () => {
                media.src = data.gallery[activePhotoIndex];
                media.alt = data.alts[activePhotoIndex] || data.title;
            });
        }

        // Project Info vs Track Note
        projectInfo.style.display = isTrackView ? "none" : "block";
        trackNote.style.display = isTrackView ? "block" : "none";
        if (isTrackView && currentTrack) {
            trackNote.innerHTML = currentTrack.text;
            if (currentTrack.name.includes("|")) {
                const p = currentTrack.name.split("|");
                title.innerHTML = `<div class="track-title-container"><span>${p[0]}</span><br><small>${p[1]}</small></div>`;
            } else {
                title.textContent = currentTrack.name;
            }
        }

        trackButtons.innerHTML = "";
        tracks.forEach((t, i) => {
            const btn = document.createElement("button");
            btn.className = `project-track-button ${isTrackView && i === activeTrackIndex ? "is-active" : ""}`;
            btn.innerHTML = `<img src="img/track-01.webp" alt="Pista">`;
            btn.addEventListener("click", () => {
                if (activeView === "track" && activeTrackIndex === i) {
                    activeView = "project";
                } else {
                    activeView = "track";
                    activeTrackIndex = i;
                }
                render();
            });
            trackButtons.appendChild(btn);
        });

        // Rent Widget logic
        if (data.rentLabel) {
            rentWidget.style.display = "block";
            rentWidget.querySelector(".rent-label").textContent = data.rentLabel;
            const rentCta = rentWidget.querySelector(".rent-cta");
            if (data.rentUrl) {
                rentCta.style.display = "inline-flex";
                rentCta.href = data.rentUrl;
            } else {
                rentCta.style.display = "none";
            }
        } else {
            rentWidget.style.display = "none";
        }
    };

    const next = () => {
        activeCardIndex = (activeCardIndex + 1) % projectDataList.length;
        activePhotoIndex = 0;
        activeTrackIndex = 0;
        activeView = "project";
        render();
    };

    const prev = () => {
        activeCardIndex = (activeCardIndex - 1 + projectDataList.length) % projectDataList.length;
        activePhotoIndex = 0;
        activeTrackIndex = 0;
        activeView = "project";
        render();
    };

    const open = (index) => {
        activeCardIndex = index;
        activePhotoIndex = 0;
        activeTrackIndex = 0;
        activeView = "project";
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

    projectCards.forEach((el, i) => {
        const gallery = window.parseDelimitedList(el.dataset.gallery, ",");
        const alts = window.parseDelimitedList(el.dataset.galleryAlts, "|");
        const trackInfo = (el.dataset.trackInfo || "").split("||").filter(Boolean).map(t => {
            const p = t.split("::");
            return { name: p[0], text: p[1] || "" };
        });

        projectDataList.push({
            title: el.querySelector("h3")?.textContent || "Projeto",
            shortCopy: el.querySelector("p")?.textContent || "",
            detail: el.dataset.detail || "",
            gallery,
            alts,
            tracks: trackInfo,
            rentLabel: el.dataset.rentLabel || "",
            rentUrl: el.dataset.rentUrl || ""
        });

        el.addEventListener("click", (e) => {
            if (e.target.closest("a, button")) return;
            open(i);
        });
    });

    closeButton.addEventListener("click", close);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
    prevBtn.addEventListener("click", prev);
    nextBtn.addEventListener("click", next);

    // Navigation
    document.addEventListener("keydown", (e) => {
        if (!overlay.classList.contains("is-visible")) return;
        if (e.key === "Escape") close();
        if (e.key === "ArrowRight") next();
        if (e.key === "ArrowLeft") prev();
    });

    if (window.bindHorizontalSwipe) {
        window.bindHorizontalSwipe(overlay, next, prev);
    }

    // Animated CoverFlow for Projects Carousel
    (() => {
        const carousel = document.querySelector(".projects-carousel");
        const track = carousel?.querySelector(".projects-carousel-track");
        if (!carousel || !track) return;
        const cards = Array.from(track.querySelectorAll(".project-card"));
        let activeIdx = 0;
        const renderCarousel = () => {
            cards.forEach((c, i) => {
                c.classList.remove("is-active", "is-side", "is-left", "is-right", "is-hidden");
                const offset = (i - activeIdx + cards.length) % cards.length;
                if (offset === 0) c.classList.add("is-active");
                else if (offset === 1) c.classList.add("is-side", "is-right");
                else if (offset === cards.length - 1) c.classList.add("is-side", "is-left");
                else c.classList.add("is-hidden");
            });
        };
        carousel.querySelector(".prev")?.addEventListener("click", () => { activeIdx = (activeIdx - 1 + cards.length) % cards.length; renderCarousel(); });
        carousel.querySelector(".next")?.addEventListener("click", () => { activeIdx = (activeIdx + 1) % cards.length; renderCarousel(); });
        renderCarousel();
    })();
})();
