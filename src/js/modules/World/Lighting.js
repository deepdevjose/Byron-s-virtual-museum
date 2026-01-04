import * as THREE from 'three';
import CONFIG from '../../config.js';

/**
 * OPTIMIZED LIGHTING SYSTEM
 * 
 * Performance optimization:
 * - Removed 16 PointLights from ceiling grid (biggest bottleneck)
 * - Kept wall spotlights and sconces for visual quality
 * - Using emissive materials for ceiling fixtures (fake lights)
 */

export class Lighting {
    constructor(scene) {
        this.scene = scene;
        this.spotlights = [];
        this.fixtures = [];
    }

    setup() {
        /** Ambient Light */

        const ambientLight = new THREE.AmbientLight(0x808080, 0.4);
        this.scene.add(ambientLight);

        /** OPTIMIZED: Ceiling fixtures with emissive only (no PointLights) */

        this.createCeilingLightGrid();

        /** Main Skylight */

        this.createSkylight();

        /** Fill Lights (kept for quality) */

        this.createFillLights();

        /** Spotlights for Artworks (RESTORED) */

        this.createRealisticSpotlights();

        /** Wall Sconces (RESTORED) */

        this.implementWallSconces();
    }

    createCeilingLightGrid() {
        /** OPTIMIZED: Minimal fixtures - NO PointLights, just 4 corner emissive fixtures
         * This was the main bottleneck (16 PointLights removed)
         */

        const positions = [
            [-6, 4.6, -6],
            [6, 4.6, -6],
            [-6, 4.6, 6],
            [6, 4.6, 6]
        ];

        positions.forEach(([posX, height, posZ]) => {
            /** Simple fixture with strong emissive */

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

            /** Bright diffuser */

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

    createSkylight() {
        /** Main directional light with shadows */

        const mainSkylight = new THREE.DirectionalLight(0xffd9a0, 0.75);
        mainSkylight.position.set(2, 20, 3);
        mainSkylight.target.position.set(0, 0, 0);
        mainSkylight.castShadow = true;

        /** Shadow configuration (optimized size) */

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

    createFillLights() {
        const fills = [
            { color: 0xffd9a0, intensity: 0.25, pos: [-15, 12, 8] },
            { color: 0xffe4b5, intensity: 0.25, pos: [15, 8, -8] },
            { color: 0xffefd5, intensity: 0.2, pos: [0, 15, 10] }
        ];

        fills.forEach(fill => {
            const light = new THREE.DirectionalLight(fill.color, fill.intensity);
            light.position.set(...fill.pos);
            this.scene.add(light);
        });
    }

    /** RESTORED: Original spotlights for artwork */

    createRealisticSpotlights() {
        const UNIFIED_COLOR = 0xffffff;
        const UNIFIED_INTENSITY = 28;
        const UNIFIED_DISTANCE = 22;
        const UNIFIED_ANGLE = Math.PI / 6;
        const UNIFIED_PENUMBRA = 0.7;
        const UNIFIED_DECAY = 1.0;

        const spotLightConfigs = [
            /** Front wall */

            { pos: [-10, 4.4, -12], target: [-10, 2.2, -13.7] },
            { pos: [-5, 4.4, -12], target: [-5, 2.2, -13.7] },
            { pos: [0, 4.4, -12], target: [0, 2.3, -13.7] },
            { pos: [5, 4.4, -12], target: [5, 2.2, -13.7] },
            { pos: [10, 4.4, -12], target: [10, 2.2, -13.7] },
            /** Left wall */

            { pos: [-12, 4.4, -7.5], target: [-13.7, 2.2, -7.5] },
            { pos: [-12, 4.4, -2.5], target: [-13.7, 2.2, -2.5] },
            { pos: [-12, 4.4, 2.5], target: [-13.7, 2.2, 2.5] },
            { pos: [-12, 4.4, 7.5], target: [-13.7, 2.2, 7.5] },
            /** Right wall */

            { pos: [12, 4.4, -7.5], target: [13.7, 2.2, -7.5] },
            { pos: [12, 4.4, -2.5], target: [13.7, 2.2, -2.5] },
            { pos: [12, 4.4, 2.5], target: [13.7, 2.2, 2.5] },
            { pos: [12, 4.4, 7.5], target: [13.7, 2.2, 7.5] },
            /** Back wall */

            { pos: [-9, 4.4, 12], target: [-9, 2.2, 13.7] },
            { pos: [-4.5, 4.4, 12], target: [-4.5, 2.2, 13.7] },
            { pos: [0, 4.4, 12], target: [0, 2.3, 13.7] },
            { pos: [4.5, 4.4, 12], target: [4.5, 2.2, 13.7] },
            { pos: [9, 4.4, 12], target: [9, 2.2, 13.7] }
        ];

        spotLightConfigs.forEach(config => {
            const spotLight = new THREE.SpotLight(UNIFIED_COLOR, UNIFIED_INTENSITY, UNIFIED_DISTANCE, UNIFIED_ANGLE, UNIFIED_PENUMBRA, UNIFIED_DECAY);
            spotLight.position.set(...config.pos);
            spotLight.target.position.set(...config.target);
            spotLight.castShadow = false; /** No shadows from artwork spots */


            this.scene.add(spotLight);
            this.scene.add(spotLight.target);
            this.spotlights.push(spotLight);

            this.createSpotlightFixture(config.pos);
        });
    }

    createSpotlightFixture(position) {
        const fixtureGroup = new THREE.Group();

        /** Spotlight base */

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

        /** Spotlight cone */

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

        /** Inner reflector with emissive */

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

    /** RESTORED: Wall sconces with lights */

    implementWallSconces() {
        const sconcePositions = [
            /** Front wall */

            [-7.5, 3.2, -13.8], [-2.5, 3.2, -13.8], [2.5, 3.2, -13.8], [7.5, 3.2, -13.8],
            /** Left wall */

            [-13.8, 3.2, -5], [-13.8, 3.2, 0], [-13.8, 3.2, 5],
            /** Right wall */

            [13.8, 3.2, -5], [13.8, 3.2, 0], [13.8, 3.2, 5],
            /** Back wall */

            [-6.75, 3.2, 13.8], [-2.25, 3.2, 13.8], [2.25, 3.2, 13.8], [6.75, 3.2, 13.8]
        ];

        sconcePositions.forEach(pos => {
            this.createWallSconce(pos);

            /** RESTORED: Sconce light */

            const sconceLight = new THREE.SpotLight(0xffd9a0, 11, 7, Math.PI / 3, 0.7, 1.1);
            sconceLight.position.set(...pos);
            sconceLight.target.position.set(pos[0], pos[1] - 2, pos[2]);
            sconceLight.castShadow = false;
            this.scene.add(sconceLight);
            this.scene.add(sconceLight.target);
        });
    }

    createWallSconce(position) {
        const sconceGroup = new THREE.Group();

        /** Sconce base */

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

        /** Sconce shade - ORIGINAL material with transmission (glass-like) */

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
