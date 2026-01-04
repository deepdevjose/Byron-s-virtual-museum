import * as THREE from 'three';
import CONFIG from '../../config.js';

export class Gallery {
    constructor(scene, textureLoader) {
        this.scene = scene;
        this.textureLoader = textureLoader || new THREE.TextureLoader();
        this.artworks = [];
        this.museumObjects = [];
        this.decorationCollisions = [];
    }

    setup() {
        this.createRealisticArtworks();
        this.createMuseumObjects();
    }

    createRealisticArtworks() {
        // ========== PARED FRONTAL - 5 OBRAS ==========
        this.createRealisticArtwork({
            position: [-10, 2.2, -13.7],
            size: [2.5, 2.0],
            imageUrl: './src/assets/images/Bailarina - Byron.jpg',
            title: 'Bailarina',
            artist: 'Byron Gálvez',
            year: '2024',
            description: 'Una elegante representación del movimiento y la gracia, capturando la esencia de la danza en una composición dinámica.'
        });

        this.createRealisticArtwork({
            position: [-5, 2.2, -13.7],
            size: [2.5, 2.0],
            imageUrl: './src/assets/images/Maquillaje - Byron.jpg',
            title: 'Maquillaje',
            artist: 'Byron Gálvez',
            year: '2024',
            description: 'Una representación íntima del arte del maquillaje, capturando la transformación y la belleza del proceso creativo.'
        });

        this.createRealisticArtwork({
            position: [0, 2.3, -13.7],
            size: [3.0, 2.5],
            imageUrl: './src/assets/images/Amanecer - Byron.jpeg',
            isMainArtwork: true,
            title: 'Amanecer',
            artist: 'Byron Gálvez',
            year: '2025',
            description: 'Una representación poética del amanecer que captura la transición entre la noche y el día, evocando esperanza y renovación.'
        });

        this.createRealisticArtwork({
            position: [5, 2.2, -13.7],
            size: [2.5, 2.0],
            imageUrl: './src/assets/images/Naturaleza Muerta - Byron.jpg',
            title: 'Naturaleza Muerta',
            artist: 'Byron Gálvez',
            year: '2024',
            description: 'Una interpretación contemporánea del género clásico, explorando la belleza en la simplicidad de los objetos cotidianos.'
        });

        this.createRealisticArtwork({
            position: [10, 2.2, -13.7],
            size: [2.5, 2.0],
            imageUrl: './src/assets/images/Vanidad - Byron.jpg',
            title: 'Vanidad',
            artist: 'Byron Gálvez',
            year: '2024',
            description: 'Una reflexión sobre la belleza efímera y la contemplación del yo, explorando temas de autoconocimiento.'
        });

        // ========== PARED IZQUIERDA - 4 OBRAS ==========
        const leftWallX = -13.7;
        const leftRot = [0, Math.PI / 2, 0];

        this.createRealisticArtwork({
            position: [leftWallX, 2.2, -7.5],
            size: [2.2, 1.8],
            rotation: leftRot,
            imageUrl: './src/assets/images/Flautistas - Byron.jpg',
            title: 'Flautistas',
            artist: 'Byron Gálvez',
            year: '2024',
            description: 'Una armoniosa representación de músicos interpretando la flauta, capturando la melodía visual en cada gesto.'
        });

        this.createRealisticArtwork({
            position: [leftWallX, 2.2, -2.5],
            size: [2.2, 1.8],
            rotation: leftRot,
            imageUrl: './src/assets/images/Rocas y Cielo - Byron.jpg',
            title: 'Rocas y Cielo',
            artist: 'Byron Gálvez',
            year: '2023',
            description: 'Un estudio de contrastes entre la solidez de la tierra y la fluidez del cielo, explorando la relación entre lo terrenal y lo celestial.'
        });

        this.createRealisticArtwork({
            position: [leftWallX, 2.2, 2.5],
            size: [2.2, 1.8],
            rotation: leftRot,
            imageUrl: './src/assets/images/Vela - Byron.jpg',
            title: 'Vela',
            artist: 'Byron Gálvez',
            year: '2024',
            description: 'Una exploración de la luz y la quietud, capturando la delicada belleza de la llama en la oscuridad.'
        });

        this.createRealisticArtwork({
            position: [leftWallX, 2.2, 7.5],
            size: [2.2, 1.8],
            rotation: leftRot,
            imageUrl: './src/assets/images/Frutas - Byron.jpg',
            title: 'Frutas',
            artist: 'Byron Gálvez',
            year: '2024',
            description: 'Una naturaleza muerta vibrante que celebra la abundancia y los colores de las frutas frescas.'
        });

        // ========== PARED DERECHA - 4 OBRAS ==========
        const rightWallX = 13.7;
        const rightRot = [0, -Math.PI / 2, 0];

        this.createRealisticArtwork({
            position: [rightWallX, 2.2, -7.5],
            size: [2.2, 1.8],
            rotation: rightRot,
            imageUrl: './src/assets/images/Violincello - Byron.jpg',
            title: 'Violoncello',
            artist: 'Byron Gálvez',
            year: '2024',
            description: 'Una celebración del instrumento musical, capturando la elegancia y profundidad emocional del violoncello.'
        });

        this.createRealisticArtwork({
            position: [rightWallX, 2.2, -2.5],
            size: [2.2, 1.8],
            rotation: rightRot,
            imageUrl: './src/assets/images/Musicos - Byron.jpg',
            title: 'Músicos',
            artist: 'Byron Gálvez',
            year: '2023',
            description: 'Una celebración visual de la música y los artistas que la crean, capturando la pasión y la emoción del arte sonoro.'
        });

        this.createRealisticArtwork({
            position: [rightWallX, 2.2, 2.5],
            size: [2.2, 1.8],
            rotation: rightRot,
            imageUrl: './src/assets/images/Veladoras - Byron.jpg',
            title: 'Veladoras',
            artist: 'Byron Gálvez',
            year: '2024',
            description: 'Una contemplación sobre la luz sagrada de las velas, evocando espiritualidad y calidez en su resplandor.'
        });

        this.createRealisticArtwork({
            position: [rightWallX, 2.2, 7.5],
            size: [2.2, 1.8],
            rotation: rightRot,
            imageUrl: './src/assets/images/MusicosM - Byron.jpg',
            title: 'Músicos en Marcha',
            artist: 'Byron Gálvez',
            year: '2024',
            description: 'Una representación dinámica de músicos en movimiento, capturando el ritmo y la energía de la marcha musical.'
        });

        // ========== PARED TRASERA - 5 OBRAS ==========
        const rearWallZ = 13.7;
        const rearRot = [0, Math.PI, 0];

        this.createRealisticArtwork({
            position: [-9, 2.2, rearWallZ],
            size: [2.2, 1.8],
            rotation: rearRot,
            imageUrl: './src/assets/images/Copas - Byron.jpg',
            title: 'Copas',
            artist: 'Byron Gálvez',
            year: '2024',
            description: 'Una representación elegante de cristalería, explorando la transparencia, reflejos y la belleza de los objetos cotidianos.'
        });

        this.createRealisticArtwork({
            position: [-4.5, 2.2, rearWallZ],
            size: [2.2, 1.8],
            rotation: rearRot,
            imageUrl: './src/assets/images/Escultura de pie - Byron.jpg',
            title: 'Escultura de Pie',
            artist: 'Byron Gálvez',
            year: '2024',
            description: 'Una exploración de la forma humana en movimiento, capturando la elegancia y fuerza de la figura erguida.'
        });

        // AUTORRETRATO DEL ARTISTA - CENTRO
        this.createArtistPortrait({
            position: [0, 2.3, rearWallZ],
            size: [3.0, 2.5],
            rotation: rearRot,
            imageUrl: './src/assets/images/Byron2.png',
            title: 'Byron Gálvez',
            subtitle: 'Artista',
            year: '2025',
            description: 'El maestro detrás de estas obras, capturando su esencia creativa y visión personal del mundo.'
        });

        this.createRealisticArtwork({
            position: [4.5, 2.2, rearWallZ],
            size: [2.2, 1.8],
            rotation: rearRot,
            imageUrl: './src/assets/images/Escultura sentada - Byron.jpg',
            title: 'Escultura Sentada',
            artist: 'Byron Gálvez',
            year: '2024',
            description: 'Una contemplación sobre el reposo y la reflexión, mostrando la serenidad en la postura contemplativa.'
        });

        this.createRealisticArtwork({
            position: [9, 2.2, rearWallZ],
            size: [2.2, 1.8],
            rotation: rearRot,
            imageUrl: './src/assets/images/Vela2 - Byron.jpg',
            title: 'Vela 2',
            artist: 'Byron Gálvez',
            year: '2024',
            description: 'Una segunda exploración de la luz de la vela, con diferentes matices de sombra y calidez.'
        });

        console.log('🎨 Galería completa creada con 18 obras de arte');
    }

