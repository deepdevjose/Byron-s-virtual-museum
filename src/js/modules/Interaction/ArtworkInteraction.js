import * as THREE from 'three';

export class ArtworkInteraction {
    constructor(camera, renderer, onArtworkSelected) {
        this.camera = camera;
        this.renderer = renderer;
        this.onArtworkSelected = onArtworkSelected;
        this.raycaster = new THREE.Raycaster();
        this.pointer = new THREE.Vector2();
        this.artworks = [];
        this.enabled = true;

        window.addEventListener('click', (event) => this.handleClick(event));
    }

    updateTargets(artworks) {
        this.artworks = artworks || [];
    }

    setEnabled(enabled) {
        this.enabled = enabled;
    }

    handleClick(event) {
        if (!this.enabled || this.isUiClick(event)) {
            return false;
        }

        if (document.pointerLockElement === this.renderer.domElement) {
            this.pointer.set(0, 0);
        } else {
            this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
        }

        const meshes = this.artworks.map((artwork) => artwork.mesh).filter(Boolean);
        if (meshes.length === 0) return false;

        this.raycaster.setFromCamera(this.pointer, this.camera);
        const hits = this.raycaster.intersectObjects(meshes, false);
        if (hits.length === 0) return false;

        const selected = this.artworks.find((artwork) => artwork.mesh === hits[0].object);
        if (selected) {
            this.onArtworkSelected(selected);
            return true;
        }

        return false;
    }

    isUiClick(event) {
        return Boolean(event.target?.closest?.('[data-ui-interactive="true"]'));
    }
}
