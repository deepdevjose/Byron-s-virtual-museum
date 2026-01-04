import * as THREE from 'three';
import CONFIG from '../../config.js';
import { FirstPersonControls } from '../Player/Controls.js';
import { Lighting } from '../World/Lighting.js';
import { Environment } from '../World/Environment.js';
import { Gallery } from '../World/Gallery.js';
import { Physics } from '../World/Physics.js';
import { Audio } from '../Utils/Audio.js';

export class App {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = null;

        // Custom FPS Counter
        this.frameCount = 0;
        this.lastTime = 0;
        this.fpsElement = null;

        this.controls = null;
        this.lighting = null;
        this.environment = null;
        this.gallery = null;
        this.physics = null;
        this.audio = null;

        this.raycaster = null;
        this.mouse = null;

        this.isLoading = true;

        // Head Bob State
        this.walkingTime = 0;
        this.headBobActive = false;
        this.headBobConfig = {
            frequency: 4.5,
            amplitude: 0.03,
            amplitudeHorizontal: 0.015,
            enabled: true
        };
    }

    async init() {
        console.log('🚀 App Initializing...');
        this.showLoader();

        try {
            await this.preloadImages();
        } catch (e) {
            console.warn('Preload had some errors, continuing...', e);
        }

        // --- Core Setup ---
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x202020, 20, 100);
        this.clock = new THREE.Clock();

        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
        this.camera.position.set(0, 1.7, -8);
        this.camera.rotation.y = Math.PI;

        this.renderer = new THREE.WebGLRenderer({
            antialias: CONFIG.performance.antialias,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = CONFIG.shadows.enabled;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.physicallyCorrectLights = true;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 0.6;

        const container = document.getElementById('canvas-container');
        if (container) {
            container.appendChild(this.renderer.domElement);
        } else {
            document.body.appendChild(this.renderer.domElement);
        }

        // Cache UI element for FPS
        this.fpsElement = document.getElementById('fps-counter');

        // --- Module Initialization ---
        this.controls = new FirstPersonControls(this.camera, this.renderer);

        // Physics needs access to world objects which will be created by Gallery/Environment
        // We initialize Physics but we will pass the objects in the update loop or set them later
        this.physics = new Physics(this.camera, this.controls);

        this.lighting = new Lighting(this.scene);
        this.lighting.setup();

        this.environment = new Environment(this.scene, this.renderer);
        this.environment.setup(); // Creates walls

        this.gallery = new Gallery(this.scene);
        this.gallery.setup(); // Creates artworks and museum objects

        this.audio = new Audio();
        this.audio.setup();

        // --- Interaction Setup ---
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.setupInteraction();

        window.addEventListener('resize', () => this.onWindowResize());

        this.hideLoader();
        console.log('✅ Initialization Complete. Starting Loop.');

        // Show Welcome Menu (Restored from backup)
        this.showControlInstructions();

        this.animate();
    }

    preloadImages() {
        return new Promise((resolve) => {
            const images = [
                'src/assets/images/Amanecer - Byron.jpeg',
                'src/assets/images/Bailarina - Byron.jpg',
                'src/assets/images/Naturaleza Muerta - Byron.jpg',
                // Add key images here
            ];

            let loaded = 0;
            const total = images.length;
            if (total === 0) resolve();

            images.forEach(src => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => {
                    loaded++;
                    if (loaded === total) resolve();
                };
                img.onerror = () => {
                    loaded++; // Continue anyway
                    if (loaded === total) resolve();
                };
                img.src = src;
            });
            // Fallback timeout
            setTimeout(resolve, 3000);
        });
    }

    setupInteraction() {
        window.addEventListener('click', (e) => this.onClick(e));
    }

    showControlInstructions() {
        // Detect mobile device first
        const isMobile = this.detectMobileDevice();

        const instructions = document.createElement('div');
        instructions.id = 'control-instructions';

        instructions.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.13);
            backdrop-filter: blur(13.125px);
            color: white;
            padding: ${isMobile ? '20px 25px' : '15.75px 18.375px'};
            border-radius: 7.35px;
            text-align: center;
            z-index: 2000;
            max-width: ${isMobile ? '90%' : '199.5px'};
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0px 4.2px 13.125px rgba(0, 0, 0, 0.4);
        `;

        const instructionText = isMobile
            ? `<p style="
                margin-bottom: 12.6px; 
                font-size: ${isMobile ? '14px' : '6.825px'};
                line-height: 1.5;
                color: rgba(255, 255, 255, 0.85);
                font-weight: 400;
            ">Usa el joystick izquierdo para moverte y desliza el dedo en la pantalla para mirar. El botón verde te permite interactuar con las obras.</p>`
            : `<p style="
                margin-bottom: 12.6px; 
                font-size: 6.825px;
                line-height: 1.5;
                color: rgba(255, 255, 255, 0.85);
                font-weight: 400;
            ">Elige tu modo de exploración</p>`;

        instructions.innerHTML = `
            <h3 style="
                margin-bottom: 6.3px; 
                color: #ffffff; 
                font-weight: 700;
                font-size: ${isMobile ? '18px' : '11.55px'};
                letter-spacing: 0.42px;
                text-transform: uppercase;
            ">Bienvenido al Museo Virtual</h3>
            ${instructionText}
            <div style="display: flex; flex-direction: column; gap: 5.25px;">
                <button id="start-walking" style="
                    background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.85) 100%);
                    color: #000;
                    border: none;
                    padding: ${isMobile ? '14px 24px' : '6.3px 12.6px'};
                    border-radius: 4.2px;
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    cursor: pointer;
                    font-weight: 700;
                    font-size: ${isMobile ? '14px' : '6.825px'};
                    letter-spacing: 0.2625px;
                    text-transform: uppercase;
                    transition: all 0.3s ease;
                    box-shadow: 0 2.1px 6.3px rgba(255, 255, 255, 0.2);
                " onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 3.15px 8.4px rgba(255, 255, 255, 0.3)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2.1px 6.3px rgba(255, 255, 255, 0.2)';">${isMobile ? 'Iniciar Recorrido' : 'Recorrido Libre'}</button>
                
                <button id="start-tour" style="
                    background: linear-gradient(135deg, rgba(74, 222, 128, 0.9) 0%, rgba(34, 197, 94, 0.9) 100%);
                    color: #000;
                    border: none;
                    padding: ${isMobile ? '14px 24px' : '6.3px 12.6px'};
                    border-radius: 4.2px;
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    cursor: pointer;
                    font-weight: 700;
                    font-size: ${isMobile ? '14px' : '6.825px'};
                    letter-spacing: 0.2625px;
                    text-transform: uppercase;
                    transition: all 0.3s ease;
                    box-shadow: 0 2.1px 6.3px rgba(74, 222, 128, 0.3);
                " onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 3.15px 8.4px rgba(74, 222, 128, 0.4)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2.1px 6.3px rgba(74, 222, 128, 0.3)';">Recorrido Dinámico</button>
            </div>
        `;

        document.body.appendChild(instructions);

        // Modo libre (exploración manual)
        const btnWalk = document.getElementById('start-walking');
        if (btnWalk) {
            btnWalk.addEventListener('click', () => {
                const el = document.getElementById('control-instructions');
                if (el) document.body.removeChild(el);

                if (isMobile) {
                    this.createMobileControls();
                } else {
                    this.renderer.domElement.requestPointerLock();
                }
            });
        }

        // Modo recorrido dinámico
        const btnTour = document.getElementById('start-tour');
        if (btnTour) {
            btnTour.addEventListener('click', () => {
                const el = document.getElementById('control-instructions');
                if (el) document.body.removeChild(el);
                this.startDynamicTour();
            });
        }
    }

    detectMobileDevice() {
        // Detectar si es móvil
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
            || (window.innerWidth <= 768);
        return isMobile;
    }

    createMobileControls() {
        console.log('📱 Creating Mobile Controls');

        // Crear joystick virtual para movimiento (lado derecho inferior)
        const joystickContainer = document.createElement('div');
        joystickContainer.id = 'mobile-joystick';
        joystickContainer.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            width: 120px;
            height: 120px;
            background: rgba(255, 255, 255, 0.15);
            border: 3px solid rgba(255, 255, 255, 0.4);
            border-radius: 50%;
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            touch-action: none;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        `;

        const joystickHandle = document.createElement('div');
        joystickHandle.id = 'joystick-handle';
        joystickHandle.style.cssText = `
            width: 50px;
            height: 50px;
            background: rgba(255, 255, 255, 0.7);
            border: 2px solid rgba(255, 255, 255, 0.9);
            border-radius: 50%;
            position: absolute;
            transition: all 0.1s ease;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        `;

        joystickContainer.appendChild(joystickHandle);
        document.body.appendChild(joystickContainer);

        // Área de mirar (toda la pantalla excepto el joystick)
        const lookArea = document.createElement('div');
        lookArea.id = 'mobile-look-area';
        lookArea.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 998;
            touch-action: none;
            pointer-events: auto;
        `;
        document.body.appendChild(lookArea);

        // Asegurar que el joystick esté por encima
        joystickContainer.style.zIndex = '1001';

        // Añadir crosshair para móvil
        const crosshair = document.getElementById('crosshair');
        if (crosshair) {
            crosshair.classList.add('active');
            crosshair.style.opacity = '0.6';
        }

        this.setupMobileEventListeners(joystickContainer, joystickHandle, lookArea);
    }

    setupMobileEventListeners(joystick, handle, lookArea) {
        let touchStartX = 0;
        let touchStartY = 0;
        let touchMoveX = 0;
        let touchMoveY = 0;
        let joystickActive = false;
        let lookTouchId = null;
        let moveTouchId = null;

        // Joystick para movimiento
        joystick.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            moveTouchId = e.touches[0].identifier;
            joystickActive = true;
            const rect = joystick.getBoundingClientRect();
            touchStartX = rect.left + rect.width / 2;
            touchStartY = rect.top + rect.height / 2;
        }, { passive: false });

        joystick.addEventListener('touchmove', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!joystickActive) return;

            const touch = Array.from(e.touches).find(t => t.identifier === moveTouchId);
            if (!touch) return;

            const rect = joystick.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            const deltaX = touch.clientX - centerX;
            const deltaY = touch.clientY - centerY;

            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            const maxDistance = 35;

            const clampedDistance = Math.min(distance, maxDistance);
            const angle = Math.atan2(deltaY, deltaX);

            const handleX = Math.cos(angle) * clampedDistance;
            const handleY = Math.sin(angle) * clampedDistance;

            handle.style.transform = `translate(${handleX}px, ${handleY}px)`;

            const normalizedX = deltaX / maxDistance;
            const normalizedY = deltaY / maxDistance;

            // Actualizar controles
            if (this.controls) {
                this.controls.moveForward = normalizedY < -0.3;
                this.controls.moveBackward = normalizedY > 0.3;
                this.controls.moveLeft = normalizedX < -0.3;
                this.controls.moveRight = normalizedX > 0.3;
            }

        }, { passive: false });

        joystick.addEventListener('touchend', (e) => {
            e.stopPropagation();
            const touch = Array.from(e.changedTouches).find(t => t.identifier === moveTouchId);
            if (!touch) return;

            joystickActive = false;
            moveTouchId = null;
            handle.style.transform = 'translate(0, 0)';

            // Detener movimiento
            if (this.controls) {
                this.controls.moveForward = false;
                this.controls.moveBackward = false;
                this.controls.moveLeft = false;
                this.controls.moveRight = false;
            }
        }, { passive: false });

        // Área de mirar
        lookArea.addEventListener('touchstart', (e) => {
            const rect = joystick.getBoundingClientRect();
            const touch = e.touches[0];
            const isOverJoystick = (
                touch.clientX >= rect.left &&
                touch.clientX <= rect.right &&
                touch.clientY >= rect.top &&
                touch.clientY <= rect.bottom
            );

            if (isOverJoystick) return;

            e.preventDefault();
            if (lookTouchId !== null) return;

            lookTouchId = touch.identifier;
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
        }, { passive: false });

        lookArea.addEventListener('touchmove', (e) => {
            const touch = Array.from(e.touches).find(t => t.identifier === lookTouchId);
            if (!touch) return;

            e.preventDefault();

            touchMoveX = touch.clientX - touchStartX;
            touchMoveY = touch.clientY - touchStartY;

            // Actualizar rotación
            if (this.controls) {
                this.controls.targetRotationY -= touchMoveX * 0.005;
                this.controls.targetRotationX -= touchMoveY * 0.005;

                const maxVerticalAngle = Math.PI / 3;
                this.controls.targetRotationX = Math.max(-maxVerticalAngle, Math.min(maxVerticalAngle, this.controls.targetRotationX));

                // Update camera
                this.controls.camera.rotation.set(this.controls.targetRotationX, this.controls.targetRotationY, 0, 'YXZ');
            }

            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
        }, { passive: false });

        lookArea.addEventListener('touchend', (e) => {
            const touch = Array.from(e.changedTouches).find(t => t.identifier === lookTouchId);
            if (touch) {
                lookTouchId = null;
            }
        }, { passive: false });
    }

    startDynamicTour() {
        console.log('🎬 Redirigiendo a recorrido dinámico...');
        // Clean up basic resources if possible, or just redirect
        if (this.renderer) {
            this.renderer.domElement.remove();
        }
        window.location.href = 'https://byron-s-dynamic-museum.pages.dev/index.html';
    }

    onClick(event) {
        if (document.pointerLockElement === this.renderer.domElement) {
            this.mouse.x = 0;
            this.mouse.y = 0;
        } else {
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        }

        this.raycaster.setFromCamera(this.mouse, this.camera);

        // Check intersection with Artworks
        // Flatten artworks meshes
        const meshes = this.gallery.artworks.map(a => a.mesh).filter(m => m);
        const intersects = this.raycaster.intersectObjects(meshes);

        if (intersects.length > 0) {
            const hit = intersects[0].object;
            const data = hit.userData;
            if (data && data.title) {
                console.log('Clicked:', data.title);
                this.showNotification(data.title);
                // logic to show detailed info could go here or imported helper
            }
        }
    }

    showNotification(text) {
        // Simple visual feedback
        const notif = document.createElement('div');
        notif.style.position = 'fixed';
        notif.style.bottom = '20px';
        notif.style.left = '50%';
        notif.style.transform = 'translateX(-50%)';
        notif.style.background = 'rgba(0,0,0,0.7)';
        notif.style.color = 'white';
        notif.style.padding = '10px 20px';
        notif.style.borderRadius = '5px';
        notif.innerText = text;
        document.body.appendChild(notif);
        setTimeout(() => notif.remove(), 2000);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // FPS Calculation
        const time = performance.now();
        this.frameCount++;
        if (time >= this.lastTime + 1000) {
            if (this.fpsElement) {
                this.fpsElement.innerText = Math.round((this.frameCount * 1000) / (time - this.lastTime));
            }
            this.frameCount = 0;
            this.lastTime = time;
        }

        const deltaTime = Math.min(this.clock.getDelta(), 0.1);

        // 1. Update Controls (Input state processing)
        this.controls.update(deltaTime);
        // Note: Controls.js applies movement to camera immediately "this.camera.position.add(nextPos)"

        // 2. Physics Correction (Collision Detection & Resolution)
        // Physics will read camera position and push it back if it collided
        this.physics.update(
            deltaTime,
            this.gallery.decorationCollisions,
            this.gallery.museumObjects
        );

        // 3. Head Bob Effect
        this.applyHeadBob(deltaTime);

        // 4. Render
        this.renderer.render(this.scene, this.camera);
    }

    applyHeadBob(deltaTime) {
        if (!this.headBobConfig.enabled) return;

        const velocity = this.controls.velocity;
        const isMoving = Math.abs(velocity.x) > 0.1 || Math.abs(velocity.z) > 0.1;

        if (isMoving) {
            this.walkingTime += deltaTime * this.headBobConfig.frequency;
            // Vertical Bob
            const wave = Math.sin(this.walkingTime * 2) * this.headBobConfig.amplitude;
            this.camera.position.y = 1.7 + wave;
            // Horizontal Bob (Tilt)
            const waveH = Math.cos(this.walkingTime) * this.headBobConfig.amplitudeHorizontal;
            this.camera.rotation.z = waveH;
        } else {
            // Reset
            this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, 1.7, deltaTime * 5);
            this.camera.rotation.z = THREE.MathUtils.lerp(this.camera.rotation.z, 0, deltaTime * 5);
        }
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    showLoader() {
        const loader = document.getElementById('loader');
        if (loader) loader.style.display = 'flex';
    }

    hideLoader() {
        const loader = document.getElementById('loader');
        if (loader) loader.style.display = 'none';
    }
}
