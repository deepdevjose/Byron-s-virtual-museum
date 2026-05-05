import * as THREE from 'three';

/**
 * Resolves simple first-person collision constraints.
 *
 * The museum uses lightweight 2D collision checks on the X/Z plane. Controls
 * apply desired camera movement first, then Physics clamps the camera inside
 * room bounds and pushes it away from registered decoration objects.
 */
export class Physics {
    /**
     * @param {THREE.PerspectiveCamera} camera - Camera representing the visitor.
     * @param {Object} controls - Controls object exposing the current velocity vector.
     */
    constructor(camera, controls) {
        this.camera = camera;
        this.controls = controls;

        // Bounds match the walkable area inside the gallery walls.
        this.bounds = {
            minX: -13.2,
            maxX: 13.2,
            minZ: -13.4,
            maxZ: 11
        };

        // Player radius is measured in scene units on the X/Z plane.
        this.playerRadius = 0.5;
    }

    /**
     * Applies room and object collision constraints for the current frame.
     *
     * @param {number} deltaTime - Seconds elapsed since the previous frame.
     * @param {Array<Object>} decorationCollisions - Lightweight collision records.
     * @param {Array<Object>} museumObjects - Museum object records with type metadata.
     */
    update(deltaTime, decorationCollisions, museumObjects) {
        this.checkBoundaries();
        this.checkObjectCollisions(decorationCollisions, museumObjects);
    }

    /**
     * Clamps the visitor camera inside the gallery bounds.
     */
    checkBoundaries() {
        const pos = this.camera.position;
        const vel = this.controls.velocity;

        // X axis.
        if (pos.x < this.bounds.minX) {
            pos.x = this.bounds.minX;
            vel.x = 0;
        } else if (pos.x > this.bounds.maxX) {
            pos.x = this.bounds.maxX;
            vel.x = 0;
        }

        // Z axis.
        if (pos.z < this.bounds.minZ) {
            pos.z = this.bounds.minZ;
            vel.z = 0;
        } else if (pos.z > this.bounds.maxZ) {
            pos.z = this.bounds.maxZ;
            vel.z = 0;
        }
    }

    /**
     * Pushes the visitor away from circular object collision volumes.
     *
     * Collision is intentionally approximate so decorative meshes can stay
     * visually rich without requiring mesh-level physics.
     *
     * @param {Array<Object>} decorationCollisions - Direct collision records.
     * @param {Array<Object>} museumObjects - Object records with type-based radii.
     */
    checkObjectCollisions(decorationCollisions, museumObjects) {
        const playerPos = new THREE.Vector2(this.camera.position.x, this.camera.position.z);
        const velocity = this.controls.velocity;

        // Simple decoration collisions use explicit circular radii.
        if (decorationCollisions) {
            decorationCollisions.forEach(collision => {
                const objectPos = new THREE.Vector2(collision.x, collision.z);
                const distance = playerPos.distanceTo(objectPos);
                const minDistance = this.playerRadius + collision.radius;

                if (distance < minDistance) {
                    // Push the camera out along the shortest horizontal direction.
                    const pushDirection = playerPos.clone().sub(objectPos).normalize();
                    const pushAmount = minDistance - distance;

                    this.camera.position.x += pushDirection.x * pushAmount;
                    this.camera.position.z += pushDirection.y * pushAmount;

                    // Dampen velocity to prevent fast sliding along the obstacle.
                    velocity.x *= 0.5;
                    velocity.z *= 0.5;

                    // Update the temporary player position before testing the next object.
                    playerPos.set(this.camera.position.x, this.camera.position.z);
                }
            });
        }

        // Museum objects derive their collision radius from object type.
        if (museumObjects) {
            museumObjects.forEach(obj => {
                if (obj.group && obj.config && obj.config.position) {
                    const objPos = new THREE.Vector2(obj.config.position[0], obj.config.position[2]);
                    const distance = playerPos.distanceTo(objPos);

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
