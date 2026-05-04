import * as THREE from 'three';
import CONFIG from '../../config.js';
import { FirstPersonControls } from '../Player/Controls.js';
import { Lighting } from '../World/Lighting.js';
import { Environment } from '../World/Environment.js';
import { Gallery } from '../World/Gallery.js';
import { Physics } from '../World/Physics.js';
import { Audio } from '../Utils/Audio.js';
import { ArtworkPanel } from '../UI/ArtworkPanel.js';
import { ArtworkInteraction } from '../Interaction/ArtworkInteraction.js';
import { TourController } from '../Tour/TourController.js';
import { TOUR_PATH } from '../Tour/tourPath.js';

export class App {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = null;

        this.frameCount = 0;
        this.lastTime = 0;
        this.fpsElement = null;

        this.controls = null;
        this.lighting = null;
        this.environment = null;
        this.gallery = null;
        this.physics = null;
        this.audio = null;
        this.artworkPanel = null;
        this.artworkInteraction = null;
        this.tourController = null;

        this.artworksData = [];
        this.walkingTime = 0;
        this.cameraMotionState = {
            phase: 0,
            intensity: 0,
            breatheTime: 0
        };
        this.headBobConfig = {
            enabled: true,
            walkFrequency: 6.6,
            runFrequency: 9.1,
            verticalWalk: 0.028,
            verticalRun: 0.048,
            pitchWalk: 0.006,
            pitchRun: 0.011,
            rollWalk: 0.012,
            rollRun: 0.022,
            yawWalk: 0.003,
            yawRun: 0.006,
            settleSpeed: 7.5
        };
    }

    async init() {
        this.showLoader();

        try {
            this.artworksData = await this.loadArtworks();
            await this.preloadImages(this.artworksData);
            this.setupScene();
            await this.setupModules();
            this.setupEvents();
            this.hideLoader();
            this.showControlInstructions();
            this.animate();
        } catch (err) {
            console.error('Failed to initialize app:', err);
            this.showFatalError();
        }
    }

    async loadArtworks() {
        const response = await fetch('./src/data/artworks.json');
        if (!response.ok) {
            throw new Error(`No se pudo cargar artworks.json (${response.status})`);
        }
        return response.json();
    }

    preloadImages(artworks) {
        const images = artworks.map((artwork) => artwork.image).filter(Boolean);
        if (images.length === 0) return Promise.resolve();

        return new Promise((resolve) => {
            let loaded = 0;
            const done = () => {
                loaded++;
                if (loaded >= images.length) resolve();
            };

            images.forEach((src) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = done;
                img.onerror = done;
                img.src = src;
            });

            setTimeout(resolve, 2500);
        });
    }

    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x1c1b18, 0.018);
        this.clock = new THREE.Clock();

        this.camera = new THREE.PerspectiveCamera(
            CONFIG.camera.fov,
            window.innerWidth / window.innerHeight,
            CONFIG.camera.near,
            CONFIG.camera.far
        );
        this.camera.position.set(CONFIG.camera.startPos.x, CONFIG.camera.startPos.y, CONFIG.camera.startPos.z);
        this.camera.rotation.y = CONFIG.camera.rotation;

        this.renderer = new THREE.WebGLRenderer({
            antialias: CONFIG.performance.antialias,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(CONFIG.performance.pixelRatio);
        this.renderer.shadowMap.enabled = CONFIG.shadows.enabled;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.shadowMap.autoUpdate = false;
        this.renderer.shadowMap.needsUpdate = true;
        this.renderer.physicallyCorrectLights = CONFIG.lighting.physicallyCorrect;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = CONFIG.lighting.exposure;

        const container = document.getElementById('canvas-container');
        (container || document.body).appendChild(this.renderer.domElement);
        this.fpsElement = document.getElementById('fps-counter');
    }

    async setupModules() {
        this.controls = new FirstPersonControls(this.camera, this.renderer);
        this.physics = new Physics(this.camera, this.controls);

        this.lighting = new Lighting(this.scene);
        this.lighting.setup(this.artworksData);

        this.environment = new Environment(this.scene, this.renderer);
        this.environment.setup();

        this.gallery = new Gallery(this.scene, null, this.renderer, () => this.updateShadowsIfNeeded());
        await this.gallery.setup(this.artworksData);

        this.artworkPanel = new ArtworkPanel();
        this.artworkInteraction = new ArtworkInteraction(
            this.camera,
            this.renderer,
            (artwork, options) => this.selectArtwork(artwork, options)
        );
        this.artworkInteraction.updateTargets(this.gallery.artworks);

        this.tourController = new TourController(this.camera, this.controls, {
            path: TOUR_PATH,
            getArtworkById: (id) => this.gallery.getArtworkById(id),
            onArtworkFocused: (artwork) => this.selectArtwork(artwork),
            onStop: () => this.onTourStopped()
        });

        this.audio = new Audio();
        this.audio.setup();
        this.updateShadowsIfNeeded();
    }

    setupEvents() {
        window.addEventListener('resize', () => this.onWindowResize());
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Escape' && this.tourController?.isActive()) {
                this.tourController.stop();
            }
        });
    }

    selectArtwork(artwork, options = {}) {
        this.artworkPanel.show(artwork, options);
    }

    showControlInstructions() {
        const isMobile = this.detectMobileDevice();
        const instructions = document.createElement('div');
        instructions.id = 'control-instructions';
        instructions.className = 'welcome-overlay';
        instructions.setAttribute('data-ui-interactive', 'true');
        instructions.innerHTML = `
            <div class="welcome-overlay__eyebrow">Museo Virtual Byron Gálvez</div>
            <h1>Elige tu modo de exploración</h1>
            <p>${isMobile
                ? 'Usa el joystick para moverte y desliza la pantalla para mirar la sala.'
                : 'Recorre la sala libremente o inicia una visita guiada por piezas clave.'}</p>
            <div class="welcome-overlay__actions">
                <button id="start-walking" type="button" data-ui-interactive="true">Recorrido libre</button>
                <button id="start-tour" type="button" data-ui-interactive="true">Recorrido guiado</button>
            </div>
        `;

        document.body.appendChild(instructions);

        document.getElementById('start-walking')?.addEventListener('click', () => {
            instructions.remove();
            if (isMobile) {
                this.createMobileControls();
            } else {
                this.renderer.domElement.requestPointerLock();
            }
        });

        document.getElementById('start-tour')?.addEventListener('click', () => {
            instructions.remove();
            this.startGuidedTour();
        });
    }

    detectMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
            || window.innerWidth <= 768;
    }

    createMobileControls() {
        if (document.getElementById('mobile-joystick')) return;

        const joystickContainer = document.createElement('div');
        joystickContainer.id = 'mobile-joystick';
        joystickContainer.setAttribute('data-ui-interactive', 'true');
        joystickContainer.innerHTML = '<div id="joystick-handle"></div>';
        document.body.appendChild(joystickContainer);

        const lookArea = document.createElement('div');
        lookArea.id = 'mobile-look-area';
        document.body.appendChild(lookArea);

        const actionButton = document.createElement('button');
        actionButton.id = 'mobile-action-button';
        actionButton.type = 'button';
        actionButton.textContent = 'Ver';
        actionButton.setAttribute('data-ui-interactive', 'true');
        document.body.appendChild(actionButton);
        actionButton.addEventListener('click', (event) => {
            event.stopPropagation();
            this.artworkInteraction.handleClick({
                target: this.renderer.domElement,
                clientX: window.innerWidth / 2,
                clientY: window.innerHeight / 2
            });
        });

        const crosshair = document.getElementById('crosshair');
        if (crosshair) crosshair.classList.add('active');

        this.setupMobileEventListeners(joystickContainer, joystickContainer.querySelector('#joystick-handle'), lookArea);
    }

    setupMobileEventListeners(joystick, handle, lookArea) {
        let touchStartX = 0;
        let touchStartY = 0;
        let joystickActive = false;
        let lookTouchId = null;
        let moveTouchId = null;

        joystick.addEventListener('touchstart', (event) => {
            event.preventDefault();
            event.stopPropagation();
            moveTouchId = event.touches[0].identifier;
            joystickActive = true;
        }, { passive: false });

        joystick.addEventListener('touchmove', (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (!joystickActive) return;

            const touch = Array.from(event.touches).find((item) => item.identifier === moveTouchId);
            if (!touch) return;

            const rect = joystick.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const deltaX = touch.clientX - centerX;
            const deltaY = touch.clientY - centerY;
            const maxDistance = 38;
            const distance = Math.min(Math.hypot(deltaX, deltaY), maxDistance);
            const angle = Math.atan2(deltaY, deltaX);

            handle.style.transform = `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px)`;

            this.controls.moveForward = deltaY / maxDistance < -0.28;
            this.controls.moveBackward = deltaY / maxDistance > 0.28;
            this.controls.moveLeft = deltaX / maxDistance < -0.28;
            this.controls.moveRight = deltaX / maxDistance > 0.28;
        }, { passive: false });

        joystick.addEventListener('touchend', (event) => {
            event.stopPropagation();
            const touch = Array.from(event.changedTouches).find((item) => item.identifier === moveTouchId);
            if (!touch) return;

            joystickActive = false;
            moveTouchId = null;
            handle.style.transform = 'translate(0, 0)';
            this.controls.resetMovement();
        }, { passive: false });

        lookArea.addEventListener('touchstart', (event) => {
            if (lookTouchId !== null) return;

            const touch = event.touches[0];
            const rect = joystick.getBoundingClientRect();
            const isOverJoystick = touch.clientX >= rect.left && touch.clientX <= rect.right
                && touch.clientY >= rect.top && touch.clientY <= rect.bottom;
            if (isOverJoystick) return;

            event.preventDefault();
            lookTouchId = touch.identifier;
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
        }, { passive: false });

        lookArea.addEventListener('touchmove', (event) => {
            const touch = Array.from(event.touches).find((item) => item.identifier === lookTouchId);
            if (!touch || !this.controls.enabled) return;

            event.preventDefault();
            const deltaX = touch.clientX - touchStartX;
            const deltaY = touch.clientY - touchStartY;

            this.controls.targetRotationY -= deltaX * 0.005;
            this.controls.targetRotationX -= deltaY * 0.005;
            this.controls.targetRotationX = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, this.controls.targetRotationX));
            this.camera.rotation.set(this.controls.targetRotationX, this.controls.targetRotationY, 0, 'YXZ');

            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
        }, { passive: false });

        lookArea.addEventListener('touchend', (event) => {
            const touch = Array.from(event.changedTouches).find((item) => item.identifier === lookTouchId);
            if (touch) lookTouchId = null;
        }, { passive: false });
    }

    startGuidedTour() {
        this.artworkPanel.hide();
        this.controls.resetMovement();
        this.tourController.start();
    }

    onTourStopped() {
        this.controls.syncRotationFromCamera();
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.updateFPS();

        const deltaTime = Math.min(this.clock.getDelta(), 0.1);

        if (this.tourController?.isActive()) {
            this.tourController.update(deltaTime);
        } else {
            this.controls.update(deltaTime);
            this.physics.update(deltaTime, this.gallery.decorationCollisions, this.gallery.museumObjects);
            this.applyOrganicCameraMotion(deltaTime);
        }

        this.renderer.render(this.scene, this.camera);
    }

    updateFPS() {
        const time = performance.now();
        this.frameCount++;
        if (time >= this.lastTime + 1000) {
            if (this.fpsElement) {
                this.fpsElement.innerText = Math.round((this.frameCount * 1000) / (time - this.lastTime));
            }
            this.frameCount = 0;
            this.lastTime = time;
        }
    }

    applyOrganicCameraMotion(deltaTime) {
        if (!this.headBobConfig.enabled) return;

        const velocity = this.controls.velocity;
        const horizontalSpeed = Math.hypot(velocity.x, velocity.z);
        const isMoving = horizontalSpeed > 0.08;
        const runBlend = this.controls.isRunning
            ? THREE.MathUtils.clamp(horizontalSpeed / CONFIG.movement.runSpeed, 0, 1)
            : 0;
        const targetIntensity = isMoving
            ? THREE.MathUtils.clamp(horizontalSpeed / CONFIG.movement.walkSpeed, 0, 1)
            : 0;
        const response = 1 - Math.exp(-this.headBobConfig.settleSpeed * deltaTime);
        const baseHeight = CONFIG.movement.height;

        this.cameraMotionState.intensity = THREE.MathUtils.lerp(
            this.cameraMotionState.intensity,
            targetIntensity,
            response
        );
        this.cameraMotionState.breatheTime += deltaTime;

        const strideFrequency = THREE.MathUtils.lerp(
            this.headBobConfig.walkFrequency,
            this.headBobConfig.runFrequency,
            runBlend
        );
        this.cameraMotionState.phase += deltaTime * strideFrequency * (0.65 + this.cameraMotionState.intensity * 0.45);
        this.walkingTime = this.cameraMotionState.phase;

        const phase = this.cameraMotionState.phase;
        const intensity = this.cameraMotionState.intensity;
        const verticalAmplitude = THREE.MathUtils.lerp(this.headBobConfig.verticalWalk, this.headBobConfig.verticalRun, runBlend);
        const pitchAmplitude = THREE.MathUtils.lerp(this.headBobConfig.pitchWalk, this.headBobConfig.pitchRun, runBlend);
        const rollAmplitude = THREE.MathUtils.lerp(this.headBobConfig.rollWalk, this.headBobConfig.rollRun, runBlend);
        const yawAmplitude = THREE.MathUtils.lerp(this.headBobConfig.yawWalk, this.headBobConfig.yawRun, runBlend);

        const stepLift = Math.abs(Math.sin(phase));
        const heelDrop = Math.sin(phase * 2 + 0.35);
        const breath = Math.sin(this.cameraMotionState.breatheTime * 1.25) * 0.004 * (1 - intensity);
        const verticalOffset = ((stepLift * verticalAmplitude) + (heelDrop * verticalAmplitude * 0.28)) * intensity + breath;
        const pitchOffset = Math.sin(phase * 2 + 0.8) * pitchAmplitude * intensity;
        const rollOffset = Math.sin(phase) * rollAmplitude * intensity;
        const yawOffset = Math.sin(phase + Math.PI * 0.5) * yawAmplitude * intensity;

        this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, baseHeight + verticalOffset, response);
        this.camera.rotation.set(
            this.controls.targetRotationX + pitchOffset,
            this.controls.targetRotationY + yawOffset,
            rollOffset,
            'YXZ'
        );
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    updateShadowsIfNeeded() {
        if (this.renderer?.shadowMap.enabled) {
            this.renderer.shadowMap.needsUpdate = true;
        }
    }

    getLODStats() {
        console.log('Manual LOD disabled. Three.js uses mipmaps automatically.');
        return null;
    }

    showLoader() {
        const loader = document.getElementById('loader');
        if (loader) loader.style.display = 'flex';
    }

    hideLoader() {
        const loader = document.getElementById('loader');
        if (loader) loader.style.display = 'none';
    }

    showFatalError() {
        const loader = document.getElementById('loader');
        if (!loader) return;
        loader.style.display = 'flex';
        loader.innerHTML = `
            <div class="loader-content">
                <p>No se pudo cargar el museo. Revisa la consola del navegador.</p>
            </div>
        `;
    }
}