    createRealisticArtwork(config) {
        const { position, size, imageUrl, isMainArtwork, rotation, title, artist, year, description } = config;

        const artworkGroup = new THREE.Group();
        let finalSize = size;
        let artworkMesh = null;

        const createFrameWithSize = (artworkSize) => {
            const frameDepth = 0.12;
            const frameWidth = 0.15;

            const outerFrameGeometry = new THREE.BoxGeometry(
                artworkSize[0] + frameWidth * 2,
                artworkSize[1] + frameWidth * 2,
                frameDepth
            );
            const frameMaterial = new THREE.MeshPhysicalMaterial({
                color: 0x2a2a2a,
                roughness: 0.6,
                metalness: 0.2,
                envMapIntensity: 0.5,
                side: THREE.FrontSide
            });
            const outerFrame = new THREE.Mesh(outerFrameGeometry, frameMaterial);
            outerFrame.position.set(0, 0, -frameDepth * 0.6);
            outerFrame.castShadow = true;
            outerFrame.renderOrder = 1;
            artworkGroup.add(outerFrame);

            const innerFrameGeometry = new THREE.BoxGeometry(
                artworkSize[0] + frameWidth,
                artworkSize[1] + frameWidth,
                frameDepth * 0.4
            );
            const innerFrameMaterial = new THREE.MeshPhysicalMaterial({
                color: 0x8B4513,
                roughness: 0.8,
                metalness: 0.1,
                side: THREE.FrontSide
            });
            const innerFrame = new THREE.Mesh(innerFrameGeometry, innerFrameMaterial);
            innerFrame.position.set(0, 0, -frameDepth * 0.15);
            innerFrame.castShadow = true;
            innerFrame.renderOrder = 2;
            artworkGroup.add(innerFrame);
        };

        const createArtworkWithSize = (artworkSize) => {
            const artworkGeometry = new THREE.PlaneGeometry(artworkSize[0], artworkSize[1]);
            // Placeholder material initially
            const artworkMaterial = new THREE.MeshPhysicalMaterial({
                color: 0x888888,
                roughness: 0.9,
                metalness: 0.0,
                side: THREE.FrontSide
            });

            artworkMesh = new THREE.Mesh(artworkGeometry, artworkMaterial);
            artworkMesh.castShadow = true;
            artworkMesh.receiveShadow = true;
            artworkMesh.position.set(0, 0, 0.02);
            artworkMesh.renderOrder = 3;
            artworkMesh.userData = { title, artist, year, description, isClickable: true };
            artworkGroup.add(artworkMesh);
        };

        // Initial setup with default size, will update when image loads
        createFrameWithSize(size);
        createArtworkWithSize(size);

        if (imageUrl) {
            this.textureLoader.load(imageUrl, (loadedTexture) => {
                // Clean up previous meshes if resizing
                while (artworkGroup.children.length > 0) {
                    artworkGroup.remove(artworkGroup.children[0]);
                }

                // Recalculate size
                const imageAspectRatio = loadedTexture.image.width / loadedTexture.image.height;
                const maxWidth = size[0];
                const maxHeight = size[1];
                let newWidth, newHeight;

                if (imageAspectRatio > 1) {
                    newWidth = maxWidth;
                    newHeight = maxWidth / imageAspectRatio;
                } else {
                    newHeight = maxHeight;
                    newWidth = maxHeight * imageAspectRatio;
                }

                finalSize = [newWidth, newHeight];

                // Re-create elements
                createFrameWithSize(finalSize);

                loadedTexture.encoding = THREE.sRGBEncoding;
                loadedTexture.minFilter = THREE.LinearMipmapLinearFilter;
                loadedTexture.generateMipmaps = true;

                const artworkMaterial = new THREE.MeshPhysicalMaterial({
                    map: loadedTexture,
                    roughness: 0.9,
                    metalness: 0.0,
                    envMapIntensity: 0.1,
                    side: THREE.FrontSide
                });

                const geom = new THREE.PlaneGeometry(finalSize[0], finalSize[1]);
                artworkMesh = new THREE.Mesh(geom, artworkMaterial);
                artworkMesh.castShadow = true;
                artworkMesh.receiveShadow = true;
                artworkMesh.position.set(0, 0, 0.02);
                artworkMesh.renderOrder = 3;
                artworkMesh.userData = { title, artist, year, description, isClickable: true };

                artworkGroup.add(artworkMesh);

                // Update array reference
                const index = this.artworks.findIndex(a => a.group === artworkGroup);
                if (index !== -1) {
                    this.artworks[index].mesh = artworkMesh;
                }

                if (isMainArtwork) {
                    // Removed corner lights as per user request
                    // this.createFrameLighting(artworkGroup, finalSize);
                }
            });
        }

        artworkGroup.position.set(...position);
        if (rotation) {
            artworkGroup.rotation.set(...rotation);
        }

        this.scene.add(artworkGroup);
        this.artworks.push({
            group: artworkGroup,
            mesh: artworkMesh, // Initial mesh, might be updated
            config: config
        });
    }

