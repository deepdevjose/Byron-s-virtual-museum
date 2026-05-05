import * as THREE from 'three';

export class ArtworkInteraction {
    constructor(camera, renderer, onArtworkSelected, onHoverChanged) {
        this.camera = camera;
        this.renderer = renderer;
        this.onArtworkSelected = onArtworkSelected;
        this.onHoverChanged = onHoverChanged || (() => {});
        this.raycaster = new THREE.Raycaster();
        this.pointer = new THREE.Vector2(0, 0); // Center of screen
        this.artworks = [];
        this.enabled = true;
        this.hoveredArtwork = null;
        this.lastHoveredArtwork = null;

        window.addEventListener('click', (event) => this.handleClick(event));
    }

    updateTargets(artworks) {
        this.artworks = artworks || [];
    }

    setEnabled(enabled) {
        this.enabled = enabled;
    }

    // Called every frame to detect what artwork is in the center of the screen
    updateHover() {
        if (!this.enabled) {
            if (this.hoveredArtwork) {
                this.setHoveredArtwork(null);
            }
            return;
        }

        // Check center of screen (raycast from center)
        this.pointer.set(0, 0);
        
        const meshes = this.artworks.map((artwork) => artwork.mesh).filter(Boolean);
        if (meshes.length === 0) {
            if (this.hoveredArtwork) {
                this.setHoveredArtwork(null);
            }
            return;
        }

        this.raycaster.setFromCamera(this.pointer, this.camera);
        const hits = this.raycaster.intersectObjects(meshes, false);
        
        const selected = hits.length > 0 
            ? this.artworks.find((artwork) => artwork.mesh === hits[0].object)
            : null;

        if (selected !== this.hoveredArtwork) {
            this.setHoveredArtwork(selected);
        }
    }

    setHoveredArtwork(artwork) {
        // Clear previous hover
        if (this.hoveredArtwork && this.hoveredArtwork !== artwork) {
            this.onHoverChanged(this.hoveredArtwork, false);
        }

        // Set new hover
        this.hoveredArtwork = artwork;
        if (artwork) {
            this.onHoverChanged(artwork, true);
            // Update crosshair to show interactive state
            const crosshair = document.getElementById('crosshair');
            if (crosshair) {
                crosshair.classList.add('interactive');
            }
        } else {
            // Remove interactive state from crosshair
            const crosshair = document.getElementById('crosshair');
            if (crosshair) {
                crosshair.classList.remove('interactive');
            }
        }
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
            this.onArtworkSelected(selected, { source: 'click', openDetail: true });
            return true;
        }

        return false;
    }

    isUiClick(event) {
        return Boolean(event.target?.closest?.('[data-ui-interactive="true"]'));
    }
}
