import * as THREE from 'three';

/**
 * Manual frustum culling utility for diagnostics and experiments.
 *
 * Three.js already implements frustum culling automatically.
 * Use this class only when a feature needs explicit visibility control
 * or when validating custom culling math against Three.js.
 *
 * The implementation extracts six frustum planes from the view-projection
 * matrix and tests bounding spheres or boxes against those planes.
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
    /**
     * Creates reusable planes, matrices, and statistics containers.
     */
    constructor() {
        // The six planes of the camera frustum.
        this.planes = {
            left: new THREE.Plane(),
            right: new THREE.Plane(),
            top: new THREE.Plane(),
            bottom: new THREE.Plane(),
            near: new THREE.Plane(),
            far: new THREE.Plane()
        };

        // Native Three.js frustum used for comparison checks.
        this.frustum = new THREE.Frustum();

        // Reused view-projection matrix.
        this.projScreenMatrix = new THREE.Matrix4();

        this.stats = {
            totalObjects: 0,
            visibleObjects: 0,
            culledObjects: 0
        };
    }

    /**
     * Extracts the six frustum planes from a view-projection matrix.
     *
     * @param {THREE.Matrix4} viewProjectionMatrix - Projection multiplied by view matrix.
     */
    extractPlanesFromMatrix(viewProjectionMatrix) {
        const m = viewProjectionMatrix.elements;

        // Left plane: row 4 + row 1.

        this.planes.left.set(
            new THREE.Vector3(m[3] + m[0], m[7] + m[4], m[11] + m[8]),
            m[15] + m[12]
        );
        this.planes.left.normalize();

        // Right plane: row 4 - row 1.

        this.planes.right.set(
            new THREE.Vector3(m[3] - m[0], m[7] - m[4], m[11] - m[8]),
            m[15] - m[12]
        );
        this.planes.right.normalize();

        // Bottom plane: row 4 + row 2.

        this.planes.bottom.set(
            new THREE.Vector3(m[3] + m[1], m[7] + m[5], m[11] + m[9]),
            m[15] + m[13]
        );
        this.planes.bottom.normalize();

        // Top plane: row 4 - row 2.

        this.planes.top.set(
            new THREE.Vector3(m[3] - m[1], m[7] - m[5], m[11] - m[9]),
            m[15] - m[13]
        );
        this.planes.top.normalize();

        // Near plane: row 4 + row 3.

        this.planes.near.set(
            new THREE.Vector3(m[3] + m[2], m[7] + m[6], m[11] + m[10]),
            m[15] + m[14]
        );
        this.planes.near.normalize();

        // Far plane: row 4 - row 3.

        this.planes.far.set(
            new THREE.Vector3(m[3] - m[2], m[7] - m[6], m[11] - m[10]),
            m[15] - m[14]
        );
        this.planes.far.normalize();
    }

    /**
     * Tests whether a sphere is at least partially inside the frustum.
     *
     * @param {THREE.Vector3} center - Center of the sphere.
     * @param {number} radius - Radius of the sphere.
     * @returns {boolean} True when visible or intersecting the frustum.
     */
    isSphereVisible(center, radius) {
        // Test against each plane.
        for (const plane of Object.values(this.planes)) {
            // Signed distance from sphere center to plane.
            const distance = plane.distanceToPoint(center);

            // A sphere fully behind any plane is outside the frustum.
            if (distance < -radius) {
                return false;
            }
        }

        return true;
    }

    /**
     * Tests whether an axis-aligned bounding box is visible.
     *
     * @param {THREE.Box3} box - Axis-aligned box.
     * @returns {boolean} True when visible.
     */
    isBoxVisible(box) {
        for (const plane of Object.values(this.planes)) {
            // Pick the vertex most likely to be behind this plane.
            const p = new THREE.Vector3();
            p.x = plane.normal.x > 0 ? box.max.x : box.min.x;
            p.y = plane.normal.y > 0 ? box.max.y : box.min.y;
            p.z = plane.normal.z > 0 ? box.max.z : box.min.z;

            // If that vertex is behind the plane, the box is outside.
            if (plane.distanceToPoint(p) < 0) {
                return false;
            }
        }

        return true;
    }

    /**
     * Updates manual and native frustums from a camera.
     *
     * @param {THREE.Camera} camera - Camera to evaluate.
     */
    updateFromCamera(camera) {
        // Calculate view-projection matrix.
        this.projScreenMatrix.multiplyMatrices(
            camera.projectionMatrix,
            camera.matrixWorldInverse
        );

        this.extractPlanesFromMatrix(this.projScreenMatrix);

        // Also update native Three.js frustum for comparison.
        this.frustum.setFromProjectionMatrix(this.projScreenMatrix);
    }

    /**
     * Evaluates visibility for a list of gallery-like objects.
     *
     * This method returns a new list and does not mutate object visibility.
     *
     * @param {Array<Object>} objects - Objects with `boundingSphere` or `group`.
     * @param {THREE.Camera} camera - Active camera.
     * @returns {Array<Object>} Visible objects.
     */
    evaluateVisibility(objects, camera) {
        this.updateFromCamera(camera);

        const visibleObjects = [];
        let culled = 0;

        objects.forEach(obj => {
            let center, radius;

            if (obj.boundingSphere) {
                center = obj.boundingSphere.center;
                radius = obj.boundingSphere.radius;
            } else if (obj.group) {
                center = new THREE.Vector3();
                obj.group.getWorldPosition(center);
                radius = 2.0; // Approximate artwork display radius.

            } else {
                // If no bounds are available, keep the object visible.
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
     * Compares manual culling results with Three.js native frustum results.
     *
     * @param {Array<Object>} objects - Gallery-like objects with groups.
     * @param {THREE.Camera} camera - Active camera.
     * @returns {{manual: number, native: number, accuracy: number}} Comparison summary.
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
     * Gets the latest culling statistics.
     *
     * @returns {{totalObjects: number, visibleObjects: number, culledObjects: number}}
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
