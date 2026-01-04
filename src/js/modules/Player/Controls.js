import * as THREE from 'three';
import CONFIG from '../../config.js';

export class FirstPersonControls {
    constructor(camera, renderer) {
        this.camera = camera;
        this.renderer = renderer;

        // Movement state
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.isRunning = false;

        // Physics state
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();

        // Rotation state
        this.targetRotationX = 0;
        this.targetRotationY = Math.PI; // Look at back wall

        // Configuration
        this.config = CONFIG.movement;

        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));
        document.addEventListener('mousemove', (e) => this.onMouseLook(e));

        // Pointer lock
        document.addEventListener('click', () => {
            if (document.pointerLockElement !== this.renderer.domElement) {
                this.renderer.domElement.requestPointerLock();
            }
        });

        document.addEventListener('pointerlockchange', () => this.onPointerLockChange());
    }

    onKeyDown(event) {
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

    onKeyUp(event) {
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

    onMouseLook(event) {
        if (document.pointerLockElement === this.renderer.domElement) {
            const movementX = event.movementX || 0;
            const movementY = event.movementY || 0;

            // Update target rotation
            // Note: In original code config was lookSpeed: 0.002
            const lookSpeed = 0.002;

            this.targetRotationY -= movementX * lookSpeed;
            this.targetRotationX -= movementY * lookSpeed;

            // Limit vertical look
            const maxVerticalAngle = Math.PI / 3;
            this.targetRotationX = Math.max(-maxVerticalAngle, Math.min(maxVerticalAngle, this.targetRotationX));

            // Apply rotation immediately for responsiveness (or smooth it in update)
            this.camera.rotation.set(this.targetRotationX, this.targetRotationY, 0, 'YXZ');
        }
    }

    onPointerLockChange() {
        if (document.pointerLockElement === this.renderer.domElement) {
            this.renderer.domElement.style.cursor = 'none';
        } else {
            this.renderer.domElement.style.cursor = 'default';
        }
    }

    update(deltaTime) {
        // Delta time cap
        deltaTime = Math.min(deltaTime, 0.1);

        const speed = this.isRunning ? this.config.runSpeed : this.config.speed; // Use config values
        // Or if config values are different in main.js
        // walkSpeed: 4.0, runSpeed: 7.0
        // I will use constants that match the behavior
        const walkSpeed = 4.0;
        const runSpeed = 7.0;
        const currentSpeed = this.isRunning ? runSpeed : walkSpeed;

        // Friction
        const friction = 10.0;
        this.velocity.x -= this.velocity.x * friction * deltaTime;
        this.velocity.z -= this.velocity.z * friction * deltaTime;

        // Direction
        this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
        this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
        this.direction.normalize();

        const acceleration = 12.0;

        if (this.moveForward || this.moveBackward) {
            const forward = new THREE.Vector3(0, 0, -1);
            forward.applyQuaternion(this.camera.quaternion);
            forward.y = 0;
            forward.normalize();

            const targetVelocityZ = this.direction.z * currentSpeed;
            const velocityDiff = targetVelocityZ - (this.velocity.dot(forward));
            this.velocity.add(forward.clone().multiplyScalar(velocityDiff * acceleration * deltaTime));
        }

        if (this.moveLeft || this.moveRight) {
            const right = new THREE.Vector3(1, 0, 0);
            right.applyQuaternion(this.camera.quaternion);
            right.y = 0;
            right.normalize();

            const targetVelocityX = this.direction.x * currentSpeed;
            const velocityDiff = targetVelocityX - (this.velocity.dot(right));
            this.velocity.add(right.clone().multiplyScalar(velocityDiff * acceleration * deltaTime));
        }

        // Apply Movement
        const nextPos = this.velocity.clone().multiplyScalar(deltaTime);
        this.camera.position.add(nextPos);

        // Simple bounds (can be improved later with proper collision system)
        // For now, rely on external collision check or add bounds here
    }
}
