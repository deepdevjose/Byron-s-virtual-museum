import * as THREE from 'three';

/**
 * Builds artwork displays and decorative museum objects.
 *
 * Gallery owns the artwork records used by raycasting, hover effects, physics
 * collision metadata, and guided-tour lookup. Artwork planes are first created
 * with fallback materials, then rebuilt after image textures load so the final
 * frame fits the source image aspect ratio.
 */
export class Gallery {
    /**
     * @param {THREE.Scene} scene - Scene that receives artwork and decor groups.
     * @param {THREE.TextureLoader|null} textureLoader - Optional texture loader for tests.
     * @param {THREE.WebGLRenderer} renderer - Renderer used for texture capability queries.
     * @param {Function} onArtworkUpdated - Callback invoked after an artwork texture loads.
     */
    constructor(scene, textureLoader, renderer, onArtworkUpdated) {
        this.scene = scene;
        this.renderer = renderer;
        this.onArtworkUpdated = onArtworkUpdated || (() => {});
        this.textureLoader = textureLoader || new THREE.TextureLoader();
        this.artworks = [];
        this.museumObjects = [];
        this.decorationCollisions = [];
    }

    /**
     * Clears previous gallery state and builds all artworks and decor.
     *
     * @param {Array<Object>} [artworksData=[]] - Artwork records from `artworks.json`.
     * @returns {Promise<Array<PromiseSettledResult<Object>>>} Settled image-load results.
     */
    setup(artworksData = []) {
        this.artworks = [];
        this.museumObjects = [];
        this.decorationCollisions = [];
        const artworkLoads = this.createRealisticArtworks(artworksData);
        this.createMuseumObjects();
        return Promise.allSettled(artworkLoads);
    }

    /**
     * Starts creation of every artwork in the catalog.
     *
     * @param {Array<Object>} artworksData - Artwork records.
     * @returns {Array<Promise<Object>>} Promises resolving to artwork records.
     */
    createRealisticArtworks(artworksData) {
        return artworksData.map((artwork) => this.createRealisticArtwork(artwork));
    }

    /**
     * Creates one framed artwork group and loads its image texture.
     *
     * The group is positioned immediately so the museum remains visible even if
     * a texture fails. Once the image loads, the group is rebuilt to match the
     * source aspect ratio and update raycast targets.
     *
     * @param {Object} data - Artwork metadata.
     * @returns {Promise<Object>} Resolves to the gallery artwork record.
     */
    createRealisticArtwork(data) {
        const artworkGroup = new THREE.Group();
        const artworkRecord = {
            id: data.id,
            group: artworkGroup,
            mesh: null,
            frame: null,
            backing: null,
            isHovered: false,
            originalFrameColor: null,
            originalBackingColor: null,
            data,
            config: data
        };

        this.buildArtworkGroup(artworkGroup, data, data.size, null, artworkRecord);

        artworkGroup.position.set(...data.position);
        if (data.rotation) {
            artworkGroup.rotation.set(...data.rotation);
        }

        this.scene.add(artworkGroup);
        this.artworks.push(artworkRecord);

        const imageUrl = data.image || data.imageUrl;
        if (!imageUrl) return Promise.resolve(artworkRecord);

        return new Promise((resolve) => {
            this.textureLoader.load(
                imageUrl,
                (loadedTexture) => {
                    const imageAspectRatio = loadedTexture.image.width / loadedTexture.image.height;
                    const finalSize = this.fitArtworkSize(data.size, imageAspectRatio);

                    while (artworkGroup.children.length > 0) {
                        artworkGroup.remove(artworkGroup.children[0]);
                    }

                    const mesh = this.buildArtworkGroup(artworkGroup, data, finalSize, loadedTexture, artworkRecord);
                    artworkRecord.mesh = mesh;
                    this.onArtworkUpdated(artworkRecord);
                    resolve(artworkRecord);
                },
                undefined,
                () => resolve(artworkRecord)
            );
        });
    }

