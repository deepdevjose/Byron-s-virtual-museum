// Configuración del Museo Virtual
const MUSEUM_CONFIG = {
    // Configuración de la galería
    gallery: {
        dimensions: {
            width: 20,
            depth: 20,
            height: 4
        },
        colors: {
            walls: 0xeeeeee,
            floor: 0xf0f0f0,
            ceiling: 0xffffff
        }
    },

    // Configuración de iluminación
    lighting: {
        ambient: {
            color: 0x404040,
            intensity: 0.3
        },
        skylight: {
            color: 0xffffff,
            intensity: 0.8,
            position: [0, 10, 0]
        },
        spotlights: {
            color: 0xffffff,
            intensity: 100,
            distance: 15,
            angle: Math.PI / 6,
            penumbra: 0.3
        }
    },

    // Configuración de cámara
    camera: {
        fov: 75,
        near: 0.1,
        far: 1000,
        initialPosition: [0, 1.7, 5],
        height: 1.7 // Altura realista de persona
    },

    // Configuración de controles
    controls: {
        enableDamping: true,
        dampingFactor: 0.05,
        minDistance: 2,
        maxDistance: 20,
        maxPolarAngle: Math.PI / 2.1
    },

    // Configuración de obras de arte
    artworks: [
        {
            id: 'central',
            position: [0, 2, -9.8],
            size: [4, 2.5],
            imageUrl: 'assets/images/central-artwork.jpg',
            videoUrl: 'assets/videos/central-artwork.mp4',
            isMainArtwork: true,
            title: 'Obra Principal',
            artist: 'Byron Gálvez',
            year: '2025'
        },
        {
            id: 'left',
            position: [-6, 2, -9.8],
            size: [3, 2],
            imageUrl: 'assets/images/artwork-1.jpg',
            videoUrl: 'assets/videos/artwork-1.mp4',
            title: 'Composición I',
            artist: 'Byron Gálvez',
            year: '2024'
        },
        {
            id: 'right',
            position: [6, 2, -9.8],
            size: [3, 2],
            imageUrl: 'assets/images/artwork-2.jpg',
            videoUrl: 'assets/videos/artwork-2.mp4',
            title: 'Composición II',
            artist: 'Byron Gálvez',
            year: '2024'
        }
    ],

    // Configuración de esculturas
    sculptures: [
        {
            id: 'sculpture1',
            position: [-7, 0, -3],
            modelUrl: 'assets/models/sculpture-1.glb',
            scale: [1, 1, 1],
            title: 'Escultura Abstracta I',
            artist: 'Byron Gálvez',
            year: '2023'
        },
        {
            id: 'sculpture2',
            position: [7, 0, 3],
            modelUrl: 'assets/models/sculpture-2.glb',
            scale: [1, 1, 1],
            title: 'Escultura Abstracta II',
            artist: 'Byron Gálvez',
            year: '2023'
        }
    ],

    // Configuración de hotspots
    hotspots: {
        colors: {
            main: 0xff4444,
            secondary: 0x44ff44
        },
        animation: {
            speed: 0.005,
            amplitude: 0.2
        },
        size: 0.1
    },

    // Configuración de UI
    ui: {
        logo: {
            text: 'BYRON GÁLVEZ',
            subtitle: 'MUSEO'
        },
        hints: [
            { icon: '👁', text: 'VER PROYECCIÓN' },
            { icon: '🎬', text: 'REPRODUCIR VIDEO' }
        ]
    }
};

// Hacer la configuración disponible globalmente
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MUSEUM_CONFIG;
} else if (typeof window !== 'undefined') {
    window.MUSEUM_CONFIG = MUSEUM_CONFIG;
}