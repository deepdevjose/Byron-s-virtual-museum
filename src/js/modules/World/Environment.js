import * as THREE from 'three';
import CONFIG from '../../config.js';

/**
 * Constructs the static museum environment.
 *
 * Environment owns the architectural shell, procedural texture generation,
 * ceiling details, skylight glass, chandelier, pillars, and baseboards. Most
 * meshes are static and can safely rely on the app's manual shadow refresh.
 */
export class Environment {
    /**
     * @param {THREE.Scene} scene - Scene that receives environment geometry.
     * @param {THREE.WebGLRenderer} renderer - Renderer used for texture capability queries.
     */
    constructor(scene, renderer) {
        this.scene = scene;
        this.renderer = renderer;
        this.walls = [];
    }

    /**
     * Builds the sky/environment backdrop and the gallery architecture.
     */
    setup() {
        this.loadEnvironmentMap();
        this.createRealisticGallery();
    }

    /**
     * Adds a large inward-facing gradient sphere around the museum.
     *
     * The PMREM generator is prepared for environment lighting compatibility,
     * although this module currently uses a shader sky instead of an HDR map.
     */
    loadEnvironmentMap() {
        const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
        pmremGenerator.compileEquirectangularShader();

        /** Create a realistic sky gradient. */

        const skyGeometry = new THREE.SphereGeometry(100, 32, 32);
        const skyMaterial = new THREE.ShaderMaterial({
            uniforms: {
                topColor: { value: new THREE.Color(0x87CEEB) },
                bottomColor: { value: new THREE.Color(0xffffff) },
                offset: { value: 10 },
                exponent: { value: 0.6 }
            },
            vertexShader: `
                varying vec3 vWorldPosition;
                void main() {
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 topColor;
                uniform vec3 bottomColor;
                uniform float offset;
                uniform float exponent;
                varying vec3 vWorldPosition;
                void main() {
                    float h = normalize(vWorldPosition + offset).y;
                    gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
                }
            `,
            side: THREE.BackSide
        });

        const sky = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(sky);
    }

    /**
     * Creates the main floor, perimeter walls, ceiling, and architectural trim.
     */
    createRealisticGallery() {
        this.walls = [];

        /** Floor surface. */

        const floorTexture = this.createCuratedFloorTexture();
        const floorMaterial = new THREE.MeshStandardMaterial({
            map: floorTexture,
            color: 0x8f887d,
            roughness: 0.72,
            metalness: 0.05
        });

        const floorGeometry = new THREE.PlaneGeometry(120, 120, 100, 100);
        const vertices = floorGeometry.attributes.position.array;
        for (let i = 2; i < vertices.length; i += 3) {
            vertices[i] += (Math.random() - 0.5) * 0.008;
        }
        floorGeometry.attributes.position.needsUpdate = true;
        floorGeometry.computeVertexNormals();

        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);

        /** Perimeter walls. */

        const wallTextures = this.createWallTextures();
        const wallHeight = 4.8;
        const wallThickness = 0.25;

        /** Back wall. */

        const backWallGeometry = new THREE.BoxGeometry(28, wallHeight, wallThickness, 8, 8, 1);
        const backWallMaterial = new THREE.MeshPhysicalMaterial({
            map: wallTextures.marble,
            color: 0xb8b2a6,
            roughness: 0.82,
            metalness: 0.0,
            reflectivity: 0.12,
            envMapIntensity: 0.18,
            clearcoat: 0.08,
            clearcoatRoughness: 0.6
        });
        const backWall = new THREE.Mesh(backWallGeometry, backWallMaterial);
        backWall.position.set(0, wallHeight / 2, -14);
        backWall.receiveShadow = true;
        backWall.castShadow = true;
        this.scene.add(backWall);
        this.walls.push(backWall);

        /** Front wall. */

        const frontWallGeometry = new THREE.BoxGeometry(28, wallHeight, wallThickness, 8, 8, 1);
        const frontWallMaterial = new THREE.MeshPhysicalMaterial({
            map: wallTextures.stone,
            color: 0xb5afa3,
            roughness: 0.86,
            metalness: 0.0,
            reflectivity: 0.08,
            envMapIntensity: 0.16
        });
        const frontWall = new THREE.Mesh(frontWallGeometry, frontWallMaterial);
        frontWall.position.set(0, wallHeight / 2, 14);
        frontWall.receiveShadow = true;
        frontWall.castShadow = true;
        this.scene.add(frontWall);
        this.walls.push(frontWall);

        /** Side walls. */

