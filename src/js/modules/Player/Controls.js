import * as THREE from 'three';
import CONFIG from '../../config.js';

/**
 * First-person camera controls for free exploration.
 *
 * The controller combines keyboard movement, pointer-lock mouse look,
 * fallback drag look, and externally controlled touch movement. Collision
 * resolution is handled by Physics after this module applies the requested
 * camera movement for the frame.
 */
export class FirstPersonControls {
    /**
     * @param {THREE.PerspectiveCamera} camera - Camera moved and rotated by the controls.
     * @param {THREE.WebGLRenderer} renderer - Renderer whose canvas receives pointer lock.
     */
    constructor(camera, renderer) {
        this.camera = camera;
        this.renderer = renderer;
        this.enabled = true;
        this.movementEnabled = true;
        this.pointerLockEnabled = true;
        this.dragLookActive = false;
        this.dragLookLastX = 0;
        this.dragLookLastY = 0;

        /** @type {boolean} Keyboard or touch forward movement state. */
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.isRunning = false;

        /** Vectors reused every frame to avoid unnecessary allocations. */
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.desiredVelocity = new THREE.Vector3();
        this.horizontalSpeed = 0;
        this.speedRatio = 0;

        /** Target Euler rotation stored separately so App can add head motion offsets. */
        this.targetRotationX = 0;
        this.targetRotationY = Math.PI;
        this.camera.rotation.order = 'YXZ';

        /** Movement and look sensitivity values from the central config. */
        this.config = CONFIG.movement;

        this.setupEventListeners();
    }

