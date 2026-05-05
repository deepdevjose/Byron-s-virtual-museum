/**
 * Tour-path helpers for wall-mounted artwork.
 *
 * Stops are derived from artwork metadata instead of hard-coded positions so
 * new wall artwork can participate in the guided tour when it follows the
 * gallery coordinate conventions.
 */
const WALL_POSITION = 13.7;
const WALL_EPSILON = 0.6;
const WALL_SPAN = 12.3;
const DEFAULT_VIEW_DISTANCE = 5.15;
const DEFAULT_CAMERA_HEIGHT = 1.7;

/**
 * Legacy exported path placeholder.
 *
 * The active app uses createTourPathFromArtworks so tour stops stay aligned
 * with the artwork catalog.
 */
export const TOUR_PATH = [];

/**
 * Creates an ordered clockwise guided-tour path from artwork records.
 *
 * The Byron Galvez portrait is prioritized as the first stop when present.
 *
 * @param {Array<Object>} [artworksData=[]] - Artwork records from `artworks.json`.
 * @returns {Array<Object>} Tour stops with cameraPosition, lookAt, and introText.
 */
export function createTourPathFromArtworks(artworksData = []) {
    const visibleArtworks = artworksData
        .filter(isMainGalleryArtwork)
        .slice();

    const byronArtwork = visibleArtworks.find((artwork) => artwork.id === 'byron-galvez');
    const byronX = byronArtwork?.position?.[0] ?? 2.35;

    visibleArtworks.sort((left, right) => {
        if (left.id === 'byron-galvez') return -1;
        if (right.id === 'byron-galvez') return 1;
        return getClockwiseRank(left, byronX) - getClockwiseRank(right, byronX);
    });

    return visibleArtworks.map((artwork, index) => {
        const cameraPosition = getCameraPosition(artwork);
        const lookAt = artwork.position || [0, 2.2, 0];

        return {
            artworkId: artwork.id,
            cameraPosition,
            lookAt,
            introText: `${index + 1} de ${visibleArtworks.length} · ${artwork.title}`
        };
    });
}

/**
 * Determines whether an artwork belongs to the main rectangular gallery walls.
 *
 * @param {Object} artwork - Artwork metadata.
 * @returns {boolean} True when the artwork is close to a main wall span.
 */
function isMainGalleryArtwork(artwork) {
    if (!Array.isArray(artwork?.position)) return false;

    const [x, , z] = artwork.position;
    const onFrontOrBackWall = isNear(Math.abs(z), WALL_POSITION) && Math.abs(x) <= WALL_SPAN;
    const onSideWall = isNear(Math.abs(x), WALL_POSITION) && Math.abs(z) <= WALL_SPAN;

    return onFrontOrBackWall || onSideWall;
}

/**
 * Gives each artwork a clockwise sorting rank around the room.
 *
 * @param {Object} artwork - Artwork metadata.
 * @param {number} startX - X position used to start after the portrait.
 * @returns {number} Clockwise ordering rank.
 */
function getClockwiseRank(artwork, startX) {
    const [x, , z] = artwork.position;

    if (isNear(z, WALL_POSITION) && x > startX) return 100 + x;
    if (isNear(x, WALL_POSITION)) return 200 - z;
    if (isNear(z, -WALL_POSITION)) return 300 - x;
    if (isNear(x, -WALL_POSITION)) return 400 + z;
    if (isNear(z, WALL_POSITION)) return 500 + x;

    return 1000;
}

/**
 * Computes a camera position offset from an artwork along its wall normal.
 *
 * @param {Object} artwork - Artwork metadata.
 * @returns {number[]} [x, y, z] camera position for the tour stop.
 */
function getCameraPosition(artwork) {
    const [x, , z] = artwork.position;
    const rotationY = Array.isArray(artwork.rotation) ? artwork.rotation[1] : 0;
    const normalX = Math.sin(rotationY);
    const normalZ = Math.cos(rotationY);
    const distance = artwork.viewDistance || DEFAULT_VIEW_DISTANCE;

    return [
        x + normalX * distance,
        artwork.cameraHeight || DEFAULT_CAMERA_HEIGHT,
        z + normalZ * distance
    ];
}

/**
 * Tests whether two scalar positions are close enough to be considered on a wall.
 *
 * @param {number} value - Measured coordinate.
 * @param {number} target - Expected wall coordinate.
 * @returns {boolean} True when within WALL_EPSILON.
 */
function isNear(value, target) {
    return Math.abs(value - target) <= WALL_EPSILON;
}
