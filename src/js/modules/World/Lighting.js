import * as THREE from 'three';
import CONFIG from '../../config.js';

/**
 * Builds the museum lighting system.
 *
 * The scene uses a small number of real lights for performance and relies on
 * emissive fixture materials where the visual object does not need to affect
 * illumination. Artwork spotlights and wall sconces are intentionally kept
 * shadowless to avoid multiplying shadow-map work.
 */
export class Lighting {
    /**
     * @param {THREE.Scene} scene - Scene that receives light objects and fixtures.
     */
    constructor(scene) {
        this.scene = scene;
        this.spotlights = [];
        this.fixtures = [];
    }

    /**
     * Adds ambient, skylight, fill, artwork, and sconce lighting.
     *
     * @param {Array<Object>} [artworksData=[]] - Artwork metadata used to aim spotlights.
     */
    setup(artworksData = []) {
        /** Ambient light establishes the base room visibility. */

        const ambientLight = new THREE.AmbientLight(0x9a8d7d, 0.26);
        this.scene.add(ambientLight);

        /** Ceiling fixtures use emissive materials instead of point lights. */

        this.createCeilingLightGrid();

        /** Main skylight. */

        this.createSkylight();

        /** Fill lights. */

        this.createFillLights();

        /** Artwork spotlights. */

        this.createRealisticSpotlights(artworksData);

        /** Wall sconces. */

        this.implementWallSconces();
    }

