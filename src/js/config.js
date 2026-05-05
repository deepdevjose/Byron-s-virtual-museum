/**
 * Shared configuration for the Byron Galvez virtual museum.
 *
 * Values in this file are consumed by the app bootstrap, renderer setup,
 * camera controls, lighting, and performance-sensitive systems. Keep these
 * values serializable where possible so they can be inspected from the
 * browser console during diagnostics.
 */
const CONFIG = {
    /**
     * High-level application metadata.
     *
     * `devMode` is currently informational and does not enable a separate
     * debug pipeline by itself.
     */
    info: {
        title: "Museo Virtual - Byron Gálvez",
        version: "1.0.0",
        devMode: true
    },

    /**
     * Perspective camera defaults.
     *
     * The start rotation points the visitor toward the back wall from the
     * initial spawn location.
     */
    camera: {
        fov: 60,
        near: 0.1,
        far: 200,
        startPos: { x: 0, y: 1.7, z: -8 },
        rotation: Math.PI
    },

    /**
     * Shadow-map defaults used during renderer initialization.
     *
     * The string value is kept for configuration readability; App resolves
     * the actual Three.js constant when applying the renderer setting.
     */
    shadows: {
        enabled: true,
        type: 'PCFSoftShadowMap',
        mapSize: 1024
    },

    /**
     * Global lighting and tone-mapping controls.
     */
    lighting: {
        physicallyCorrect: true,
        exposure: 0.75,
        shadowBias: -0.0001
    },

    /**
     * Material defaults shared by world-building modules.
     */
    materials: {
        enablePBR: true,
        envMapIntensity: 0.8
    },

    /**
     * First-person movement tuning.
     *
     * Movement is calculated on the horizontal plane; `height` is the
     * camera eye height used by controls, physics, and camera motion.
     */
    movement: {
        walkSpeed: 3.35,
        runSpeed: 5.65,
        lookSpeed: 0.002,
        smoothing: 0.18,
        acceleration: 8.5,
        deceleration: 7.2,
        runAcceleration: 7.4,
        friction: 8.0,
        jumpForce: 0.15, /** Legacy compatibility; jumping is not currently enabled. */
        gravity: 0.01,   /** Legacy compatibility; vertical physics is not currently enabled. */
        height: 1.7
    },

    /**
     * Renderer and asset limits chosen for browser performance.
     */
    performance: {
        maxLights: 20,
        simplifiedGeometry: true,
        reducedShadows: true,
        textureMaxSize: 2048,
        antialias: false,
        pixelRatio: Math.min(window.devicePixelRatio, 2)
    },

    /**
     * Legacy color fallbacks retained for older modules and diagnostics.
     */
    colors: {
        background: 0x202020,
        fog: 0x1c1b18,
        lights: {
            ambient: 0xffffff,
            spot: 0xfff0dd
        }
    }
};

export default CONFIG;

/**
 * Checks whether the browser can create a WebGL context.
 *
 * This helper is retained for diagnostics and future startup validation.
 * It currently logs failures in Spanish to match the existing user-facing
 * application copy.
 *
 * @returns {boolean} True when WebGL is available.
 */
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
