/**
 * Manages artwork side-panel metadata and detail media modals.
 *
 * The panel is created dynamically so it can be reused for both free
 * exploration and guided tour stops. Detail media markup is generated only
 * when opened, preventing Cloudinary-hosted videos from loading during initial
 * scene startup.
 */
export class ArtworkPanel {
    /**
     * @param {Object} [options] - Panel callbacks.
     * @param {Function} [options.onDetailClosed] - Called after an open detail modal closes.
     */
    constructor(options = {}) {
        this.panel = null;
        this.currentArtwork = null;
        this.currentOptions = {};
        this.audioGuide = null;
        this.detailOpen = false;
        this.detailArtwork = null;
        this.detailContext = null;
        this.activeDetailTab = 'artwork';
        this.onDetailClosed = options.onDetailClosed || (() => {});
        this.createPanel();
        this.setupDetailModal();
    }

    /**
     * Creates the side-panel DOM and action handlers.
     */
    createPanel() {
        this.panel = document.createElement('aside');
        this.panel.id = 'artwork-panel';
        this.panel.className = 'artwork-panel';
        this.panel.setAttribute('data-ui-interactive', 'true');
        this.panel.innerHTML = `
            <button class="artwork-panel__close" type="button" aria-label="Cerrar ficha" data-ui-interactive="true">&times;</button>
            <div class="artwork-panel__eyebrow">Ficha de obra</div>
            <h2 class="artwork-panel__title"></h2>
            <p class="artwork-panel__meta"></p>
            <p class="artwork-panel__technique"></p>
            <p class="artwork-panel__description"></p>
            <div class="artwork-panel__actions">
                <button class="artwork-panel__button artwork-panel__button--primary" type="button" data-action="detail" data-ui-interactive="true">Ver detalle</button>
                <button class="artwork-panel__button" type="button" data-action="audio" data-ui-interactive="true">Audioguía</button>
            </div>
        `;

        this.panel.querySelector('.artwork-panel__close').addEventListener('click', () => this.hide());
        this.panel.querySelector('[data-action="detail"]').addEventListener('click', () => {
            this.openDetail(this.currentArtwork, {
                autoplayVideo: true,
                context: this.currentOptions.source || null
            });
        });
        this.panel.querySelector('[data-action="audio"]').addEventListener('click', () => this.playAudioGuide());
        document.body.appendChild(this.panel);
    }

    /**
     * Wires the static detail modal container from `index.html`.
     *
     * Clicking the modal backdrop closes the current detail view.
     */
    setupDetailModal() {
        const modal = document.getElementById('video-modal');
        if (!modal) return;

        modal.setAttribute('data-ui-interactive', 'true');
        const closeFromBackdrop = (event) => {
            if (event.target === modal) {
                event.preventDefault();
                this.closeDetail();
            }
        };
        modal.addEventListener('pointerdown', closeFromBackdrop);
        modal.addEventListener('touchstart', closeFromBackdrop, { passive: false });
        modal.addEventListener('click', closeFromBackdrop);
    }

    /**
     * Shows artwork metadata in the side panel.
     *
     * @param {Object} artwork - Gallery artwork record.
     * @param {Object} [options] - Display options.
     * @param {string} [options.source] - Interaction source, such as `tour`.
     * @param {boolean} [options.locked] - Hide close controls for tour-managed stops.
     * @param {boolean} [options.openDetail] - Immediately open the detail modal.
     * @param {boolean} [options.playAudio] - Start the audio guide if available.
     */
    show(artwork, options = {}) {
        if (!artwork || !artwork.data) return;

        this.stopAudioGuide();
        this.currentArtwork = artwork;
        this.currentOptions = options;
        const data = artwork.data;
        this.panel.querySelector('.artwork-panel__title').textContent = data.title;
        this.panel.querySelector('.artwork-panel__meta').textContent = `${data.artist} · ${data.year}`;
        this.panel.querySelector('.artwork-panel__technique').textContent = data.technique || 'Técnica mixta';
        this.panel.querySelector('.artwork-panel__description').textContent = data.description;
        this.panel.classList.toggle('artwork-panel--tour', options.source === 'tour');

        // Hide the panel eyebrow when the detail modal is about to take focus.
        const eyebrow = this.panel.querySelector('.artwork-panel__eyebrow');
        if (eyebrow) {
            eyebrow.style.display = options.openDetail ? 'none' : 'block';
        }

        const audioButton = this.panel.querySelector('[data-action="audio"]');
        const detailButton = this.panel.querySelector('[data-action="detail"]');
        const closeButton = this.panel.querySelector('.artwork-panel__close');
        audioButton.hidden = !data.audio || options.source === 'tour';
        detailButton.textContent = 'Ver en detalle';
        closeButton.hidden = Boolean(options.locked);

        this.panel.classList.add('is-visible');

        if (options.playAudio && data.audio) {
            this.playAudioGuide();
        }

        if (options.openDetail) {
            this.openDetail(artwork, { autoplayVideo: true });
        }
    }