    /**
     * Builds the frame, artwork plane, and wall label for one artwork.
     *
     * @param {THREE.Group} artworkGroup - Parent group for artwork meshes.
     * @param {Object} data - Artwork metadata.
     * @param {number[]} artworkSize - Final [width, height] in scene units.
     * @param {THREE.Texture|null} [loadedTexture=null] - Optional artwork image texture.
     * @param {Object|null} [artworkRecord=null] - Record that receives hover references.
     * @returns {THREE.Mesh} The clickable artwork plane.
     */
    buildArtworkGroup(artworkGroup, data, artworkSize, loadedTexture = null, artworkRecord = null) {
        this.createFrame(artworkGroup, artworkSize, Boolean(data.featured), artworkRecord);
        const artworkMesh = this.createArtworkPlane(artworkSize, data, loadedTexture);
        artworkGroup.add(artworkMesh);
        this.createArtworkLabel(artworkGroup, data, artworkSize);
        return artworkMesh;
    }

    /**
     * Fits an image inside the configured maximum artwork dimensions.
     *
     * @param {number[]} maxSize - Maximum [width, height] for the artwork.
     * @param {number} imageAspectRatio - Source image width divided by height.
     * @returns {number[]} Fitted [width, height] preserving image aspect ratio.
     */
    fitArtworkSize(maxSize, imageAspectRatio) {
        const maxWidth = maxSize[0];
        const maxHeight = maxSize[1];

        if (imageAspectRatio > 1) {
            return [maxWidth, maxWidth / imageAspectRatio];
        }

        return [maxHeight * imageAspectRatio, maxHeight];
    }

    /**
     * Creates the extruded artwork frame and backing board.
     *
     * @param {THREE.Group} artworkGroup - Parent artwork group.
     * @param {number[]} artworkSize - Artwork [width, height] in scene units.
     * @param {boolean} featured - Whether to use the larger featured frame.
     * @param {Object|null} [artworkRecord=null] - Record that stores hover material references.
     */
    createFrame(artworkGroup, artworkSize, featured, artworkRecord = null) {
        const frameWidth = featured ? 0.22 : 0.18;
        const outerWidth = artworkSize[0] + frameWidth * 2;
        const outerHeight = artworkSize[1] + frameWidth * 2;
        const innerWidth = artworkSize[0] + 0.04;
        const innerHeight = artworkSize[1] + 0.04;

        const frameShape = new THREE.Shape();
        frameShape.moveTo(-outerWidth / 2, -outerHeight / 2);
        frameShape.lineTo(outerWidth / 2, -outerHeight / 2);
        frameShape.lineTo(outerWidth / 2, outerHeight / 2);
        frameShape.lineTo(-outerWidth / 2, outerHeight / 2);
        frameShape.lineTo(-outerWidth / 2, -outerHeight / 2);

        const hole = new THREE.Path();
        hole.moveTo(-innerWidth / 2, -innerHeight / 2);
        hole.lineTo(-innerWidth / 2, innerHeight / 2);
        hole.lineTo(innerWidth / 2, innerHeight / 2);
        hole.lineTo(innerWidth / 2, -innerHeight / 2);
        hole.lineTo(-innerWidth / 2, -innerHeight / 2);
        frameShape.holes.push(hole);

        const frameGeometry = new THREE.ExtrudeGeometry(frameShape, {
            depth: featured ? 0.22 : 0.18,
            bevelEnabled: true,
            bevelSize: 0.028,
            bevelThickness: 0.028,
            bevelSegments: 2
        });
        frameGeometry.center();

        const frameColor = featured ? 0x25201b : 0x2c2824;
        const frameMaterial = new THREE.MeshPhysicalMaterial({
            color: frameColor,
            roughness: 0.46,
            metalness: 0.18,
            clearcoat: 0.25,
            clearcoatRoughness: 0.35,
            envMapIntensity: 0.45
        });

        const frame = new THREE.Mesh(frameGeometry, frameMaterial);
        frame.position.z = -0.06;
        frame.castShadow = true;
        frame.receiveShadow = true;
        frame.renderOrder = 1;
        artworkGroup.add(frame);

        const backingGeometry = new THREE.BoxGeometry(artworkSize[0] + 0.14, artworkSize[1] + 0.14, 0.06);
        const backingColor = 0x1a1714;
        const backingMaterial = new THREE.MeshPhysicalMaterial({
            color: backingColor,
            roughness: 0.75,
            metalness: 0.05
        });
        const backing = new THREE.Mesh(backingGeometry, backingMaterial);
        backing.position.z = -0.09;
        backing.castShadow = true;
        backing.receiveShadow = true;
        artworkGroup.add(backing);

        // Keep material references so hover state can be restored exactly.
        if (artworkRecord) {
            artworkRecord.frame = frame;
            artworkRecord.backing = backing;
            artworkRecord.originalFrameColor = new THREE.Color(frameColor);
            artworkRecord.originalBackingColor = new THREE.Color(backingColor);
        }
    }

