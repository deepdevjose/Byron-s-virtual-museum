export class ArtworkPanel {
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

        // Hide eyebrow if opening detail modal
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
        // Resume ambient audio when closing panel
        if (shouldResumeAmbient && !this.detailOpen && window.app?.audio) {
            window.app.audio.resumeAmbient();
        }
    }

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
        // Re-enable cursor for interaction with video and controls
        document.body.style.cursor = 'auto';;

        const media = content.querySelector('video, audio');
        if (media && options.autoplayVideo !== false) {
            media.play().catch(() => {});
        }
    }

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
        // Resume ambient audio
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

    isOpen() {
        return this.panel.classList.contains('is-visible');
    }

    playAudioGuide() {
        const data = this.currentArtwork?.data;
        if (!data?.audio) return;

        this.stopAudioGuide();
        this.audioGuide = new window.Audio(data.audio);
        this.audioGuide.play().catch(() => {});
    }

    stopAudioGuide() {
        if (!this.audioGuide) return;
        this.audioGuide.pause();
        this.audioGuide.currentTime = 0;
        this.audioGuide = null;
    }

    stopDetailMedia(modal) {
        modal.querySelectorAll('video, audio').forEach((media) => {
            media.pause();
            media.currentTime = 0;
        });
    }

    getMediaType(data) {
        if (data.audio) return 'audio';
        if (data.video) return 'video';
        return 'image';
    }

    createMediaMarkup(data, mediaType) {
        if (mediaType === 'audio') {
            return this.createAudioImageMarkup(data);
        }
        if (mediaType === 'video') {
            return this.createVideoMarkup(data);
        }
        return this.createImageMarkup(data);
    }

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

    createImageMarkup(data) {
        return `
            <img
                class="artwork-detail__image"
                src="${this.escapeAttribute(data.image)}"
                alt="${this.escapeAttribute(data.title)}"
            >
        `;
    }

    escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    escapeAttribute(value) {
        return this.escapeHtml(value).replace(/`/g, '&#096;');
    }
}