    /**
     * Hides the side panel and optionally resumes ambient audio.
     *
     * @param {Object} [options] - Hide behavior.
     * @param {boolean} [options.resumeAmbient=true] - Resume ambient audio when no detail modal is open.
     * @param {boolean} [options.preserveArtwork=false] - Keep current artwork for detail modal use.
     */
    hide(options = {}) {
        const shouldResumeAmbient = options.resumeAmbient !== false;
        const shouldPreserveArtwork = options.preserveArtwork === true;

        this.panel.classList.remove('is-visible');
        this.panel.classList.remove('artwork-panel--tour');
        this.panel.querySelector('.artwork-panel__close').hidden = false;
        if (!shouldPreserveArtwork) {
            this.currentArtwork = null;
            this.currentOptions = {};
        }
        this.stopAudioGuide();
        // Resume ambient audio when closing the panel outside an active detail modal.
        if (shouldResumeAmbient && !this.detailOpen && window.app?.audio) {
            window.app.audio.resumeAmbient();
        }
    }

    /**
     * Opens the detail modal for an artwork and creates the needed media element.
     *
     * The media element is injected at open time so remote video delivery URLs
     * are not requested until the visitor asks to view an artwork detail.
     *
     * @param {Object} [artwork=this.currentArtwork] - Gallery artwork record.
     * @param {Object} [options] - Detail behavior.
     * @param {boolean} [options.autoplayVideo=true] - Whether to attempt autoplay.
     * @param {string|null} [options.context] - Close context passed back to App.
     */
    openDetail(artwork = this.currentArtwork, options = {}) {
        if (!artwork || !artwork.data) return;

        if (document.pointerLockElement) {
            document.exitPointerLock();
        }

        const data = artwork.data;
        const modal = document.getElementById('video-modal');
        if (!modal) return;

        const content = modal.querySelector('.modal-content');
        if (!content) return;

        this.stopDetailMedia(modal);
        this.hide({ preserveArtwork: true, resumeAmbient: false });

        const mediaType = this.getMediaType(data);
        const mediaMarkup = this.createMediaMarkup(data, mediaType);

        content.className = 'modal-content artwork-detail';
        content.setAttribute('data-ui-interactive', 'true');
        content.innerHTML = `
            <button id="close-modal" class="close-btn" type="button" data-ui-interactive="true">&times;</button>
            <div class="artwork-detail__media-wrap artwork-detail__media-wrap--${mediaType}">
                ${mediaMarkup}
            </div>
            <div class="artwork-detail__body">
                <div class="artwork-detail__eyebrow">${this.escapeHtml(data.room || 'Lectura de obra')}</div>
                <h2>${this.escapeHtml(data.title)}</h2>
                <p class="artwork-detail__meta">${this.escapeHtml(data.artist)} · ${this.escapeHtml(data.year)} · ${this.escapeHtml(data.technique || 'Técnica mixta')}</p>
                ${this.createTabMarkup(data)}
            </div>
        `;

        const closeButton = content.querySelector('#close-modal');
        const closeDetail = (event) => {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation?.();
            this.closeDetail();
        };
        closeButton.addEventListener('pointerdown', closeDetail);
        closeButton.addEventListener('touchstart', closeDetail, { passive: false });
        closeButton.addEventListener('click', closeDetail);
        this.setupDetailTabs(content);
        this.setupCloseReading(content);
        this.detailOpen = true;
        this.detailArtwork = artwork;
        this.detailContext = options.context || null;
        modal.classList.add('show');
        document.body.classList.add('artwork-detail-open');
        if (window.app?.audio) {
            window.app.audio.pauseAmbient();
        }
        // Re-enable the cursor so the visitor can use media controls.
        document.body.style.cursor = 'auto';;

        const media = content.querySelector('video, audio');
        if (media && options.autoplayVideo !== false) {
            media.play().catch(() => {});
        }
    }

