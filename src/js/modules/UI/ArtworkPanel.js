export class ArtworkPanel {
    constructor() {
        this.panel = null;
        this.currentArtwork = null;
        this.audioGuide = null;
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
        this.panel.querySelector('[data-action="detail"]').addEventListener('click', () => this.openDetail());
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

    show(artwork) {
        if (!artwork || !artwork.data) return;

        this.currentArtwork = artwork;
        const data = artwork.data;
        this.panel.querySelector('.artwork-panel__title').textContent = data.title;
        this.panel.querySelector('.artwork-panel__meta').textContent = `${data.artist} · ${data.year}`;
        this.panel.querySelector('.artwork-panel__technique').textContent = data.technique || 'Técnica mixta';
        this.panel.querySelector('.artwork-panel__description').textContent = data.description;

        const audioButton = this.panel.querySelector('[data-action="audio"]');
        audioButton.hidden = !data.audio;

        this.panel.classList.add('is-visible');
    }

    hide() {
        this.panel.classList.remove('is-visible');
        this.currentArtwork = null;
        this.stopAudioGuide();
    }

    openDetail(artwork = this.currentArtwork) {
        if (!artwork || !artwork.data) return;

        if (document.pointerLockElement) {
            document.exitPointerLock();
        }

        const data = artwork.data;
        const modal = document.getElementById('video-modal');
        if (!modal) return;

        const content = modal.querySelector('.modal-content');
        if (!content) return;

        content.className = 'modal-content artwork-detail';
        content.setAttribute('data-ui-interactive', 'true');
        content.innerHTML = `
            <button id="close-modal" class="close-btn" type="button" data-ui-interactive="true">&times;</button>
            <div class="artwork-detail__image-wrap">
                <img class="artwork-detail__image" src="${this.escapeAttribute(data.image)}" alt="${this.escapeAttribute(data.title)}">
            </div>
            <div class="artwork-detail__body">
                <span class="artwork-detail__eyebrow">Obra seleccionada</span>
                <h2>${this.escapeHtml(data.title)}</h2>
                <p class="artwork-detail__meta">${this.escapeHtml(data.artist)} · ${this.escapeHtml(data.year)}</p>
                <p class="artwork-detail__technique">${this.escapeHtml(data.technique || 'Técnica mixta')}</p>
                <p class="artwork-detail__description">${this.escapeHtml(data.description)}</p>
            </div>
        `;

        content.querySelector('#close-modal').addEventListener('click', () => this.closeDetail());
        modal.classList.add('show');
    }

    closeDetail() {
        const modal = document.getElementById('video-modal');
        if (modal) {
            modal.classList.remove('show');
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
