import * as THREE from 'three';

/**
 * Experimental distance-based texture LOD utility.
 *
 * The current gallery relies on Three.js mipmaps for artwork texture sampling,
 * but this utility remains available for experiments and benchmark scripts that
 * need theoretical LOD distribution statistics.
 */
export class LODSystem {
    /**
     * Initializes texture loading, thresholds, quality levels, and statistics.
     */
    constructor() {
        this.textureLoader = new THREE.TextureLoader();
        this.loadedTextures = new Map(); // Texture cache keyed by artwork and URL.

        /**
         * Distance thresholds for theoretical LOD switching.
         * @type {{high: number, medium: number, low: number}}
         */
        this.thresholds = {
            high: 6.0,    // Near artwork, maximum detail.
            medium: 12.0, // Mid-range artwork, medium detail.
            low: 20.0     // Distant artwork, basic detail.
        };

        /**
         * Texture quality levels
         * @type {{high: {scale: number, label: string, mipmaps: boolean}, medium: {scale: number, label: string, mipmaps: boolean}, low: {scale: number, label: string, mipmaps: boolean}}}
         */
        this.qualityLevels = {
            high: { scale: 1.0, label: 'High', mipmaps: true },
            medium: { scale: 0.5, label: 'Medium', mipmaps: true },
            low: { scale: 0.25, label: 'Low', mipmaps: false }
        };

        /**
         * LOD statistics
         * @type {{switches: number, currentLevel: Map<string, string>}}
         */
        this.stats = {
            switches: 0,
            currentLevel: new Map()
        };
    }

    /**
     * Generates textures in multiple resolutions from an image.
     *
     * Optimized: Only generates textures on demand.
     * @param {string} imageUrl - The image URL.
     * @param {string} artworkId - The artwork identifier.
     * @returns {Promise<{high: THREE.Texture, medium: THREE.Texture|null, low: THREE.Texture|null}>}
     */
    async generateLODTextures(imageUrl, artworkId) {
        const cacheKey = `${artworkId}_${imageUrl}`;

        // Return the cached texture set when available.
        if (this.loadedTextures.has(cacheKey)) {
            return this.loadedTextures.get(cacheKey);
        }

        return new Promise((resolve, reject) => {
            this.textureLoader.load(
                imageUrl,
                (highResTexture) => {
                    // Configure high-resolution texture for color artwork.
                    highResTexture.encoding = THREE.sRGBEncoding;
                    highResTexture.minFilter = THREE.LinearMipmapLinearFilter;
                    highResTexture.magFilter = THREE.LinearFilter;
                    highResTexture.generateMipmaps = true;

                    // Avoid generating scaled textures at startup; medium and low
                    // variants are reserved for lazy generation if re-enabled.
                    const lodTextures = {
                        high: highResTexture,
                        medium: null,
                        low: null
                    };

                    this.loadedTextures.set(cacheKey, lodTextures);
                    resolve(lodTextures);
                },
                undefined,
                (error) => {
                    console.error(`Error cargando textura LOD: ${imageUrl}`, error);
                    reject(error);
                }
            );
        });
    }

    /**
     * Creates a scaled texture using canvas (resolution reduction).
     * @param {THREE.Texture} originalTexture - The original texture.
     * @param {number} scale - The scale factor (0-1).
     * @returns {THREE.Texture}
     */
    createScaledTexture(originalTexture, scale) {
        const img = originalTexture.image;
        if (!img) return originalTexture;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = Math.max(1, Math.floor(img.width * scale));
        canvas.height = Math.max(1, Math.floor(img.height * scale));

        // Smooth interpolation
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const scaledTexture = new THREE.CanvasTexture(canvas);
        scaledTexture.encoding = THREE.sRGBEncoding;
        scaledTexture.minFilter = THREE.LinearFilter;
        scaledTexture.magFilter = THREE.LinearFilter;
        scaledTexture.generateMipmaps = scale > 0.3; // Only mipmaps for medium quality

        return scaledTexture;
    }

    /**
     * Calculates distance between camera and artwork.
     * @param {THREE.Vector3} cameraPosition
     * @param {THREE.Vector3} artworkPosition
     * @returns {number}
     */
    calculateDistance(cameraPosition, artworkPosition) {
        return cameraPosition.distanceTo(artworkPosition);
    }

    /**
     * Determines the appropriate LOD level based on distance.
     * @param {number} distance
     * @returns {'high'|'medium'|'low'}
     */
    determineLODLevel(distance) {
        if (distance <= this.thresholds.high) {
            return 'high';
        } else if (distance <= this.thresholds.medium) {
            return 'medium';
        } else {
            return 'low';
        }
    }

    /**
     * Updates the LOD level of an artwork.
     * Optimized: Uses native Three.js mipmaps instead of switching textures.
     * @param {Object} artwork - The artwork object.
     * @param {THREE.Vector3} cameraPosition
     * @param {Object} lodTextures
     */
    updateArtworkLOD(artwork, cameraPosition, lodTextures) {
        if (!artwork.mesh || !artwork.mesh.material) return;

        const artworkPos = new THREE.Vector3();
        artwork.group.getWorldPosition(artworkPos);

        const distance = this.calculateDistance(cameraPosition, artworkPos);
        const newLevel = this.determineLODLevel(distance);

        const artworkId = artwork.config.imageUrl;
        const currentLevel = this.stats.currentLevel.get(artworkId) || 'high';

        // Do not switch textures here; Three.js mipmaps already handle sampling
        // by distance. This records theoretical levels for diagnostics only.
        if (currentLevel !== newLevel) {
            this.stats.currentLevel.set(artworkId, newLevel);
            this.stats.switches++;

            // Avoid this expensive path unless a future feature explicitly needs it:
            // artwork.mesh.material.map = texture;
            // artwork.mesh.material.needsUpdate = true;
        }
    }

    /**
     * Updates all artworks in the gallery.
     *
     * @param {Array} artworks
     * @param {THREE.Vector3} cameraPosition
     * @param {Map<string, Object>} artworkTextures
     */
    updateAll(artworks, cameraPosition, artworkTextures) {
        artworks.forEach(artwork => {
            const textureSet = artworkTextures.get(artwork.config.imageUrl);
            if (textureSet) {
                this.updateArtworkLOD(artwork, cameraPosition, textureSet);
            }
        });
    }

    /**
     * Gets statistics from the LOD system.
     * @returns {{totalSwitches: number, currentDistribution: Object, cacheSize: number}}
     */
    getStats() {
        const levelCounts = {
            high: 0,
            medium: 0,
            low: 0
        };

        this.stats.currentLevel.forEach(level => {
            levelCounts[level]++;
        });

        return {
            totalSwitches: this.stats.switches,
            currentDistribution: levelCounts,
            cacheSize: this.loadedTextures.size
        };
    }

    /**
     * Clears the texture cache (useful for memory management).
     */
    clearCache() {
        this.loadedTextures.forEach(textures => {
            Object.values(textures).forEach(texture => {
                if (texture.dispose) texture.dispose();
            });
        });
        this.loadedTextures.clear();
        this.stats.currentLevel.clear();
    }
}
