import * as THREE from 'three';
import CONFIG from '../../config.js';

export class Lighting {
    constructor(scene) {
        this.scene = scene;
        this.spotlights = [];
        this.fixtures = [];
    }

    setup() {
        console.log('💡 Initializing lighting system...');

        // Ambient Light (Reduced by 5% from 0.415 -> 0.394)
        const ambientLight = new THREE.AmbientLight(0x808080, 0.394);
        this.scene.add(ambientLight);

        // Ceiling Light Grid (Refined)
        this.createCeilingLightGrid();

        // Main Skylight (Environment Light - Reduced by 5% from 0.75 -> 0.71)
        this.createSkylight();

        // Fill Lights (Reduced)
        this.createFillLights();

        // Spotlights for Artworks (Reduced)
        this.createRealisticSpotlights();

        // Wall Sconces
        this.implementWallSconces();

        // Additional Ambient Details
        this.createAmbientLighting();
    }

    createCeilingLightGrid() {
        // Grid de luces puntuales en el techo para iluminación uniforme
        const gridSize = 4;
        const spacing = 6;
        const height = 4.6;
        const startX = -9;
        const startZ = -9;

        for (let x = 0; x < gridSize; x++) {
            for (let z = 0; z < gridSize; z++) {
                const posX = startX + (x * spacing);
                const posZ = startZ + (z * spacing);

                // Luz puntual principal con tono cálido (Reduced intensity 7.12 -> 5.7 - 20% reduction)
                const ceilingLight = new THREE.PointLight(0xffd9a0, 5.7, 15, 2.0);
                ceilingLight.position.set(posX, height, posZ);
                ceilingLight.castShadow = false;
                this.scene.add(ceilingLight);

                // Fixture visual pequeño
                const fixtureGeometry = new THREE.CylinderGeometry(0.12, 0.15, 0.08, 12);
                const fixtureMaterial = new THREE.MeshPhysicalMaterial({
                    color: 0x2a2a2a,
                    roughness: 0.3,
                    metalness: 0.8,
                    emissive: 0xffd9a0,
                    emissiveIntensity: 0.08
                });
                const fixture = new THREE.Mesh(fixtureGeometry, fixtureMaterial);
                fixture.position.set(posX, height + 0.2, posZ);
                fixture.castShadow = false;
                this.scene.add(fixture);

                // Pequeño difusor
                const diffuserGeometry = new THREE.CircleGeometry(0.18, 16);
                const diffuserMaterial = new THREE.MeshPhysicalMaterial({
                    color: 0xffffff,
                    roughness: 0.9,
                    metalness: 0.0,
                    emissive: 0xffd9a0,
                    emissiveIntensity: 0.25,
                    transparent: true,
                    opacity: 0.9,
                    side: THREE.DoubleSide
                });
                const diffuser = new THREE.Mesh(diffuserGeometry, diffuserMaterial);
                diffuser.position.set(posX, height + 0.15, posZ);
                diffuser.rotation.x = -Math.PI / 2;
                this.scene.add(diffuser);
            }
        }
    }

    createSkylight() {
        // Luz principal del tragaluz con tono cálido (Reduced intensity 0.75 -> 0.71)
        const mainSkylight = new THREE.DirectionalLight(0xffd9a0, 0.71);
        mainSkylight.position.set(2, 20, 3);
        mainSkylight.target.position.set(0, 0, 0);
        mainSkylight.castShadow = true;

        // Shadow configuration
        mainSkylight.shadow.mapSize.width = 2048;
        mainSkylight.shadow.mapSize.height = 2048;
        mainSkylight.shadow.camera.near = 1;
        mainSkylight.shadow.camera.far = 50;
        mainSkylight.shadow.camera.left = -25;
        mainSkylight.shadow.camera.right = 25;
        mainSkylight.shadow.camera.top = 25;
        mainSkylight.shadow.camera.bottom = -25;
        mainSkylight.shadow.bias = -0.0001;
        mainSkylight.shadow.radius = 8;

        this.scene.add(mainSkylight);
        this.scene.add(mainSkylight.target);
    }

