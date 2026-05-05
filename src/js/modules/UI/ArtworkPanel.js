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
                <button class="artwork-panel__button" type="button" data-action="audio" data-ui-interactive="true">Audio guía</button>
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
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                this.closeDetail();
            }
        });
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
        detailButton.textContent = (data.video || data.audio) ? 'Ver animación' : 'Ver detalle';
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
                <h2>${this.escapeHtml(data.title)}</h2>
                <p class="artwork-detail__meta">${this.escapeHtml(data.artist)} · ${this.escapeHtml(data.year)}</p>
                <p class="artwork-detail__technique">${this.escapeHtml(data.technique || 'Técnica mixta')}</p>
                <p class="artwork-detail__description">${this.escapeHtml(data.description)}</p>
            </div>
        `;

        content.querySelector('#close-modal').addEventListener('click', () => this.closeDetail());
        this.detailOpen = true;
        this.detailArtwork = artwork;
        this.detailContext = options.context || null;
        modal.classList.add('show');
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
            <video
                class="artwork-detail__video"
                controls
                playsinline
                preload="metadata"
                poster="${this.escapeAttribute(data.image)}"
            >
                <source src="${this.escapeAttribute(data.video)}" type="video/mp4">
            </video>
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
                <img
                    class="artwork-detail__image"
                    src="${this.escapeAttribute(data.image)}"
                    alt="${this.escapeAttribute(data.title)}"
                >
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
            <img
                class="artwork-detail__image"
                src="${this.escapeAttribute(data.image)}"
                alt="${this.escapeAttribute(data.title)}"
            >
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