    /**
     * Closes the detail modal and reports the close context to the app.
     */
    closeDetail() {
        const modal = document.getElementById('video-modal');
        const wasOpen = this.detailOpen;
        const closedArtwork = this.detailArtwork;
        const closedContext = this.detailContext;

        if (modal) {
            this.stopDetailMedia(modal);
            modal.classList.remove('show');
        }
        document.body.classList.remove('artwork-detail-open');
        this.detailOpen = false;
        this.detailArtwork = null;
        this.detailContext = null;
        // Restore ambient audio once modal media is no longer active.
        if (window.app?.audio) {
            window.app.audio.resumeAmbient();
        }
        if (wasOpen) {
            this.onDetailClosed({
                artwork: closedArtwork,
                context: closedContext
            });
        }
    }

    /**
     * @returns {boolean} True when the side panel is visible.
     */
    isOpen() {
        return this.panel.classList.contains('is-visible');
    }

    /**
     * Starts the current artwork's audio guide.
     */
    playAudioGuide() {
        const data = this.currentArtwork?.data;
        if (!data?.audio) return;

        this.stopAudioGuide();
        this.audioGuide = new window.Audio(data.audio);
        this.audioGuide.play().catch(() => {});
    }

    /**
     * Stops and releases the active audio guide.
     */
    stopAudioGuide() {
        if (!this.audioGuide) return;
        this.audioGuide.pause();
        this.audioGuide.currentTime = 0;
        this.audioGuide = null;
    }

    /**
     * Stops modal media before the modal is reused or closed.
     *
     * @param {HTMLElement} modal - Detail modal element.
     */
    stopDetailMedia(modal) {
        modal.querySelectorAll('video, audio').forEach((media) => {
            media.pause();
            media.currentTime = 0;
        });
    }

    /**
     * Chooses the preferred detail media type for an artwork.
     *
     * Audio takes precedence because the existing Byron record has both audio
     * and video and should present the audio-guide card.
     *
     * @param {Object} data - Artwork metadata.
     * @returns {'audio'|'video'|'image'} Detail media type.
     */
    getMediaType(data) {
        if (data.audio) return 'audio';
        if (data.video) return 'video';
        return 'image';
    }

    /**
     * Creates the detail media markup for the chosen media type.
     *
     * @param {Object} data - Artwork metadata.
     * @param {'audio'|'video'|'image'} mediaType - Detail media type.
     * @returns {string} Safe HTML markup for the media area.
     */
    createMediaMarkup(data, mediaType) {
        if (mediaType === 'audio') {
            return this.createAudioImageMarkup(data);
        }
        if (mediaType === 'video') {
            return this.createVideoMarkup(data);
        }
        return this.createImageMarkup(data);
    }

    /**
     * Creates lazy video markup for a Cloudinary delivery URL.
     *
     * @param {Object} data - Artwork metadata with `video` and poster `image`.
     * @returns {string} Video HTML.
     */
    createVideoMarkup(data) {
        return `
            <div class="artwork-detail__media-stack">
                <div class="artwork-detail__video-stage is-active" data-media-stage="video">
                    <video
                        class="artwork-detail__video"
                        controls
                        playsinline
                        preload="metadata"
                        poster="${this.escapeAttribute(data.image)}"
                    >
                        <source src="${this.escapeAttribute(data.video)}" type="video/mp4">
                    </video>
                </div>
                <div class="artwork-detail__texture-stage" data-media-stage="texture">
                    ${this.createZoomableImageMarkup(data)}
                    ${this.createCloseReadingControls()}
                </div>
                ${this.createMediaModeToggle('video')}
            </div>
        `;
    }