    createFillLights() {
        // Reduced intensities (0.29 -> 0.27, 0.25 -> 0.24)
        const fills = [
            { color: 0xffd9a0, intensity: 0.27, pos: [-15, 12, 8] },
            { color: 0xffe4b5, intensity: 0.27, pos: [15, 8, -8] },
            { color: 0xffefd5, intensity: 0.24, pos: [0, 15, 10] }
        ];

        fills.forEach(fill => {
            const light = new THREE.DirectionalLight(fill.color, fill.intensity);
            light.position.set(...fill.pos);
            this.scene.add(light);
        });
    }

    createRealisticSpotlights() {
        const UNIFIED_COLOR = 0xffffff;
        // Reduced intensity (29 -> 27.5)
        const UNIFIED_INTENSITY = 27.5;
        const UNIFIED_DISTANCE = 22;
        const UNIFIED_ANGLE = Math.PI / 6;
        const UNIFIED_PENUMBRA = 0.7;
        const UNIFIED_DECAY = 1.0;

        const spotLightConfigs = [
            // Pared frontal
            { pos: [-10, 4.4, -12], target: [-10, 2.2, -13.7], castShadow: false },
            { pos: [-5, 4.4, -12], target: [-5, 2.2, -13.7], castShadow: false },
            { pos: [0, 4.4, -12], target: [0, 2.3, -13.7], castShadow: false },
            { pos: [5, 4.4, -12], target: [5, 2.2, -13.7], castShadow: false },
            { pos: [10, 4.4, -12], target: [10, 2.2, -13.7], castShadow: false },
            // Pared izquierda
            { pos: [-12, 4.4, -7.5], target: [-13.7, 2.2, -7.5], castShadow: false },
            { pos: [-12, 4.4, -2.5], target: [-13.7, 2.2, -2.5], castShadow: false },
            { pos: [-12, 4.4, 2.5], target: [-13.7, 2.2, 2.5], castShadow: false },
            { pos: [-12, 4.4, 7.5], target: [-13.7, 2.2, 7.5], castShadow: false },
            // Pared derecha
            { pos: [12, 4.4, -7.5], target: [13.7, 2.2, -7.5], castShadow: false },
            { pos: [12, 4.4, -2.5], target: [13.7, 2.2, -2.5], castShadow: false },
            { pos: [12, 4.4, 2.5], target: [13.7, 2.2, 2.5], castShadow: false },
            { pos: [12, 4.4, 7.5], target: [13.7, 2.2, 7.5], castShadow: false },
            // Pared trasera
            { pos: [-9, 4.4, 12], target: [-9, 2.2, 13.7], castShadow: false },
            { pos: [-4.5, 4.4, 12], target: [-4.5, 2.2, 13.7], castShadow: false },
            { pos: [0, 4.4, 12], target: [0, 2.3, 13.7], castShadow: true },
            { pos: [4.5, 4.4, 12], target: [4.5, 2.2, 13.7], castShadow: false },
            { pos: [9, 4.4, 12], target: [9, 2.2, 13.7], castShadow: false }
        ];

        spotLightConfigs.forEach(config => {
            const spotLight = new THREE.SpotLight(UNIFIED_COLOR, UNIFIED_INTENSITY, UNIFIED_DISTANCE, UNIFIED_ANGLE, UNIFIED_PENUMBRA, UNIFIED_DECAY);
            spotLight.position.set(...config.pos);
            spotLight.target.position.set(...config.target);
            spotLight.castShadow = config.castShadow;

            if (config.castShadow) {
                spotLight.shadow.mapSize.width = 512;
                spotLight.shadow.mapSize.height = 512;
                spotLight.shadow.bias = -0.00015;
                spotLight.shadow.radius = 4;
            }

            this.scene.add(spotLight);
            this.scene.add(spotLight.target);
            this.spotlights.push(spotLight);

            this.createSpotlightFixture(config.pos);
        });
    }

