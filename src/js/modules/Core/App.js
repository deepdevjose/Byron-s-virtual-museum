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
import { createTourPathFromArtworks } from '../Tour/tourPath.js';
import { ROOM_TEXTS } from '../Curatorial/rooms.js';

/**
 * Coordinates the virtual museum application lifecycle.
 *
 * App owns the Three.js scene, renderer, camera, module setup, global DOM
 * overlays, guided tour state, and the animation loop. World-building and
 * interaction details are delegated to feature modules so this class can
 * orchestrate scene lifecycle without duplicating their implementation.
 */
export class App {
    /**
     * Initializes app-level references and runtime state.
     */
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

        this.startMenuActive = false;
        this.freeExplorationActive = false;
        this.freeExplorationHud = null;
        this.creditsModal = null;
        this.creditsAutoCloseTimer = null;
        this.creditsCloseCallback = null;
        this.tourCompletionTimer = null;
        this.tourCompletionModal = null;
        this.roomNarrationToast = null;
        this.proximityPhrase = null;
        this.currentRoomIndicator = null;
        this.currentRoom = null;
        this.nearbyArtworkId = null;
        this.roomNarrationTimer = null;
        this.suppressTourExitUntil = 0;
    }

    /**
     * Loads artwork data, builds the scene, wires modules, and starts rendering.
     *
     * Side effects include fetching local JSON, preloading artwork images,
     * creating DOM overlays, appending the WebGL canvas, and registering global
     * event listeners.
     *
     * @returns {Promise<void>}
     */
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

    /**
     * Fetches the artwork catalog used by gallery, lighting, and tour modules.
     *
     * @returns {Promise<Array<Object>>} Artwork metadata from `src/data/artworks.json`.
     * @throws {Error} When the JSON file cannot be loaded.
     */
    async loadArtworks() {
        const response = await fetch('./src/data/artworks.json');
        if (!response.ok) {
            throw new Error(`No se pudo cargar artworks.json (${response.status})`);
        }
        return response.json();
    }

    /**
     * Preloads artwork image assets before the gallery is built.
     *
     * The timeout keeps startup from blocking forever on a slow or failed image,
     * while individual load errors are tolerated so placeholder materials can
     * still appear in the scene.
     *
     * @param {Array<Object>} artworks - Artwork records that may include image paths.
     * @returns {Promise<void>}
     */
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

    /**
     * Creates the core Three.js scene, camera, and renderer.
     *
     * The renderer is attached to `#canvas-container` when available and uses
     * manual shadow-map updates because most museum geometry is static after
     * setup.
     */
    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x1d1c19, 0.017);
        this.clock = new THREE.Clock();

        this.camera = new THREE.PerspectiveCamera(
            CONFIG.camera.fov,
            this.getViewportSize().width / this.getViewportSize().height,
            CONFIG.camera.near,
            CONFIG.camera.far
        );
        this.camera.position.set(CONFIG.camera.startPos.x, CONFIG.camera.startPos.y, CONFIG.camera.startPos.z);
        this.camera.rotation.y = CONFIG.camera.rotation;

        this.renderer = new THREE.WebGLRenderer({
            antialias: CONFIG.performance.antialias,
            powerPreference: 'high-performance'
        });
        this.renderer.setPixelRatio(CONFIG.performance.pixelRatio);
        this.renderer.shadowMap.enabled = CONFIG.shadows.enabled;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        // Keep shadow updates manual because most museum objects are static.
        this.renderer.shadowMap.autoUpdate = false;
        this.renderer.shadowMap.needsUpdate = true;
        this.renderer.physicallyCorrectLights = CONFIG.lighting.physicallyCorrect;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = CONFIG.lighting.exposure;

        const container = document.getElementById('canvas-container');
        (container || document.body).appendChild(this.renderer.domElement);
        this.onWindowResize();
        this.fpsElement = document.getElementById('fps-counter');
    }

    /**
     * Instantiates the main app modules and connects their cross-module callbacks.
     *
     * Side effects include adding lights, environment geometry, artwork meshes,
     * UI panels, audio hooks, raycast targets, and guided tour stops.
     *
     * @returns {Promise<void>}
     */
    async setupModules() {
        this.controls = new FirstPersonControls(this.camera, this.renderer);
        this.physics = new Physics(this.camera, this.controls);

        this.lighting = new Lighting(this.scene);
        this.lighting.setup(this.artworksData);

        this.environment = new Environment(this.scene, this.renderer);
        this.environment.setup();

        this.gallery = new Gallery(this.scene, null, this.renderer, () => this.updateShadowsIfNeeded());
        await this.gallery.setup(this.artworksData);

        this.artworkPanel = new ArtworkPanel({
            onDetailClosed: (detail) => this.onArtworkDetailClosed(detail)
        });
        this.artworkInteraction = new ArtworkInteraction(
            this.camera,
            this.renderer,
            (artwork, options) => this.selectArtwork(artwork, options),
            (artwork, isHovered) => this.gallery.setArtworkHoverState(artwork, isHovered)
        );
        this.artworkInteraction.updateTargets(this.gallery.artworks);

        this.tourController = new TourController(this.camera, this.controls, {
            path: createTourPathFromArtworks(this.artworksData),
            getArtworkById: (id) => this.gallery.getArtworkById(id),
            onArtworkFocused: (artwork, stop) => this.selectArtwork(artwork, { source: 'tour', stop, locked: true }),
            onStop: (reason) => this.onTourStopped(reason),
            onComplete: () => this.onTourCompleted()
        });

        this.audio = new Audio();
        this.audio.setup();
        this.createFreeExplorationHud();
        this.updateShadowsIfNeeded();
    }

    /**
     * Registers global browser and application overlay events.
     */
    setupEvents() {
        window.addEventListener('resize', () => this.onWindowResize());
        this.setupGuidedTourExitFallback();
        this.setupCreditsModal();
    }

    /**
     * Captures guided-tour exit clicks before the canvas or raycaster can handle them.
     */
    setupGuidedTourExitFallback() {
        const exitFromEvent = (event) => {
            if (performance.now() < this.suppressTourExitUntil) return;
            if (document.body.classList.contains('artwork-detail-open')) return;

            const button = event.target?.closest?.('.tour-hud__button');
            const visibleButton = document.querySelector('.tour-hud.is-visible .tour-hud__button');
            const buttonWasPressed = button || this.isPointInsideElement(event, visibleButton);
            if (!buttonWasPressed) return;

            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation?.();
            this.tourController?.stop('manual');
        };

        document.addEventListener('pointerdown', exitFromEvent, true);
        document.addEventListener('click', exitFromEvent, true);
        document.addEventListener('touchstart', exitFromEvent, { capture: true, passive: false });
    }

    /**
     * Checks pointer coordinates against an element box.
     *
     * @param {PointerEvent|MouseEvent|TouchEvent} event - Input event.
     * @param {Element|null} element - Element to test.
     * @returns {boolean} True when the event position falls inside the element.
     */
    isPointInsideElement(event, element) {
        if (!element) return false;

        const point = event.touches?.[0] || event.changedTouches?.[0] || event;
        if (typeof point.clientX !== 'number' || typeof point.clientY !== 'number') return false;

        const rect = element.getBoundingClientRect();
        return point.clientX >= rect.left
            && point.clientX <= rect.right
            && point.clientY >= rect.top
            && point.clientY <= rect.bottom;
    }

    /**
     * Connects the static credits modal declared in `index.html`.
     *
     * The modal is marked as interactive so museum raycast clicks ignore it.
     */
    setupCreditsModal() {
        this.creditsModal = document.getElementById('credits-modal');
        if (!this.creditsModal) return;

        const closeButton = this.creditsModal.querySelector('#close-credits');
        closeButton?.addEventListener('click', () => this.closeCreditsModal());

        this.creditsModal.addEventListener('click', (event) => {
            if (event.target === this.creditsModal) {
                this.closeCreditsModal();
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.creditsModal.classList.contains('show')) {
                this.closeCreditsModal();
            }
        });
    }

    /**
     * Opens the credits modal and optionally schedules an automatic close.
     *
     * Pointer lock is released so the visitor can move the cursor over modal
     * controls.
     *
     * @param {Object} [options] - Credits modal behavior.
     * @param {number} [options.autoCloseMs] - Optional timeout before closing.
     * @param {Function} [options.onClose] - Callback invoked after the close animation.
     */
    openCreditsModal(options = {}) {
        if (!this.creditsModal) return;

        if (document.pointerLockElement) {
            document.exitPointerLock();
        }

        clearTimeout(this.creditsAutoCloseTimer);
        this.creditsCloseCallback = options.onClose || null;
        this.creditsModal.classList.remove('is-closing');
        this.creditsModal.classList.add('show');
        document.body.style.cursor = 'auto';

        if (options.autoCloseMs) {
            this.creditsAutoCloseTimer = setTimeout(() => this.closeCreditsModal(), options.autoCloseMs);
        }
    }

    /**
     * Closes the credits modal and runs the pending close callback.
     *
     * @param {Object} [options] - Close behavior.
     * @param {boolean} [options.animate=true] - Whether to play the closing animation.
     */
    closeCreditsModal(options = {}) {
        if (!this.creditsModal) return;
        clearTimeout(this.creditsAutoCloseTimer);
        this.creditsAutoCloseTimer = null;

        const animate = options.animate !== false && this.creditsModal.classList.contains('show');

        const closeCallback = this.creditsCloseCallback;
        this.creditsCloseCallback = null;
        const finishClose = () => {
            this.creditsModal.classList.remove('show', 'is-closing');
            if (closeCallback) {
                closeCallback();
            }
        };

        if (!animate) {
            finishClose();
            return;
        }

        this.creditsModal.classList.add('is-closing');
        setTimeout(finishClose, 460);
    }

    /**
     * Creates the temporary modal shown when the guided tour reaches its end.
     */
    showTourCompletionModal() {
        this.hideTourCompletionModal({ animate: false });

        this.tourCompletionModal = document.createElement('div');
        this.tourCompletionModal.className = 'tour-completion-modal';
        this.tourCompletionModal.setAttribute('data-ui-interactive', 'true');
        this.tourCompletionModal.innerHTML = `
            <div class="tour-completion-modal__content">
                <span>Recorrido guiado</span>
                <h2>El recorrido ha terminado</h2>
            </div>
        `;
        document.body.appendChild(this.tourCompletionModal);
    }

    /**
     * Removes the guided-tour completion modal.
     *
     * @param {Object} [options] - Hide behavior.
     * @param {boolean} [options.animate=true] - Whether to play the exit animation.
     * @returns {Promise<void>} Resolves after the modal is removed.
     */
    hideTourCompletionModal(options = {}) {
        if (!this.tourCompletionModal) return Promise.resolve();

        const modal = this.tourCompletionModal;
        const finishHide = () => {
            if (this.tourCompletionModal === modal) {
                this.tourCompletionModal = null;
            }
            modal.remove();
        };

        if (options.animate === false) {
            finishHide();
            return Promise.resolve();
        }

        modal.classList.add('is-leaving');
        return new Promise((resolve) => {
            setTimeout(() => {
                finishHide();
                resolve();
            }, 460);
        });
    }

    /**
     * Routes an artwork selection to the correct UI surface.
     *
     * Clicks during free exploration open the detail modal directly, while tour
     * selections use the side panel so the tour controller can wait for the
     * visitor to close the detail view.
     *
     * @param {Object} artwork - Gallery artwork record.
     * @param {Object} [options] - Selection context from interaction or tour code.
     */
    selectArtwork(artwork, options = {}) {
        if (options.source === 'click' && !this.tourController?.isActive()) {
            this.artworkPanel.hide({ resumeAmbient: false });
            this.artworkPanel.openDetail(artwork, {
                autoplayVideo: true,
                context: 'free'
            });
            return;
        }

        this.artworkPanel.show(artwork, options);
    }

    /**
     * Displays the startup mode chooser and locks movement until a mode is chosen.
     *
     * The overlay is created at runtime because its copy and behavior depend on
     * whether the current device needs touch controls.
     */
    showControlInstructions() {
        const isMobile = this.detectMobileDevice();
        document.getElementById('control-instructions')?.remove();
        this.startMenuActive = true;
        this.freeExplorationActive = false;
        this.hideFreeExplorationHud();
        this.currentRoomIndicator?.classList.remove('is-visible');
        this.controls.setEnabled(false);
        this.controls.setMovementEnabled?.(false);
        this.controls.setPointerLockEnabled?.(false);
        this.artworkInteraction?.setEnabled(false);

        const instructions = document.createElement('div');
        instructions.id = 'control-instructions';
        instructions.className = 'welcome-overlay';
        instructions.setAttribute('data-ui-interactive', 'true');
        instructions.innerHTML = `
            <div class="welcome-overlay__eyebrow">Museo virtual</div>
            <h1>Byron Gálvez</h1>
            <p class="welcome-overlay__subtitle">Una experiencia inmersiva de luz, textura, cuerpo y geometría.</p>
            <p>Recorre un espacio digital dedicado al universo pictórico de Byron Gálvez.</p>
            <div class="welcome-overlay__actions">
                <button id="start-walking" type="button" data-ui-interactive="true">Explorar museo</button>
                <button id="start-tour" type="button" data-ui-interactive="true">Recorrido guiado</button>
            </div>
            <div class="welcome-overlay__extras">
                <button id="start-credits" type="button" data-ui-interactive="true">Créditos</button>
            </div>
        `;

        document.body.appendChild(instructions);

        document.getElementById('start-walking')?.addEventListener('click', () => {
            instructions.remove();
            this.startMenuActive = false;
            this.enableFreeExploration({ createMobileControls: true });
            this.currentRoom = 'Una obra que nos permite recuperar lo sagrado';
            this.updateCurrentRoomIndicator(this.currentRoom);
            this.showRoomNarration('Una obra que nos permite recuperar lo sagrado');
            if (!isMobile) {
                this.renderer.domElement.requestPointerLock();
            }
        });

        document.getElementById('start-tour')?.addEventListener('click', () => {
            instructions.remove();
            this.startMenuActive = false;
            this.startGuidedTour();
        });

        document.getElementById('start-credits')?.addEventListener('click', () => {
            this.openCreditsModal();
        });
    }

    /**
     * Creates the free-exploration HUD with the close-tour control.
     */
    createFreeExplorationHud() {
        if (this.freeExplorationHud) return;

        this.freeExplorationHud = document.createElement('div');
        this.freeExplorationHud.id = 'free-exploration-hud';
        this.freeExplorationHud.className = 'free-exploration-hud';
        this.freeExplorationHud.setAttribute('data-ui-interactive', 'true');
        this.freeExplorationHud.innerHTML = `
            <button class="free-exploration-hud__button" type="button" data-ui-interactive="true" aria-label="Cerrar recorrido libre">Cerrar recorrido</button>
        `;
        this.freeExplorationHud.querySelector('button').addEventListener('click', (event) => {
            event.stopPropagation();
            this.endFreeExploration();
        });
        document.body.appendChild(this.freeExplorationHud);
        this.createCuratorialOverlays();
    }

    /**
     * Creates lightweight text overlays for room narration and proximity phrases.
     */
    createCuratorialOverlays() {
        if (!this.roomNarrationToast) {
            this.roomNarrationToast = document.createElement('div');
            this.roomNarrationToast.id = 'room-narration';
            this.roomNarrationToast.className = 'room-narration';
            document.body.appendChild(this.roomNarrationToast);
        }

        if (!this.proximityPhrase) {
            this.proximityPhrase = document.createElement('div');
            this.proximityPhrase.id = 'proximity-phrase';
            this.proximityPhrase.className = 'proximity-phrase';
            document.body.appendChild(this.proximityPhrase);
        }

        if (!this.currentRoomIndicator) {
            this.currentRoomIndicator = document.createElement('div');
            this.currentRoomIndicator.id = 'current-room-indicator';
            this.currentRoomIndicator.className = 'current-room-indicator';
            document.body.appendChild(this.currentRoomIndicator);
        }
    }

    /**
     * Shows the free-exploration close control.
     */
    showFreeExplorationHud() {
        this.createFreeExplorationHud();
        this.freeExplorationHud.classList.add('is-visible');
    }

    /**
     * Hides the free-exploration close control.
     */
    hideFreeExplorationHud() {
        this.freeExplorationHud?.classList.remove('is-visible');
    }

    /**
     * Removes touch controls that only belong to active free exploration.
     */
    removeMobileControls() {
        document.getElementById('mobile-joystick')?.remove();
        document.getElementById('mobile-look-area')?.remove();
        document.getElementById('mobile-action-button')?.remove();
        document.body.classList.remove('has-mobile-controls');

        const crosshair = document.getElementById('crosshair');
        if (crosshair) {
            crosshair.classList.remove('active', 'interactive');
        }
    }

    /**
     * Ends free exploration and returns the visitor to the mode chooser.
     */
    endFreeExploration() {
        if (!this.freeExplorationActive) return;

        this.freeExplorationActive = false;
        this.controls.setEnabled(false);
        this.controls.setMovementEnabled?.(false);
        this.controls.setPointerLockEnabled?.(false);
        this.controls.resetMovement();
        this.artworkInteraction?.setEnabled(false);
        this.artworkPanel.closeDetail();
        this.artworkPanel.hide({ resumeAmbient: true });
        this.removeMobileControls();
        this.hideFreeExplorationHud();
        this.showControlInstructions();
    }

    /**
     * Detects touch-first layouts where mobile controls should be available.
     *
     * @returns {boolean} True for common mobile user agents or narrow viewports.
     */
    detectMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
            || window.innerWidth <= 768;
    }

    /**
     * Creates the touch joystick, look area, and centered action button.
     *
     * The action button synthesizes a centered click so mobile users can select
     * the artwork currently under the crosshair.
     */
    createMobileControls() {
        if (document.getElementById('mobile-joystick')) return;

        document.body.classList.add('has-mobile-controls');

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
            event.preventDefault();
            event.stopPropagation();
            const rect = this.renderer.domElement.getBoundingClientRect();
            this.artworkInteraction.handleClick({
                target: this.renderer.domElement,
                clientX: rect.left + rect.width / 2,
                clientY: rect.top + rect.height / 2
            });
        });

        const crosshair = document.getElementById('crosshair');
        if (crosshair) crosshair.classList.add('active');

        this.setupMobileEventListeners(joystickContainer, joystickContainer.querySelector('#joystick-handle'), lookArea);
    }

    /**
     * Registers touch handlers for movement and camera look.
     *
     * Separate touch identifiers let the visitor move with one finger while
     * looking around with another.
     *
     * @param {HTMLElement} joystick - Joystick touch surface.
     * @param {HTMLElement} handle - Visual joystick handle.
     * @param {HTMLElement} lookArea - Full-screen look touch surface.
     */
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

    /**
     * Starts guided tour mode and disables manual navigation.
     */
    startGuidedTour() {
        clearTimeout(this.tourCompletionTimer);
        this.freeExplorationActive = false;
        this.hideFreeExplorationHud();
        this.artworkPanel.hide({ resumeAmbient: false });
        this.controls.resetMovement();
        this.controls.setEnabled(true);
        this.controls.setMovementEnabled?.(false);
        this.controls.setPointerLockEnabled?.(false);
        this.artworkInteraction?.setEnabled(false);
        this.tourController.start();
        this.currentRoom = 'Una obra que nos permite recuperar lo sagrado';
        this.updateCurrentRoomIndicator(this.currentRoom);
        this.showRoomNarration('Una obra que nos permite recuperar lo sagrado');
    }

    /**
     * Returns to the mode chooser after the guided tour is stopped manually.
     */
    onTourStopped() {
        clearTimeout(this.tourCompletionTimer);
        this.hideTourCompletionModal();
        this.artworkPanel.closeDetail();
        this.artworkPanel.hide({ resumeAmbient: true });
        this.freeExplorationActive = false;
        this.controls.setEnabled(false);
        this.controls.setMovementEnabled?.(false);
        this.controls.setPointerLockEnabled?.(false);
        this.controls.resetMovement();
        this.artworkInteraction?.setEnabled(false);
        this.removeMobileControls();
        this.hideFreeExplorationHud();
        this.showControlInstructions();
    }

    /**
     * Handles detail modal closure so tour or free-exploration state can resume.
     *
     * @param {Object} detail - Detail modal close payload from ArtworkPanel.
     * @param {Object|null} detail.artwork - Artwork that was open.
     * @param {string|null} detail.context - Source context for the detail modal.
     */
    onArtworkDetailClosed(detail) {
        this.suppressTourExitUntil = performance.now() + 800;
        this.artworkInteraction?.suppressSelection(800);

        if (detail.context === 'tour' && this.tourController?.isActive()) {
            this.tourController.advanceAfterDetail();
            return;
        }

        if (detail.context === 'free') {
            this.restoreFreeExplorationLook();
        }
    }

    /**
     * Requests pointer lock again after a free-exploration modal closes.
     */
    restoreFreeExplorationLook() {
        if (this.detectMobileDevice() || !this.controls?.enabled || !this.renderer?.domElement) return;
        if (document.pointerLockElement === this.renderer.domElement) return;

        window.setTimeout(() => {
            if (!this.controls?.enabled || document.body.classList.contains('artwork-detail-open')) return;
            if (document.pointerLockElement === this.renderer.domElement) return;

            const lockRequest = this.renderer.domElement.requestPointerLock();
            lockRequest?.catch?.(() => {});
        }, 120);
    }

    /**
     * Runs the guided tour completion sequence.
     *
     * The app shows a short completion modal, then opens credits, and finally
     * returns the visitor to free exploration.
     */
    onTourCompleted() {
        this.artworkPanel.hide({ resumeAmbient: false });
        this.controls.syncRotationFromCamera();
        this.controls.setMovementEnabled?.(false);
        this.artworkInteraction?.setEnabled(false);
        this.showTourCompletionModal();

        this.tourCompletionTimer = setTimeout(async () => {
            await this.hideTourCompletionModal();
            this.openCreditsModal({
                autoCloseMs: 10000,
                onClose: () => this.enableFreeExploration({ createMobileControls: true })
            });
        }, 2200);
    }

    /**
     * Enables manual navigation and interaction.
     *
     * @param {Object} [options] - Free-exploration options.
     * @param {boolean} [options.createMobileControls] - Create touch controls when needed.
     */
    enableFreeExploration(options = {}) {
        this.freeExplorationActive = true;
        this.controls.setEnabled(true);
        this.controls.setMovementEnabled?.(true);
        this.controls.setPointerLockEnabled?.(true);
        this.artworkInteraction?.setEnabled(true);
        this.showFreeExplorationHud();

        if (options.createMobileControls && this.detectMobileDevice()) {
            this.createMobileControls();
        }
    }

    /**
     * Main animation loop.
     *
     * The loop updates either guided-tour interpolation or manual controls,
     * resolves collisions, refreshes hover raycasting, and renders the scene.
     */
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

        // Hover selection is screen-centered in pointer-lock mode.
        this.artworkInteraction.updateHover();
        this.updateCuratorialProximity(deltaTime);

        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Updates room narration, artwork phrase, spotlight, and ambient tone.
     *
     * @param {number} deltaTime - Seconds elapsed since the previous frame.
     */
    updateCuratorialProximity(deltaTime) {
        if (!this.gallery?.artworks?.length || !this.camera) return;

        const closest = this.findClosestArtwork();
        const nearby = closest && closest.distance < 4.15 ? closest.artwork : null;
        const nearbyId = nearby?.id || null;

        this.lighting?.updateProximityFocus(nearbyId, deltaTime);
        this.updateProximityPhrase(nearby);
        this.updateAmbientTone(nearby, deltaTime);

        const room = nearby?.data?.room || null;
        if (room && room !== this.currentRoom) {
            this.currentRoom = room;
            this.updateCurrentRoomIndicator(room);
            this.showRoomNarration(room);
        }

        this.nearbyArtworkId = nearbyId;
    }

    /**
     * Finds the nearest artwork to the camera.
     *
     * @returns {{artwork: Object, distance: number}|null} Nearest artwork result.
     */
    findClosestArtwork() {
        let closest = null;

        this.gallery.artworks.forEach((artwork) => {
            if (!artwork?.group) return;
            const distance = this.camera.position.distanceTo(artwork.group.position);
            if (!closest || distance < closest.distance) {
                closest = { artwork, distance };
            }
        });

        return closest;
    }

    /**
     * Shows a poetic room text and lets it fade away.
     *
     * @param {string} room - Thematic room name.
     */
    showRoomNarration(room) {
        this.createCuratorialOverlays();
        const text = ROOM_TEXTS[room];
        if (!text || !this.roomNarrationToast) return;

        clearTimeout(this.roomNarrationTimer);
        this.roomNarrationToast.textContent = text;
        this.roomNarrationToast.classList.add('is-visible');
        this.roomNarrationTimer = setTimeout(() => {
            this.roomNarrationToast?.classList.remove('is-visible');
        }, 5200);
    }

    /**
     * Updates the small phrase shown near artworks during close approach.
     *
     * @param {Object|null} artwork - Nearby artwork record.
     */
    updateProximityPhrase(artwork) {
        this.createCuratorialOverlays();
        if (!this.proximityPhrase) return;

        const hint = artwork?.data?.interactionHint || artwork?.data?.emotionalTone || '';
        this.proximityPhrase.textContent = hint;
        this.proximityPhrase.classList.toggle('is-visible', Boolean(hint));
    }

    /**
     * Keeps the current thematic room visible as a lightweight museum label.
     *
     * @param {string} room - Current thematic room name.
     */
    updateCurrentRoomIndicator(room) {
        this.createCuratorialOverlays();
        if (!this.currentRoomIndicator) return;

        this.currentRoomIndicator.replaceChildren();
        const label = document.createElement('span');
        label.textContent = 'Sala actual';
        const roomName = document.createElement('strong');
        roomName.textContent = room;
        this.currentRoomIndicator.append(label, roomName);
        this.currentRoomIndicator.classList.add('is-visible');
    }

    /**
     * Slightly changes the ambient level when the visitor approaches thematic work.
     *
     * @param {Object|null} artwork - Nearby artwork record.
     * @param {number} deltaTime - Seconds elapsed since the previous frame.
     */
    updateAmbientTone(artwork, deltaTime) {
        const ambient = this.audio?.ambientAudio;
        if (!ambient) return;

        const themes = artwork?.data?.themes || [];
        const target = themes.includes('light') || themes.includes('ritual') ? 0.38 : (artwork ? 0.34 : 0.3);
        const response = 1 - Math.exp(-2.6 * deltaTime);
        ambient.volume = THREE.MathUtils.lerp(ambient.volume, target, response);
    }

    /**
     * Updates the on-screen FPS counter once per second.
     */
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

    /**
     * Applies subtle walking motion to the camera without changing navigation.
     *
     * The effect blends toward zero while idle so camera height and rotation
     * settle naturally after the visitor stops moving.
     *
     * @param {number} deltaTime - Seconds elapsed since the previous frame.
     */
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

    /**
     * Keeps the camera projection and renderer dimensions aligned with the window.
     */
    onWindowResize() {
        const { width, height } = this.getViewportSize();
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height, false);
    }

    /**
     * Reads the rendered canvas host size instead of assuming the browser
     * viewport exactly matches the WebGL container.
     *
     * @returns {{width: number, height: number}} Current render size.
     */
    getViewportSize() {
        const container = document.getElementById('canvas-container');
        const width = Math.max(1, Math.floor(container?.clientWidth || window.innerWidth));
        const height = Math.max(1, Math.floor(container?.clientHeight || window.innerHeight));
        return { width, height };
    }

    /**
     * Marks static shadows for a one-time refresh after scene mutations.
     */
    updateShadowsIfNeeded() {
        if (this.renderer?.shadowMap.enabled) {
            this.renderer.shadowMap.needsUpdate = true;
        }
    }

    /**
     * Compatibility hook for older benchmark scripts.
     *
     * @returns {null} Manual LOD statistics are not available in the current app.
     */
    getLODStats() {
        console.log('Manual LOD disabled. Three.js uses mipmaps automatically.');
        return null;
    }

    /**
     * Shows the loading overlay declared in `index.html`.
     */
    showLoader() {
        const loader = document.getElementById('loader');
        if (loader) loader.style.display = 'flex';
    }

    /**
     * Hides the loading overlay after the initial scene is ready.
     */
    hideLoader() {
        const loader = document.getElementById('loader');
        if (loader) loader.style.display = 'none';
    }

    /**
     * Replaces the loader with a fatal startup message.
     */
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
