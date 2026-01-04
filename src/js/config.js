// Configuración del Museo Virtual Byron Gálvez
// Este archivo contiene configuraciones generales del museo

const CONFIG = {
    // Información del museo
    info: {
        title: "Museo Virtual - Byron Gálvez",
        version: "1.0.0",
        devMode: true
    },

    // Configuración de la cámara
    camera: {
        fov: 60,
        near: 0.1,
        far: 200,
        startPos: { x: 0, y: 1.7, z: -8 },
        rotation: Math.PI // Looking back
    },

    shadows: {
        enabled: true,
        type: 'PCFSoftShadowMap', // Will be resolved to constant in Three.js usage if needed, or string
        mapSize: 1024
    },

    lighting: {
        physicallyCorrect: true,
        exposure: 1,
        shadowBias: -0.0001
    },

    materials: {
        enablePBR: true,
        envMapIntensity: 0.8
    },

    // Configuración de movimiento
    movement: {
        walkSpeed: 4.0,
        runSpeed: 7.0,
        lookSpeed: 0.002,
        smoothing: 0.18,
        acceleration: 12.0,
        friction: 10.0,
        jumpForce: 0.15, // Legacy support
        gravity: 0.01,   // Legacy support
        height: 1.7
    },

    performance: {
        maxLights: 20,
        simplifiedGeometry: true,
        reducedShadows: true,
        textureMaxSize: 2048,
        antialias: false,
        pixelRatio: Math.min(window.devicePixelRatio, 2)
    },

    // Colores del tema (Legacy/Fallback)
    colors: {
        background: 0x202020,
        fog: 0x202020,
        lights: {
            ambient: 0xffffff,
            spot: 0xfff0dd
        }
    }
};

export default CONFIG;

// Función de verificación de compatibilidad WebGL
function checkWebGLSupport() {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) {
            console.error('❌ WebGL no está disponible');
            return false;
        }

        return true;
    } catch (e) {
        console.error('❌ Error al verificar WebGL:', e);
        return false;
    }
}


