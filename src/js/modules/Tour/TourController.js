import * as THREE from 'three';

/**
 * Drives the guided tour state machine.
 *
 * The controller interpolates the camera between generated stops, focuses the
 * matching artwork, waits for the detail modal to close, and then advances to
 * the next stop. Manual movement and pointer lock are disabled while the tour
 * is active.
 */
export class TourController {
    /**
     * @param {THREE.PerspectiveCamera} camera - Camera moved through tour stops.
     * @param {Object} controls - First-person controls managed during tour mode.
     * @param {Object} [options] - Tour configuration and callbacks.
     * @param {Array<Object>} [options.path] - Ordered tour stops.
     * @param {Function} [options.getArtworkById] - Lookup callback for artwork ids.
     * @param {Function} [options.onArtworkFocused] - Called after a stop movement completes.
     * @param {Function} [options.onStop] - Called when tour mode stops manually.
     * @param {Function} [options.onComplete] - Called after the final stop.
     */
    constructor(camera, controls, options = {}) {
        this.camera = camera;
        this.controls = controls;
        this.path = options.path || [];
        this.getArtworkById = options.getArtworkById || (() => null);
        this.onArtworkFocused = options.onArtworkFocused || (() => {});
        this.onStop = options.onStop || (() => {});
        this.onComplete = options.onComplete || (() => {});

        this.active = false;
        this.state = 'idle';
        this.currentIndex = 0;
        this.elapsed = 0;
        this.moveDuration = 2.6;

        this.fromPosition = new THREE.Vector3();
        this.toPosition = new THREE.Vector3();
        this.fromQuaternion = new THREE.Quaternion();
        this.toQuaternion = new THREE.Quaternion();
        this.targetVector = new THREE.Vector3();

        this.hud = null;
        this.createHud();
    }

    /**
     * Starts the guided tour at the first stop.
     */
    start() {
        if (this.path.length === 0) return;

        if (document.pointerLockElement) {
            document.exitPointerLock();
        }

        this.active = true;
        this.currentIndex = 0;
        this.controls.setEnabled(true);
        this.controls.setMovementEnabled?.(false);
        this.controls.setPointerLockEnabled?.(false);
        this.controls.syncRotationFromCamera?.();
        this.prepareMoveToCurrentStop();
        this.showHud();
    }

    /**
     * Stops the guided tour and restores manual control.
     *
     * @param {string} [reason='manual'] - Stop reason passed to the app callback.
     */
    stop(reason = 'manual') {
        if (!this.active) return;

        this.active = false;
        this.state = 'idle';
        this.controls.setEnabled(true);
        this.controls.setMovementEnabled?.(true);
        this.controls.setPointerLockEnabled?.(true);
        this.controls.syncRotationFromCamera();
        this.hideHud();
        this.onStop(reason);
    }

    /**
     * Advances active tour interpolation.
     *
     * @param {number} deltaTime - Seconds elapsed since the previous frame.
     */
    update(deltaTime) {
        if (!this.active) return;

        if (this.state === 'moving') {
            this.elapsed += deltaTime;
            const t = Math.min(this.elapsed / this.moveDuration, 1);
            const eased = t * t * (3 - 2 * t);

            this.camera.position.lerpVectors(this.fromPosition, this.toPosition, eased);
            this.camera.quaternion.copy(this.fromQuaternion).slerp(this.toQuaternion, eased);

            if (t >= 1) {
                this.focusCurrentArtwork();
                this.elapsed = 0;
            }
        }
    }

    /**
     * @returns {boolean} True when guided tour mode is active.
     */
    isActive() {
        return this.active;
    }

    /**
     * Captures the current camera transform and prepares interpolation to a stop.
     */
    prepareMoveToCurrentStop() {
        const stop = this.path[this.currentIndex];
        this.state = 'moving';
        this.elapsed = 0;

        this.fromPosition.copy(this.camera.position);
        this.fromQuaternion.copy(this.camera.quaternion);
        this.toPosition.set(...stop.cameraPosition);
        this.toQuaternion.copy(this.calculateLookQuaternion(this.toPosition, stop.lookAt));
        this.updateHud(stop);
    }

    /**
     * Emits the current artwork focus event after camera movement finishes.
     */
    focusCurrentArtwork() {
        const stop = this.path[this.currentIndex];
        const artwork = this.getArtworkById(stop.artworkId);
        this.state = 'awaiting-detail';
        this.controls.syncRotationFromCamera?.();
        if (artwork) {
            this.onArtworkFocused(artwork, stop);
        }
    }

    /**
     * Moves to the next stop after the visitor closes the current detail modal.
     */
    advanceAfterDetail() {
        if (!this.active || this.state === 'moving') return;

        this.currentIndex++;
        if (this.currentIndex >= this.path.length) {
            this.complete();
            return;
        }

        this.prepareMoveToCurrentStop();
    }

    /**
     * Completes the tour and delegates the completion sequence to App.
     */
    complete() {
        if (!this.active) return;

        this.active = false;
        this.state = 'complete';
        this.hideHud();
        this.onComplete();
    }

    /**
     * Calculates the quaternion needed to look from a position toward a target.
     *
     * The current camera transform is restored after the calculation so this
     * helper has no visible side effects.
     *
     * @param {THREE.Vector3} position - Camera position for the look calculation.
     * @param {number[]} target - [x, y, z] point to look at.
     * @returns {THREE.Quaternion} Target camera orientation.
     */
    calculateLookQuaternion(position, target) {
        const originalPosition = this.camera.position.clone();
        const originalQuaternion = this.camera.quaternion.clone();
        this.targetVector.set(...target);

        this.camera.position.copy(position);
        this.camera.lookAt(this.targetVector);
        const quaternion = this.camera.quaternion.clone();

        this.camera.position.copy(originalPosition);
        this.camera.quaternion.copy(originalQuaternion);

        return quaternion;
    }

    /**
     * Creates the guided-tour HUD and exit handler.
     */
    createHud() {
        this.hud = document.createElement('div');
        this.hud.id = 'tour-hud';
        this.hud.className = 'tour-hud';
        this.hud.setAttribute('data-ui-interactive', 'true');
        this.hud.innerHTML = `
            <div class="tour-hud__label">Recorrido guiado</div>
            <div class="tour-hud__text"></div>
            <button class="tour-hud__button" type="button" data-ui-interactive="true">Salir del recorrido</button>
        `;
        this.hud.querySelector('button').addEventListener('click', () => this.stop());
        document.body.appendChild(this.hud);
    }

    /**
     * Shows the guided-tour HUD.
     */
    showHud() {
        this.hud.classList.add('is-visible');
    }

    /**
     * Hides the guided-tour HUD.
     */
    hideHud() {
        this.hud.classList.remove('is-visible');
    }

    /**
     * Updates HUD text for the current tour stop.
     *
     * @param {Object} stop - Current tour stop.
     */
    updateHud(stop) {
        const text = stop.introText || 'La camara se movera a la siguiente obra.';
        this.hud.querySelector('.tour-hud__text').textContent = text;
    }
}
