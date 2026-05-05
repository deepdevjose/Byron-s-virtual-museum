import * as THREE from 'three';

/**
 * Wall-based occlusion culling utility for museum scenes.
 *
 * This optional utility is intended for large museums, multi-room scenes, or
 * limited hardware. It hides artworks on walls that are not generally in front
 * of the camera, while keeping nearby artworks visible to avoid obvious pop-in.
 *
 * Current App does not call this utility during the main loop, but benchmark
 * scripts use it as a performance experiment.
 */
export class OcclusionCulling {
    /**
     * Creates wall definitions, visibility threshold, and statistics.
     */
    constructor() {
        this.stats = {
            totalObjects: 0,
            visibleObjects: 0,
            culledObjects: 0,
            drawCallsSaved: 0
        };

        // Wall normals describe the visible face direction for each wall.
        this.walls = {
            front: {
                normal: new THREE.Vector3(0, 0, 1),

                position: new THREE.Vector3(0, 0, -13.7),
                name: 'Front Wall'

            },
            back: {
                normal: new THREE.Vector3(0, 0, -1),

                position: new THREE.Vector3(0, 0, 10),
                name: 'Back Wall'

            },
            left: {
                normal: new THREE.Vector3(1, 0, 0),

                position: new THREE.Vector3(-13.7, 0, 0),
                name: 'Left Wall'

            },
            right: {
                normal: new THREE.Vector3(-1, 0, 0),

                position: new THREE.Vector3(13.7, 0, 0),
                name: 'Right Wall'

            }
        };

        // Dot-product threshold; lower values keep more artworks visible.
        this.visibilityThreshold = 0.3;


        // Cache each artwork's nearest wall after the first assignment pass.
        this.wallAssignments = new Map();

    }

    /**
     * Assigns each artwork to its nearest wall.
     *
     * @param {Array<Object>} artworks - Gallery artwork records with groups.
     */
    assignArtworksToWalls(artworks) {
        console.log('Assigning artworks to walls...');



        artworks.forEach(artwork => {
            const pos = new THREE.Vector3();
            artwork.group.getWorldPosition(pos);

            // Determine wall ownership by nearest predefined wall position.
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
     * Calculates which walls are generally in front of the camera.
     *
     * @param {THREE.Vector3} cameraPosition - Current camera position.
     * @param {THREE.Vector3} cameraDirection - Normalized camera direction.
     * @returns {string[]} Wall keys that pass the visibility threshold.
     */
    getVisibleWalls(cameraPosition, cameraDirection) {
        const visibleWalls = [];

        Object.entries(this.walls).forEach(([key, wall]) => {
            const toWall = new THREE.Vector3()
                .subVectors(wall.position, cameraPosition)
                .normalize();

            // Positive dot products indicate the wall is in front of the camera.
            const dot = cameraDirection.dot(toWall);

            if (dot > this.visibilityThreshold) {
                visibleWalls.push(key);
            }
        });

        return visibleWalls;
    }

    /**
     * Determines whether one artwork should remain visible.
     *
     * @param {Object} artwork - Gallery artwork record.
     * @param {THREE.Vector3} cameraPosition - Current camera position.
     * @param {THREE.Vector3} cameraDirection - Normalized camera direction.
     * @returns {boolean} True when the artwork should be visible.
     */
    isArtworkVisible(artwork, cameraPosition, cameraDirection) {
        const artworkWall = this.wallAssignments.get(artwork);
        if (!artworkWall) return true; // If not assigned, leave visible.


        const wall = this.walls[artworkWall];

        const toWall = new THREE.Vector3()
            .subVectors(wall.position, cameraPosition)
            .normalize();

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
     * Updates visibility of all artworks based on camera orientation.
     *
     * @param {Array<Object>} artworks - Gallery artwork records.
     * @param {THREE.Camera} camera - Active camera.
     */
    update(artworks, camera) {
        if (this.wallAssignments.size === 0) {
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

            // Avoid redundant visibility writes.
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
        this.stats.drawCallsSaved = culled * 3; // Approximate frame + artwork draw calls.

    }

    /**
     * Gets culling statistics for diagnostics and benchmark scripts.
     *
     * @returns {{total: number, visible: number, culled: number, cullPercentage: number, drawCallsSaved: number}}
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
     * Clears cached wall assignments.
     *
     * Useful after changing museum geometry or artwork positions.
     */
    reset() {
        this.wallAssignments.clear();
        this.stats.culledObjects = 0;
        this.stats.visibleObjects = 0;
    }
}