    /**
     * Creates a combined artwork image and audio guide card.
     *
     * @param {Object} data - Artwork metadata with `audio` and `image`.
     * @returns {string} Audio card HTML.
     */
    createAudioImageMarkup(data) {
        return `
            <div class="artwork-detail__audio-card">
                ${this.createDisplayImageMarkup(data)}
                <audio
                    class="artwork-detail__audio"
                    controls
                    preload="metadata"
                >
                    <source src="${this.escapeAttribute(data.audio)}" type="audio/mpeg">
                </audio>
            </div>
        `;
    }

    /**
     * Creates static image markup for artwork without media.
     *
     * @param {Object} data - Artwork metadata with `image`.
     * @returns {string} Image HTML.
     */
    createImageMarkup(data) {
        return `
            <div class="artwork-detail__media-stack">
                <div class="artwork-detail__image-stage is-active" data-media-stage="artwork">
                    ${this.createDisplayImageMarkup(data)}
                </div>
                <div class="artwork-detail__texture-stage artwork-detail__texture-stage--single" data-media-stage="texture">
                    ${this.createZoomableImageMarkup(data)}
                    ${this.createCloseReadingControls()}
                </div>
                ${this.createMediaModeToggle('artwork')}
            </div>
        `;
    }

    /**
     * Creates the primary non-zoomed artwork image shown before texture mode.
     *
     * @param {Object} data - Artwork metadata with image and title.
     * @returns {string} Image markup.
     */
    createDisplayImageMarkup(data) {
        return `
            <img
                class="artwork-detail__image"
                src="${this.escapeAttribute(data.image)}"
                alt="${this.escapeAttribute(data.title)}"
                draggable="false"
            >
        `;
    }

    /**
     * Creates a compact media mode switch for animation/artwork and texture.
     *
     * @param {'video'|'artwork'} activeMode - Initial active media mode.
     * @returns {string} Segmented mode control markup.
     */
    createMediaModeToggle(activeMode) {
        const primaryLabel = activeMode === 'video' ? 'Animación' : 'Obra';
        return `
            <div class="artwork-detail__media-toggle" role="group" aria-label="Modo de visualización" data-ui-interactive="true">
                <button
                    class="${activeMode === 'texture' ? '' : 'is-active'}"
                    type="button"
                    data-action="set-media-mode"
                    data-mode="${this.escapeAttribute(activeMode)}"
                >${primaryLabel}</button>
                <button
                    type="button"
                    data-action="set-media-mode"
                    data-mode="texture"
                >Textura</button>
            </div>
        `;
    }

    /**
     * Creates the zoomable image viewport used by texture inspection.
     *
     * @param {Object} data - Artwork metadata with image and title.
     * @returns {string} Zoomable image markup.
     */
    createZoomableImageMarkup(data) {
        return `
            <div class="artwork-detail__zoom-viewport" data-action="zoom-viewport">
                <img
                    class="artwork-detail__image artwork-detail__image--zoomable"
                    src="${this.escapeAttribute(data.image)}"
                    alt="${this.escapeAttribute(data.title)}"
                    draggable="false"
                >
            </div>
        `;
    }

    /**
     * Builds the compact tabbed reading areas for the artwork modal.
     *
     * @param {Object} data - Artwork metadata with optional curatorial fields.
     * @returns {string} Safe tab markup.
     */
    createTabMarkup(data) {
        const tabs = [
            {
                id: 'artwork',
                label: 'Obra',
                text: data.curatorialText || data.description,
                extra: this.createKeywordMarkup(data.visualKeywords)
            },
            {
                id: 'formal',
                label: 'Formal',
                text: data.formalReading || 'Observa cómo la composición, el ritmo, el color y la tensión de la superficie organizan la imagen.'
            },
            {
                id: 'symbolic',
                label: 'Simbólica',
                text: data.symbolicReading || 'La obra abre un espacio simbólico entre cuerpo, memoria, ritual y paisaje interior.'
            },
            {
                id: 'tech',
                label: 'Experiencia',
                text: data.interactionHint || 'Acércate a la obra: la luz, el sonido y la distancia de la cámara forman parte de la lectura.'
            }
        ];

        const buttons = tabs.map((tab, index) => `
            <button
                class="artwork-detail__tab${index === 0 ? ' is-active' : ''}"
                type="button"
                data-tab="${this.escapeAttribute(tab.id)}"
                data-ui-interactive="true"
            >${this.escapeHtml(tab.label)}</button>
        `).join('');

        const panels = tabs.map((tab, index) => `
            <section class="artwork-detail__panel${index === 0 ? ' is-active' : ''}" data-panel="${this.escapeAttribute(tab.id)}">
                <p>${this.escapeHtml(tab.text)}</p>
                ${tab.extra || ''}
            </section>
        `).join('');

        return `
            <div class="artwork-detail__tabs" role="tablist">
                ${buttons}
            </div>
            <div class="artwork-detail__panels">
                ${panels}
            </div>
        `;
    }

