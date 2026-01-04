import * as THREE from 'three';

export class Physics {
    constructor(camera, controls) {
        this.camera = camera;
        this.controls = controls;

        // World Bounds (from main.js)
        this.bounds = {
            minX: -13.2,
            maxX: 13.2,
            minZ: -13.4,
            maxZ: 11
        };

        // Player physical properties
        this.playerRadius = 0.5;
    }

    update(deltaTime, decorationCollisions, museumObjects) {
        this.checkBoundaries();
        this.checkObjectCollisions(decorationCollisions, museumObjects);
    }

    checkBoundaries() {
        const pos = this.camera.position;
        const vel = this.controls.velocity;

        // X Axis
        if (pos.x < this.bounds.minX) {
            pos.x = this.bounds.minX;
            vel.x = 0;
        } else if (pos.x > this.bounds.maxX) {
            pos.x = this.bounds.maxX;
            vel.x = 0;
        }

        // Z Axis
        if (pos.z < this.bounds.minZ) {
            pos.z = this.bounds.minZ;
            vel.z = 0;
        } else if (pos.z > this.bounds.maxZ) {
            pos.z = this.bounds.maxZ;
            vel.z = 0;
        }
    }

    checkObjectCollisions(decorationCollisions, museumObjects) {
        const playerPos = new THREE.Vector2(this.camera.position.x, this.camera.position.z);
        const velocity = this.controls.velocity;

        // 1. Simple Decoration Collisions (Circles)
        if (decorationCollisions) {
            decorationCollisions.forEach(collision => {
                const objectPos = new THREE.Vector2(collision.x, collision.z);
                const distance = playerPos.distanceTo(objectPos);
                const minDistance = this.playerRadius + collision.radius;

                if (distance < minDistance) {
                    // Collision detected - push player out
                    const pushDirection = playerPos.clone().sub(objectPos).normalize();
                    const pushAmount = minDistance - distance;

                    this.camera.position.x += pushDirection.x * pushAmount;
                    this.camera.position.z += pushDirection.y * pushAmount;

                    // Dampen velocity to prevent sticking/sliding too fast
                    velocity.x *= 0.5;
                    velocity.z *= 0.5;

                    // Update temp playerPos for next check (iterative resolution)
                    playerPos.set(this.camera.position.x, this.camera.position.z);
                }
            });
        }

        // 2. Museum Objects (Complex Objects)
        if (museumObjects) {
            museumObjects.forEach(obj => {
                if (obj.group && obj.config && obj.config.position) {
                    const objPos = new THREE.Vector2(obj.config.position[0], obj.config.position[2]);
                    const distance = playerPos.distanceTo(objPos);

                    // Determine collision radius based on type
                    let objRadius = 0.5;
                    const type = obj.config.type;

                    if (type === 'sculpture') objRadius = 1.5;
                    else if (type === 'plant') objRadius = 0.4;
                    else if (type === 'bench') objRadius = 1.0;
                    else if (type === 'table') objRadius = 0.8;
                    else if (type === 'column') objRadius = 0.6;
                    else if (type === 'displayCase') objRadius = 1.0;
                    else if (type === 'wall') objRadius = 2.0;
                    else if (type === 'podium') objRadius = 0.8;
                    // Special case for monumental sculpture which relies on size checks
                    else if (type === 'monumentalSculpture') objRadius = 1.8;

                    const minDistance = this.playerRadius + objRadius;

                    if (distance < minDistance) {
                        const pushDirection = playerPos.clone().sub(objPos).normalize();
                        const pushAmount = minDistance - distance;

                        this.camera.position.x += pushDirection.x * pushAmount;
                        this.camera.position.z += pushDirection.y * pushAmount;

                        velocity.x *= 0.3;
                        velocity.z *= 0.3;

                        playerPos.set(this.camera.position.x, this.camera.position.z);
                    }
                }
            });
        }
    }
}