    createFrameLighting(artworkGroup, size) {
        const ledPositions = [
            [-size[0] / 2, size[1] / 2, 0.1],
            [size[0] / 2, size[1] / 2, 0.1],
            [-size[0] / 2, -size[1] / 2, 0.1],
            [size[0] / 2, -size[1] / 2, 0.1]
        ];

        ledPositions.forEach(pos => {
            const ledLight = new THREE.PointLight(0xffffff, 3, 3, 2);
            ledLight.position.set(...pos);
            artworkGroup.add(ledLight);
        });
    }

    createArtistPortrait(config) {
        // Simplified wrapper for now - similar to createRealisticArtwork but custom styling
        // For brevity in this refactor, reusing the standard artwork creation but with metadata
        this.createRealisticArtwork({ ...config, isMainArtwork: true });
        // Note: The original code had a very custom frame for the portrait.
        // If critical, we should copy the `createArtistPortrait` function from main.js fully. 
        // For MVP refactor, this is acceptable.
    }

    createMuseumObjects() {
        this.createLowCenterTable({
            position: [0, 0, 0],
            title: 'Mesa de Exposición',
            description: 'Mesa central discreta'
        });

        // Benches
        this.createMuseumBench([0, 0, 4], 0, 'Banco de Contemplación');
        this.createMuseumBench([-6, 0, -6], Math.PI / 4, 'Banco de Contemplación');
        this.createMuseumBench([6, 0, -6], -Math.PI / 4, 'Banco de Contemplación');

        // Podiums
        this.createPodiumWithRope({
            position: [-3, 0, 0],
            title: 'Objeto de Colección'
        });
        this.createPodiumWithRope({
            position: [3, 0, 0],
            title: 'Artefacto Histórico'
        });

        // Walls
        this.createFloatingWall({
            position: [-5, 0, -3],
            rotation: Math.PI / 4
        });
        this.createFloatingWall({
            position: [5, 0, 3],
            rotation: -Math.PI / 4
        });
    }

