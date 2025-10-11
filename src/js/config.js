// Configuración del Museo Virtual Byron Gálvez
// Este archivo contiene configuraciones generales del museo

const MUSEUM_CONFIG = {
    title: "Museo Virtual Byron Gálvez",
    version: "1.0.0",
    
    // Configuración de renderizado
    rendering: {
        antialias: true,
        shadowsEnabled: true,
        maxPixelRatio: 2
    },
    
    // Configuración de cámara
    camera: {
        fov: 60,
        near: 0.1,
        far: 200,
        initialPosition: { x: 0, y: 1.7, z: 8 }
    },
    
    // Configuración de audio
    audio: {
        ambientVolume: 0.3,
        footstepVolume: 0.2,
        enabled: true
    },
    
    // Configuración de controles
    controls: {
        walkSpeed: 4.0,
        runSpeed: 7.0,
        lookSpeed: 0.002,
        smoothing: 0.18
    }
};

// Función de verificación de compatibilidad WebGL
function checkWebGLSupport() {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) {
            console.error('❌ WebGL no está disponible');
            return false;
        }
        console.log('✅ WebGL disponible');
        return true;
    } catch (e) {
        console.error('❌ Error al verificar WebGL:', e);
        return false;
    }
}

console.log('📝 Config.js cargado correctamente');
