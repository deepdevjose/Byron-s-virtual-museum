import * as THREE from 'three';

export class TourController {
    constructor(camera, controls, options = {}) {
        this.camera = camera;
        this.controls = controls;
        this.path = options.path || [];
        this.getArtworkById = options.getArtworkById || (() => null);
        this.onArtworkFocused = options.onArtworkFocused || (() => {});
        this.onStop = options.onStop || (() => {});

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

    start() {
        if (this.path.length === 0) return;

        if (document.pointerLockElement) {
            document.exitPointerLock();
        }

        this.active = true;
        this.currentIndex = 0;
        this.controls.setEnabled(false);
        this.prepareMoveToCurrentStop();
        this.showHud();
    }

    stop() {
        if (!this.active) return;

        this.active = false;
        this.state = 'idle';
        this.controls.setEnabled(true);
        this.controls.syncRotationFromCamera();
        this.hideHud();
        this.onStop();
    }

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
                this.state = 'holding';
                this.elapsed = 0;
            }
        } else if (this.state === 'holding') {
            const stop = this.path[this.currentIndex];
            this.elapsed += deltaTime;

            if (this.elapsed >= (stop.holdSeconds || 4)) {
                this.currentIndex++;
                if (this.currentIndex >= this.path.length) {
                    this.stop();
                    return;
                }

                this.prepareMoveToCurrentStop();
            }
        }
    }

    isActive() {
        return this.active;
    }

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

    focusCurrentArtwork() {
        const stop = this.path[this.currentIndex];
        const artwork = this.getArtworkById(stop.artworkId);
        if (artwork) {
            this.onArtworkFocused(artwork, stop);
        }
    }

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

    createHud() {
        this.hud = document.createElement('div');
        this.hud.id = 'tour-hud';
        this.hud.className = 'tour-hud';
        this.hud.setAttribute('data-ui-interactive', 'true');
        this.hud.innerHTML = `
            <div class="tour-hud__label">Recorrido guiado</div>
            <div class="tour-hud__text"></div>
            <button class="tour-hud__button" type="button" data-ui-interactive="true">Salir</button>
        `;
        this.hud.querySelector('button').addEventListener('click', () => this.stop());
        document.body.appendChild(this.hud);
    }

    showHud() {
        this.hud.classList.add('is-visible');
    }

    hideHud() {
        this.hud.classList.remove('is-visible');
    }

    updateHud(stop) {
        const text = stop.introText || 'La camara se movera a la siguiente obra.';
        this.hud.querySelector('.tour-hud__text').textContent = text;
    }
}