    /**
     * Registers keyboard, mouse, and pointer-lock events.
     *
     * Events are attached globally because pointer lock routes mouse movement
     * through the document after the canvas has captured the pointer.
     */
    setupEventListeners() {
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));
        document.addEventListener('mousemove', (e) => this.onMouseLook(e));
        document.addEventListener('mouseup', () => this.onPointerUp());

        this.renderer.domElement.addEventListener('click', () => {
            if (this.enabled && this.pointerLockEnabled && document.pointerLockElement !== this.renderer.domElement) {
                this.renderer.domElement.requestPointerLock();
            }
        });
        this.renderer.domElement.addEventListener('mousedown', (e) => this.onPointerDown(e));

        document.addEventListener('pointerlockchange', () => this.onPointerLockChange());
    }

    /**
     * Handles keyboard movement presses.
     *
     * @param {KeyboardEvent} event - Keyboard event from the document.
     */
    onKeyDown(event) {
        if (!this.enabled || !this.movementEnabled) return;

        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW': this.moveForward = true; break;
            case 'ArrowLeft':
            case 'KeyA': this.moveLeft = true; break;
            case 'ArrowDown':
            case 'KeyS': this.moveBackward = true; break;
            case 'ArrowRight':
            case 'KeyD': this.moveRight = true; break;
            case 'ShiftLeft':
            case 'ShiftRight': this.isRunning = true; break;
        }
    }

    /**
     * Handles keyboard movement releases.
     *
     * @param {KeyboardEvent} event - Keyboard event from the document.
     */
    onKeyUp(event) {
        if (!this.enabled || !this.movementEnabled) return;

        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW': this.moveForward = false; break;
            case 'ArrowLeft':
            case 'KeyA': this.moveLeft = false; break;
            case 'ArrowDown':
            case 'KeyS': this.moveBackward = false; break;
            case 'ArrowRight':
            case 'KeyD': this.moveRight = false; break;
            case 'ShiftLeft':
            case 'ShiftRight': this.isRunning = false; break;
        }
    }

    /**
     * Applies pointer-lock or drag-look mouse deltas to the camera rotation.
     *
     * @param {MouseEvent} event - Mouse movement event.
     */
    onMouseLook(event) {
        if (!this.enabled) return;

        const usingPointerLock = document.pointerLockElement === this.renderer.domElement;
        if (!usingPointerLock && !this.dragLookActive) return;

        const movementX = usingPointerLock ? (event.movementX || 0) : event.clientX - this.dragLookLastX;
        const movementY = usingPointerLock ? (event.movementY || 0) : event.clientY - this.dragLookLastY;

        if (!usingPointerLock) {
            this.dragLookLastX = event.clientX;
            this.dragLookLastY = event.clientY;
        }

        const lookSpeed = this.config.lookSpeed;

        this.targetRotationY -= movementX * lookSpeed;
        this.targetRotationX -= movementY * lookSpeed;

        // Clamp pitch so the visitor cannot rotate beyond a natural vertical range.
        const maxVerticalAngle = Math.PI / 3;
        this.targetRotationX = Math.max(-maxVerticalAngle, Math.min(maxVerticalAngle, this.targetRotationX));

        // Apply immediately; App layers optional walking motion on top later.
        this.camera.rotation.set(this.targetRotationX, this.targetRotationY, 0, 'YXZ');
    }

    /**
     * Starts drag-look fallback when pointer lock is not active.
     *
     * @param {MouseEvent} event - Mouse down event on the renderer canvas.
     */
    onPointerDown(event) {
        if (!this.enabled || document.pointerLockElement === this.renderer.domElement || event.button !== 0) {
            return;
        }

        this.dragLookActive = true;
        this.dragLookLastX = event.clientX;
        this.dragLookLastY = event.clientY;
    }

    /**
     * Ends drag-look fallback.
     */
    onPointerUp() {
        this.dragLookActive = false;
    }

    /**
     * Keeps the canvas cursor state aligned with pointer-lock state.
     */
    onPointerLockChange() {
        if (document.pointerLockElement === this.renderer.domElement) {
            this.renderer.domElement.style.cursor = 'none';
        } else {
            this.renderer.domElement.style.cursor = 'default';
        }
    }

    /**
     * Updates velocity and applies horizontal camera movement.
     *
     * Movement is relative to the current camera yaw and remains on the X/Z
     * plane; the Physics module corrects boundaries and object collisions after
     * this update.
     *
     * @param {number} deltaTime - Seconds elapsed since the previous frame.
     */
    update(deltaTime) {
        // Cap large frame gaps so tab stalls do not create a movement jump.
        deltaTime = Math.min(deltaTime, 0.1);

        if (!this.enabled || !this.movementEnabled) {
            this.velocity.set(0, 0, 0);
            return;
        }

        this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
        this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
        const isMoving = this.direction.lengthSq() > 0;
        const currentSpeed = this.isRunning ? this.config.runSpeed : this.config.walkSpeed;

        this.desiredVelocity.set(0, 0, 0);

        if (isMoving) {
            this.direction.normalize();
            const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
            const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
            forward.y = 0;
            right.y = 0;
            forward.normalize();
            right.normalize();

            const backwardsMultiplier = this.direction.z < 0 ? 0.72 : 1;
            const strafeMultiplier = Math.abs(this.direction.x) > 0 && Math.abs(this.direction.z) === 0 ? 0.86 : 1;
            const targetSpeed = currentSpeed * backwardsMultiplier * strafeMultiplier;

            this.desiredVelocity
                .addScaledVector(forward, this.direction.z * targetSpeed)
                .addScaledVector(right, this.direction.x * targetSpeed);
        }

        const response = isMoving
            ? (this.isRunning ? this.config.runAcceleration : this.config.acceleration)
            : (this.config.deceleration || this.config.friction);
        const blend = 1 - Math.exp(-response * deltaTime);

        this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, this.desiredVelocity.x, blend);
        this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, this.desiredVelocity.z, blend);

        if (!isMoving && Math.hypot(this.velocity.x, this.velocity.z) < 0.02) {
            this.velocity.x = 0;
            this.velocity.z = 0;
        }

        this.horizontalSpeed = Math.hypot(this.velocity.x, this.velocity.z);
        this.speedRatio = currentSpeed > 0 ? THREE.MathUtils.clamp(this.horizontalSpeed / currentSpeed, 0, 1) : 0;

        const nextPos = this.velocity.clone().multiplyScalar(deltaTime);
        this.camera.position.add(nextPos);
    }

    /**
     * Enables or disables the control system.
     *
     * @param {boolean} enabled - Whether look and movement input should be accepted.
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            this.resetMovement();
            this.dragLookActive = false;
        }
    }

    /**
     * Enables or disables manual movement while preserving look control.
     *
     * @param {boolean} enabled - Whether movement input should be accepted.
     */
    setMovementEnabled(enabled) {
        this.movementEnabled = enabled;
        if (!enabled) {
            this.resetMovement();
        }
    }

    /**
     * Enables or disables pointer-lock requests from the renderer canvas.
     *
     * @param {boolean} enabled - Whether clicking the canvas may request pointer lock.
     */
    setPointerLockEnabled(enabled) {
        this.pointerLockEnabled = enabled;
        if (!enabled && document.pointerLockElement === this.renderer.domElement) {
            document.exitPointerLock();
        }
    }

    /**
     * Clears movement keys, run state, and smoothed velocity.
     */
    resetMovement() {
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.isRunning = false;
        this.velocity.set(0, 0, 0);
        this.desiredVelocity.set(0, 0, 0);
        this.horizontalSpeed = 0;
        this.speedRatio = 0;
    }

    /**
     * Copies the camera's current quaternion into the stored target rotation.
     *
     * Guided tour interpolation changes the camera quaternion directly, so this
     * method prevents manual controls from snapping back to stale yaw/pitch
     * values afterward.
     */
    syncRotationFromCamera() {
        const euler = new THREE.Euler().setFromQuaternion(this.camera.quaternion, 'YXZ');
        this.targetRotationX = euler.x;
        this.targetRotationY = euler.y;
        this.camera.rotation.set(this.targetRotationX, this.targetRotationY, 0, 'YXZ');
    }
}
