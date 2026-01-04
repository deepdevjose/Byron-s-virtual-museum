import * as THREE from 'three';

/**
 * Manual Frustum Culling System

 *
 * Three.js already implements frustum culling automatically.
 * Use only if you need very specific manual control like me.
 *
 * Based on plane extraction from the View-Projection matrix.
 *
 * Mathematical Foundation:
 * =======================
 *
 * 1. View-Projection Matrix (M = P × V)
 *
 *    M = | m11  m12  m13  m14 |
 *        | m21  m22  m23  m24 |
 *        | m31  m32  m33  m34 |
 *        | m41  m42  m43  m44 |
 *
 * 2. Extraction of the 6 frustum planes:
 *
 *    Left Plane:   Row4 + Row1 → (m41+m11, m42+m12, m43+m13, m44+m14)
 *    Right Plane:  Row4 - Row1 → (m41-m11, m42-m12, m43-m13, m44-m14)
 *    Bottom Plane: Row4 + Row2 → (m41+m21, m42+m22, m43+m23, m44+m24)
 *    Top Plane:    Row4 - Row2 → (m41-m21, m42-m22, m43-m23, m44-m24)
 *    Near Plane:   Row4 + Row3 → (m41+m31, m42+m32, m43+m33, m44+m34)
 *    Far Plane:    Row4 - Row3 → (m41-m31, m42-m32, m43-m33, m44-m34)
 *
 * 3. Sphere vs Plane Test:
 *
 *    Signed distance: d = (A*x + B*y + C*z + D) / sqrt(A² + B² + C²)
 *    If d < -radius → Totally outside (CULL)
 *    If d > radius  → Totally inside
 *    Else           → Intersects (could be visible)
 */

export class FrustumCulling {
    constructor() {
        // The 6 planes of the frustum

        this.planes = {
            left: new THREE.Plane(),
            right: new THREE.Plane(),
            top: new THREE.Plane(),
            bottom: new THREE.Plane(),
            near: new THREE.Plane(),
            far: new THREE.Plane()
        };

        // Native Three.js Frustum (for comparison)

        this.frustum = new THREE.Frustum();

        // Temporary matrix

        this.projScreenMatrix = new THREE.Matrix4();

        this.stats = {
            totalObjects: 0,
            visibleObjects: 0,
            culledObjects: 0
        };
    }

    /**
     * Extracts the 6 frustum planes from the View-Projection matrix
     * Pure mathematical implementation
     */

    extractPlanesFromMatrix(viewProjectionMatrix) {
        const m = viewProjectionMatrix.elements;

        // Left Plane: Row 4 + Row 1

        this.planes.left.set(
            new THREE.Vector3(m[3] + m[0], m[7] + m[4], m[11] + m[8]),
            m[15] + m[12]
        );
        this.planes.left.normalize();

        // Right Plane: Row 4 - Row 1

        this.planes.right.set(
            new THREE.Vector3(m[3] - m[0], m[7] - m[4], m[11] - m[8]),
            m[15] - m[12]
        );
        this.planes.right.normalize();

        // Bottom Plane: Row 4 + Row 2

        this.planes.bottom.set(
            new THREE.Vector3(m[3] + m[1], m[7] + m[5], m[11] + m[9]),
            m[15] + m[13]
        );
        this.planes.bottom.normalize();

        // Top Plane: Row 4 - Row 2

        this.planes.top.set(
            new THREE.Vector3(m[3] - m[1], m[7] - m[5], m[11] - m[9]),
            m[15] - m[13]
        );
        this.planes.top.normalize();

        // Near Plane: Row 4 + Row 3

        this.planes.near.set(
            new THREE.Vector3(m[3] + m[2], m[7] + m[6], m[11] + m[10]),
            m[15] + m[14]
        );
        this.planes.near.normalize();

        // Far Plane: Row 4 - Row 3

        this.planes.far.set(
            new THREE.Vector3(m[3] - m[2], m[7] - m[6], m[11] - m[10]),
            m[15] - m[14]
        );
        this.planes.far.normalize();
    }

    /**
     * Sphere vs Frustum Test
     * Returns true if the sphere is visible (totally or partially)
     *
     * @param {THREE.Vector3} center - Center of the sphere
     * @param {number} radius - Radius of the sphere
     * @returns {boolean} - true if visible, false if hidden
     */

    isSphereVisible(center, radius) {
        // Test against each plane

        for (const plane of Object.values(this.planes)) {
            // Signed distance from center to plane

            const distance = plane.distanceToPoint(center);

            // If completely behind the plane → CULL

            if (distance < -radius) {
                return false;
            }
        }

        // Passed all tests → Visible

        return true;
    }

