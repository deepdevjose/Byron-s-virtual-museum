import * as THREE from 'three';

/**
 * Handles artwork hover and selection raycasting.
 *
 * Pointer-lock mode raycasts through the center of the screen so the crosshair
 * is the selection target. Unlocked clicks raycast through the actual pointer
 * location, which supports modal-free desktop interaction and synthesized
 * mobile action-button clicks.
 */
export class ArtworkInteraction {
    /**
     * @param {THREE.PerspectiveCamera} camera - Active visitor camera.
     * @param {THREE.WebGLRenderer} renderer - Renderer whose canvas can own pointer lock.
     * @param {Function} onArtworkSelected - Callback fired when an artwork is selected.
     * @param {Function} onHoverChanged - Callback fired when hover state changes.
     */
    constructor(camera, renderer, onArtworkSelected, onHoverChanged) {
        this.camera = camera;
        this.renderer = renderer;
        this.onArtworkSelected = onArtworkSelected;
        this.onHoverChanged = onHoverChanged || (() => {});
        this.raycaster = new THREE.Raycaster();
        this.pointer = new THREE.Vector2(0, 0); // Normalized device coordinates.
        this.artworks = [];
        this.enabled = true;
        this.hoveredArtwork = null;
        this.lastHoveredArtwork = null;

        window.addEventListener('click', (event) => this.handleClick(event));
    }

    /**
     * Replaces the list of artwork records used for raycasting.
     *
     * @param {Array<Object>} artworks - Gallery artwork records.
     */
    updateTargets(artworks) {
        this.artworks = artworks || [];
    }

    /**
     * Enables or disables hover and click handling.
     *
     * @param {boolean} enabled - Whether artwork interaction is active.
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }

    /**
     * Updates the artwork currently targeted by the screen-center raycast.
     *
     * Called every frame by App so hover state remains responsive while the
     * visitor looks around.
     */
    updateHover() {
        if (!this.enabled) {
            if (this.hoveredArtwork) {
                this.setHoveredArtwork(null);
            }
            return;
        }

        // In pointer-lock navigation, the crosshair is always screen center.
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

    /**
     * Applies hover state changes and updates the crosshair affordance.
     *
     * @param {Object|null} artwork - Artwork record being targeted, or null.
     */
    setHoveredArtwork(artwork) {
        // Clear previous hover before enabling the new artwork highlight.
        if (this.hoveredArtwork && this.hoveredArtwork !== artwork) {
            this.onHoverChanged(this.hoveredArtwork, false);
        }

        this.hoveredArtwork = artwork;
        if (artwork) {
            this.onHoverChanged(artwork, true);
            const crosshair = document.getElementById('crosshair');
            if (crosshair) {
                crosshair.classList.add('interactive');
            }
        } else {
            const crosshair = document.getElementById('crosshair');
            if (crosshair) {
                crosshair.classList.remove('interactive');
            }
        }
    }

    /**
     * Handles click selection for artwork meshes.
     *
     * @param {MouseEvent|Object} event - Browser click or synthesized mobile action.
     * @returns {boolean} True when an artwork was selected.
     */
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

    /**
     * Detects clicks inside DOM UI so they do not also select 3D artwork.
     *
     * @param {Event} event - Click event.
     * @returns {boolean} True when the click originated in an interactive UI region.
     */
    isUiClick(event) {
        return Boolean(event.target?.closest?.('[data-ui-interactive="true"]'));
    }
}