    /**
     * Creates ceiling fixtures without real point lights.
     *
     * The removed point lights were the most expensive part of the previous
     * lighting setup; emissive diffusers preserve the visual cue without adding
     * per-light shading cost.
     */
    createCeilingLightGrid() {
        const positions = [
            [-6, 4.6, -6],
            [6, 4.6, -6],
            [-6, 4.6, 6],
            [6, 4.6, 6]
        ];

        positions.forEach(([posX, height, posZ]) => {
            /** Simple fixture with strong emissive material. */

            const fixtureGeometry = new THREE.CylinderGeometry(0.15, 0.18, 0.1, 8);
            const fixtureMaterial = new THREE.MeshStandardMaterial({
                color: 0x2a2a2a,
                roughness: 0.3,
                metalness: 0.8,
                emissive: 0xffd9a0,
                emissiveIntensity: 0.4
            });
            const fixture = new THREE.Mesh(fixtureGeometry, fixtureMaterial);
            fixture.position.set(posX, height + 0.2, posZ);
            fixture.castShadow = false;
            fixture.receiveShadow = false;
            this.scene.add(fixture);

            /** Bright diffuser. */

            const diffuserGeometry = new THREE.CircleGeometry(0.22, 12);
            const diffuserMaterial = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                emissive: 0xffd9a0,
                emissiveIntensity: 1.0,
                side: THREE.DoubleSide
            });
            const diffuser = new THREE.Mesh(diffuserGeometry, diffuserMaterial);
            diffuser.position.set(posX, height + 0.15, posZ);
            diffuser.rotation.x = -Math.PI / 2;
            diffuser.castShadow = false;
            diffuser.receiveShadow = false;
            this.scene.add(diffuser);
        });
    }

    /**
     * Adds the primary directional light that simulates skylight.
     */
    createSkylight() {
        /** Main directional light with shadows. */

        const mainSkylight = new THREE.DirectionalLight(0xffd9a0, 0.62);
        mainSkylight.position.set(2, 20, 3);
        mainSkylight.target.position.set(0, 0, 0);
        mainSkylight.castShadow = true;

        /** Shadow configuration uses a moderate map size for performance. */

        mainSkylight.shadow.mapSize.width = 1024;
        mainSkylight.shadow.mapSize.height = 1024;
        mainSkylight.shadow.camera.near = 1;
        mainSkylight.shadow.camera.far = 50;
        mainSkylight.shadow.camera.left = -20;
        mainSkylight.shadow.camera.right = 20;
        mainSkylight.shadow.camera.top = 20;
        mainSkylight.shadow.camera.bottom = -20;
        mainSkylight.shadow.bias = -0.0001;
        mainSkylight.shadow.radius = 6;

        this.scene.add(mainSkylight);
        this.scene.add(mainSkylight.target);
    }

    /**
     * Adds low-intensity directional fills for softer room contrast.
     */
    createFillLights() {
        const fills = [
            { color: 0xffd9a0, intensity: 0.16, pos: [-15, 12, 8] },
            { color: 0xffe4b5, intensity: 0.15, pos: [15, 8, -8] },
            { color: 0xffefd5, intensity: 0.12, pos: [0, 15, 10] }
        ];

        fills.forEach(fill => {
            const light = new THREE.DirectionalLight(fill.color, fill.intensity);
            light.position.set(...fill.pos);
            this.scene.add(light);
        });
    }

    /**
     * Creates a shadowless spotlight and fixture for each artwork.
     *
     * @param {Array<Object>} [artworksData=[]] - Artwork records with position and rotation.
     */
    createRealisticSpotlights(artworksData = []) {
        const UNIFIED_COLOR = 0xffffff;
        const UNIFIED_INTENSITY = 22;
        const UNIFIED_DISTANCE = 22;
        const UNIFIED_ANGLE = Math.PI / 6;
        const UNIFIED_PENUMBRA = 0.7;
        const UNIFIED_DECAY = 1.0;
        const spotLightConfigs = this.createArtworkSpotlightConfigs(artworksData);

        spotLightConfigs.forEach(config => {
            const spotLight = new THREE.SpotLight(UNIFIED_COLOR, UNIFIED_INTENSITY, UNIFIED_DISTANCE, UNIFIED_ANGLE, UNIFIED_PENUMBRA, UNIFIED_DECAY);
            spotLight.position.set(...config.pos);
            spotLight.target.position.set(...config.target);
            spotLight.castShadow = false; /** Artwork lights skip shadows to keep GPU cost stable. */


            this.scene.add(spotLight);
            this.scene.add(spotLight.target);
            this.spotlights.push(spotLight);

            this.createSpotlightFixture(config.pos);
        });
    }

    /**
     * Computes spotlight positions from artwork wall normals.
     *
     * @param {Array<Object>} artworksData - Artwork records.
     * @returns {Array<{pos: number[], target: number[]}>} Spotlight positions and targets.
     */
    createArtworkSpotlightConfigs(artworksData) {
        if (!Array.isArray(artworksData) || artworksData.length === 0) {
            return [];
        }

        return artworksData.map((artwork) => {
            const target = artwork.position || [0, 2.2, 0];
            const rotationY = Array.isArray(artwork.rotation) ? artwork.rotation[1] : 0;
            const normal = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), rotationY);
            const lightPosition = new THREE.Vector3(target[0], 4.4, target[2]).addScaledVector(normal, 1.7);

            return {
                pos: [lightPosition.x, lightPosition.y, lightPosition.z],
                target: [target[0], target[1], target[2]]
            };
        });
    }

    /**
     * Adds the visible fixture mesh for an artwork spotlight.
     *
     * @param {number[]} position - [x, y, z] fixture position.
     */
    createSpotlightFixture(position) {
        const fixtureGroup = new THREE.Group();

        /** Spotlight base. */

        const baseGeometry = new THREE.CylinderGeometry(0.18, 0.18, 0.12, 12);
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: 0x222222,
            roughness: 0.2,
            metalness: 0.9
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.set(0, -0.06, 0);
        base.castShadow = false;
        fixtureGroup.add(base);

        /** Spotlight cone. */

        const coneGeometry = new THREE.ConeGeometry(0.15, 0.35, 12);
        const coneMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.1,
            metalness: 0.95
        });
        const cone = new THREE.Mesh(coneGeometry, coneMaterial);
        cone.position.set(0, -0.3, 0);
        cone.rotation.x = Math.PI;
        cone.castShadow = false;
        fixtureGroup.add(cone);

        /** Inner reflector with emissive material. */

        const reflectorGeometry = new THREE.ConeGeometry(0.12, 0.25, 12);
        const reflectorMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0xffffcc,
            emissiveIntensity: 0.4,
            roughness: 0.05,
            metalness: 0.95
        });
        const reflector = new THREE.Mesh(reflectorGeometry, reflectorMaterial);
        reflector.position.set(0, -0.25, 0);
        reflector.rotation.x = Math.PI;
        fixtureGroup.add(reflector);

        fixtureGroup.position.set(...position);
        this.scene.add(fixtureGroup);
        this.fixtures.push(fixtureGroup);
    }

    /**
     * Adds wall sconces and their small shadowless spotlights.
     */
    implementWallSconces() {
        const sconcePositions = [
            /** Front wall. */

            [-7.5, 3.2, -13.8], [-2.5, 3.2, -13.8], [2.5, 3.2, -13.8], [7.5, 3.2, -13.8],
            /** Left wall. */

            [-13.8, 3.2, -5], [-13.8, 3.2, 0], [-13.8, 3.2, 5],
            /** Right wall. */

            [13.8, 3.2, -5], [13.8, 3.2, 0], [13.8, 3.2, 5],
            /** Back wall. */

            [-6.75, 3.2, 13.8], [-2.25, 3.2, 13.8], [2.25, 3.2, 13.8], [6.75, 3.2, 13.8]
        ];

        sconcePositions.forEach(pos => {
            this.createWallSconce(pos);

            /** Sconce light. */

            const sconceLight = new THREE.SpotLight(0xffd9a0, 4.5, 5.8, Math.PI / 3, 0.75, 1.2);
            sconceLight.position.set(...pos);
            sconceLight.target.position.set(pos[0], pos[1] - 2, pos[2]);
            sconceLight.castShadow = false;
            this.scene.add(sconceLight);
            this.scene.add(sconceLight.target);
        });
    }

    /**
     * Adds one visible wall sconce mesh.
     *
     * @param {number[]} position - [x, y, z] sconce position.
     */
    createWallSconce(position) {
        const sconceGroup = new THREE.Group();

        /** Sconce base. */

        const baseGeometry = new THREE.CylinderGeometry(0.08, 0.1, 0.15, 12);
        const baseMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x444444,
            roughness: 0.3,
            metalness: 0.8,
            envMapIntensity: 0.8
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.set(0, 0, 0.05);
        base.castShadow = false;
        sconceGroup.add(base);

        /** Sconce shade with glass-like transmission. */

        const shadeGeometry = new THREE.SphereGeometry(0.12, 16, 16);
        const shadeMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            roughness: 0.18,
            metalness: 0.0,
            transparent: true,
            opacity: 0.85,
            emissive: 0xfff5e6,
            emissiveIntensity: 0.08,
            transmission: 0.65
        });

        const shade = new THREE.Mesh(shadeGeometry, shadeMaterial);
        shade.position.set(0, 0, 0.1);
        sconceGroup.add(shade);

        sconceGroup.position.set(...position);
        this.scene.add(sconceGroup);
    }
}