    /**
     * Creates the clickable artwork plane.
     *
     * Texture settings favor visual quality at oblique viewing angles while
     * staying within the renderer's anisotropy capability.
     *
     * @param {number[]} artworkSize - Artwork [width, height] in scene units.
     * @param {Object} data - Artwork metadata copied into mesh userData.
     * @param {THREE.Texture|null} loadedTexture - Optional image texture.
     * @returns {THREE.Mesh} Artwork plane mesh.
     */
    createArtworkPlane(artworkSize, data, loadedTexture) {
        const artworkGeometry = new THREE.PlaneGeometry(artworkSize[0], artworkSize[1]);
        let artworkMaterial;

        if (loadedTexture) {
            loadedTexture.encoding = THREE.sRGBEncoding;
            loadedTexture.minFilter = THREE.LinearMipmapLinearFilter;
            loadedTexture.magFilter = THREE.LinearFilter;
            loadedTexture.generateMipmaps = true;
            loadedTexture.anisotropy = Math.min(4, this.renderer?.capabilities.getMaxAnisotropy() || 4);
            loadedTexture.needsUpdate = true;

            artworkMaterial = new THREE.MeshPhysicalMaterial({
                map: loadedTexture,
                roughness: 0.82,
                metalness: 0.0,
                clearcoat: 0.08,
                clearcoatRoughness: 0.65,
                envMapIntensity: 0.12,
                side: THREE.FrontSide
            });
        } else {
            artworkMaterial = new THREE.MeshPhysicalMaterial({
                color: 0x4b4842,
                roughness: 0.9,
                metalness: 0.0,
                side: THREE.FrontSide
            });
        }

        const artworkMesh = new THREE.Mesh(artworkGeometry, artworkMaterial);
        artworkMesh.castShadow = true;
        artworkMesh.receiveShadow = true;
        artworkMesh.position.z = 0.055;
        artworkMesh.renderOrder = 3;
        artworkMesh.userData = {
            title: data.title,
            artist: data.artist,
            year: data.year,
            description: data.description,
            isClickable: true,
            artworkId: data.id
        };

        return artworkMesh;
    }