        const sideWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, 28, 1, 8, 8);
        const sideWallMaterial = new THREE.MeshPhysicalMaterial({
            map: wallTextures.concrete,
            color: 0xc3bcae,
            roughness: 0.88,
            metalness: 0.0,
            reflectivity: 0.08,
            envMapIntensity: 0.14
        });

        /** Left wall. */

        const leftWall = new THREE.Mesh(sideWallGeometry, sideWallMaterial);
        leftWall.position.set(-14, wallHeight / 2, 0);
        leftWall.receiveShadow = true;
        leftWall.castShadow = true;
        this.scene.add(leftWall);
        this.walls.push(leftWall);

        /** Right wall. */

        const rightWall = new THREE.Mesh(sideWallGeometry, sideWallMaterial);
        rightWall.position.set(14, wallHeight / 2, 0);
        rightWall.receiveShadow = true;
        rightWall.castShadow = true;
        this.scene.add(rightWall);
        this.walls.push(rightWall);

        this.createCompleteCeiling(wallTextures);
        this.createArchitecturalDetails(wallTextures);
    }

    /**
     * Creates the closed ceiling and suspended decorative details.
     *
     * @param {Object} wallTextures - Procedural wall texture set.
     */
    createCompleteCeiling(wallTextures) {
        /** Use plaster texture for ceiling if available. */

        const ceilingMaterial = new THREE.MeshPhysicalMaterial({
            map: wallTextures ? wallTextures.plaster : null,
            normalMap: wallTextures ? wallTextures.plasterNormal : null,
            color: 0xd8d1c4,
            roughness: 0.9,
            metalness: 0.0,
            envMapIntensity: 0.12
        });

        if (ceilingMaterial.map) {
            ceilingMaterial.map.repeat.set(8, 8);
            ceilingMaterial.map.wrapS = THREE.RepeatWrapping;
            ceilingMaterial.map.wrapT = THREE.RepeatWrapping;
        }

        /** Main ceiling slab with no physical opening. */

        const mainCeilingGeometry = new THREE.BoxGeometry(28, 0.2, 28);
        const mainCeiling = new THREE.Mesh(mainCeilingGeometry, ceilingMaterial);
        mainCeiling.position.set(0, 4.9, 0);
        mainCeiling.receiveShadow = true;
        mainCeiling.castShadow = true;
        this.scene.add(mainCeiling);

        this.createSkylight();
        this.createCenterChandelier();
        this.createCeilingBeams(wallTextures);
    }

    /**
     * Adds the decorative skylight frame and transparent glass plane.
     */
    createSkylight() {
        /** Raised skylight frame. */

        const frameThickness = 0.15;
        const skylightSize = 8;
        const elevation = 0.3; /** Elevation above the ceiling. */


        const frameMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x666666,
            roughness: 0.2,
            metalness: 0.9,
            envMapIntensity: 1.0
        });

        /** Raised outer frame. */

        const frameGeometry = new THREE.BoxGeometry(skylightSize + frameThickness * 2, frameThickness, skylightSize + frameThickness * 2);
        const frame = new THREE.Mesh(frameGeometry, frameMaterial);
        frame.position.set(0, 5.0 + elevation, 0);
        frame.castShadow = false; /** Decorative metal does not need to update shadow maps. */

        this.scene.add(frame);

        /** Skylight walls add visual depth above the ceiling plane. */

        const wallHeight = elevation;
        const skylightWalls = [
            { size: [frameThickness, wallHeight, skylightSize + frameThickness * 2], pos: [-(skylightSize / 2 + frameThickness), 5.0 + wallHeight / 2, 0] },
            { size: [frameThickness, wallHeight, skylightSize + frameThickness * 2], pos: [skylightSize / 2 + frameThickness, 5.0 + wallHeight / 2, 0] },
            { size: [skylightSize, wallHeight, frameThickness], pos: [0, 5.0 + wallHeight / 2, -(skylightSize / 2 + frameThickness)] },
            { size: [skylightSize, wallHeight, frameThickness], pos: [0, 5.0 + wallHeight / 2, skylightSize / 2 + frameThickness] }
        ];

        skylightWalls.forEach(wall => {
            const wallGeometry = new THREE.BoxGeometry(...wall.size);
            const wallMesh = new THREE.Mesh(wallGeometry, frameMaterial);
            wallMesh.position.set(...wall.pos);
            wallMesh.castShadow = false; /** Decorative depth walls skip shadow casting. */

            wallMesh.receiveShadow = true;
            this.scene.add(wallMesh);
        });

        /** Skylight glass with physical transparency settings. */

        const glassGeometry = new THREE.PlaneGeometry(skylightSize, skylightSize);
        const glassMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.05,
            roughness: 0.0,
            metalness: 0.0,
            transmission: 0.98,
            envMapIntensity: 1.0,
            clearcoat: 1.0,
            clearcoatRoughness: 0.0
        });

        const glass = new THREE.Mesh(glassGeometry, glassMaterial);
        glass.position.set(0, 5.0 + elevation + frameThickness / 2, 0);
        glass.rotation.x = -Math.PI / 2;
        this.scene.add(glass);
    }

    /**
     * Adds ceiling beams with repeated procedural material.
     *
     * @param {Object} wallTextures - Procedural wall texture set.
     */
    createCeilingBeams(wallTextures) {
        /** Wood-look beams using a darkened concrete texture. */

        const beamMaterial = new THREE.MeshPhysicalMaterial({
            map: wallTextures ? wallTextures.concrete : null,
            normalMap: wallTextures ? wallTextures.concreteNormal : null,
            color: 0x5c4033, /** Dark wood-brown tint. */

            roughness: 0.8,
            metalness: 0.0,
            envMapIntensity: 0.2
        });

        /** Ensure texture repeats well on thin beams. */

        if (beamMaterial.map) {
            beamMaterial.map.repeat.set(4, 1);
            beamMaterial.map.wrapS = THREE.RepeatWrapping;
            beamMaterial.map.wrapT = THREE.RepeatWrapping;
        }
        if (beamMaterial.normalMap) {
            beamMaterial.normalMap.repeat.set(4, 1);
            beamMaterial.normalMap.wrapS = THREE.RepeatWrapping;
            beamMaterial.normalMap.wrapT = THREE.RepeatWrapping;
        }

        /** Thin beam dimensions sized to sit close to the ceiling. */

        const beamW = 0.15;

        const beamH = 0.25;

        const beamL = 28;


        /** Main longitudinal beams. */

        const mainBeamPositions = [
            { size: [beamW, beamH, beamL], pos: [-4, 4.9 - beamH / 2, 0] },

            { size: [beamW, beamH, beamL], pos: [4, 4.9 - beamH / 2, 0] },
            { size: [beamW, beamH, beamL], pos: [-8, 4.9 - beamH / 2, 0] },
            { size: [beamW, beamH, beamL], pos: [8, 4.9 - beamH / 2, 0] },
            { size: [beamW, beamH, beamL], pos: [-12, 4.9 - beamH / 2, 0] },
            { size: [beamW, beamH, beamL], pos: [12, 4.9 - beamH / 2, 0] }
        ];

        mainBeamPositions.forEach(beam => {
            const beamMesh = new THREE.Mesh(new THREE.BoxGeometry(...beam.size), beamMaterial);
            beamMesh.position.set(...beam.pos);
            beamMesh.castShadow = true;
            beamMesh.receiveShadow = true;
            this.scene.add(beamMesh);
        });

        /** Cross beams complete the ceiling grid. */

        const crossBeamPositions = [
            { size: [beamL, beamH, beamW], pos: [0, 4.9 - beamH / 2, -4] },
            { size: [beamL, beamH, beamW], pos: [0, 4.9 - beamH / 2, 4] },
            { size: [beamL, beamH, beamW], pos: [0, 4.9 - beamH / 2, -8] },
            { size: [beamL, beamH, beamW], pos: [0, 4.9 - beamH / 2, 8] },
            { size: [beamL, beamH, beamW], pos: [0, 4.9 - beamH / 2, -12] },
            { size: [beamL, beamH, beamW], pos: [0, 4.9 - beamH / 2, 12] }
        ];

        crossBeamPositions.forEach(beam => {
            /** Beams intentionally cross the decorative skylight for the current design. */

            const beamMesh = new THREE.Mesh(new THREE.BoxGeometry(...beam.size), beamMaterial);
            beamMesh.position.set(...beam.pos);
            beamMesh.castShadow = true;
            beamMesh.receiveShadow = true;
            this.scene.add(beamMesh);
        });
    }

    /**
     * Adds the central chandelier and one low-cost point light.
     */
    createCenterChandelier() {
        const chandelierGroup = new THREE.Group();

        /** Shared chandelier materials. */

        const metalMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x1a1a1a,
            roughness: 0.2,
            metalness: 0.95,
            envMapIntensity: 1.2
        });

        const goldMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xd4af37,
            roughness: 0.15,
            metalness: 0.9,
            envMapIntensity: 1.0
        });

        const glassMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.3,
            roughness: 0.0,
            metalness: 0.0,
            transmission: 0.9,
            envMapIntensity: 1.2,
            emissive: 0xfff8dc,
            emissiveIntensity: 0.4
        });

        /** Central support chain/tube. */

        const chainGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.8, 8);
        const chain = new THREE.Mesh(chainGeometry, metalMaterial);
        chain.position.y = 4.5;
        chandelierGroup.add(chain);

        /** Upper base (ceiling rosette). */

        const rosetteGeometry = new THREE.CylinderGeometry(0.15, 0.12, 0.08, 16);
        const rosette = new THREE.Mesh(rosetteGeometry, goldMaterial);
        rosette.position.y = 4.9;
        chandelierGroup.add(rosette);

        /** Main lamp body (circular crown). */

        const crownGeometry = new THREE.TorusGeometry(0.6, 0.08, 8, 24);
        const crown = new THREE.Mesh(crownGeometry, goldMaterial);
        crown.position.y = 4.1;
        crown.rotation.x = Math.PI / 2;
        chandelierGroup.add(crown);

        /** Decorative arms. */

        const numArms = 6;
        for (let i = 0; i < numArms; i++) {
            const angle = (i / numArms) * Math.PI * 2;

            /** Curved arm. */

            const armGeometry = new THREE.CylinderGeometry(0.025, 0.02, 0.4, 8);
            const arm = new THREE.Mesh(armGeometry, goldMaterial);

            const armRadius = 0.5;
            arm.position.x = Math.cos(angle) * armRadius;
            arm.position.z = Math.sin(angle) * armRadius;
            arm.position.y = 4.1;
            arm.rotation.z = Math.PI / 6; /** Slight upward tilt. */

            arm.rotation.y = angle;
            chandelierGroup.add(arm);

            /** Lamp/bulb in each arm. */

            const bulbGeometry = new THREE.SphereGeometry(0.08, 12, 12);
            const bulb = new THREE.Mesh(bulbGeometry, glassMaterial);
            bulb.position.x = Math.cos(angle) * (armRadius + 0.15);
            bulb.position.z = Math.sin(angle) * (armRadius + 0.15);
            bulb.position.y = 3.95;
            chandelierGroup.add(bulb);

            /** Emissive bulb only; point lights here are expensive and visually noisy. */
        }

        /** Lower central lamp. */

        const centerBulbGeometry = new THREE.SphereGeometry(0.12, 16, 16);
        const centerBulb = new THREE.Mesh(centerBulbGeometry, glassMaterial);
        centerBulb.position.y = 3.85;
        chandelierGroup.add(centerBulb);

        /** Main central light. */

        const centerLight = new THREE.PointLight(0xfff8dc, 2.4, 4.5, 2);
        centerLight.position.y = 3.85;
        chandelierGroup.add(centerLight);

        /** Decorative hanging crystals. */

        const numCrystals = 12;
        for (let i = 0; i < numCrystals; i++) {
            const angle = (i / numCrystals) * Math.PI * 2;
            const radius = 0.45 + (i % 2) * 0.15;

            const crystalGeometry = new THREE.ConeGeometry(0.03, 0.15, 6);
            const crystal = new THREE.Mesh(crystalGeometry, glassMaterial);
            crystal.position.x = Math.cos(angle) * radius;
            crystal.position.z = Math.sin(angle) * radius;
            crystal.position.y = 3.8 - (i % 3) * 0.1;
            crystal.rotation.x = Math.PI;
            chandelierGroup.add(crystal);
        }

        /** Position chandelier in the center of the ceiling. */

        chandelierGroup.position.set(0, 0, 0);
        this.scene.add(chandelierGroup);
    }

    /**
     * Adds pillars and baseboards after the main room shell is created.
     *
     * @param {Object} wallTextures - Procedural wall texture set.
     */
    createArchitecturalDetails(wallTextures) {
        this.createDecorativePillars(wallTextures);
        this.createBaseboards(wallTextures);
    }

    /**
     * Adds marble-textured corner pillars.
     *
     * @param {Object} wallTextures - Procedural wall texture set.
     */
    createDecorativePillars(wallTextures) {
        /** Corner pillars. */

        const pillarGeo = new THREE.CylinderGeometry(0.4, 0.4, 4.8, 32);
        const pillarMaterial = new THREE.MeshPhysicalMaterial({
            map: wallTextures ? wallTextures.marble : null,
            color: 0xb9b1a3,
            roughness: 0.58,
            metalness: 0.02,
            envMapIntensity: 0.18
        });
        const positions = [
            [-13.5, 2.4, -13.5], [13.5, 2.4, -13.5],
            [-13.5, 2.4, 13.5], [13.5, 2.4, 13.5]
        ];
        positions.forEach(pos => {
            const pillar = new THREE.Mesh(pillarGeo, pillarMaterial);
            pillar.position.set(...pos);
            pillar.castShadow = true;
            pillar.receiveShadow = true;
            this.scene.add(pillar);
        });
    }

    /**
     * Adds low trim along the gallery walls.
     *
     * @param {Object} wallTextures - Procedural wall texture set.
     */
    createBaseboards(wallTextures) {
        const baseboardMaterial = new THREE.MeshPhysicalMaterial({
            map: wallTextures ? wallTextures.marble : null,
            color: 0x51483d,

            roughness: 0.52,
            metalness: 0.1,
            envMapIntensity: 0.24
        });

        const wallThickness = 0.5;
        const wallHeight = 0.4; /** Low baseboard height. */

        /** Simple baseboards along the walls. */

        const baseboards = [
            /** Back wall trim. */

            { size: [28, wallHeight, 0.1], pos: [0, wallHeight / 2, -13.95] },
            /** Front wall trim. */

            { size: [28, wallHeight, 0.1], pos: [0, wallHeight / 2, 13.95] },
            /** Left wall trim. */

            { size: [0.1, wallHeight, 28], pos: [-13.95, wallHeight / 2, 0] },
            /** Right wall trim. */

            { size: [0.1, wallHeight, 28], pos: [13.95, wallHeight / 2, 0] }
        ];

        baseboards.forEach(board => {
            const mesh = new THREE.Mesh(new THREE.BoxGeometry(...board.size), baseboardMaterial);
            mesh.position.set(...board.pos);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            this.scene.add(mesh);
        });
    }

    /** --- Texture generation functions. --- */

    /**
     * Creates the main floor texture procedurally.
     *
     * @returns {THREE.CanvasTexture} Repeating floor texture.
     */
    createCuratedFloorTexture() {
        const size = 1024;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = size;
        canvas.height = size;

        const base = ctx.createLinearGradient(0, 0, size, size);
        base.addColorStop(0, '#8f887d');
        base.addColorStop(0.5, '#9a9285');
        base.addColorStop(1, '#817a70');
        ctx.fillStyle = base;
        ctx.fillRect(0, 0, size, size);

        ctx.globalAlpha = 0.18;
        for (let i = 0; i < 2200; i++) {
            const value = 125 + Math.random() * 35;
            ctx.fillStyle = `rgb(${value}, ${value - 4}, ${value - 12})`;
            ctx.fillRect(Math.random() * size, Math.random() * size, 1, 1);
        }

        ctx.globalAlpha = 0.16;
        ctx.strokeStyle = '#6f685f';
        ctx.lineWidth = 2;
        const tile = size / 4;
        for (let i = 1; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(i * tile, 0);
            ctx.lineTo(i * tile, size);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, i * tile);
            ctx.lineTo(size, i * tile);
            ctx.stroke();
        }

        ctx.globalAlpha = 0.08;
        ctx.strokeStyle = '#e1d7c7';
        ctx.lineWidth = 1;
        for (let i = 0; i < 18; i++) {
            const y = Math.random() * size;
            ctx.beginPath();
            ctx.moveTo(Math.random() * size * 0.2, y);
            ctx.bezierCurveTo(
                Math.random() * size,
                y + (Math.random() - 0.5) * 80,
                Math.random() * size,
                y + (Math.random() - 0.5) * 140,
                size,
                y + (Math.random() - 0.5) * 120
            );
            ctx.stroke();
        }

        ctx.globalAlpha = 1;
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(6, 6);
        texture.encoding = THREE.sRGBEncoding;
        texture.anisotropy = Math.min(4, this.renderer.capabilities.getMaxAnisotropy());
        texture.needsUpdate = true;
        return texture;
    }


    /**
     * Creates high-resolution diffuse and normal textures for polished marble.
     *
     * @returns {{diffuse: THREE.CanvasTexture, normal: THREE.CanvasTexture}} Texture pair.
     */
    createLuxuryMarbleTexture() {
        const size = 2048; /** High resolution for large surfaces. */


        /** Create diffuse texture with layered procedural noise. */

        const generateLuxuryMarbleDiffuse = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = size;
            canvas.height = size;

            /** Base with subtle color variation using simulated Perlin-style noise. */

            const imageData = ctx.createImageData(size, size);
            const data = imageData.data;

            /** Simplified noise function for natural variations. */

            function noise(x, y, scale = 0.01) {
                return (Math.sin(x * scale) + Math.cos(y * scale) + Math.sin((x + y) * scale * 0.5)) / 3;
            }

            /** Create a base with very subtle color variation. */

            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    const i = (y * size + x) * 4;
                    const baseVariation = noise(x, y, 0.008) * 15;
                    const baseColor = 248 + baseVariation;

                    data[i] = Math.min(255, Math.max(240, baseColor));     // R
                    data[i + 1] = Math.min(255, Math.max(240, baseColor)); // G
                    data[i + 2] = Math.min(255, Math.max(245, baseColor + 2)); // B
                    data[i + 3] = 255; // A
                }
            }

            ctx.putImageData(imageData, 0, 0);

            /** Draw layered organic veins. */

            function drawAdvancedVein(startX, startY, color, opacity, thickness, complexity = 8, turbulence = 1) {
                ctx.globalCompositeOperation = 'multiply';
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';

                /** Use multiple layers for a more realistic vein. */

                for (let layer = 0; layer < 3; layer++) {
                    ctx.strokeStyle = color;
                    ctx.globalAlpha = opacity * (0.4 + layer * 0.2);
                    ctx.lineWidth = thickness * (1 - layer * 0.3);

                    ctx.beginPath();
                    ctx.moveTo(startX, startY);

                    let currentX = startX;
                    let currentY = startY;
                    let direction = Math.random() * Math.PI * 2;

                    for (let i = 0; i < complexity; i++) {
                        /** Let vein direction drift naturally over each segment. */

                        direction += (Math.random() - 0.5) * 0.8 * turbulence;
                        const distance = (Math.random() * 120 + 80) * (1 - i / complexity * 0.3);

                        const nextX = currentX + Math.cos(direction) * distance;
                        const nextY = currentY + Math.sin(direction) * distance;

                        /** Use Bezier control points for natural curves. */

                        const cp1X = currentX + Math.cos(direction - 0.5) * distance * 0.3;
                        const cp1Y = currentY + Math.sin(direction - 0.5) * distance * 0.3;
                        const cp2X = nextX - Math.cos(direction + 0.5) * distance * 0.3;
                        const cp2Y = nextY - Math.sin(direction + 0.5) * distance * 0.3;

                        ctx.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, nextX, nextY);

                        /** Add occasional branches. */

                        if (Math.random() < 0.3 && i > 2) {
                            const branchLength = distance * 0.6;
                            const branchAngle = direction + (Math.random() - 0.5) * Math.PI * 0.8;
                            const branchX = currentX + Math.cos(branchAngle) * branchLength;
                            const branchY = currentY + Math.sin(branchAngle) * branchLength;

                            ctx.moveTo(currentX, currentY);
                            ctx.lineTo(branchX, branchY);
                            ctx.moveTo(nextX, nextY);
                        }

                        currentX = nextX;
                        currentY = nextY;
                    }

                    ctx.stroke();
                }

                ctx.globalAlpha = 1.0;
            }

            /** Primary black/gray veins. */

            for (let i = 0; i < 8; i++) {
                const x = Math.random() * size;
                const y = Math.random() * size;
                const grayValue = Math.random() * 40 + 20; /** Very dark grays for contrast. */

                const blueTint = Math.random() * 10; /** Slight natural blue tint. */

                drawAdvancedVein(x, y, `rgb(${grayValue}, ${grayValue}, ${grayValue + blueTint})`, 0.7 + Math.random() * 0.2, Math.random() * 20 + 12, 8 + Math.random() * 4, 1.2);
            }

            /** Secondary transition veins. */

            for (let i = 0; i < 15; i++) {
                const x = Math.random() * size;
                const y = Math.random() * size;
                const grayValue = Math.random() * 60 + 70; /** Medium grays. */

                drawAdvancedVein(x, y, `rgb(${grayValue}, ${grayValue}, ${grayValue + 5})`, 0.4 + Math.random() * 0.3, Math.random() * 12 + 6, 5 + Math.random() * 3, 0.8);
            }

            /** Fine detail veins. */

            for (let i = 0; i < 25; i++) {
                const x = Math.random() * size;
                const y = Math.random() * size;
                const grayValue = Math.random() * 40 + 120; /** Light grays. */

                drawAdvancedVein(x, y, `rgb(${grayValue}, ${grayValue}, ${grayValue})`, 0.2 + Math.random() * 0.2, Math.random() * 6 + 2, 3 + Math.random() * 2, 0.5);
            }

            /** Golden accent veins for a polished-marble look. */

            for (let i = 0; i < 6; i++) {
                const x = Math.random() * size;
                const y = Math.random() * size;
                const goldR = Math.random() * 40 + 180;
                const goldG = Math.random() * 30 + 150;
                const goldB = Math.random() * 20 + 80;
                drawAdvancedVein(x, y, `rgb(${goldR}, ${goldG}, ${goldB})`, 0.35 + Math.random() * 0.15, Math.random() * 8 + 3, 4 + Math.random() * 2, 0.7);
            }

            /** Subtle spots and variations. */

            ctx.globalCompositeOperation = 'overlay';
            for (let i = 0; i < 30; i++) {
                const x = Math.random() * size;
                const y = Math.random() * size;
                const radius = Math.random() * 80 + 20;

                const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
                const variation = Math.random() * 20 + 235;
                gradient.addColorStop(0, `rgba(${variation}, ${variation}, ${variation}, 0.3)`);
                gradient.addColorStop(1, `rgba(${variation}, ${variation}, ${variation}, 0)`);

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();
            }

            /** Crystallizations and highlights for a polished effect. */

            ctx.globalCompositeOperation = 'screen';
            for (let i = 0; i < 15; i++) {
                const x = Math.random() * size;
                const y = Math.random() * size;
                const radius = Math.random() * 30 + 5;

                const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
                gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
                gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();
            }

            const texture = new THREE.CanvasTexture(canvas);

            texture.generateMipmaps = true;
            texture.minFilter = THREE.LinearMipmapLinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(4, 4);
            texture.encoding = THREE.sRGBEncoding;
            texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
            texture.needsUpdate = true;
            return texture;
        };

        /** Create normal map for marble. */

        const generateLuxuryMarbleNormal = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = size;
            canvas.height = size;

            /** Normal-map base color. */

            ctx.fillStyle = '#8080ff';
            ctx.fillRect(0, 0, size, size);

            /** Relief for main veins. */

            function drawNormalVein(startX, startY, intensity, thickness, complexity = 6) {
                ctx.globalCompositeOperation = 'normal';
                ctx.strokeStyle = `rgba(${100 + intensity}, ${100 + intensity}, 255, 0.6)`;
                ctx.lineWidth = thickness;
                ctx.lineCap = 'round';

                ctx.beginPath();
                ctx.moveTo(startX, startY);

                let currentX = startX;
                let currentY = startY;

                for (let i = 0; i < complexity; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const distance = Math.random() * 150 + 40;
                    const nextX = currentX + Math.cos(angle) * distance;
                    const nextY = currentY + Math.sin(angle) * distance;

                    ctx.quadraticCurveTo(
                        currentX + (Math.random() - 0.5) * 80,
                        currentY + (Math.random() - 0.5) * 80,
                        nextX, nextY
                    );

                    currentX = nextX;
                    currentY = nextY;
                }

                ctx.stroke();
            }

            /** Normal-map vein passes. */

            for (let i = 0; i < 15; i++) {
                const x = Math.random() * size;
                const y = Math.random() * size;
                const intensity = Math.random() * 30 + 20;
                drawNormalVein(x, y, intensity, Math.random() * 12 + 6, 5 + Math.random() * 4);
            }

            /** Subtle variations for the polished surface. */

            for (let i = 0; i < 100; i++) {
                const x = Math.random() * size;
                const y = Math.random() * size;
                const radius = Math.random() * 20 + 5;

                const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
                gradient.addColorStop(0, `rgba(${125 + Math.random() * 10}, ${125 + Math.random() * 10}, 255, 0.3)`);
                gradient.addColorStop(1, 'rgba(128, 128, 255, 0)');

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();
            }

            const texture = new THREE.CanvasTexture(canvas);
            texture.generateMipmaps = true;
            texture.minFilter = THREE.LinearMipmapLinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(4, 4);
            texture.encoding = THREE.LinearEncoding; // Normal maps use linear encoding.
            return texture;
        };

        return {
            diffuse: generateLuxuryMarbleDiffuse(),
            normal: generateLuxuryMarbleNormal()
        };
    }

    /**
     * Creates all procedural wall texture variants used by the gallery shell.
     *
     * @returns {Object} Named diffuse and normal textures for wall materials.
     */
    createWallTextures() {
        const textures = {};

        /** Helper function to create a texture with a normal map. */

        const createTextureWithNormal = (diffuseGenerator, normalGenerator, size = 512) => {
            const diffuseTexture = diffuseGenerator(size);
            const normalTexture = normalGenerator(size);

            return {
                diffuse: diffuseTexture, // Three.js uses `map` and `normalMap`.
                normal: normalTexture,
                map: diffuseTexture,
                normalMap: normalTexture
            };
        };

        /** 1. Wall marble texture. */

        const generateMarbleTexture = (size) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = size;
            canvas.height = size;

            /** Marble base with natural variation using noise. */

            const imageData = ctx.createImageData(size, size);
            const data = imageData.data;

            /** Create realistic base variation. */

            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    const i = (y * size + x) * 4;

                    /** Multiple noise frequencies create natural variation. */

                    const noise1 = Math.sin(x * 0.01) * Math.cos(y * 0.01);
                    const noise2 = Math.sin(x * 0.005 + y * 0.008) * 0.5;
                    const noise3 = (Math.random() - 0.5) * 0.1;

                    const variation = (noise1 + noise2 + noise3) * 12;
                    const baseColor = 245 + variation;

                    data[i] = Math.min(255, Math.max(230, baseColor));     // R
                    data[i + 1] = Math.min(255, Math.max(230, baseColor)); // G
                    data[i + 2] = Math.min(255, Math.max(235, baseColor + 3)); // B
                    data[i + 3] = 255; // A
                }
            }

            ctx.putImageData(imageData, 0, 0);

            /** Marble veins. */

            ctx.globalCompositeOperation = 'multiply';
            for (let i = 0; i < 15; i++) {
                ctx.strokeStyle = `rgba(200, 200, 200, ${0.3 + Math.random() * 0.4})`;
                ctx.lineWidth = Math.random() * 8 + 2;
                ctx.beginPath();
                ctx.moveTo(Math.random() * size, Math.random() * size);

                for (let j = 0; j < 5; j++) {
                    const x = Math.random() * size;
                    const y = Math.random() * size;
                    ctx.quadraticCurveTo(
                        Math.random() * size, Math.random() * size,
                        x, y
                    );
                }
                ctx.stroke();
            }

            // Fine veins.
            ctx.globalCompositeOperation = 'darken';
            for (let i = 0; i < 20; i++) {
                ctx.strokeStyle = `rgba(180, 180, 180, ${0.2 + Math.random() * 0.3})`;
                ctx.lineWidth = Math.random() * 3 + 1;
                ctx.beginPath();
                ctx.moveTo(Math.random() * size, Math.random() * size);
                ctx.lineTo(Math.random() * size, Math.random() * size);
                ctx.stroke();
            }

            return new THREE.CanvasTexture(canvas);
        };

        const generateMarbleNormal = (size) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = size;
            canvas.height = size;

            // Blue normal-map base.
            ctx.fillStyle = '#8080ff';
            ctx.fillRect(0, 0, size, size);

            // Subtle variations.
            for (let i = 0; i < 30; i++) {
                const x = Math.random() * size;
                const y = Math.random() * size;
                const radius = Math.random() * 20 + 5;

                const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
                gradient.addColorStop(0, `rgba(${120 + Math.random() * 20}, ${120 + Math.random() * 20}, 255, 0.3)`);
                gradient.addColorStop(1, 'rgba(128, 128, 255, 0)');

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();
            }

            return new THREE.CanvasTexture(canvas);
        };

        // 2. Natural stone texture.
        const generateStoneTexture = (size) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = size;
            canvas.height = size;

            // Stone base with multiple layers of noise.
            const imageData = ctx.createImageData(size, size);
            const data = imageData.data;

            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    const i = (y * size + x) * 4;

                    // Multiple noise frequencies create a natural texture.
                    const noise1 = Math.sin(x * 0.02) * Math.cos(y * 0.02) * 20;
                    const noise2 = Math.sin(x * 0.05 + y * 0.03) * 15;
                    const noise3 = Math.sin(x * 0.1 + y * 0.15) * 8;
                    const noise4 = (Math.random() - 0.5) * 25;

                    const totalNoise = noise1 + noise2 + noise3 + noise4;

                    // Natural stone base colors.
                    const baseR = 240 + totalNoise * 0.3;
                    const baseG = 238 + totalNoise * 0.35;
                    const baseB = 220 + totalNoise * 0.4;

                    data[i] = Math.min(255, Math.max(200, baseR));     // R
                    data[i + 1] = Math.min(255, Math.max(200, baseG)); // G
                    data[i + 2] = Math.min(255, Math.max(180, baseB)); // B
                    data[i + 3] = 255; // A
                }
            }

            ctx.putImageData(imageData, 0, 0);

            // Cracks and fissures.
            ctx.globalCompositeOperation = 'multiply';
            for (let i = 0; i < 8; i++) {
                ctx.strokeStyle = `rgba(200, 200, 200, ${0.4 + Math.random() * 0.3})`;
                ctx.lineWidth = Math.random() * 2 + 1;
                ctx.beginPath();
                ctx.moveTo(Math.random() * size, Math.random() * size);

                const segments = 3 + Math.random() * 5;
                for (let j = 0; j < segments; j++) {
                    ctx.lineTo(
                        Math.random() * size,
                        Math.random() * size
                    );
                }
                ctx.stroke();
            }

            return new THREE.CanvasTexture(canvas);
        };

        const generateStoneNormal = (size) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = size;
            canvas.height = size;

            ctx.fillStyle = '#8080ff';
            ctx.fillRect(0, 0, size, size);

            // Stone relief.
            for (let i = 0; i < 100; i++) {
                const x = Math.random() * size;
                const y = Math.random() * size;
                const radius = Math.random() * 15 + 3;

                ctx.fillStyle = `rgba(${100 + Math.random() * 40}, ${100 + Math.random() * 40}, 255, 0.4)`;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();
            }

            return new THREE.CanvasTexture(canvas);
        };

        // 3. Modern concrete texture.
        const generateConcreteTexture = (size) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = size;
            canvas.height = size;

            // Concrete base with layered surface variation.
            const imageData = ctx.createImageData(size, size);
            const data = imageData.data;

            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    const i = (y * size + x) * 4;

                    // Simulate aggregate variation in the concrete.
                    const aggregate1 = Math.sin(x * 0.03) * Math.cos(y * 0.025) * 12;
                    const aggregate2 = Math.sin(x * 0.08 + y * 0.06) * 8;
                    const fine_texture = Math.sin(x * 0.2 + y * 0.18) * 4;
                    const randomness = (Math.random() - 0.5) * 20;

                    const totalVariation = aggregate1 + aggregate2 + fine_texture + randomness;

                    // Modern concrete base color.
                    const baseColor = 235 + totalVariation * 0.4;

                    data[i] = Math.min(255, Math.max(210, baseColor));     // R
                    data[i + 1] = Math.min(255, Math.max(210, baseColor)); // G
                    data[i + 2] = Math.min(255, Math.max(210, baseColor)); // B
                    data[i + 3] = 255; // A
                }
            }

            ctx.putImageData(imageData, 0, 0);

            // Mold lines for poured concrete.
            ctx.globalCompositeOperation = 'overlay';
            const lineSpacing = size / 3;
            for (let i = 1; i < 3; i++) {
                // Primary line.
                ctx.strokeStyle = 'rgba(200, 200, 200, 0.8)';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(0, i * lineSpacing);
                ctx.lineTo(size, i * lineSpacing);
                ctx.stroke();

                // Line shadow.
                ctx.strokeStyle = 'rgba(180, 180, 180, 0.4)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(0, i * lineSpacing + 2);
                ctx.lineTo(size, i * lineSpacing + 2);
                ctx.stroke();
            }

            // Moisture stains and subtle surface variation.
            ctx.globalCompositeOperation = 'multiply';
            for (let i = 0; i < 8; i++) {
                const x = Math.random() * size;
                const y = Math.random() * size;
                const radius = Math.random() * 60 + 20;

                const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
                gradient.addColorStop(0, 'rgba(220, 220, 220, 0.7)');
                gradient.addColorStop(0.7, 'rgba(230, 230, 230, 0.3)');
                gradient.addColorStop(1, 'rgba(240, 240, 240, 0)');

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();
            }

            return new THREE.CanvasTexture(canvas);
        };

        const generateConcreteNormal = (size) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = size;
            canvas.height = size;

            ctx.fillStyle = '#8080ff';
            ctx.fillRect(0, 0, size, size);

            // Concrete relief.
            for (let i = 0; i < 150; i++) {
                const x = Math.random() * size;
                const y = Math.random() * size;
                const radius = Math.random() * 8 + 2;

                ctx.fillStyle = `rgba(${120 + Math.random() * 20}, ${120 + Math.random() * 20}, 255, 0.3)`;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();
            }

            // Mold lines in the normal map.
            for (let i = 1; i < 4; i++) {
                const y = (i / 4) * size;
                ctx.strokeStyle = 'rgba(140, 140, 255, 0.6)';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(size, y);
                ctx.stroke();
            }

            return new THREE.CanvasTexture(canvas);
        };

        // 4. Hand-applied plaster texture.
        const generatePlasterTexture = (size) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = size;
            canvas.height = size;

            // Plaster base with natural variation.
            const imageData = ctx.createImageData(size, size);
            const data = imageData.data;

            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    const i = (y * size + x) * 4;

                    // Simulate hand-applied plaster texture.
                    const brush1 = Math.sin(x * 0.015 + y * 0.008) * 8;
                    const brush2 = Math.sin(x * 0.03 + y * 0.025) * 5;
                    const trowel = Math.sin(x * 0.007 + y * 0.012) * 12;
                    const fine_detail = (Math.random() - 0.5) * 6;

                    const texture_variation = brush1 + brush2 + trowel + fine_detail;

                    // Natural plaster base color.
                    const baseR = 252 + texture_variation * 0.3;
                    const baseG = 250 + texture_variation * 0.35;
                    const baseB = 246 + texture_variation * 0.4;

                    data[i] = Math.min(255, Math.max(240, baseR));     // R
                    data[i + 1] = Math.min(255, Math.max(240, baseG)); // G
                    data[i + 2] = Math.min(255, Math.max(235, baseB)); // B
                    data[i + 3] = 255; // A
                }
            }

            ctx.putImageData(imageData, 0, 0);

            // Tool marks.
            ctx.globalCompositeOperation = 'overlay';
            for (let i = 0; i < 40; i++) {
                const x = Math.random() * size;
                const y = Math.random() * size;
                const length = Math.random() * 80 + 30;
                const width = Math.random() * 12 + 4;
                const angle = Math.random() * Math.PI;

                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(angle);

                // Primary tool mark.
                const gradient = ctx.createLinearGradient(-length / 2, -width / 2, length / 2, width / 2);
                gradient.addColorStop(0, 'rgba(248, 248, 246, 0)');
                gradient.addColorStop(0.5, 'rgba(250, 248, 245, 0.6)');
                gradient.addColorStop(1, 'rgba(248, 248, 246, 0)');

                ctx.fillStyle = gradient;
                ctx.fillRect(-length / 2, -width / 2, length, width);

                ctx.restore();
            }

            // Subtle color variation from drying.
            ctx.globalCompositeOperation = 'soft-light';
            for (let i = 0; i < 15; i++) {
                const x = Math.random() * size;
                const y = Math.random() * size;
                const radius = Math.random() * 50 + 25;

                const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
                gradient.addColorStop(0, 'rgba(254, 252, 250, 0.3)');
                gradient.addColorStop(0.7, 'rgba(251, 249, 247, 0.2)');
                gradient.addColorStop(1, 'rgba(252, 250, 248, 0)');

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();
            }

            return new THREE.CanvasTexture(canvas);
        };

        const generatePlasterNormal = (size) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = size;
            canvas.height = size;

            ctx.fillStyle = '#8080ff';
            ctx.fillRect(0, 0, size, size);

            // Soft plaster relief.
            for (let i = 0; i < 60; i++) {
                const x = Math.random() * size;
                const y = Math.random() * size;
                const radius = Math.random() * 25 + 8;

                const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
                gradient.addColorStop(0, `rgba(${125 + Math.random() * 10}, ${125 + Math.random() * 10}, 255, 0.2)`);
                gradient.addColorStop(1, 'rgba(128, 128, 255, 0)');

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();
            }

            return new THREE.CanvasTexture(canvas);
        };

        // Generate every texture variant used by wall materials.
        const anisotropicLevel = this.renderer.capabilities.getMaxAnisotropy();

        const configureTexture = (texture) => {
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            // Floor marble used 6x6 repeat in backup vs 4x4 in other places, 
            // but Environment.js createLuxuryMarbleTexture() had 4x4 internal.
            // Let's stick to consistent wrapping if possible, or respect what the generator did.
            // The generator sets repeat, so we only need to ensure anisotropy.
            texture.anisotropy = anisotropicLevel;
            texture.needsUpdate = true;
            return texture;
        };

        textures.marble = configureTexture(generateMarbleTexture(1024));
        textures.marbleNormal = configureTexture(generateMarbleNormal(1024));

        textures.stone = configureTexture(generateStoneTexture(1024));
        textures.stoneNormal = configureTexture(generateStoneNormal(1024));

        textures.concrete = configureTexture(generateConcreteTexture(1024));
        textures.concreteNormal = configureTexture(generateConcreteNormal(1024));

        textures.plaster = configureTexture(generatePlasterTexture(1024));
        textures.plasterNormal = configureTexture(generatePlasterNormal(1024));

        return textures;
    }
}
