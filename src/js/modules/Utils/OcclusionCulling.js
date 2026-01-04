import * as THREE from 'three';

/**
 * Occlusion Culling System for Museums
 * Useful for:
 * - Very large museums (>100 artworks)
 * - Scenes with many walls/rooms
 * - Very limited hardware
 *
 * Hides artworks that are behind walls or outside the field of view.
 *
 * How it works:
 * 1. Determines which wall the camera is facing
 * 2. Hides all artworks on other walls
 * 3. Only renders what the user can actually see
 */

export class OcclusionCulling {
    constructor() {
        this.stats = {
            totalObjects: 0,
            visibleObjects: 0,
            culledObjects: 0,
            drawCallsSaved: 0
        };

        // Museum walls definition

        this.walls = {
            front: {
                normal: new THREE.Vector3(0, 0, 1),  /** Faces +Z */

                position: new THREE.Vector3(0, 0, -13.7),
                name: 'Front Wall'

            },
            back: {
                normal: new THREE.Vector3(0, 0, -1), /** Faces -Z */

                position: new THREE.Vector3(0, 0, 10),
                name: 'Back Wall'

            },
            left: {
                normal: new THREE.Vector3(1, 0, 0),  /** Faces +X */

                position: new THREE.Vector3(-13.7, 0, 0),
                name: 'Left Wall'

            },
            right: {
                normal: new THREE.Vector3(-1, 0, 0), /** Faces -X */

                position: new THREE.Vector3(13.7, 0, 0),
                name: 'Right Wall'

            }
        };

        // Visibility threshold (dot product)
        this.visibilityThreshold = 0.3; // More tolerant = more artworks visible


        // Assignments cache wall->artworks
        this.wallAssignments = new Map(); // artwork -> wall

    }

    /**
     * Assigns each artwork to its corresponding wall (once at startup)
     */

    assignArtworksToWalls(artworks) {
        console.log('Assigning artworks to walls...');



        artworks.forEach(artwork => {
            const pos = new THREE.Vector3();
            artwork.group.getWorldPosition(pos);

            // Determine which wall it belongs to based on position

            let closestWall = null;
            let minDistance = Infinity;

            Object.entries(this.walls).forEach(([key, wall]) => {
                const distance = Math.abs(pos.distanceTo(wall.position));
                if (distance < minDistance) {
                    minDistance = distance;
                    closestWall = key;
                }
            });

            this.wallAssignments.set(artwork, closestWall);
            console.log(`  - ${artwork.config.title} → ${this.walls[closestWall].name}`);
        });

        this.stats.totalObjects = artworks.length;
    }

    /**
     * Calculates which walls are visible from the camera position
     */

    getVisibleWalls(cameraPosition, cameraDirection) {
        const visibleWalls = [];

        Object.entries(this.walls).forEach(([key, wall]) => {
            // Vector from camera to wall

            const toWall = new THREE.Vector3()
                .subVectors(wall.position, cameraPosition)
                .normalize();

            // Dot product between camera direction and direction to wall

            const dot = cameraDirection.dot(toWall);

            // If dot product is positive, the wall is in front of the camera

            if (dot > this.visibilityThreshold) {
                visibleWalls.push(key);
            }
        });

        return visibleWalls;
    }

    /**
     * Determines if a specific artwork should be visible
     */

    isArtworkVisible(artwork, cameraPosition, cameraDirection) {
        const artworkWall = this.wallAssignments.get(artwork);
        if (!artworkWall) return true; // If not assigned, leave visible


        const wall = this.walls[artworkWall];

        // Vector from camera to wall

        const toWall = new THREE.Vector3()
            .subVectors(wall.position, cameraPosition)
            .normalize();

        // Check if looking towards that wall

        const dot = cameraDirection.dot(toWall);

        // Consider visible if:
        // 1. We are looking towards the wall (dot > threshold)
        // 2. Or we are very close to the artwork (distance < 8m to avoid pop-in)

        const artworkPos = new THREE.Vector3();
        artwork.group.getWorldPosition(artworkPos);
        const distance = cameraPosition.distanceTo(artworkPos);

        return dot > this.visibilityThreshold || distance < 8.0;
    }

    /**
     * Updates visibility of all artworks based on camera position
     * This is the function called every frame
     */

    update(artworks, camera) {
        if (this.wallAssignments.size === 0) {
            // First time - assign artworks to walls

            this.assignArtworksToWalls(artworks);
        }

        const cameraDirection = new THREE.Vector3();
        camera.getWorldDirection(cameraDirection);

        let visible = 0;
        let culled = 0;

        artworks.forEach(artwork => {
            const shouldBeVisible = this.isArtworkVisible(
                artwork,
                camera.position,
                cameraDirection
            );

            // Update only if state changed

            if (artwork.group.visible !== shouldBeVisible) {
                artwork.group.visible = shouldBeVisible;
            }

            if (shouldBeVisible) {
                visible++;
            } else {
                culled++;
            }
        });

        this.stats.visibleObjects = visible;
        this.stats.culledObjects = culled;
        this.stats.drawCallsSaved = culled * 3; // ~3 draw calls per artwork (frame + artwork)

    }

    /**
     * Get culling statistics
     */

    getStats() {
        const cullPercentage = this.stats.totalObjects > 0
            ? ((this.stats.culledObjects / this.stats.totalObjects) * 100).toFixed(1)
            : 0;

        return {
            total: this.stats.totalObjects,
            visible: this.stats.visibleObjects,
            culled: this.stats.culledObjects,
            cullPercentage: parseFloat(cullPercentage),
            drawCallsSaved: this.stats.drawCallsSaved
        };
    }

    /**
     * Reset assignments (useful if museum geometry changes)
     */

    reset() {
        this.wallAssignments.clear();
        this.stats.culledObjects = 0;
        this.stats.visibleObjects = 0;
    }
}