    /**
     * AABB Box vs Frustum Test
     *
     * @param {THREE.Box3} box - Axis-aligned box
     * @returns {boolean} - true if visible
     */

    isBoxVisible(box) {
        for (const plane of Object.values(this.planes)) {
            // Find the point closest to the plane

            const p = new THREE.Vector3();
            p.x = plane.normal.x > 0 ? box.max.x : box.min.x;
            p.y = plane.normal.y > 0 ? box.max.y : box.min.y;
            p.z = plane.normal.z > 0 ? box.max.z : box.min.z;

            // If the closest point is behind the plane → CULL

            if (plane.distanceToPoint(p) < 0) {
                return false;
            }
        }

        return true;
    }

    /**
     * Updates the frustum from the camera
     */

    updateFromCamera(camera) {
        // Calculate View-Projection matrix

        this.projScreenMatrix.multiplyMatrices(
            camera.projectionMatrix,
            camera.matrixWorldInverse
        );

        // Extract planes

        this.extractPlanesFromMatrix(this.projScreenMatrix);

        // Also update native Three.js frustum for comparison

        this.frustum.setFromProjectionMatrix(this.projScreenMatrix);
    }

    /**
     * Evaluates visibility of a list of objects
     * Functional approach - returns new list without mutating originals
     *
     * @param {Array} objects - List of objects with boundingSphere
     * @param {THREE.Camera} camera - Active camera
     * @returns {Array} - List of visible objects
     */

    evaluateVisibility(objects, camera) {
        this.updateFromCamera(camera);

        const visibleObjects = [];
        let culled = 0;

        objects.forEach(obj => {
            // Get center and radius of bounding sphere

            let center, radius;

            if (obj.boundingSphere) {
                center = obj.boundingSphere.center;
                radius = obj.boundingSphere.radius;
            } else if (obj.group) {
                // For artwork groups

                center = new THREE.Vector3();
                obj.group.getWorldPosition(center);
                radius = 2.0; // Approximate radius for artworks

            } else {
                // No sphere defined, assume visible

                visibleObjects.push(obj);
                return;
            }

            if (this.isSphereVisible(center, radius)) {
                visibleObjects.push(obj);
            } else {
                culled++;
            }
        });

        this.stats.totalObjects = objects.length;
        this.stats.visibleObjects = visibleObjects.length;
        this.stats.culledObjects = culled;

        return visibleObjects;
    }

    /**
     * Compares result with native Three.js frustum
     * Useful for validating mathematical implementation
     */

    compareWithNative(objects, camera) {
        this.updateFromCamera(camera);

        let manualVisible = 0;
        let nativeVisible = 0;
        let matches = 0;

        objects.forEach(obj => {
            const center = new THREE.Vector3();
            if (obj.group) {
                obj.group.getWorldPosition(center);
            } else {
                return;
            }

            const sphere = new THREE.Sphere(center, 2.0);

            const manualResult = this.isSphereVisible(center, 2.0);
            const nativeResult = this.frustum.intersectsSphere(sphere);

            if (manualResult) manualVisible++;
            if (nativeResult) nativeVisible++;
            if (manualResult === nativeResult) matches++;
        });

        console.log('Frustum Culling Comparison:');

        console.log(`  Manual: ${manualVisible} visibles`);
        console.log(`  Nativo (Three.js): ${nativeVisible} visibles`);
        console.log(`  Coincidencias: ${matches}/${objects.length} (${(matches / objects.length * 100).toFixed(1)}%)`);

        return {
            manual: manualVisible,
            native: nativeVisible,
            accuracy: matches / objects.length
        };
    }

    /**
     * Get statistics
     */

    getStats() {
        return { ...this.stats };
    }
}

/**
 * USAGE EXAMPLE:
 *
 * const frustumCulling = new FrustumCulling();
 *
 * function animate() {
 *     // Only every few frames for efficiency
 *     if (frameCount % 5 === 0) {
 *         const visibleArtworks = frustumCulling.evaluateVisibility(
 *             gallery.artworks,
 *             camera
 *         );
 *
 *         // Render only visible ones
 *         visibleArtworks.forEach(artwork => {
 *             artwork.group.visible = true;
 *         });
 *     }
 *
 *     renderer.render(scene, camera);
 * }
 *
 * NOTE: Three.js does this AUTOMATICALLY in renderer.render()
 * using object.frustumCulled = true (default)
 */

