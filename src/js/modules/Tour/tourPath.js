const WALL_POSITION = 13.7;
const WALL_EPSILON = 0.6;
const WALL_SPAN = 12.3;
const DEFAULT_VIEW_DISTANCE = 5.15;
const DEFAULT_CAMERA_HEIGHT = 1.7;

export const TOUR_PATH = [];

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

function isMainGalleryArtwork(artwork) {
    if (!Array.isArray(artwork?.position)) return false;

    const [x, , z] = artwork.position;
    const onFrontOrBackWall = isNear(Math.abs(z), WALL_POSITION) && Math.abs(x) <= WALL_SPAN;
    const onSideWall = isNear(Math.abs(x), WALL_POSITION) && Math.abs(z) <= WALL_SPAN;

    return onFrontOrBackWall || onSideWall;
}

function getClockwiseRank(artwork, startX) {
    const [x, , z] = artwork.position;

    if (isNear(z, WALL_POSITION) && x > startX) return 100 + x;
    if (isNear(x, WALL_POSITION)) return 200 - z;
    if (isNear(z, -WALL_POSITION)) return 300 - x;
    if (isNear(x, -WALL_POSITION)) return 400 + z;
    if (isNear(z, WALL_POSITION)) return 500 + x;

    return 1000;
}

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

function isNear(value, target) {
    return Math.abs(value - target) <= WALL_EPSILON;
}