    createSpotlightFixture(position) {
        const fixtureGroup = new THREE.Group();

        // Base del foco
        const baseGeometry = new THREE.CylinderGeometry(0.18, 0.18, 0.12, 16);
        const baseMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x222222,
            roughness: 0.2,
            metalness: 0.9,
            envMapIntensity: 1.0
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.set(0, -0.06, 0);
        base.castShadow = true;
        fixtureGroup.add(base);

        // Cono del foco
        const coneGeometry = new THREE.ConeGeometry(0.15, 0.35, 16);
        const coneMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x333333,
            roughness: 0.1,
            metalness: 0.95,
            envMapIntensity: 1.2
        });
        const cone = new THREE.Mesh(coneGeometry, coneMaterial);
        cone.position.set(0, -0.3, 0);
        cone.rotation.x = Math.PI;
        cone.castShadow = true;
        fixtureGroup.add(cone);

        // Reflector interior
        const reflectorGeometry = new THREE.ConeGeometry(0.12, 0.25, 16);
        const reflectorMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            roughness: 0.05,
            metalness: 0.95,
            envMapIntensity: 1.5
        });
        const reflector = new THREE.Mesh(reflectorGeometry, reflectorMaterial);
        reflector.position.set(0, -0.25, 0);
        reflector.rotation.x = Math.PI;
        fixtureGroup.add(reflector);

        fixtureGroup.position.set(...position);
        this.scene.add(fixtureGroup);
        this.fixtures.push(fixtureGroup);
    }

    implementWallSconces() {
        const sconcePositions = [
            // Pared frontal
            [-7.5, 3.2, -13.8], [-2.5, 3.2, -13.8], [2.5, 3.2, -13.8], [7.5, 3.2, -13.8],
            // Pared izquierda
            [-13.8, 3.2, -5], [-13.8, 3.2, 0], [-13.8, 3.2, 5],
            // Pared derecha
            [13.8, 3.2, -5], [13.8, 3.2, 0], [13.8, 3.2, 5],
            // Pared trasera
            [-6.75, 3.2, 13.8], [-2.25, 3.2, 13.8], [2.25, 3.2, 13.8], [6.75, 3.2, 13.8]
        ];

        sconcePositions.forEach(pos => {
            this.createWallSconce(pos);

            // Luz del aplique apuntando HACIA ABAJO (Reduced 12 -> 11.4)
            const sconceLight = new THREE.SpotLight(0xffd9a0, 11.4, 7, Math.PI / 3, 0.7, 1.1);
            sconceLight.position.set(...pos);
            sconceLight.target.position.set(pos[0], pos[1] - 2, pos[2]);
            sconceLight.castShadow = false;
            this.scene.add(sconceLight);
            this.scene.add(sconceLight.target);
        });
    }

    createWallSconce(position) {
        const sconceGroup = new THREE.Group();

        // Base del aplique
        const baseGeometry = new THREE.CylinderGeometry(0.08, 0.1, 0.15, 12);
        const baseMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x444444,
            roughness: 0.3,
            metalness: 0.8,
            envMapIntensity: 0.8
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.set(0, 0, 0.05);
        base.castShadow = true;
        sconceGroup.add(base);

        // Pantalla del aplique
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

    createAmbientLighting() {
        // Iluminación de suelo indirecta - reducida para ambiente nocturno
        const floorLights = [
            { pos: [0, 0.1, 0], color: 0xffd9a0, intensity: 9.5 }, // 10 -> 9.5
            { pos: [-7, 0.1, -7], color: 0xffd9a0, intensity: 6.65 }, // 7 -> 6.65
            { pos: [7, 0.1, -7], color: 0xffd9a0, intensity: 6.65 },
            { pos: [-7, 0.1, 7], color: 0xffd9a0, intensity: 6.65 },
            { pos: [7, 0.1, 7], color: 0xffd9a0, intensity: 6.65 }
        ];

        floorLights.forEach(light => {
            const scaledIntensity = light.intensity >= 8 ? 1.2 : 1.0;
            const floorLight = new THREE.PointLight(light.color, scaledIntensity, 6.5, 2.4);
            floorLight.position.set(...light.pos);
            this.scene.add(floorLight);
        });
    }
}