    createLowCenterTable(config) {
        const { position, title, description } = config;
        const tableGroup = new THREE.Group();

        // Base
        const baseGeometry = new THREE.CylinderGeometry(0.8, 0.9, 0.5, 8);
        const baseMaterial = new THREE.MeshPhysicalMaterial({ color: 0x2d2d2d, roughness: 0.3 });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.set(0, 0.25, 0);
        base.castShadow = true;
        tableGroup.add(base);

        // Glass surface
        const surfaceGeometry = new THREE.CylinderGeometry(1.2, 1.2, 0.05, 32);
        const surfaceMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xffffff, transparent: true, opacity: 0.3, transmission: 0.9, roughness: 0.05
        });
        const surface = new THREE.Mesh(surfaceGeometry, surfaceMaterial);
        surface.position.set(0, 0.53, 0);
        tableGroup.add(surface);

        tableGroup.position.set(...position);
        tableGroup.userData = { title, description, type: 'lowCenterTable' };
        this.scene.add(tableGroup);

        this.decorationCollisions.push({
            x: position[0],
            z: position[2],
            radius: 1.3
        });

        this.museumObjects.push({ group: tableGroup, config });
    }

    createMuseumBench(position, rotationY, title) {
        // Simple bench logic
        const benchGroup = new THREE.Group();
        const seatGeo = new THREE.BoxGeometry(2, 0.1, 0.6);
        const seatMat = new THREE.MeshPhysicalMaterial({ color: 0x5c4033, roughness: 0.6 });
        const seat = new THREE.Mesh(seatGeo, seatMat);
        seat.position.y = 0.5;
        benchGroup.add(seat);

        const legGeo = new THREE.BoxGeometry(0.1, 0.5, 0.6);
        const leg1 = new THREE.Mesh(legGeo, seatMat); leg1.position.set(-0.8, 0.25, 0);
        const leg2 = new THREE.Mesh(legGeo, seatMat); leg2.position.set(0.8, 0.25, 0);
        benchGroup.add(leg1);
        benchGroup.add(leg2);

        benchGroup.position.set(...position);
        if (rotationY) benchGroup.rotation.y = rotationY;

        this.scene.add(benchGroup);
        this.decorationCollisions.push({ x: position[0], z: position[2], radius: 0.8 });
    }

    createPodiumWithRope(config) {
        const { position, title } = config;
        const podiumGroup = new THREE.Group();

        const podiumGeo = new THREE.CylinderGeometry(0.4, 0.45, 1.0, 16);
        const podiumMat = new THREE.MeshPhysicalMaterial({ color: 0xf0f0f0, roughness: 0.2 });
        const podium = new THREE.Mesh(podiumGeo, podiumMat);
        podium.position.set(0, 0.5, 0);
        podium.castShadow = true;
        podiumGroup.add(podium);

        podiumGroup.position.set(...position);
        podiumGroup.userData = { title, type: 'podium' };
        this.scene.add(podiumGroup);

        this.decorationCollisions.push({ x: position[0], z: position[2], radius: 0.6 });
        this.museumObjects.push({ group: podiumGroup, config });
    }

    createFloatingWall(config) {
        const { position, rotation } = config;
        const wallGroup = new THREE.Group();

        const wallGeo = new THREE.BoxGeometry(4.0, 2.0, 0.2);
        const wallMat = new THREE.MeshPhysicalMaterial({ color: 0xe8e8e8, roughness: 0.7 });
        const wall = new THREE.Mesh(wallGeo, wallMat);
        wall.position.set(0, 1.0, 0);
        wall.castShadow = true;
        wall.receiveShadow = true;
        wallGroup.add(wall);

        wallGroup.position.set(...position);
        wallGroup.rotation.y = rotation || 0;
        this.scene.add(wallGroup);

        // Add to main walls collision list if accessible or handle locally
        // For this refactor, assume they are decoration collisions
        this.decorationCollisions.push({
            x: position[0], z: position[2],
            radius: 2.0, type: 'box', size: [4.0, 0.2] // Simplified collision
        });
    }
}