    /**
     * Creates visual keyword chips for the artwork tab.
     *
     * @param {string[]} keywords - Optional artwork keywords.
     * @returns {string} Keyword markup.
     */
    createKeywordMarkup(keywords = []) {
        if (!Array.isArray(keywords) || keywords.length === 0) return '';

        return `
            <div class="artwork-detail__keywords">
                ${keywords.slice(0, 5).map((keyword) => `<span>${this.escapeHtml(keyword)}</span>`).join('')}
            </div>
        `;
    }

    /**
     * Enables tab switching inside an open detail modal.
     *
     * @param {HTMLElement} content - Detail modal content element.
     */
    setupDetailTabs(content) {
        content.querySelectorAll('.artwork-detail__tab').forEach((button) => {
            button.addEventListener('click', () => {
                const tabId = button.dataset.tab;
                content.querySelectorAll('.artwork-detail__tab').forEach((item) => {
                    item.classList.toggle('is-active', item === button);
                });
                content.querySelectorAll('.artwork-detail__panel').forEach((panel) => {
                    panel.classList.toggle('is-active', panel.dataset.panel === tabId);
                });
            });
        });
    }

    /**
     * Adds lightweight texture/close-reading zoom controls for artwork images.
     *
     * @param {HTMLElement} content - Detail modal content element.
     */
    setupCloseReading(content) {
        const image = content.querySelector('.artwork-detail__image--zoomable');
        const viewport = content.querySelector('[data-action="zoom-viewport"]');
        const range = content.querySelector('[data-action="close-reading-range"]');
        const reset = content.querySelector('[data-action="close-reading-reset"]');
        const toggle = content.querySelector('[data-action="toggle-close-reading"]');
        const modeButtons = content.querySelectorAll('[data-action="set-media-mode"]');
        const videoStage = content.querySelector('[data-media-stage="video"]');
        const artworkStage = content.querySelector('[data-media-stage="artwork"]');
        const textureStage = content.querySelector('[data-media-stage="texture"]');

        if (!image || !range || !viewport) return;

        const zoomState = {
            scale: Number(range.value) || 1,
            x: 0,
            y: 0,
            dragging: false,
            startX: 0,
            startY: 0,
            originX: 50,
            originY: 50
        };

        const clampPan = () => {
            const maxX = Math.max(0, (image.clientWidth * (zoomState.scale - 1)) / 2);
            const maxY = Math.max(0, (image.clientHeight * (zoomState.scale - 1)) / 2);
            zoomState.x = Math.max(-maxX, Math.min(maxX, zoomState.x));
            zoomState.y = Math.max(-maxY, Math.min(maxY, zoomState.y));
        };

        const updateZoom = () => {
            zoomState.scale = Number(range.value) || 1;
            if (zoomState.scale <= 1) {
                zoomState.x = 0;
                zoomState.y = 0;
            }
            clampPan();
            image.style.transformOrigin = `${zoomState.originX}% ${zoomState.originY}%`;
            image.style.transform = `translate(${zoomState.x}px, ${zoomState.y}px) scale(${zoomState.scale})`;
            viewport.classList.toggle('is-zoomed', zoomState.scale > 1);
        };

        toggle?.addEventListener('click', () => {
            const textureActive = !textureStage?.classList.contains('is-active');
            textureStage?.classList.toggle('is-active', textureActive);
            videoStage?.classList.toggle('is-active', !textureActive);
            artworkStage?.classList.toggle('is-active', !textureActive);
            toggle.textContent = textureActive ? 'Volver a la animación' : 'Explorar textura';
            content.querySelectorAll('video').forEach((video) => video.pause());
            requestAnimationFrame(updateZoom);
        });

        modeButtons.forEach((button) => {
            button.addEventListener('click', () => {
                const mode = button.dataset.mode;
                const textureActive = mode === 'texture';
                textureStage?.classList.toggle('is-active', textureActive);
                videoStage?.classList.toggle('is-active', mode === 'video');
                artworkStage?.classList.toggle('is-active', mode === 'artwork');
                content.querySelector('.artwork-detail__media-stack')?.classList.toggle('is-texture-active', textureActive);
                modeButtons.forEach((item) => item.classList.toggle('is-active', item === button));
                if (textureActive) {
                    content.querySelectorAll('video').forEach((video) => video.pause());
                }
                requestAnimationFrame(updateZoom);
            });
        });

        range.addEventListener('input', updateZoom);
        reset?.addEventListener('click', () => {
            range.value = '1';
            zoomState.originX = 50;
            zoomState.originY = 50;
            updateZoom();
        });
        viewport.addEventListener('pointermove', (event) => {
            if (!zoomState.dragging) {
                const rect = viewport.getBoundingClientRect();
                zoomState.originX = ((event.clientX - rect.left) / rect.width) * 100;
                zoomState.originY = ((event.clientY - rect.top) / rect.height) * 100;
                updateZoom();
                return;
            }

            zoomState.x = event.clientX - zoomState.startX;
            zoomState.y = event.clientY - zoomState.startY;
            updateZoom();
        });
        viewport.addEventListener('pointerdown', (event) => {
            if (zoomState.scale <= 1) return;

            zoomState.dragging = true;
            zoomState.startX = event.clientX - zoomState.x;
            zoomState.startY = event.clientY - zoomState.y;
            viewport.setPointerCapture?.(event.pointerId);
            viewport.classList.add('is-dragging');
        });
        viewport.addEventListener('pointerup', (event) => {
            zoomState.dragging = false;
            viewport.releasePointerCapture?.(event.pointerId);
            viewport.classList.remove('is-dragging');
        });
        viewport.addEventListener('pointerleave', () => {
            zoomState.dragging = false;
            viewport.classList.remove('is-dragging');
        });
        viewport.addEventListener('wheel', (event) => {
            event.preventDefault();
            const rect = viewport.getBoundingClientRect();
            zoomState.originX = ((event.clientX - rect.left) / rect.width) * 100;
            zoomState.originY = ((event.clientY - rect.top) / rect.height) * 100;
            const direction = event.deltaY > 0 ? -1 : 1;
            const nextScale = Math.max(1, Math.min(2.4, zoomState.scale + direction * 0.12));
            range.value = String(nextScale.toFixed(2));
            updateZoom();
        }, { passive: false });
        updateZoom();
    }

    /**
     * Creates close-reading controls for static artwork images.
     *
     * @returns {string} Close-reading control markup.
     */
    createCloseReadingControls() {
        return `
            <div class="artwork-detail__close-reading" data-ui-interactive="true">
                <span>Explorar superficie</span>
                <input
                    type="range"
                    min="1"
                    max="2.4"
                    step="0.05"
                    value="1"
                    data-action="close-reading-range"
                    aria-label="Acercamiento a la textura de la obra"
                >
                <button type="button" data-action="close-reading-reset" data-ui-interactive="true">Restablecer vista</button>
            </div>
        `;
    }

    /**
     * Escapes HTML text inserted into modal markup.
     *
     * @param {*} value - Value to escape.
     * @returns {string} Escaped text.
     */
    escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    /**
     * Escapes an HTML attribute value.
     *
     * @param {*} value - Value to escape.
     * @returns {string} Escaped attribute text.
     */
    escapeAttribute(value) {
        return this.escapeHtml(value).replace(/`/g, '&#096;');
    }
}