    /**
     * Generates a canvas-based wall label for one artwork.
     *
     * Canvas text is converted to a texture so labels exist inside the 3D scene
     * and receive the same camera perspective as the framed work.
     *
     * @param {THREE.Group} artworkGroup - Parent artwork group.
     * @param {Object} data - Artwork metadata used for label text.
     * @param {number[]} artworkSize - Artwork [width, height] in scene units.
     */
    createArtworkLabel(artworkGroup, data, artworkSize) {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 460;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = 'rgba(236, 229, 214, 0.96)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = 'rgba(37, 32, 26, 0.16)';
        ctx.fillRect(52, 52, 2, 350);

        ctx.fillStyle = '#2a251f';
        ctx.font = '600 54px Inter, Arial, sans-serif';
        this.wrapText(ctx, data.title, 88, 112, 820, 58, 2);

        ctx.fillStyle = '#5e5449';
        ctx.font = '400 34px Inter, Arial, sans-serif';
        ctx.fillText(`${data.artist} · ${data.year}`, 88, 236);

        ctx.fillStyle = '#7b7064';
        ctx.font = '500 28px Inter, Arial, sans-serif';
        ctx.fillText(data.technique || 'Tecnica mixta', 88, 292);

        ctx.fillStyle = '#6b6155';
        ctx.font = '300 25px Inter, Arial, sans-serif';
        this.wrapText(ctx, data.description, 88, 346, 820, 34, 2);

        const texture = new THREE.CanvasTexture(canvas);
        texture.encoding = THREE.sRGBEncoding;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;

        const labelWidth = data.featured ? 1.32 : 1.18;
        const labelHeight = labelWidth * (canvas.height / canvas.width);
        const label = new THREE.Mesh(
            new THREE.PlaneGeometry(labelWidth, labelHeight),
            new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true,
                toneMapped: false
            })
        );

        label.position.set(artworkSize[0] / 2 + labelWidth / 2 + 0.34, -artworkSize[1] / 2 + labelHeight / 2 + 0.06, 0.09);
        label.castShadow = false;
        label.receiveShadow = false;
        label.renderOrder = 4;
        artworkGroup.add(label);
    }

    /**
     * Draws wrapped text onto a canvas context.
     *
     * @param {CanvasRenderingContext2D} ctx - Canvas context.
     * @param {string} text - Text to draw.
     * @param {number} x - Left drawing coordinate.
     * @param {number} y - Baseline of the first line.
     * @param {number} maxWidth - Maximum line width in pixels.
     * @param {number} lineHeight - Line height in pixels.
     * @param {number} maxLines - Maximum number of rendered lines.
     */
    wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
        const words = String(text || '').split(' ');
        let line = '';
        let lineCount = 0;

        for (let i = 0; i < words.length; i++) {
            const testLine = `${line}${words[i]} `;
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && i > 0) {
                ctx.fillText(line.trim(), x, y);
                line = `${words[i]} `;
                y += lineHeight;
                lineCount++;

                if (lineCount >= maxLines - 1) {
                    const remaining = `${line}${words.slice(i + 1).join(' ')}`.trim();
                    ctx.fillText(this.truncateText(ctx, remaining, maxWidth), x, y);
                    return;
                }
            } else {
                line = testLine;
            }
        }

        ctx.fillText(line.trim(), x, y);
    }

    /**
     * Shortens canvas text with an ellipsis until it fits the target width.
     *
     * @param {CanvasRenderingContext2D} ctx - Canvas context used for measurement.
     * @param {string} text - Text to truncate.
     * @param {number} maxWidth - Maximum width in pixels.
     * @returns {string} Truncated text with an ellipsis.
     */
    truncateText(ctx, text, maxWidth) {
        let value = text;
        while (ctx.measureText(`${value}...`).width > maxWidth && value.length > 0) {
            value = value.slice(0, -1);
        }
        return `${value.trim()}...`;
    }

    /**
     * Updates frame and backing materials for artwork hover feedback.
     *
     * @param {Object} artwork - Gallery artwork record.
     * @param {boolean} isHovered - Whether the artwork is currently targeted.
     */
    setArtworkHoverState(artwork, isHovered) {
        if (!artwork || !artwork.frame) return;

        artwork.isHovered = isHovered;

        if (isHovered) {
            const hoverColor = new THREE.Color(0xd4af37);
            artwork.frame.material.color.copy(hoverColor);
            artwork.frame.material.metalness = 0.35;
            artwork.frame.material.roughness = 0.3;
            artwork.frame.material.emissive = new THREE.Color(0x4a4020);
            artwork.frame.material.emissiveIntensity = 0.15;
            
            // Brighten the backing just enough to make targeting readable.
            artwork.backing.material.color.copy(new THREE.Color(0x2a2420));
        } else {
            artwork.frame.material.color.copy(artwork.originalFrameColor);
            artwork.frame.material.metalness = 0.18;
            artwork.frame.material.roughness = 0.46;
            artwork.frame.material.emissive = new THREE.Color(0x000000);
            artwork.frame.material.emissiveIntensity = 0;
            
            artwork.backing.material.color.copy(artwork.originalBackingColor);
        }
    }

    /**
     * Finds an artwork record by its catalog id.
     *
     * @param {string} id - Artwork id from `artworks.json`.
     * @returns {Object|null} Matching artwork record, or null when missing.
     */
    getArtworkById(id) {
        return this.artworks.find((artwork) => artwork.id === id) || null;
    }

    /**
     * Creates non-artwork museum objects and their collision metadata.
     */
    createMuseumObjects() {
        this.createLowCenterTable({
            position: [0, 0, 0],
            title: 'Mesa de Exposicion',
            description: 'Mesa central discreta'
        });

        this.createMuseumBench([0, 0, 4], 0, 'Banco de Contemplacion');
        this.createMuseumBench([-6.4, 0, -5.8], Math.PI / 4, 'Banco de Contemplacion');
        this.createMuseumBench([6.4, 0, -5.8], -Math.PI / 4, 'Banco de Contemplacion');

        this.createPodiumWithRope({
            position: [-3, 0, 0],
            title: 'Objeto de Coleccion'
        });
        this.createPodiumWithRope({
            position: [3, 0, 0],
            title: 'Artefacto Historico'
        });

        this.createFloatingWall({
            position: [-5, 0, -3],
            rotation: Math.PI / 4
        });
        this.createFloatingWall({
            position: [5, 0, 3],
            rotation: -Math.PI / 4
        });
    }

    /**
     * Adds the central glass-topped table and circular collision boundary.
     *
     * @param {Object} config - Table configuration.
     * @param {number[]} config.position - [x, y, z] scene position.
     * @param {string} config.title - Display/debug title.
     * @param {string} config.description - Display/debug description.
     */
    createLowCenterTable(config) {
        const { position, title, description } = config;
        const tableGroup = new THREE.Group();
        const stoneMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x6e675d,
            roughness: 0.55,
            metalness: 0.04,
            clearcoat: 0.18,
            clearcoatRoughness: 0.45
        });

        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.9, 0.42, 32), stoneMaterial);
        base.position.y = 0.21;
        base.castShadow = true;
        base.receiveShadow = true;
        tableGroup.add(base);

        const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.58, 0.32, 32), stoneMaterial);
        neck.position.y = 0.56;
        neck.castShadow = true;
        neck.receiveShadow = true;
        tableGroup.add(neck);

        const surfaceMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xf1eadf,
            transparent: true,
            opacity: 0.34,
            transmission: 0.85,
            roughness: 0.08,
            metalness: 0.0,
            clearcoat: 0.9
        });
        const surface = new THREE.Mesh(new THREE.CylinderGeometry(1.18, 1.18, 0.06, 48), surfaceMaterial);
        surface.position.y = 0.76;
        surface.castShadow = false;
        tableGroup.add(surface);

        tableGroup.position.set(...position);
        tableGroup.userData = { title, description, type: 'lowCenterTable' };
        this.scene.add(tableGroup);

        this.decorationCollisions.push({ x: position[0], z: position[2], radius: 1.25 });
        this.museumObjects.push({ group: tableGroup, config: { ...config, type: 'table' } });
    }

    /**
     * Adds a bench and its collision boundary.
     *
     * @param {number[]} position - [x, y, z] scene position.
     * @param {number} rotationY - Y-axis rotation in radians.
     * @param {string} title - Display/debug title.
     */
    createMuseumBench(position, rotationY, title) {
        const benchGroup = new THREE.Group();
        const woodMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x6a5541,
            roughness: 0.64,
            metalness: 0.02,
            clearcoat: 0.16,
            clearcoatRoughness: 0.5
        });
        const metalMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x282623,
            roughness: 0.38,
            metalness: 0.72
        });

        const slatPositions = [-0.22, 0, 0.22];
        slatPositions.forEach((z) => {
            const slat = new THREE.Mesh(new THREE.BoxGeometry(2.25, 0.08, 0.16), woodMaterial);
            slat.position.set(0, 0.58, z);
            slat.castShadow = true;
            slat.receiveShadow = true;
            benchGroup.add(slat);
        });

        const back = new THREE.Mesh(new THREE.BoxGeometry(2.25, 0.1, 0.16), woodMaterial);
        back.position.set(0, 0.92, 0.34);
        back.rotation.x = -0.18;
        back.castShadow = true;
        back.receiveShadow = true;
        benchGroup.add(back);

        [-0.86, 0.86].forEach((x) => {
            const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.52, 0.44), metalMaterial);
            leg.position.set(x, 0.28, 0);
            leg.castShadow = true;
            leg.receiveShadow = true;
            benchGroup.add(leg);

            const foot = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.06, 0.5), metalMaterial);
            foot.position.set(x, 0.04, 0);
            foot.castShadow = true;
            foot.receiveShadow = true;
            benchGroup.add(foot);
        });

        benchGroup.position.set(...position);
        benchGroup.rotation.y = rotationY || 0;
        benchGroup.userData = { title, type: 'bench' };
        this.scene.add(benchGroup);

        this.decorationCollisions.push({ x: position[0], z: position[2], radius: 1.05 });
        this.museumObjects.push({ group: benchGroup, config: { position, title, type: 'bench' } });
    }

    /**
     * Adds a decorative podium with a sculptural object and collision boundary.
     *
     * @param {Object} config - Podium configuration.
     * @param {number[]} config.position - [x, y, z] scene position.
     * @param {string} config.title - Display/debug title.
     */
    createPodiumWithRope(config) {
        const { position, title } = config;
        const podiumGroup = new THREE.Group();
        const podiumMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xd7d0c4,
            roughness: 0.5,
            metalness: 0.03,
            clearcoat: 0.2,
            clearcoatRoughness: 0.4
        });
        const trimMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x3d3328,
            roughness: 0.32,
            metalness: 0.35
        });

        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.64, 0.18, 32), trimMaterial);
        base.position.y = 0.09;
        base.castShadow = true;
        base.receiveShadow = true;
        podiumGroup.add(base);

        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.86, 32), podiumMaterial);
        body.position.y = 0.58;
        body.castShadow = true;
        body.receiveShadow = true;
        podiumGroup.add(body);

        const top = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.52, 0.12, 32), trimMaterial);
        top.position.y = 1.07;
        top.castShadow = true;
        top.receiveShadow = true;
        podiumGroup.add(top);

        const object = new THREE.Mesh(
            new THREE.TorusKnotGeometry(0.18, 0.045, 64, 8),
            new THREE.MeshPhysicalMaterial({ color: 0x6b4f2f, roughness: 0.35, metalness: 0.3 })
        );
        object.position.y = 1.28;
        object.castShadow = true;
        podiumGroup.add(object);

        podiumGroup.position.set(...position);
        podiumGroup.userData = { title, type: 'podium' };
        this.scene.add(podiumGroup);

        this.decorationCollisions.push({ x: position[0], z: position[2], radius: 0.72 });
        this.museumObjects.push({ group: podiumGroup, config: { ...config, type: 'podium' } });
    }

    /**
     * Adds a freestanding wall segment and broad collision boundary.
     *
     * @param {Object} config - Wall configuration.
     * @param {number[]} config.position - [x, y, z] scene position.
     * @param {number} config.rotation - Y-axis rotation in radians.
     */
    createFloatingWall(config) {
        const { position, rotation } = config;
        const wallGroup = new THREE.Group();
        const wallMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xb8b2a6,
            roughness: 0.82,
            metalness: 0.0,
            clearcoat: 0.08,
            clearcoatRoughness: 0.6
        });

        const wall = new THREE.Mesh(new THREE.BoxGeometry(4.0, 2.15, 0.22), wallMaterial);
        wall.position.y = 1.08;
        wall.castShadow = true;
        wall.receiveShadow = true;
        wallGroup.add(wall);

        const capMaterial = new THREE.MeshPhysicalMaterial({ color: 0x51483d, roughness: 0.62, metalness: 0.05 });
        const capTop = new THREE.Mesh(new THREE.BoxGeometry(4.1, 0.08, 0.28), capMaterial);
        capTop.position.y = 2.18;
        capTop.castShadow = true;
        wallGroup.add(capTop);

        const capBottom = new THREE.Mesh(new THREE.BoxGeometry(4.1, 0.08, 0.3), capMaterial);
        capBottom.position.y = 0.08;
        capBottom.castShadow = true;
        wallGroup.add(capBottom);

        wallGroup.position.set(...position);
        wallGroup.rotation.y = rotation || 0;
        this.scene.add(wallGroup);

        this.decorationCollisions.push({ x: position[0], z: position[2], radius: 2.0, type: 'box', size: [4.0, 0.22] });
        this.museumObjects.push({ group: wallGroup, config: { ...config, type: 'wall' } });
    }
}
