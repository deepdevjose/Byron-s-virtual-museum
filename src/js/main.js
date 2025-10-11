// Variables globales
let scene, camera, renderer;
let raycaster, mouse;
let artworks = [];
let hotspots = [];
let ambientAudio;
let clock;
let footstepAudio;
let envMap;

// Variables para navegación tipo walking
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let isRunning = false;
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let prevTime = performance.now();

// Variables para efecto de caminar (head bob)
let walkingTime = 0;
let headBobActive = false;
const headBobConfig = {
    frequency: 4.5,        // Frecuencia del balanceo (pasos por segundo)
    amplitude: 0.03,       // Amplitud vertical (altura del balanceo)
    amplitudeHorizontal: 0.015, // Amplitud horizontal (balanceo lateral)
    enabled: true
};

// Variables para colisiones
let museumObjects = [];
let collisionBounds = {
    minX: -13.2,
    maxX: 13.2,
    minZ: -13.4, // Aumentado para permitir acercarse a la pared trasera
    maxZ: 11 // Permitir algo de espacio en la parte frontal
};

// Array para almacenar cajas de colisión de decoraciones
let decorationCollisions = [];

// Configuración realista con optimización de rendimiento
const REALISTIC_CONFIG = {
    shadows: {
        enabled: true,
        type: THREE.PCFSoftShadowMap,
        mapSize: 1024 // Reducido de 2048 para mejor rendimiento
    },
    lighting: {
        physicallyCorrect: true,
        exposure: 1.2,
        shadowBias: -0.0001
    },
    materials: {
        enablePBR: true,
        envMapIntensity: 0.8
    },
    movement: {
        walkSpeed: 4.0,    // Aumentado de 2.5 para más rapidez
        runSpeed: 7.0,     // Aumentado de 4.5 para correr más rápido
        lookSpeed: 0.002,  // Aumentado de 0.0015 para rotación más rápida
        smoothing: 0.18,   // Reducido de 0.25 para menos "lag"
        acceleration: 12.0, // Aumentado de 8.0 para respuesta más rápida
        friction: 10.0     // Reducido de 12.0 para menos resistencia
    },
    performance: {
        maxLights: 20,           // Limitar número de luces
        simplifiedGeometry: true, // Usar geometrías más simples
        reducedShadows: true,     // Solo objetos importantes proyectan sombras
        textureMaxSize: 2048,     // Tamaño máximo de texturas
        antialias: false,         // Desactivar antialiasing para mejor FPS
        pixelRatio: Math.min(window.devicePixelRatio, 2) // Limitar pixel ratio
    }
};

// Configurar interactividad básica (sin videos)
function setupAdvancedInteractivity() {
    // Event listeners básicos para navegación
    window.addEventListener('click', onAdvancedMouseClick, false);
    window.addEventListener('mousemove', onMouseMove, false);

    // Cerrar con Escape y liberar pointer lock
    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            hideArtworkInfo();
            // Liberar pointer lock
            if (document.pointerLockElement) {
                document.exitPointerLock();
            }
        }
    });

    // Controles de audio
    const audioToggle = createAudioToggle();
    document.body.appendChild(audioToggle);

    // Instrucciones de controles
    showControlInstructions();
}

// Manejar clicks (solo mostrar información, sin videos)
function onAdvancedMouseClick(event) {
    console.log('🖱️ Click detectado');

    let mouseX, mouseY;

    if (document.pointerLockElement === renderer.domElement) {
        mouseX = 0;
        mouseY = 0;
    } else {
        mouseX = (event.clientX / window.innerWidth) * 2 - 1;
        mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    mouse.x = mouseX;
    mouse.y = mouseY;

    raycaster.setFromCamera(mouse, camera);

    // Verificar click en pinturas
    const artworkMeshes = artworks.map(artwork => artwork.mesh).filter(mesh => mesh);
    const artworkIntersects = raycaster.intersectObjects(artworkMeshes);

    if (artworkIntersects.length > 0) {
        const artworkMesh = artworkIntersects[0].object;
        const userData = artworkMesh.userData;

        console.log('🎨 Click en pintura:', userData.title);
        
        // Solo mostrar información (sin video)
        showClickNotification('📖 ' + userData.title);
        showArtworkInfo(userData, true);

        // Efecto visual de click
        const originalScale = artworkMesh.scale.clone();
        artworkMesh.scale.multiplyScalar(1.02);
        setTimeout(() => {
            artworkMesh.scale.copy(originalScale);
        }, 200);
    }
}

// Configuración inicial mejorada
async function init() {
    try {
        console.log('Iniciando museo virtual...');
        showLoader();

        // PASO 1: Precargar todas las imágenes primero
        updateLoaderProgress(0, 100, 'Preparando recursos');
        await preloadImagesWithProgress();
        
        console.log('✅ Todas las imágenes precargadas');
        updateLoaderProgress(10, 100, 'Inicializando WebGL');

        // Verificar compatibilidad WebGL
        if (!checkWebGLSupport()) {
            throw new Error('WebGL no está disponible en este navegador');
        }

        updateLoaderProgress(20, 100, 'Creando escena');

        // Crear escena
        scene = new THREE.Scene();
        scene.fog = new THREE.Fog(0x202020, 20, 100);
        console.log('Escena creada exitosamente');

        // Clock para animaciones
        clock = new THREE.Clock();

        updateLoaderProgress(30, 100, 'Configurando cámara');

        // Configurar cámara con parámetros más realistas
        camera = new THREE.PerspectiveCamera(
            60, // FOV más natural
            window.innerWidth / window.innerHeight,
            0.1,
            200
        );
        camera.position.set(0, 1.7, 8);

        updateLoaderProgress(40, 100, 'Inicializando renderer');

        // Configurar renderizador optimizado para rendimiento
        renderer = new THREE.WebGLRenderer({
            antialias: REALISTIC_CONFIG.performance.antialias,
            powerPreference: "high-performance",
            stencil: false,
            depth: true,
            preserveDrawingBuffer: false,
            failIfMajorPerformanceCaveat: false
        });

        console.log('🖥️ Creando renderer...', renderer ? '✅' : '❌');

        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(REALISTIC_CONFIG.performance.pixelRatio);
        renderer.setClearColor(0x202020, 1);

        // Configuración de renderizado optimizada
        renderer.shadowMap.enabled = REALISTIC_CONFIG.shadows.enabled;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Tipo optimizado
        renderer.shadowMap.autoUpdate = false; // Solo actualizar cuando sea necesario
        renderer.physicallyCorrectLights = true;
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 0.8; // Reducido para evitar sobreexposición

        // Configuraciones adicionales para mejor rendimiento
        renderer.sortObjects = false; // Desactivar sorting automático para evitar z-fighting
        renderer.logarithmicDepthBuffer = false;
        renderer.autoClear = true;
        renderer.autoClearColor = true;
        renderer.autoClearDepth = true;
        renderer.autoClearStencil = true;

        console.log('📺 Renderer configurado:', {
            size: { width: renderer.domElement.width, height: renderer.domElement.height },
            shadowMap: renderer.shadowMap.enabled,
            pixelRatio: renderer.getPixelRatio(),
            canvas: !!renderer.domElement
        });

        const container = document.getElementById('canvas-container');
        if (container) {
            container.appendChild(renderer.domElement);
            console.log('✅ Canvas agregado al contenedor');
        } else {
            console.error('❌ No se encontró el contenedor canvas-container');
        }

        updateLoaderProgress(50, 100, 'Configurando controles');

        // Configurar controles para navegación tipo walking
        setupWalkingControls();

        // Configurar raycaster
        raycaster = new THREE.Raycaster();
        mouse = new THREE.Vector2();

        updateLoaderProgress(60, 100, 'Creando galería');

        // Crear ambiente
        loadEnvironmentMap();
        createRealisticGallery();
        
        updateLoaderProgress(70, 100, 'Configurando iluminación');
        
        setupAdvancedLighting();
        
        updateLoaderProgress(80, 100, 'Cargando obras de arte');
        
        createRealisticArtworks();
        createMuseumObjects(); // Cambiar de createRealisticSculptures
        registerAllCollisions(); // Registrar todas las colisiones
        
        updateLoaderProgress(90, 100, 'Configurando interactividad');
        
        setupAdvancedInteractivity(); // Restaurado - necesario para mostrar bienvenida
        setupAudio();

        updateLoaderProgress(95, 100, 'Finalizando');

                // Verificar estado de la escena
        console.log('🎭 Estado de la escena:', {
            children: scene.children.length,
            fog: !!scene.fog,
            camera: camera.position
        });

        // Detectar y configurar controles móviles
        detectMobileDevice();
        if (isMobileDevice) {
            createMobileControls();
            adjustUIForMobile();
            console.log('📱 Controles móviles activados');
        }

        // Iniciar loop de animación
        animate();

        // Ocultar loader después de cargar (múltiples métodos de seguridad)
        checkLoadingProgress();

        // Método de seguridad #1: Timer simple
        setTimeout(() => {
            console.log('🔄 Timer de seguridad 1: ocultando loader a los 2 segundos');
            hideLoader();
        }, 2000);

        // Método de seguridad #2: Timer de emergencia
        setTimeout(() => {
            console.log('🚨 Timer de emergencia: forzando ocultación del loader');
            const loader = document.getElementById('loader');
            if (loader) {
                loader.style.display = 'none';
            }
        }, 3000);

        console.log('Museo inicializado exitosamente');

    } catch (error) {
        console.error('Error inicializando el museo:', error);
        console.error('Stack trace:', error.stack);

        // Solo mostrar alerta si es un error crítico
        if (error.message.includes('THREE') || error.message.includes('WebGL')) {
            setTimeout(() => {
                hideLoader();
                alert('Error crítico: ' + error.message + '\nPor favor, verifica que tu navegador soporte WebGL.');
            }, 1000);
        } else {
            // Para otros errores, solo loggear y continuar
            console.warn('Error no crítico, continuando carga...');
            hideLoader();
        }
    }
}

// Configurar controles tipo walking
function setupWalkingControls() {
    // Desactivar los controles orbit predeterminados
    controls = null;

    // Inicializar rotaciones objetivo y actuales
    targetRotationX = camera.rotation.x;
    targetRotationY = camera.rotation.y;
    currentRotationX = camera.rotation.x;
    currentRotationY = camera.rotation.y;

    // Asegurar orden de rotación correcto
    camera.rotation.order = 'YXZ';

    // Configurar eventos de teclado
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    // Configurar controles de mouse para mirar
    document.addEventListener('mousemove', onMouseLook);
    document.addEventListener('click', () => {
        // Bloquear puntero para mejor control
        if (document.pointerLockElement !== renderer.domElement) {
            renderer.domElement.requestPointerLock();
        }
    });

    // Configurar events de pointer lock
    document.addEventListener('pointerlockchange', onPointerLockChange);
}

// Manejar eventos de teclado
function onKeyDown(event) {
    // Resaltar tecla en UI
    highlightKey(event.code, true);
    
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = true;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = true;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = true;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveRight = true;
            break;
        case 'ShiftLeft':
        case 'ShiftRight':
            isRunning = true;
            updateMovementMode();
            break;
    }
}

function onKeyUp(event) {
    // Quitar resaltado de tecla en UI
    highlightKey(event.code, false);
    
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = false;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = false;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = false;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveRight = false;
            break;
        case 'ShiftLeft':
        case 'ShiftRight':
            isRunning = false;
            updateMovementMode();
            break;
    }
}

// Función para resaltar teclas en la UI
function highlightKey(code, isActive) {
    const keyMap = {
        'KeyW': 'w',
        'KeyA': 'a',
        'KeyS': 's',
        'KeyD': 'd',
        'ShiftLeft': 'shift',
        'ShiftRight': 'shift'
    };
    
    const keyName = keyMap[code];
    if (keyName) {
        const keyElement = document.querySelector(`[data-key="${keyName}"]`);
        if (keyElement) {
            if (isActive) {
                keyElement.classList.add('active');
            } else {
                keyElement.classList.remove('active');
            }
        }
    }
}

// Variables para suavizado de cámara
let targetRotationX = 0;
let targetRotationY = 0;
let currentRotationX = 0;
let currentRotationY = 0;

// Manejar movimiento del mouse para mirar
function onMouseLook(event) {
    if (document.pointerLockElement === renderer.domElement) {
        const movementX = event.movementX || 0;
        const movementY = event.movementY || 0;

        // Actualizar rotación objetivo en lugar de directamente
        targetRotationY -= movementX * REALISTIC_CONFIG.movement.lookSpeed;
        targetRotationX -= movementY * REALISTIC_CONFIG.movement.lookSpeed;

        // Limitar ángulo vertical (solo se puede mirar hacia arriba/abajo naturalmente)
        // -60° a +60° es un rango natural para la cabeza humana
        const maxVerticalAngle = Math.PI / 3; // 60 grados
        targetRotationX = Math.max(-maxVerticalAngle, Math.min(maxVerticalAngle, targetRotationX));
        
        // NO limitar la rotación horizontal (puedes girar 360°)
    }
}

// Manejar cambios de pointer lock
function onPointerLockChange() {
    const crosshair = document.getElementById('crosshair');
    const instructions = document.querySelector('.instructions');

    if (document.pointerLockElement === renderer.domElement) {
        // Pointer está bloqueado - mostrar crosshair y ocultar cursor
        renderer.domElement.style.cursor = 'none';
        if (crosshair) crosshair.classList.add('active');
        
        // Ocultar cartel de instrucciones si aún está visible
        if (instructions && instructions.parentNode) {
            instructions.parentNode.removeChild(instructions);
        }
    } else {
        // Pointer desbloqueado - ocultar crosshair y mostrar cursor
        renderer.domElement.style.cursor = 'default';
        if (crosshair) crosshair.classList.remove('active');
    }
}

// Actualizar modo de movimiento en UI
function updateMovementMode() {
    const modeElement = document.getElementById('movement-mode');
    if (modeElement) {
        modeElement.textContent = isRunning ? 'Correr' : 'Caminar';
    }
}

// Actualizar posición en UI
function updatePositionDisplay() {
    const posElement = document.getElementById('position-display');
    if (posElement) {
        const x = Math.round(camera.position.x * 10) / 10;
        const z = Math.round(camera.position.z * 10) / 10;
        posElement.textContent = `${x}, ${z}`;
    }
    
    // Actualizar FPS
    const fpsElement = document.getElementById('fps-counter');
    if (fpsElement) {
        fpsElement.textContent = Math.round(fps);
        
        // Colorear según rendimiento
        if (fps > 50) {
            fpsElement.style.color = '#4ade80'; // Verde
        } else if (fps > 30) {
            fpsElement.style.color = '#fbbf24'; // Amarillo
        } else {
            fpsElement.style.color = '#f87171'; // Rojo
        }
    }
}

// Funciones de loader
function showLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = 'flex';
        console.log('Mostrando loader');
    }
}

function hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.classList.add('hidden');
        console.log('Ocultando loader - Museo cargado completamente');

        // Forzar ocultación después de la transición
        setTimeout(() => {
            loader.classList.add('force-hidden');
        }, 600);
    }
}

// Actualizar texto del loader con progreso
function updateLoaderProgress(current, total, message = 'Cargando recursos') {
    const loaderText = document.querySelector('.loader-content p');
    if (loaderText) {
        const percentage = Math.round((current / total) * 100);
        loaderText.textContent = `${message}... ${percentage}%`;
    }
}

// Precargar imágenes con progreso visible
function preloadImagesWithProgress() {
    return new Promise((resolve) => {
        const imageUrls = [
            './src/assets/images/Amanecer - Byron.jpeg',
            './src/assets/images/Bailarina - Byron.jpg',
            './src/assets/images/Byron2.png',
            './src/assets/images/Copas - Byron.jpg',
            './src/assets/images/Escultura de pie - Byron.jpg',
            './src/assets/images/Escultura sentada - Byron.jpg',
            './src/assets/images/Frutas - Byron.jpg',
            './src/assets/images/Maquillaje - Byron.jpg',
            './src/assets/images/Musicos - Byron.jpg',
            './src/assets/images/MusicosM - Byron.jpg',
            './src/assets/images/Naturaleza Muerta - Byron.jpg',
            './src/assets/images/Rocas y Cielo - Byron.jpg',
            './src/assets/images/Vanidad - Byron.jpg',
            './src/assets/images/Vela - Byron.jpg',
            './src/assets/images/Vela2 - Byron.jpg',
            './src/assets/images/Violincello - Byron.jpg'
        ];

        let loadedCount = 0;
        const totalImages = imageUrls.length;
        const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        console.log('📱 Dispositivo:', isMobileDevice ? 'Móvil' : 'Desktop');
        console.log('🖼️ Iniciando precarga de', totalImages, 'imágenes...');
        
        updateLoaderProgress(0, totalImages, 'Cargando imágenes');

        const loadImage = (url, index) => {
            return new Promise((resolveImage) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                
                // Timeout por imagen (más largo en móvil)
                const timeout = setTimeout(() => {
                    console.warn(`⏱️ Timeout imagen ${index + 1}/${totalImages}:`, url);
                    loadedCount++;
                    updateLoaderProgress(loadedCount, totalImages, 'Cargando imágenes');
                    resolveImage();
                }, isMobileDevice ? 15000 : 10000);

                img.onload = () => {
                    clearTimeout(timeout);
                    loadedCount++;
                    console.log(`✅ ${loadedCount}/${totalImages} - ${url} (${img.width}x${img.height})`);
                    updateLoaderProgress(loadedCount, totalImages, 'Cargando imágenes');
                    resolveImage();
                };

                img.onerror = (error) => {
                    clearTimeout(timeout);
                    loadedCount++;
                    console.error(`❌ ${loadedCount}/${totalImages} - Error:`, url);
                    updateLoaderProgress(loadedCount, totalImages, 'Cargando imágenes');
                    resolveImage();
                };

                // Cache busting en móviles
                const cacheBuster = isMobileDevice ? `?v=${Date.now()}` : '';
                img.src = url + cacheBuster;
            });
        };

        // Cargar todas las imágenes en paralelo
        Promise.all(imageUrls.map((url, index) => loadImage(url, index)))
            .then(() => {
                console.log(`🎉 Precarga completada: ${loadedCount}/${totalImages} imágenes`);
                updateLoaderProgress(totalImages, totalImages, 'Imágenes cargadas');
                setTimeout(resolve, 500); // Pequeña pausa para mostrar 100%
            })
            .catch((error) => {
                console.error('Error en precarga:', error);
                resolve(); // Resolver de todos modos
            });
    });
}

// Verificar progreso de carga
function checkLoadingProgress() {
    let attempts = 0;
    const maxAttempts = 30; // 3 segundos máximo

    const checkInterval = setInterval(() => {
        attempts++;

        // Verificar que Three.js esté inicializado
        const sceneReady = scene && scene.children.length > 0;
        const rendererReady = renderer && renderer.domElement;

        console.log(`Intento ${attempts}: Escena lista: ${sceneReady}, Renderer listo: ${rendererReady}`);

        if (sceneReady && rendererReady) {
            // Todo listo, ocultar loader
            console.log('✅ Museo completamente cargado');
            clearInterval(checkInterval);
            setTimeout(hideLoader, 300);
        } else if (attempts >= maxAttempts) {
            // Timeout alcanzado, forzar ocultación
            console.warn('⚠️ Timeout alcanzado, forzando ocultación del loader');
            clearInterval(checkInterval);
            hideLoader();
        }
    }, 100); // Revisar cada 100ms

    // Timeout de seguridad adicional
    setTimeout(() => {
        console.log('🔄 Timeout de seguridad: forzando ocultación del loader');
        hideLoader();
    }, 4000);
}

// Cargar mapa de entorno para reflejos realistas
function loadEnvironmentMap() {
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    // Crear un gradiente de cielo realista
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
    scene.add(sky);
}

// Crear textura de mármol de lujo para el piso con máximo realismo
function createLuxuryMarbleTexture() {
    const size = 2048; // Alta resolución para el piso
    
    // Crear textura difusa con algoritmos avanzados
    function generateLuxuryMarbleDiffuse() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = size;
        canvas.height = size;

        // Base con variación sutil de color usando ruido Perlin simulado
        const imageData = ctx.createImageData(size, size);
        const data = imageData.data;
        
        // Función de ruido simplificada para variaciones naturales
        function noise(x, y, scale = 0.01) {
            return (Math.sin(x * scale) + Math.cos(y * scale) + Math.sin((x + y) * scale * 0.5)) / 3;
        }
        
        // Crear base con variación de color muy sutil
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const i = (y * size + x) * 4;
                const baseVariation = noise(x, y, 0.008) * 15;
                const baseColor = 248 + baseVariation;
                
                data[i] = Math.min(255, Math.max(240, baseColor));     // R
                data[i + 1] = Math.min(255, Math.max(240, baseColor)); // G
                data[i + 2] = Math.min(255, Math.max(245, baseColor + 2)); // B (ligeramente más azul)
                data[i + 3] = 255; // A
            }
        }
        
        ctx.putImageData(imageData, 0, 0);

        // Función avanzada para crear vetas orgánicas ultra-realistas
        function drawAdvancedVein(startX, startY, color, opacity, thickness, complexity = 8, turbulence = 1) {
            ctx.globalCompositeOperation = 'multiply';
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            // Crear múltiples capas para una veta más realista
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
                    // Evolución más natural de la dirección
                    direction += (Math.random() - 0.5) * 0.8 * turbulence;
                    const distance = (Math.random() * 120 + 80) * (1 - i / complexity * 0.3);
                    
                    const nextX = currentX + Math.cos(direction) * distance;
                    const nextY = currentY + Math.sin(direction) * distance;
                    
                    // Control points más sofisticados para curvas naturales
                    const cp1X = currentX + Math.cos(direction - 0.5) * distance * 0.3;
                    const cp1Y = currentY + Math.sin(direction - 0.5) * distance * 0.3;
                    const cp2X = nextX - Math.cos(direction + 0.5) * distance * 0.3;
                    const cp2Y = nextY - Math.sin(direction + 0.5) * distance * 0.3;
                    
                    ctx.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, nextX, nextY);
                    
                    // Añadir ramificaciones ocasionales
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

        // Vetas principales negras/grises ultra-realistas
        for (let i = 0; i < 8; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const grayValue = Math.random() * 40 + 20; // Grises muy oscuros para contraste
            const blueTint = Math.random() * 10; // Ligero tinte azul natural
            drawAdvancedVein(x, y, `rgb(${grayValue}, ${grayValue}, ${grayValue + blueTint})`, 0.7 + Math.random() * 0.2, Math.random() * 20 + 12, 8 + Math.random() * 4, 1.2);
        }

        // Vetas secundarias de transición
        for (let i = 0; i < 15; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const grayValue = Math.random() * 60 + 70; // Grises medios
            drawAdvancedVein(x, y, `rgb(${grayValue}, ${grayValue}, ${grayValue + 5})`, 0.4 + Math.random() * 0.3, Math.random() * 12 + 6, 5 + Math.random() * 3, 0.8);
        }

        // Vetas finas de detalle
        for (let i = 0; i < 25; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const grayValue = Math.random() * 40 + 120; // Grises claros
            drawAdvancedVein(x, y, `rgb(${grayValue}, ${grayValue}, ${grayValue})`, 0.2 + Math.random() * 0.2, Math.random() * 6 + 2, 3 + Math.random() * 2, 0.5);
        }

        // Vetas doradas premium (como en mármol de lujo)
        for (let i = 0; i < 6; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const goldR = Math.random() * 40 + 180;
            const goldG = Math.random() * 30 + 150;
            const goldB = Math.random() * 20 + 80;
            drawAdvancedVein(x, y, `rgb(${goldR}, ${goldG}, ${goldB})`, 0.35 + Math.random() * 0.15, Math.random() * 8 + 3, 4 + Math.random() * 2, 0.7);
        }

        // Manchas y variaciones sutiles
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

        // Cristalizaciones y brillos (efecto de mármol pulido)
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
        try {
            texture.generateMipmaps = true;
            texture.minFilter = THREE.LinearMipmapLinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(4, 4);
            texture.encoding = THREE.sRGBEncoding;
            texture.needsUpdate = true;
            return texture;
        } catch (error) {
            console.error('Error configurando textura de mármol:', error);
            // Retornar textura básica en caso de error
            const basicTexture = new THREE.CanvasTexture(canvas);
            basicTexture.needsUpdate = true;
            return basicTexture;
        }
    }

    // Crear normal map para el mármol
    function generateLuxuryMarbleNormal() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = size;
        canvas.height = size;

        // Base del normal map
        ctx.fillStyle = '#8080ff';
        ctx.fillRect(0, 0, size, size);

        // Relieve de las vetas principales
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

        // Normal map para vetas principales
        for (let i = 0; i < 15; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const intensity = Math.random() * 30 + 20;
            drawNormalVein(x, y, intensity, Math.random() * 12 + 6, 5 + Math.random() * 4);
        }

        // Variaciones sutiles para superficie pulida
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
        texture.encoding = THREE.LinearEncoding; // Normal maps use linear encoding
        return texture;
    }

    console.log('🎨 Creando textura de mármol de lujo para el piso...');
    
    return {
        diffuse: generateLuxuryMarbleDiffuse(),
        normal: generateLuxuryMarbleNormal()
    };
}

// Crear texturas procedurales para las paredes del museo
function createWallTextures() {
    const textures = {};

    // Función auxiliar para crear textura con normal map
    function createTextureWithNormal(diffuseGenerator, normalGenerator, size = 512) {
        const diffuseTexture = diffuseGenerator(size);
        const normalTexture = normalGenerator(size);
        
        return {
            diffuse: diffuseTexture,
            normal: normalTexture
        };
    }

    // 1. Textura de mármol de pared ultra-realista
    function generateMarbleTexture(size) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = size;
        canvas.height = size;

        // Base de mármol con variación natural usando ruido
        const imageData = ctx.createImageData(size, size);
        const data = imageData.data;
        
        // Crear variación de base más realista
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const i = (y * size + x) * 4;
                
                // Ruido múltiple para variación natural
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

        // Vetas de mármol
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

        // Vetas más finas
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
    }

    function generateMarbleNormal(size) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = size;
        canvas.height = size;

        // Base azul para normal map
        ctx.fillStyle = '#8080ff';
        ctx.fillRect(0, 0, size, size);

        // Variaciones sutiles
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
    }

    // 2. Textura de piedra natural ultra-realista
    function generateStoneTexture(size) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = size;
        canvas.height = size;

        // Base de piedra con múltiples capas de ruido
        const imageData = ctx.createImageData(size, size);
        const data = imageData.data;

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const i = (y * size + x) * 4;
                
                // Múltiples frecuencias de ruido para textura natural
                const noise1 = Math.sin(x * 0.02) * Math.cos(y * 0.02) * 20;
                const noise2 = Math.sin(x * 0.05 + y * 0.03) * 15;
                const noise3 = Math.sin(x * 0.1 + y * 0.15) * 8;
                const noise4 = (Math.random() - 0.5) * 25;
                
                const totalNoise = noise1 + noise2 + noise3 + noise4;
                
                // Colores base de piedra natural
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

        // Grietas y fisuras
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
    }

    function generateStoneNormal(size) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = size;
        canvas.height = size;

        ctx.fillStyle = '#8080ff';
        ctx.fillRect(0, 0, size, size);

        // Relieve de piedra
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
    }

    // 3. Textura de concreto moderno ultra-realista
    function generateConcreteTexture(size) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = size;
        canvas.height = size;

        // Base de concreto con múltiples capas de realismo
        const imageData = ctx.createImageData(size, size);
        const data = imageData.data;

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const i = (y * size + x) * 4;
                
                // Simulación de agregados en el concreto
                const aggregate1 = Math.sin(x * 0.03) * Math.cos(y * 0.025) * 12;
                const aggregate2 = Math.sin(x * 0.08 + y * 0.06) * 8;
                const fine_texture = Math.sin(x * 0.2 + y * 0.18) * 4;
                const randomness = (Math.random() - 0.5) * 20;
                
                const totalVariation = aggregate1 + aggregate2 + fine_texture + randomness;
                
                // Color base de concreto moderno
                const baseColor = 235 + totalVariation * 0.4;
                
                data[i] = Math.min(255, Math.max(210, baseColor));     // R
                data[i + 1] = Math.min(255, Math.max(210, baseColor)); // G
                data[i + 2] = Math.min(255, Math.max(210, baseColor)); // B
                data[i + 3] = 255; // A
            }
        }
        
        ctx.putImageData(imageData, 0, 0);

        // Líneas de moldaje más realistas
        ctx.globalCompositeOperation = 'overlay';
        const lineSpacing = size / 3;
        for (let i = 1; i < 3; i++) {
            // Línea principal
            ctx.strokeStyle = 'rgba(200, 200, 200, 0.8)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(0, i * lineSpacing);
            ctx.lineTo(size, i * lineSpacing);
            ctx.stroke();
            
            // Sombra de la línea
            ctx.strokeStyle = 'rgba(180, 180, 180, 0.4)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, i * lineSpacing + 2);
            ctx.lineTo(size, i * lineSpacing + 2);
            ctx.stroke();
        }

        // Manchas y variaciones de humedad
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
    }

    function generateConcreteNormal(size) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = size;
        canvas.height = size;

        ctx.fillStyle = '#8080ff';
        ctx.fillRect(0, 0, size, size);

        // Relieve del concreto
        for (let i = 0; i < 150; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const radius = Math.random() * 8 + 2;
            
            ctx.fillStyle = `rgba(${120 + Math.random() * 20}, ${120 + Math.random() * 20}, 255, 0.3)`;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }

        // Líneas de moldaje en normal
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
    }

    // 4. Textura de yeso artesanal ultra-realista
    function generatePlasterTexture(size) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = size;
        canvas.height = size;

        // Base de yeso con variación natural
        const imageData = ctx.createImageData(size, size);
        const data = imageData.data;

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const i = (y * size + x) * 4;
                
                // Simulación de textura de yeso aplicado a mano
                const brush1 = Math.sin(x * 0.015 + y * 0.008) * 8;
                const brush2 = Math.sin(x * 0.03 + y * 0.025) * 5;
                const trowel = Math.sin(x * 0.007 + y * 0.012) * 12;
                const fine_detail = (Math.random() - 0.5) * 6;
                
                const texture_variation = brush1 + brush2 + trowel + fine_detail;
                
                // Color base de yeso natural
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

        // Marcas de herramientas más realistas
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
            
            // Marca principal de la herramienta
            const gradient = ctx.createLinearGradient(-length/2, -width/2, length/2, width/2);
            gradient.addColorStop(0, 'rgba(248, 248, 246, 0)');
            gradient.addColorStop(0.5, 'rgba(250, 248, 245, 0.6)');
            gradient.addColorStop(1, 'rgba(248, 248, 246, 0)');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(-length/2, -width/2, length, width);
            
            ctx.restore();
        }

        // Variaciones sutiles de color por secado
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
    }

    function generatePlasterNormal(size) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = size;
        canvas.height = size;

        ctx.fillStyle = '#8080ff';
        ctx.fillRect(0, 0, size, size);

        // Relieve suave del yeso
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
    }

    // Configurar texturas con validación
    function configureTexture(texture) {
        if (!texture) {
            console.error('Textura inválida detectada');
            return null;
        }

        try {
            texture.generateMipmaps = true;
            texture.minFilter = THREE.LinearMipmapLinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(2, 2);
            texture.encoding = THREE.sRGBEncoding;
            texture.needsUpdate = true;
            return texture;
        } catch (error) {
            console.error('Error configurando textura:', error);
            return null;
        }
    }

    // Generar todas las texturas
    textures.marble = configureTexture(generateMarbleTexture(1024));
    textures.marbleNormal = configureTexture(generateMarbleNormal(1024));
    
    textures.stone = configureTexture(generateStoneTexture(1024));
    textures.stoneNormal = configureTexture(generateStoneNormal(1024));
    
    textures.concrete = configureTexture(generateConcreteTexture(1024));
    textures.concreteNormal = configureTexture(generateConcreteNormal(1024));
    
    textures.plaster = configureTexture(generatePlasterTexture(1024));
    textures.plasterNormal = configureTexture(generatePlasterNormal(1024));

    console.log('🎨 Texturas de paredes creadas exitosamente:', Object.keys(textures));
    
    return textures;
}

// Crear sistema de iluminación de techo en grid para cobertura completa
function createCeilingLightGrid() {
    // Grid de luces puntuales en el techo para iluminación uniforme
    const gridSize = 4; // 4x4 = 16 luces (reducido de 5x5)
    const spacing = 6;  // Espaciado entre luces (aumentado para cubrir con menos luces)
    const height = 4.6; // Altura de las luces
    const startX = -9;
    const startZ = -9;

    for (let x = 0; x < gridSize; x++) {
        for (let z = 0; z < gridSize; z++) {
            const posX = startX + (x * spacing);
            const posZ = startZ + (z * spacing);

            // Luz puntual principal - intensidad reducida
            const ceilingLight = new THREE.PointLight(0xfff8e7, 9, 15, 2.0);
            ceilingLight.position.set(posX, height, posZ);
            ceilingLight.castShadow = false; // Desactivar sombras para optimizar
            
            scene.add(ceilingLight);

            // Fixture visual pequeño para cada luz
            const fixtureGeometry = new THREE.CylinderGeometry(0.12, 0.15, 0.08, 12);
            const fixtureMaterial = new THREE.MeshPhysicalMaterial({
                color: 0x2a2a2a,
                roughness: 0.3,
                metalness: 0.8,
                emissive: 0xffffff,
                emissiveIntensity: 0.05
            });
            const fixture = new THREE.Mesh(fixtureGeometry, fixtureMaterial);
            fixture.position.set(posX, height + 0.2, posZ);
            fixture.castShadow = false;
            scene.add(fixture);

            // Pequeño difusor
            const diffuserGeometry = new THREE.CircleGeometry(0.18, 16);
            const diffuserMaterial = new THREE.MeshPhysicalMaterial({
                color: 0xffffff,
                roughness: 0.9,
                metalness: 0.0,
                emissive: 0xfff5e6,
                emissiveIntensity: 0.2,
                transparent: true,
                opacity: 0.9,
                side: THREE.DoubleSide
            });
            const diffuser = new THREE.Mesh(diffuserGeometry, diffuserMaterial);
            diffuser.position.set(posX, height + 0.15, posZ);
            diffuser.rotation.x = -Math.PI / 2;
            scene.add(diffuser);
        }
    }

    console.log('💡 Sistema de iluminación de techo en grid creado: ' + (gridSize * gridSize) + ' luces');
}

// Crear galería más realista
function createRealisticGallery() {
    // Limpiar array de paredes para colisiones
    walls = [];

    // Material del suelo con textura de mármol mejorada pero compatible
    const floorTexture = createLuxuryMarbleTexture();
    const floorMaterial = new THREE.MeshPhysicalMaterial({
        map: floorTexture.diffuse,
        normalMap: floorTexture.normal,
        color: 0xffffff,
        roughness: 0.05,
        metalness: 0.0,
        reflectivity: 0.9,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        envMapIntensity: 0.8
    });

    // Suelo principal con geometría más detallada
    const floorGeometry = new THREE.PlaneGeometry(120, 120, 100, 100);

    // Añadir variación sutil al suelo para mayor realismo
    const vertices = floorGeometry.attributes.position.array;
    for (let i = 2; i < vertices.length; i += 3) {
        vertices[i] += (Math.random() - 0.5) * 0.008; // Variación muy sutil
    }
    floorGeometry.attributes.position.needsUpdate = true;
    floorGeometry.computeVertexNormals();

    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Crear texturas procedurales diferentes para cada pared
    const wallTextures = createWallTextures();

    // Paredes con más detalle y realismo
    const wallHeight = 4.8;
    const wallThickness = 0.25;

    // Pared trasera (la que faltaba) - Textura de mármol elegante
    const backWallGeometry = new THREE.BoxGeometry(28, wallHeight, wallThickness, 8, 8, 1);
    const backWallMaterial = new THREE.MeshPhysicalMaterial({
        map: wallTextures.marble,
        normalMap: wallTextures.marbleNormal,
        color: 0xffffff,
        roughness: 0.2,
        metalness: 0.0,
        reflectivity: 0.5,
        envMapIntensity: 0.7,
        clearcoat: 0.6,
        clearcoatRoughness: 0.1
    });
    const backWall = new THREE.Mesh(backWallGeometry, backWallMaterial);
    backWall.position.set(0, wallHeight / 2, -14);
    backWall.receiveShadow = true;
    backWall.castShadow = true;
    scene.add(backWall);
    walls.push(backWall);

    // Pared frontal (entrada) - Textura de piedra natural
    const frontWallGeometry = new THREE.BoxGeometry(28, wallHeight, wallThickness, 8, 8, 1);
    const frontWallMaterial = new THREE.MeshPhysicalMaterial({
        map: wallTextures.stone,
        normalMap: wallTextures.stoneNormal,
        color: 0xffffff,
        roughness: 0.8,
        metalness: 0.0,
        reflectivity: 0.2,
        envMapIntensity: 0.4
    });
    const frontWall = new THREE.Mesh(frontWallGeometry, frontWallMaterial);
    frontWall.position.set(0, wallHeight / 2, 14);
    frontWall.receiveShadow = true;
    frontWall.castShadow = true;
    scene.add(frontWall);
    walls.push(frontWall);

    // Paredes laterales
    const sideWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, 28, 1, 8, 8);

    // Pared izquierda - Textura de concreto moderno
    const leftWallMaterial = new THREE.MeshPhysicalMaterial({
        map: wallTextures.concrete,
        normalMap: wallTextures.concreteNormal,
        color: 0xf5f5f5,
        roughness: 0.9,
        metalness: 0.0,
        reflectivity: 0.1,
        envMapIntensity: 0.3
    });
    const leftWall = new THREE.Mesh(sideWallGeometry, leftWallMaterial);
    leftWall.position.set(-14, wallHeight / 2, 0);
    leftWall.receiveShadow = true;
    leftWall.castShadow = true;
    scene.add(leftWall);
    walls.push(leftWall);

    // Pared derecha - Misma textura que la izquierda (concreto moderno)
    const rightWallMaterial = new THREE.MeshPhysicalMaterial({
        map: wallTextures.concrete,
        normalMap: wallTextures.concreteNormal,
        color: 0xf5f5f5,
        roughness: 0.9,
        metalness: 0.0,
        reflectivity: 0.1,
        envMapIntensity: 0.3
    });
    const rightWall = new THREE.Mesh(sideWallGeometry, rightWallMaterial);
    rightWall.position.set(14, wallHeight / 2, 0);
    rightWall.receiveShadow = true;
    rightWall.castShadow = true;
    scene.add(rightWall);
    walls.push(rightWall);

    // Techo complejo con tragaluz cerrado completamente
    createCompleteCeiling();

    // Detalles arquitectónicos adicionales
    createArchitecturalDetails();
}

// Crear techo completo sin agujeros
function createCompleteCeiling() {
    const ceilingMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.0,
        envMapIntensity: 0.2
    });

    // Techo principal COMPLETO - sin aberturas
    const mainCeilingGeometry = new THREE.BoxGeometry(28, 0.2, 28);
    const mainCeiling = new THREE.Mesh(mainCeilingGeometry, ceilingMaterial);
    mainCeiling.position.set(0, 4.9, 0);
    mainCeiling.receiveShadow = true;
    mainCeiling.castShadow = true;
    scene.add(mainCeiling);

    // Crear tragaluz con marco de vidrio SOBRE el techo (no un agujero)
    createSkylight();

    // Vigas estructurales decorativas
    createCeilingBeams();
}

// Crear tragaluz realista SOBRE el techo
function createSkylight() {
    // Marco del tragaluz elevado
    const frameThickness = 0.15;
    const skylightSize = 8;
    const elevation = 0.3; // Elevación sobre el techo

    const frameMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x666666,
        roughness: 0.2,
        metalness: 0.9,
        envMapIntensity: 1.0
    });

    // Marco exterior elevado
    const frameGeometry = new THREE.BoxGeometry(skylightSize + frameThickness * 2, frameThickness, skylightSize + frameThickness * 2);
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.position.set(0, 5.0 + elevation, 0);
    frame.castShadow = false; // Optimización: sin sombras en elementos decorativos
    scene.add(frame);

    // Paredes del tragaluz (para crear profundidad)
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
        wallMesh.castShadow = false; // Optimización: sin sombras
        wallMesh.receiveShadow = true;
        scene.add(wallMesh);
    });

    // Vidrio del tragaluz con propiedades físicas realistas
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
    scene.add(glass);
}

// Crear vigas del techo
function createCeilingBeams() {
    const beamMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xe8e8e8,
        roughness: 0.6,
        metalness: 0.1,
        envMapIntensity: 0.4
    });

    // Vigas principales
    const mainBeamPositions = [
        { size: [0.3, 0.5, 28], pos: [-4, 4.7, 0] },
        { size: [0.3, 0.5, 28], pos: [4, 4.7, 0] },
        { size: [28, 0.5, 0.3], pos: [0, 4.7, -4] },
        { size: [28, 0.5, 0.3], pos: [0, 4.7, 4] }
    ];

    mainBeamPositions.forEach(beam => {
        const geometry = new THREE.BoxGeometry(...beam.size);
        const mesh = new THREE.Mesh(geometry, beamMaterial);
        mesh.position.set(...beam.pos);
        mesh.castShadow = false; // Optimización: vigas sin sombras
        mesh.receiveShadow = true;
        scene.add(mesh);
    });
}

// Detalles arquitectónicos adicionales
function createArchitecturalDetails() {
    // Molduras base más detalladas
    const moldingMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xf5f5f5,
        roughness: 0.6,
        metalness: 0.05,
        envMapIntensity: 0.3
    });

    // Molduras horizontales en las paredes
    const moldingConfigs = [
        { size: [28, 0.08, 0.08], pos: [0, 0.1, -13.9] },
        { size: [28, 0.08, 0.08], pos: [0, 4.6, -13.9] },
        { size: [0.08, 4.8, 0.08], pos: [-13.9, 2.4, 0] },
        { size: [0.08, 4.8, 0.08], pos: [13.9, 2.4, 0] }
    ];

    moldingConfigs.forEach(molding => {
        const geometry = new THREE.BoxGeometry(...molding.size);
        const mesh = new THREE.Mesh(geometry, moldingMaterial);
        mesh.position.set(...molding.pos);
        mesh.castShadow = true;
        scene.add(mesh);
    });

    // Crear columnas decorativas
    createDecorativePillars();

    // Añadir rodapiés
    createBaseboards();
    
    // Elementos arquitectónicos sutiles
    implementWallSconces();
    // createBackWallDecoration(); // Comentado - eliminado por solicitud del usuario
}

// Crear columnas decorativas
function createDecorativePillars() {
    const pillarMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xf8f8f8,
        roughness: 0.4,
        metalness: 0.1,
        envMapIntensity: 0.6
    });

    const pillarPositions = [
        [-12, 2.4, -12],
        [12, 2.4, -12],
        [-12, 2.4, 12],
        [12, 2.4, 12]
    ];

    pillarPositions.forEach(pos => {
        // Base de la columna (reducido de 16 a 8 segmentos)
        const baseGeometry = new THREE.CylinderGeometry(0.35, 0.4, 0.3, 8);
        const base = new THREE.Mesh(baseGeometry, pillarMaterial);
        base.position.set(pos[0], 0.15, pos[2]);
        base.castShadow = false; // Optimización: sin sombras
        base.receiveShadow = true;
        scene.add(base);

        // Fuste de la columna (reducido de 16 a 8 segmentos)
        const shaftGeometry = new THREE.CylinderGeometry(0.25, 0.3, 4.2, 8);
        const shaft = new THREE.Mesh(shaftGeometry, pillarMaterial);
        shaft.position.set(pos[0], pos[1], pos[2]);
        shaft.castShadow = REALISTIC_CONFIG.performance.reducedShadows ? false : true;
        shaft.receiveShadow = true;
        scene.add(shaft);

        // Capitel (reducido de 16 a 8 segmentos)
        const capitalGeometry = new THREE.CylinderGeometry(0.4, 0.25, 0.3, 8);
        const capital = new THREE.Mesh(capitalGeometry, pillarMaterial);
        capital.position.set(pos[0], 4.65, pos[2]);
        capital.castShadow = false; // Optimización: sin sombras
        capital.receiveShadow = true;
        scene.add(capital);
        
        // Agregar colisión para esta columna
        decorationCollisions.push({
            x: pos[0],
            z: pos[2],
            radius: 0.5 // Radio de colisión de la columna
        });
    });
    
    console.log('🏛️ Columnas decorativas creadas con colisiones');
}

// Crear rodapiés
function createBaseboards() {
    const baseboardMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xf0f0f0,
        roughness: 0.7,
        metalness: 0.05,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1
    });

    const baseboardConfigs = [
        { size: [28, 0.15, 0.1], pos: [0, 0.075, -13.85] },  // Más afuera y más grueso
        { size: [0.1, 0.15, 28], pos: [-13.85, 0.075, 0] },  // Más afuera y más grueso
        { size: [0.1, 0.15, 28], pos: [13.85, 0.075, 0] }    // Más afuera y más grueso
    ];

    baseboardConfigs.forEach(board => {
        const geometry = new THREE.BoxGeometry(...board.size);
        const mesh = new THREE.Mesh(geometry, baseboardMaterial);
        mesh.position.set(...board.pos);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.renderOrder = 1; // Asegurar que se renderice correctamente
        scene.add(mesh);
    });
}

// Iluminación avanzada y realista
function setupAdvancedLighting() {
    // Luz ambiental reducida para evitar sobreexposición
    const ambientLight = new THREE.AmbientLight(0x404040, 0.18);
    scene.add(ambientLight);

    // Sistema de iluminación de techo en grid para cobertura completa
    createCeilingLightGrid();

    // Luz principal del tragaluz (reducida)
    const mainSkylight = new THREE.DirectionalLight(0xfff8dc, 0.9);
    mainSkylight.position.set(2, 20, 3);
    mainSkylight.target.position.set(0, 0, 0);
    mainSkylight.castShadow = true;

    // Configuración de sombras optimizada (reducida para performance)
    mainSkylight.shadow.mapSize.width = 2048; // Reducido de 4096
    mainSkylight.shadow.mapSize.height = 2048;
    mainSkylight.shadow.camera.near = 1;
    mainSkylight.shadow.camera.far = 50;
    mainSkylight.shadow.camera.left = -25;
    mainSkylight.shadow.camera.right = 25;
    mainSkylight.shadow.camera.top = 25;
    mainSkylight.shadow.camera.bottom = -25;
    mainSkylight.shadow.bias = REALISTIC_CONFIG.lighting.shadowBias;
    mainSkylight.shadow.radius = 8; // Reducido de 12

    scene.add(mainSkylight);
    scene.add(mainSkylight.target);

    // Luces de relleno reducidas
    const fillLight1 = new THREE.DirectionalLight(0xbde3ff, 0.27);
    fillLight1.position.set(-15, 12, 8);
    scene.add(fillLight1);

    const fillLight2 = new THREE.DirectionalLight(0xffe4b5, 0.22);
    fillLight2.position.set(15, 8, -8);
    scene.add(fillLight2);

    const fillLight3 = new THREE.DirectionalLight(0xffffff, 0.18);
    fillLight3.position.set(0, 15, 10);
    scene.add(fillLight3);

    // Focos LED realistas para obras
    createRealisticSpotlights();

    // Iluminación de ambiente general
    createAmbientLighting();
    
    console.log('💡 Sistema de iluminación completo inicializado');
}

// Crear focos LED realistas
function createRealisticSpotlights() {
    const spotLightConfigs = [
        // Pared frontal - obras principales (con sombras) - alturas uniformes
        { pos: [0, 4.4, -12], target: [0, 2.8, -13.7], intensity: 31, color: 0xffffff, castShadow: true },
        { pos: [-6.5, 4.4, -12], target: [-6.5, 2.6, -13.7], intensity: 27, color: 0xfff8dc, castShadow: true },
        { pos: [6.5, 4.4, -12], target: [6.5, 2.6, -13.7], intensity: 27, color: 0xfff8dc, castShadow: true },
        { pos: [-9.5, 4.4, -12], target: [-9.5, 2.6, -13.7], intensity: 22, color: 0xfff8dc, castShadow: false },
        { pos: [9.5, 4.4, -12], target: [9.5, 2.6, -13.7], intensity: 22, color: 0xfff8dc, castShadow: false },
        
        // Pared izquierda (sin sombras) - altura uniforme
        { pos: [-12, 4.4, -3], target: [-13.7, 2.6, -3], intensity: 22, color: 0xffffff, castShadow: false },
        { pos: [-12, 4.4, 6], target: [-13.7, 2.6, 6], intensity: 22, color: 0xfff8dc, castShadow: false },
        { pos: [-12, 4.4, -9], target: [-13.7, 2.6, -9], intensity: 19, color: 0xfff8dc, castShadow: false },
        
        // Pared derecha (sin sombras) - altura uniforme
        { pos: [12, 4.4, 3], target: [13.7, 2.6, 3], intensity: 22, color: 0xffffff, castShadow: false },
        { pos: [12, 4.4, -6], target: [13.7, 2.6, -6], intensity: 22, color: 0xfff8dc, castShadow: false },
        { pos: [12, 4.4, 9], target: [13.7, 2.6, 9], intensity: 19, color: 0xfff8dc, castShadow: false },
        
        // Pared trasera/entrada (sin sombras) - mejor espaciados (sin el retrato central que tiene su propia luz)
        { pos: [-9, 4.4, 12], target: [-9, 2.6, 13.7], intensity: 19, color: 0xfff8dc, castShadow: false },
        { pos: [-4.5, 4.4, 12], target: [-4.5, 2.6, 13.7], intensity: 19, color: 0xfff8dc, castShadow: false },
        { pos: [4.5, 4.4, 12], target: [4.5, 2.6, 13.7], intensity: 19, color: 0xfff8dc, castShadow: false },
        { pos: [9, 4.4, 12], target: [9, 2.6, 13.7], intensity: 19, color: 0xfff8dc, castShadow: false }
    ];

    spotLightConfigs.forEach((config, index) => {
        // Spotlight principal con parámetros más realistas
        const spotLight = new THREE.SpotLight(config.color, config.intensity, 25, Math.PI / 9, 0.6, 1.5);
        spotLight.position.set(...config.pos);
        spotLight.target.position.set(...config.target);
        spotLight.castShadow = config.castShadow;

        if (config.castShadow) {
            spotLight.shadow.mapSize.width = 1024; // Reducido de 2048
            spotLight.shadow.mapSize.height = 1024;
            spotLight.shadow.camera.near = 0.5;
            spotLight.shadow.camera.far = 25;
            spotLight.shadow.bias = -0.0002;
            spotLight.shadow.radius = 8;
        }

        scene.add(spotLight);
        scene.add(spotLight.target);

        // Fixture físico del foco
        createSpotlightFixture(config.pos);

        // Luz de relleno muy suave
        const fillLight = new THREE.PointLight(config.color, config.intensity * 0.3, 18, 2);
        fillLight.position.set(config.pos[0], config.pos[1] - 0.8, config.pos[2]);
        scene.add(fillLight);
    });

    console.log('🔦 Focos LED creados: ' + spotLightConfigs.length + ' spotlights');
}

// Crear fixture físico del foco
function createSpotlightFixture(position) {
    const fixtureGroup = new THREE.Group();

    // Base del foco con material metálico realista
    const baseGeometry = new THREE.CylinderGeometry(0.18, 0.18, 0.12, 16);
    const baseMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x222222,
        roughness: 0.2,
        metalness: 0.9,
        envMapIntensity: 1.0
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(0, -0.06, 0);
    base.castShadow = true;
    fixtureGroup.add(base);

    // Cono del foco con reflector interior
    const coneGeometry = new THREE.ConeGeometry(0.15, 0.35, 16);
    const coneMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x333333,
        roughness: 0.1,
        metalness: 0.95,
        envMapIntensity: 1.2
    });
    const cone = new THREE.Mesh(coneGeometry, coneMaterial);
    cone.position.set(0, -0.3, 0);
    cone.rotation.x = Math.PI;
    cone.castShadow = true;
    fixtureGroup.add(cone);

    // Reflector interior
    const reflectorGeometry = new THREE.ConeGeometry(0.12, 0.25, 16);
    const reflectorMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        roughness: 0.05,
        metalness: 0.95,
        envMapIntensity: 1.5
    });
    const reflector = new THREE.Mesh(reflectorGeometry, reflectorMaterial);
    reflector.position.set(0, -0.25, 0);
    reflector.rotation.x = Math.PI;
    fixtureGroup.add(reflector);

    fixtureGroup.position.set(...position);
    scene.add(fixtureGroup);
}

// Iluminación ambiente adicional
function createAmbientLighting() {
    // Luces de pared indirectas - reducidas en intensidad y alineadas con cuadros
    const wallLightPositions = [
        // Pared izquierda - alineadas con cuadros
        [-13.5, 3.5, -9], [-13.5, 3.5, -3], [-13.5, 3.5, 6],
        // Pared derecha - alineadas con cuadros
        [13.5, 3.5, -6], [13.5, 3.5, 3], [13.5, 3.5, 9],
        // Pared frontal - alineadas con cuadros principales
        [-9.5, 3.5, -13.5], [-6.5, 3.5, -13.5], [0, 3.5, -13.5], [6.5, 3.5, -13.5], [9.5, 3.5, -13.5],
        // Pared trasera/entrada - mejor espaciadas
        [-9, 3.5, 13.5], [-4.5, 3.5, 13.5], [4.5, 3.5, 13.5], [9, 3.5, 13.5]
    ];

    wallLightPositions.forEach(pos => {
        const wallLight = new THREE.PointLight(0xfff5e6, 13, 12, 2);
        wallLight.position.set(...pos);
        scene.add(wallLight);
    });

    // Luces en las esquinas - reducidas
    const cornerLights = [
        { pos: [-12, 3.5, -12], intensity: 18 },
        { pos: [12, 3.5, -12], intensity: 18 },
        { pos: [-12, 3.5, 12], intensity: 18 },
        { pos: [12, 3.5, 12], intensity: 18 }
    ];

    cornerLights.forEach(light => {
        const cornerLight = new THREE.PointLight(0xffffff, light.intensity, 16, 2);
        cornerLight.position.set(...light.pos);
        scene.add(cornerLight);
    });

    // Iluminación de suelo indirecta - reducida
    const floorLights = [
        // Centro y cuadrantes principales
        { pos: [0, 0.1, 0], color: 0xffffff, intensity: 10 },
        { pos: [-7, 0.1, -7], color: 0xfff8dc, intensity: 7 },
        { pos: [7, 0.1, -7], color: 0xfff8dc, intensity: 7 },
        { pos: [-7, 0.1, 7], color: 0xfff8dc, intensity: 7 },
        { pos: [7, 0.1, 7], color: 0xfff8dc, intensity: 7 }
    ];

    floorLights.forEach(light => {
        const floorLight = new THREE.PointLight(light.color, light.intensity, 12, 2.5);
        floorLight.position.set(...light.pos);
        scene.add(floorLight);
    });

    console.log('💡 Iluminación ambiente creada: ' + (wallLightPositions.length + cornerLights.length + floorLights.length) + ' luces');
}

// Crear aplique de pared más detallado
function createWallSconce(position) {
    const sconceGroup = new THREE.Group();

    // Base del aplique
    const baseGeometry = new THREE.CylinderGeometry(0.08, 0.1, 0.15, 12);
    const baseMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x444444,
        roughness: 0.3,
        metalness: 0.8,
        envMapIntensity: 0.8
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(0, 0, 0.05);
    base.castShadow = true;
    sconceGroup.add(base);

    // Pantalla del aplique
    const shadeGeometry = new THREE.SphereGeometry(0.12, 16, 16);
    const shadeMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        roughness: 0.05,
        metalness: 0.0,
        transparent: true,
        opacity: 0.9,
        emissive: 0xfff5e6,
        emissiveIntensity: 0.3,
        transmission: 0.8
    });

    const shade = new THREE.Mesh(shadeGeometry, shadeMaterial);
    shade.position.set(0, 0, 0.1);
    sconceGroup.add(shade);

    sconceGroup.position.set(...position);
    scene.add(sconceGroup);
}

// Implementar apliques de pared estratégicamente
function implementWallSconces() {
    const sconcePositions = [
        // Pared frontal - entre obras principales, mejor espaciados
        [-10.5, 3.2, -13.8],
        [-3.25, 3.2, -13.8],
        [3.25, 3.2, -13.8],
        [10.5, 3.2, -13.8],
        
        // Pared izquierda - entre obras
        [-13.8, 3.2, -6],
        [-13.8, 3.2, 1.5],
        
        // Pared derecha - entre obras
        [13.8, 3.2, -1.5],
        [13.8, 3.2, 6],
        
        // Pared trasera/entrada - entre obras con mejor espaciado
        [-6.75, 3.2, 13.8],
        [-2.25, 3.2, 13.8],
        [2.25, 3.2, 13.8],
        [6.75, 3.2, 13.8]
    ];

    sconcePositions.forEach(pos => {
        createWallSconce(pos);
        
        // Añadir luz indirecta del aplique
        const sconceLight = new THREE.SpotLight(0xfff5e6, 8, 5, Math.PI / 6, 0.5, 2);
        sconceLight.position.set(...pos);
        sconceLight.target.position.set(pos[0], pos[1] + 2, pos[2]);
        sconceLight.castShadow = false;
        scene.add(sconceLight);
        scene.add(sconceLight.target);
    });

    console.log('🕯️ Apliques de pared implementados');
}

// Crear Muro de Homenaje al Artista Byron Gálvez
// Crear texturas procedurales para las obras
function createProceduralTexture(type, width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Crear gradiente base
    const gradient = ctx.createLinearGradient(0, 0, width, height);

    switch (type) {
        case 'abstract-digital':
            // Patrón digital abstracto
            gradient.addColorStop(0, '#1e3a8a');
            gradient.addColorStop(0.3, '#3b82f6');
            gradient.addColorStop(0.6, '#60a5fa');
            gradient.addColorStop(1, '#dbeafe');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);

            // Agregar formas geométricas
            ctx.globalCompositeOperation = 'overlay';
            for (let i = 0; i < 20; i++) {
                ctx.fillStyle = `hsla(${Math.random() * 60 + 200}, 70%, 60%, 0.3)`;
                const x = Math.random() * width;
                const y = Math.random() * height;
                const size = Math.random() * 100 + 20;
                ctx.fillRect(x, y, size, size);
            }
            break;

        case 'urban-reflections':
            // Reflecciones urbanas
            gradient.addColorStop(0, '#374151');
            gradient.addColorStop(0.5, '#6b7280');
            gradient.addColorStop(1, '#d1d5db');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);

            // Líneas verticales como edificios
            ctx.globalCompositeOperation = 'multiply';
            ctx.strokeStyle = '#1f2937';
            ctx.lineWidth = 3;
            for (let i = 0; i < 15; i++) {
                const x = (i / 15) * width;
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, height);
                ctx.stroke();
            }
            break;

        case 'infinite-horizons':
            // Horizontes infinitos
            gradient.addColorStop(0, '#f59e0b');
            gradient.addColorStop(0.4, '#fbbf24');
            gradient.addColorStop(0.6, '#fde047');
            gradient.addColorStop(1, '#fef3c7');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);

            // Círculos concéntricos
            ctx.globalCompositeOperation = 'overlay';
            const centerX = width / 2;
            const centerY = height / 2;
            for (let i = 1; i <= 8; i++) {
                ctx.strokeStyle = `hsla(45, 100%, ${80 - i * 5}%, 0.4)`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(centerX, centerY, i * 30, 0, Math.PI * 2);
                ctx.stroke();
            }
            break;

        case 'emotional-geometry':
            // Geometría emocional
            gradient.addColorStop(0, '#7c3aed');
            gradient.addColorStop(0.5, '#a855f7');
            gradient.addColorStop(1, '#ddd6fe');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);

            // Triángulos y formas geométricas
            ctx.globalCompositeOperation = 'overlay';
            for (let i = 0; i < 12; i++) {
                const x = Math.random() * width;
                const y = Math.random() * height;
                const size = Math.random() * 60 + 20;

                ctx.fillStyle = `hsla(${280 + Math.random() * 40}, 70%, 60%, 0.5)`;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + size, y);
                ctx.lineTo(x + size / 2, y - size);
                ctx.closePath();
                ctx.fill();
            }
            break;

        case 'visual-synesthesia':
            // Sinestesia visual
            gradient.addColorStop(0, '#ec4899');
            gradient.addColorStop(0.3, '#f472b6');
            gradient.addColorStop(0.7, '#fbbf24');
            gradient.addColorStop(1, '#fef3c7');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);

            // Ondas sinusoidales
            ctx.globalCompositeOperation = 'overlay';
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 2;
            for (let i = 0; i < 5; i++) {
                ctx.beginPath();
                for (let x = 0; x < width; x += 2) {
                    const y = height / 2 + Math.sin((x + i * 50) * 0.02) * (30 + i * 10);
                    if (x === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                ctx.stroke();
            }
            break;

        default:
        case 'fallback':
            // Patrón de fallback simple
            gradient.addColorStop(0, '#4b5563');
            gradient.addColorStop(1, '#9ca3af');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
            break;
    }

    // Crear y retornar textura de Three.js
    const texture = new THREE.CanvasTexture(canvas);
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.encoding = THREE.sRGBEncoding;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.flipY = false;

    return texture;
}

// Crear obras de arte realistas
function createRealisticArtworks() {
    // Obra central - Amanecer (pared frontal principal)
    createRealisticArtwork({
        position: [0, 2.8, -13.7],
        size: [4.5, 3.2],
        imageUrl: './src/assets/images/Amanecer - Byron.jpeg',
        isMainArtwork: true,
        title: 'Amanecer',
        artist: 'Byron Gálvez',
        year: '2025',
        description: 'Una representación poética del amanecer que captura la transición entre la noche y el día, evocando esperanza y renovación.'
    });

    // Obras laterales - Pared frontal (altura uniforme)
    createRealisticArtwork({
        position: [-6.5, 2.6, -13.7],
        size: [3.5, 2.8],
        imageUrl: './src/assets/images/Bailarina - Byron.jpg',
        title: 'Bailarina',
        artist: 'Byron Gálvez',
        year: '2024',
        description: 'Una elegante representación del movimiento y la gracia, capturando la esencia de la danza en una composición dinámica.'
    });

    createRealisticArtwork({
        position: [6.5, 2.6, -13.7],
        size: [3.5, 2.8],
        imageUrl: './src/assets/images/Naturaleza Muerta - Byron.jpg',
        title: 'Naturaleza Muerta',
        artist: 'Byron Gálvez',
        year: '2024',
        description: 'Una interpretación contemporánea del género clásico, explorando la belleza en la simplicidad de los objetos cotidianos.'
    });

    // Pared izquierda - obra 1 (altura uniforme)
    createRealisticArtwork({
        position: [-13.7, 2.6, -3],
        size: [3.0, 2.5],
        rotation: [0, Math.PI / 2, 0],
        imageUrl: './src/assets/images/Rocas y Cielo - Byron.jpg',
        title: 'Rocas y Cielo',
        artist: 'Byron Gálvez',
        year: '2023',
        description: 'Un estudio de contrastes entre la solidez de la tierra y la fluidez del cielo, explorando la relación entre lo terrenal y lo celestial.'
    });

    // Pared izquierda - obra 2 (altura uniforme)
    createRealisticArtwork({
        position: [-13.7, 2.6, 6],
        size: [3.0, 2.5],
        rotation: [0, Math.PI / 2, 0],
        imageUrl: './src/assets/images/Vela - Byron.jpg',
        title: 'Vela',
        artist: 'Byron Gálvez',
        year: '2024',
        description: 'Una exploración de la luz y la quietud, capturando la delicada belleza de la llama en la oscuridad.'
    });

    // Pared derecha - obra 1 (altura uniforme)
    createRealisticArtwork({
        position: [13.7, 2.6, 3],
        size: [3.0, 2.5],
        rotation: [0, -Math.PI / 2, 0],
        imageUrl: './src/assets/images/Musicos - Byron.jpg',
        title: 'Músicos',
        artist: 'Byron Gálvez',
        year: '2023',
        description: 'Una celebración visual de la música y los artistas que la crean, capturando la pasión y la emoción del arte sonoro.'
    });

    // Pared derecha - obra 2 (altura uniforme)
    createRealisticArtwork({
        position: [13.7, 2.6, -6],
        size: [3.0, 2.5],
        rotation: [0, -Math.PI / 2, 0],
        imageUrl: './src/assets/images/Violincello - Byron.jpg',
        title: 'Violoncello',
        artist: 'Byron Gálvez',
        year: '2024',
        description: 'Una celebración del instrumento musical, capturando la elegancia y profundidad emocional del violoncello.'
    });

    // Pared trasera - obra izquierda exterior (mejor espaciado)
    createRealisticArtwork({
        position: [-9, 2.6, 13.7],
        size: [2.5, 2.0],
        rotation: [0, Math.PI, 0],
        imageUrl: './src/assets/images/Copas - Byron.jpg',
        title: 'Copas',
        artist: 'Byron Gálvez',
        year: '2024',
        description: 'Una representación elegante de cristalería, explorando la transparencia, reflejos y la belleza de los objetos cotidianos.'
    });

    // Pared trasera - obra izquierda interior (mejor espaciado)
    createRealisticArtwork({
        position: [-4.5, 2.6, 13.7],
        size: [2.3, 1.9],
        rotation: [0, Math.PI, 0],
        imageUrl: './src/assets/images/Escultura de pie - Byron.jpg',
        title: 'Escultura de Pie',
        artist: 'Byron Gálvez',
        year: '2024',
        description: 'Una exploración de la forma humana en movimiento, capturando la elegancia y fuerza de la figura erguida.'
    });

    // Pared trasera - AUTORRETRATO DEL ARTISTA (con estructura especial - centro)
    createArtistPortrait({
        position: [0, 2.8, 13.7],
        size: [3.5, 3.0],
        rotation: [0, Math.PI, 0],
        imageUrl: './src/assets/images/Byron2.png',
        title: 'Byron Gálvez',
        subtitle: 'Artista',
        year: '2025',
        description: 'El maestro detrás de estas obras, capturando su esencia creativa y visión personal del mundo.'
    });

    // Pared trasera - obra derecha interior (mejor espaciado)
    createRealisticArtwork({
        position: [4.5, 2.6, 13.7],
        size: [2.3, 1.9],
        rotation: [0, Math.PI, 0],
        imageUrl: './src/assets/images/Escultura sentada - Byron.jpg',
        title: 'Escultura Sentada',
        artist: 'Byron Gálvez',
        year: '2024',
        description: 'Una contemplación sobre el reposo y la reflexión, mostrando la serenidad en la postura contemplativa.'
    });

    // Pared trasera - obra derecha exterior (mejor espaciado)
    createRealisticArtwork({
        position: [9, 2.6, 13.7],
        size: [2.5, 2.0],
        rotation: [0, Math.PI, 0],
        imageUrl: './src/assets/images/Frutas - Byron.jpg',
        title: 'Frutas',
        artist: 'Byron Gálvez',
        year: '2024',
        description: 'Una celebración de la naturaleza muerta, explorando colores vibrantes y formas orgánicas de frutas frescas.'
    });

    // Obras adicionales pared frontal (altura uniforme)
    createRealisticArtwork({
        position: [-9.5, 2.6, -13.7],
        size: [2.5, 2.0],
        imageUrl: './src/assets/images/Maquillaje - Byron.jpg',
        title: 'Maquillaje',
        artist: 'Byron Gálvez',
        year: '2024',
        description: 'Una exploración del arte del maquillaje como forma de expresión y transformación personal.'
    });

    createRealisticArtwork({
        position: [9.5, 2.6, -13.7],
        size: [2.5, 2.0],
        imageUrl: './src/assets/images/Vanidad - Byron.jpg',
        title: 'Vanidad',
        artist: 'Byron Gálvez',
        year: '2024',
        description: 'Una reflexión sobre la belleza, el tiempo y la naturaleza efímera de la apariencia física.'
    });

    // Obras pequeñas complementarias en paredes laterales (altura uniforme)
    createRealisticArtwork({
        position: [-13.7, 2.6, -9],
        size: [2.2, 1.8],
        rotation: [0, Math.PI / 2, 0],
        imageUrl: './src/assets/images/Vela2 - Byron.jpg',
        title: 'Vela II',
        artist: 'Byron Gálvez',
        year: '2024',
        description: 'Segunda exploración de la luz de vela, capturando momentos de serenidad y contemplación.'
    });

    createRealisticArtwork({
        position: [13.7, 2.6, 9],
        size: [2.2, 1.8],
        rotation: [0, -Math.PI / 2, 0],
        imageUrl: './src/assets/images/MusicosM - Byron.jpg',
        title: 'Músicos en Concierto',
        artist: 'Byron Gálvez',
        year: '2024',
        description: 'Una visión íntima del mundo musical, capturando la concentración y pasión de los intérpretes en su arte.'
    });

    console.log('🎨 Galería completa creada con 16 obras de arte');
}

// Crear retrato especial del artista - Versión simplificada y elegante
function createArtistPortrait(config) {
    const { position, size, imageUrl, rotation, title, subtitle, year, description } = config;

    const portraitGroup = new THREE.Group();

    // Cargar la imagen primero para obtener sus proporciones reales
    const textureLoader = new THREE.TextureLoader();
    textureLoader.crossOrigin = 'anonymous';
    
    textureLoader.load(
        imageUrl,
        (loadedTexture) => {
            console.log('✅ Retrato del artista cargado:', imageUrl);
            console.log('📐 Dimensiones originales:', loadedTexture.image.width, 'x', loadedTexture.image.height);
            
            // Calcular proporciones reales de la imagen
            const imageAspectRatio = loadedTexture.image.width / loadedTexture.image.height;
            
            // Ajustar tamaño manteniendo la proporción vertical
            let portraitWidth, portraitHeight;
            if (imageAspectRatio < 1) {
                // Imagen vertical (como debería ser un retrato)
                portraitHeight = size[1]; // Altura máxima permitida
                portraitWidth = portraitHeight * imageAspectRatio;
            } else {
                // Imagen horizontal (poco común para retratos)
                portraitWidth = size[0];
                portraitHeight = portraitWidth / imageAspectRatio;
            }
            
            console.log('🎯 Tamaño ajustado del retrato:', portraitWidth.toFixed(2), 'x', portraitHeight.toFixed(2));

            // Configurar textura
            loadedTexture.encoding = THREE.sRGBEncoding;
            loadedTexture.minFilter = THREE.LinearFilter;
            loadedTexture.magFilter = THREE.LinearFilter;
            loadedTexture.wrapS = THREE.ClampToEdgeWrapping;
            loadedTexture.wrapT = THREE.ClampToEdgeWrapping;

            // RETRATO PRINCIPAL con proporciones correctas
            const portraitGeometry = new THREE.PlaneGeometry(portraitWidth, portraitHeight);
            const portraitMaterial = new THREE.MeshPhysicalMaterial({
                map: loadedTexture,
                roughness: 0.85,
                metalness: 0.0,
                clearcoat: 0.15,
                clearcoatRoughness: 0.9,
                envMapIntensity: 0.2
            });

            const portraitMesh = new THREE.Mesh(portraitGeometry, portraitMaterial);
            portraitMesh.position.set(0, 0, 0.05);
            portraitMesh.castShadow = true;
            portraitMesh.receiveShadow = true;
            portraitMesh.userData = { title, artist: subtitle, year, description };
            portraitGroup.add(portraitMesh);

            // MARCO ELEGANTE - Marco exterior oscuro
            const frameDepth = 0.12;
            const frameWidth = 0.18;
            
            const outerFrameGeometry = new THREE.BoxGeometry(
                portraitWidth + frameWidth * 2,
                portraitHeight + frameWidth * 2,
                frameDepth
            );
            const outerFrameMaterial = new THREE.MeshPhysicalMaterial({
                color: 0x1a1a1a,
                roughness: 0.4,
                metalness: 0.3,
                envMapIntensity: 0.6
            });
            const outerFrame = new THREE.Mesh(outerFrameGeometry, outerFrameMaterial);
            outerFrame.position.set(0, 0, -frameDepth * 0.5);
            outerFrame.castShadow = true;
            portraitGroup.add(outerFrame);

            // Marco interior dorado sutil
            const innerFrameGeometry = new THREE.BoxGeometry(
                portraitWidth + frameWidth,
                portraitHeight + frameWidth,
                frameDepth * 0.5
            );
            const innerFrameMaterial = new THREE.MeshPhysicalMaterial({
                color: 0xb8860b, // Oro oscuro elegante
                roughness: 0.5,
                metalness: 0.7,
                envMapIntensity: 0.8
            });
            const innerFrame = new THREE.Mesh(innerFrameGeometry, innerFrameMaterial);
            innerFrame.position.set(0, 0, -frameDepth * 0.2);
            innerFrame.castShadow = true;
            portraitGroup.add(innerFrame);

            // PLACA INFORMATIVA SIMPLE
            const plaqueWidth = portraitWidth + frameWidth;
            const plaqueGeometry = new THREE.BoxGeometry(plaqueWidth, 0.35, 0.06);
            const plaqueMaterial = new THREE.MeshPhysicalMaterial({
                color: 0x2c2c2c,
                roughness: 0.6,
                metalness: 0.4,
                envMapIntensity: 0.5
            });
            const plaque = new THREE.Mesh(plaqueGeometry, plaqueMaterial);
            plaque.position.set(0, -(portraitHeight/2 + frameWidth + 0.25), 0.03);
            plaque.castShadow = true;
            portraitGroup.add(plaque);

            // Detalle dorado en la placa
            const plaqueAccentGeometry = new THREE.BoxGeometry(plaqueWidth - 0.1, 0.28, 0.08);
            const plaqueAccentMaterial = new THREE.MeshPhysicalMaterial({
                color: 0xb8860b,
                roughness: 0.4,
                metalness: 0.8,
                envMapIntensity: 1.0
            });
            const plaqueAccent = new THREE.Mesh(plaqueAccentGeometry, plaqueAccentMaterial);
            plaqueAccent.position.set(0, -(portraitHeight/2 + frameWidth + 0.25), 0.06);
            portraitGroup.add(plaqueAccent);

            console.log('🖼️ Retrato del artista creado con proporciones correctas');
        },
        undefined,
        (error) => {
            console.error('❌ Error cargando retrato del artista:', imageUrl, error);
        }
    );

    // ILUMINACIÓN ESPECIAL PARA EL RETRATO (más suave)
    const spotLight1 = new THREE.SpotLight(0xffffff, 30, 15, Math.PI / 8, 0.3, 1.8);
    spotLight1.position.set(0, 5, 12.5);
    spotLight1.target.position.set(...position);
    spotLight1.castShadow = true;
    spotLight1.shadow.mapSize.width = 2048;
    spotLight1.shadow.mapSize.height = 2048;
    scene.add(spotLight1);
    scene.add(spotLight1.target);

    // Luz ambiental suave para el retrato
    const ambientLight = new THREE.PointLight(0xfff8dc, 8, 6, 2);
    ambientLight.position.set(position[0], position[1], position[2] + 1);
    scene.add(ambientLight);

    // Posicionar el grupo completo
    portraitGroup.position.set(...position);
    if (rotation) {
        portraitGroup.rotation.set(...rotation);
    }

    // Añadir a la escena y al array de artworks
    scene.add(portraitGroup);
    artworks.push({
        group: portraitGroup,
        mesh: portraitGroup,
        title: title,
        artist: subtitle,
        year: year,
        description: description
    });

    console.log('👤 Retrato especial del artista inicializado');
}

// Crear una obra de arte individual realista
function createRealisticArtwork(config) {
    const { position, size, imageUrl, proceduralTexture, isMainArtwork, rotation, title, artist, year, description } = config;

    // Grupo para la obra completa
    const artworkGroup = new THREE.Group();

    // Variables para el tamaño final (se ajustarán con la imagen)
    let finalSize = size;
    let artworkMesh = null; // Referencia al mesh del artwork

    // Función para crear el marco con el tamaño correcto
    function createFrameWithSize(artworkSize) {
        // Marco más realista con profundidad - z-positions ajustadas para evitar z-fighting
        const frameDepth = 0.12;
        const frameWidth = 0.15;

        // Marco exterior (más atrás)
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
        outerFrame.position.set(0, 0, -frameDepth * 0.6); // Movido más atrás
        outerFrame.castShadow = true;
        outerFrame.renderOrder = 1; // Renderizar primero
        artworkGroup.add(outerFrame);

        // Marco interior (adelante del exterior)
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
        innerFrame.position.set(0, 0, -frameDepth * 0.15); // Separado del marco exterior
        innerFrame.castShadow = true;
        innerFrame.renderOrder = 2; // Renderizar después del exterior
        artworkGroup.add(innerFrame);

        console.log('🖼️ Marco creado para:', title, 'Tamaño:', artworkSize);
    }

    // Cristal protector eliminado para evitar interferencias visuales
    console.log('🚫 Vidrio protector eliminado del cuadro:', title);    // Pintura/Obra principal (se creará después de conocer las dimensiones)
    let artworkGeometry;
    let artworkMaterial;

    // Función para crear el artwork con el tamaño correcto
    function createArtworkWithSize(artworkSize) {
        artworkGeometry = new THREE.PlaneGeometry(artworkSize[0], artworkSize[1]);
        artworkMesh = new THREE.Mesh(artworkGeometry, artworkMaterial);
        artworkMesh.castShadow = true;
        artworkMesh.receiveShadow = true;
        artworkMesh.position.set(0, 0, 0.02); // Más separación para evitar z-fighting
        artworkMesh.renderOrder = 3; // Renderizar al frente
        artworkMesh.userData = { title, artist, year, description};
        artworkGroup.add(artworkMesh);
        console.log('🎨 Artwork creado con tamaño:', artworkSize);

        // Agregar cursor pointer cuando el mouse está sobre la pintura
        artworkMesh.userData.isClickable = true;
    }

    if (imageUrl) {
        // Priorizar imágenes reales con optimizaciones para móvil
        const textureLoader = new THREE.TextureLoader();
        
        // Configurar crossOrigin para evitar problemas de CORS
        textureLoader.crossOrigin = 'anonymous';
        
        const texture = textureLoader.load(
            imageUrl,
            (loadedTexture) => {
                console.log('✅ Imagen cargada exitosamente:', imageUrl);
                console.log('📐 Dimensiones de textura:', loadedTexture.image.width, 'x', loadedTexture.image.height);

                // Calcular tamaño proporcional basado en la imagen
                const imageAspectRatio = loadedTexture.image.width / loadedTexture.image.height;
                const maxWidth = size[0];
                const maxHeight = size[1];

                let newWidth, newHeight;
                if (imageAspectRatio > 1) {
                    // Imagen horizontal
                    newWidth = maxWidth;
                    newHeight = maxWidth / imageAspectRatio;
                } else {
                    // Imagen vertical o cuadrada
                    newHeight = maxHeight;
                    newWidth = maxHeight * imageAspectRatio;
                }

                finalSize = [newWidth, newHeight];
                console.log('🎯 Tamaño ajustado:', finalSize, 'Ratio:', imageAspectRatio.toFixed(2));

                // Crear marco con el tamaño correcto
                createFrameWithSize(finalSize);

                // Configuración optimizada de texturas para rendimiento
                const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                
                // Redimensionar textura si es muy grande
                const maxSize = REALISTIC_CONFIG.performance.textureMaxSize;
                if (loadedTexture.image.width > maxSize || loadedTexture.image.height > maxSize) {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    const scale = Math.min(maxSize / loadedTexture.image.width, maxSize / loadedTexture.image.height);
                    canvas.width = loadedTexture.image.width * scale;
                    canvas.height = loadedTexture.image.height * scale;
                    
                    ctx.drawImage(loadedTexture.image, 0, 0, canvas.width, canvas.height);
                    loadedTexture.image = canvas;
                    console.log('🔧 Textura redimensionada a:', canvas.width, 'x', canvas.height);
                }
                
                loadedTexture.generateMipmaps = true;
                loadedTexture.minFilter = isMobile ? THREE.LinearFilter : THREE.LinearMipmapLinearFilter;
                loadedTexture.magFilter = THREE.LinearFilter;
                loadedTexture.wrapS = THREE.ClampToEdgeWrapping;
                loadedTexture.wrapT = THREE.ClampToEdgeWrapping;
                loadedTexture.flipY = true;
                loadedTexture.anisotropy = isMobile ? 1 : Math.min(2, renderer.capabilities.getMaxAnisotropy());
                loadedTexture.encoding = THREE.sRGBEncoding;
                loadedTexture.needsUpdate = true;

                // Crear el material y el artwork con las dimensiones correctas
                artworkMaterial = new THREE.MeshPhysicalMaterial({
                    map: loadedTexture,
                    roughness: 0.9,
                    metalness: 0.0,
                    envMapIntensity: 0.1,
                    transparent: false,
                    side: THREE.FrontSide,
                    depthTest: true,
                    depthWrite: true,
                    polygonOffset: true,
                    polygonOffsetFactor: -1,
                    polygonOffsetUnits: -1
                });

                createArtworkWithSize(finalSize);
                setupAdditionalElements(finalSize);
            },
            (progress) => {
                if (progress.lengthComputable) {
                    const percentComplete = (progress.loaded / progress.total) * 100;
                    console.log('Cargando imagen:', imageUrl, percentComplete.toFixed(0) + '%');
                }
            },
            (error) => {
                console.error('❌ Error cargando imagen:', imageUrl, error);
                console.log('🔄 Intentando cargar imagen de respaldo...');
                
                // Crear material de respaldo con color
                finalSize = size; // Usar tamaño predeterminado
                createFrameWithSize(finalSize);
                
                artworkMaterial = new THREE.MeshPhysicalMaterial({
                    color: isMainArtwork ? 0x4488ff : 0x888888,
                    roughness: 0.9,
                    metalness: 0.0,
                    envMapIntensity: 0.1,
                    side: THREE.FrontSide
                });
                
                // Si hay textura procedural, usarla
                if (proceduralTexture) {
                    const fallbackTexture = createProceduralTexture(proceduralTexture, 512, 512);
                    artworkMaterial.map = fallbackTexture;
                }
                
                artworkMaterial.needsUpdate = true;
                createArtworkWithSize(finalSize);
                setupAdditionalElements(finalSize);
            }
        );

        // Las texturas con imageUrl ya se configuran en el callback de carga
        console.log('ℹ️ Imagen cargada, configuración manejada en callback');
    } else if (proceduralTexture) {
        // Crear textura procedural según el tipo - usar tamaño original
        createFrameWithSize(size);
        const texture = createProceduralTexture(proceduralTexture, 512, 512);
        artworkMaterial = new THREE.MeshPhysicalMaterial({
            map: texture,
            roughness: 0.8,
            metalness: 0.0,
            envMapIntensity: 0.1
        });
        createArtworkWithSize(size);
        setupAdditionalElements(size);
    } else {
        // Material procedural si no hay imagen - usar tamaño original
        createFrameWithSize(size);
        artworkMaterial = new THREE.MeshPhysicalMaterial({
            color: isMainArtwork ? 0x4488ff : 0x888888,
            roughness: 0.9,
            metalness: 0.0
        });
        createArtworkWithSize(size);
        setupAdditionalElements(size);
    }

    // Artwork ya creado en createArtworkWithSize() - removido código duplicado

    // Función para configurar elementos adicionales con el tamaño correcto
    function setupAdditionalElements(artworkSize) {
        // Iluminación LED del marco (para obras principales)
        if (isMainArtwork) {
            createFrameLighting(artworkGroup, artworkSize);
        }
    }

    // Configurar elementos adicionales - se llama después de crear el artwork

    // Posicionar el grupo completo
    artworkGroup.position.set(...position);
    if (rotation) {
        artworkGroup.rotation.set(...rotation);
    }

    scene.add(artworkGroup);

    artworks.push({
        group: artworkGroup,
        mesh: artworkMesh,
        config: config
    });

    console.log('🖼️ Artwork agregado al array. Total artworks:', artworks.length);
}

// Crear lámpara principal del techo
// Crear iluminación LED del marco
function createFrameLighting(artworkGroup, size) {
    const ledPositions = [
        [-size[0] / 2, size[1] / 2, 0.1],    // Esquina superior izquierda
        [size[0] / 2, size[1] / 2, 0.1],     // Esquina superior derecha
        [-size[0] / 2, -size[1] / 2, 0.1],   // Esquina inferior izquierda
        [size[0] / 2, -size[1] / 2, 0.1]     // Esquina inferior derecha
    ];

    ledPositions.forEach(pos => {
        const ledLight = new THREE.PointLight(0xffffff, 3, 3, 2);
        ledLight.position.set(...pos);
        artworkGroup.add(ledLight);

        // LED físico
        const ledGeometry = new THREE.SphereGeometry(0.01, 8, 8);
        const ledMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0xffffff,
            emissiveIntensity: 0.1
        });
        const led = new THREE.Mesh(ledGeometry, ledMaterial);
        led.position.set(...pos);
        artworkGroup.add(led);
    });
}

// Crear objetos típicos de museo
function createMuseumObjects() {
    // ESCULTURA MONUMENTAL CENTRAL - Alto impacto visual
    createMonumentalSculpture({
        position: [0, 0, 0],
        title: 'Forma Abstracta',
        description: 'Escultura monumental que define el espacio central'
    });

    // Vitrina con artefactos arqueológicos
    createDisplayCase({
        position: [-8, 0, -4],
        type: 'archaeological',
        title: 'Cerámica Precolombina',
        description: 'Colección de vasijas ceremoniales del período clásico'
    });

    // Grupos de bancos para contemplación - crear varios
    createMuseumBench({
        position: [0, 0, 4],
        title: 'Banco de Contemplación'
    });
    
    createMuseumBench({
        position: [-6, 0, -6],
        rotation: Math.PI / 4,
        title: 'Banco de Contemplación'
    });
    
    createMuseumBench({
        position: [6, 0, -6],
        rotation: -Math.PI / 4,
        title: 'Banco de Contemplación'
    });

    // Grupos de plantas decorativas - múltiples ubicaciones
    createMuseumPlant({
        position: [8, 0, 4],
        type: 'large'
    });
    
    createMuseumPlant({
        position: [8, 0, 6],
        type: 'medium'
    });
    
    createMuseumPlant({
        position: [-8, 0, 4],
        type: 'large'
    });
    
    createMuseumPlant({
        position: [-8, 0, 6],
        type: 'medium'
    });
    
    // Plantas en las esquinas
    createMuseumPlant({
        position: [-11, 0, -11],
        type: 'large'
    });
    
    createMuseumPlant({
        position: [11, 0, -11],
        type: 'large'
    });

    // Mesa de información en la entrada
    createInformationTable({
        position: [0, 0, 9],
        title: 'Mesa de Bienvenida',
        description: 'Catálogos y material educativo'
    });

    // Columnas expositivas - crear múltiples
    createExhibitionColumn({
        position: [6, 0, -8],
        title: 'Cronología Artística',
        description: 'Línea temporal del arte contemporáneo'
    });
    
    createExhibitionColumn({
        position: [-6, 0, -8],
        title: 'Biografía del Artista',
        description: 'Vida y obra de Byron Gálvez'
    });

    // Muros flotantes para romper líneas de visión
    createFloatingWall({
        position: [-5, 0, -3],
        rotation: Math.PI / 4
    });
    
    createFloatingWall({
        position: [5, 0, 3],
        rotation: -Math.PI / 4
    });

    // Podios con barandas
    createPodiumWithRope({
        position: [-3, 0, 0],
        title: 'Objeto de Colección'
    });
    
    createPodiumWithRope({
        position: [3, 0, 0],
        title: 'Artefacto Histórico'
    });
}

// Crear escultura monumental central - PUNTO FOCAL PRINCIPAL (reducida al 50%)
function createMonumentalSculpture(config) {
    const { position, title, description } = config;

    const sculptureGroup = new THREE.Group();
    const sizeMultiplier = 0.5; // Reducción al 50%

    // Base circular de mármol oscuro
    const baseGeometry = new THREE.CylinderGeometry(1.8 * sizeMultiplier, 2.0 * sizeMultiplier, 0.3 * sizeMultiplier, 32);
    const baseMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x1a1a1a,
        roughness: 0.2,
        metalness: 0.1,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        envMapIntensity: 1.0
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(0, 0.15 * sizeMultiplier, 0);
    base.castShadow = true;
    base.receiveShadow = true;
    sculptureGroup.add(base);

    // Pedestal de bronce
    const pedestalGeometry = new THREE.CylinderGeometry(0.6 * sizeMultiplier, 0.8 * sizeMultiplier, 1.2 * sizeMultiplier, 16);
    const pedestalMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x8B6914,
        roughness: 0.3,
        metalness: 0.9,
        envMapIntensity: 1.2
    });
    const pedestal = new THREE.Mesh(pedestalGeometry, pedestalMaterial);
    pedestal.position.set(0, 0.9 * sizeMultiplier, 0);
    pedestal.castShadow = true;
    pedestal.receiveShadow = true;
    sculptureGroup.add(pedestal);

    // Escultura abstracta principal - forma de torsión ascendente
    const sculptureHeight = 2.5 * sizeMultiplier;
    const segments = 20;
    
    // Crear geometría de torsión personalizada
    const points = [];
    for (let i = 0; i <= segments; i++) {
        const y = (i / segments) * sculptureHeight;
        const radius = (0.4 - (i / segments) * 0.15) * sizeMultiplier; // Se adelgaza hacia arriba
        const angle = (i / segments) * Math.PI * 2; // Giro completo
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        points.push(new THREE.Vector3(x, y, z));
    }

    const sculptureGeometry = new THREE.LatheGeometry(
        points.map(p => new THREE.Vector2(Math.sqrt(p.x * p.x + p.z * p.z), p.y)),
        32
    );

    const sculptureMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x2d2d2d, // Negro metálico
        roughness: 0.2,
        metalness: 0.95,
        envMapIntensity: 1.5,
        clearcoat: 0.5,
        clearcoatRoughness: 0.2
    });

    const sculpture = new THREE.Mesh(sculptureGeometry, sculptureMaterial);
    sculpture.position.set(0, 1.5 * sizeMultiplier, 0);
    sculpture.castShadow = true;
    sculpture.receiveShadow = true;
    sculptureGroup.add(sculpture);

    // Elementos decorativos flotantes alrededor
    for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        const radius = 1.2 * sizeMultiplier;
        
        const sphereGeometry = new THREE.SphereGeometry(0.08 * sizeMultiplier, 16, 16);
        const sphereMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xFFD700, // Dorado
            roughness: 0.1,
            metalness: 1.0,
            emissive: 0x332200,
            emissiveIntensity: 0.2
        });
        
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.position.set(
            Math.cos(angle) * radius,
            2.5 * sizeMultiplier + Math.sin(i) * 0.3 * sizeMultiplier,
            Math.sin(angle) * radius
        );
        sphere.castShadow = true;
        sculptureGroup.add(sphere);
    }

    // Iluminación dedicada para la escultura
    const sculptureLight1 = new THREE.SpotLight(0xffffff, 40, 8, Math.PI / 6, 0.5, 2);
    sculptureLight1.position.set(0, 4.5, 0);
    sculptureLight1.target.position.set(0, 1.5 * sizeMultiplier, 0);
    scene.add(sculptureLight1);
    scene.add(sculptureLight1.target);

    // Luz de relleno
    const fillLight = new THREE.PointLight(0xffffff, 20, 6, 2);
    fillLight.position.set(0, 3, 0);
    scene.add(fillLight);

    sculptureGroup.position.set(...position);
    sculptureGroup.userData = { title, description, type: 'monumentalSculpture' };
    scene.add(sculptureGroup);

    museumObjects.push({
        group: sculptureGroup,
        config: config
    });

    console.log('🗿 Escultura monumental creada en posición central');
}

// Crear muro flotante para romper líneas de visión
function createFloatingWall(config) {
    const { position, rotation } = config;

    const wallGroup = new THREE.Group();

    // Muro bajo pero ancho
    const wallGeometry = new THREE.BoxGeometry(4.0, 2.0, 0.2);
    const wallMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xe8e8e8,
        roughness: 0.7,
        metalness: 0.05,
        envMapIntensity: 0.3
    });
    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.position.set(0, 1.0, 0);
    wall.castShadow = true;
    wall.receiveShadow = true;
    wallGroup.add(wall);

    // Marco decorativo superior
    const topFrameGeometry = new THREE.BoxGeometry(4.2, 0.1, 0.25);
    const frameMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x3a3a3a,
        roughness: 0.3,
        metalness: 0.8
    });
    const topFrame = new THREE.Mesh(topFrameGeometry, frameMaterial);
    topFrame.position.set(0, 2.05, 0);
    topFrame.castShadow = true;
    wallGroup.add(topFrame);

    // Bases decorativas
    const baseGeometry = new THREE.BoxGeometry(4.2, 0.15, 0.3);
    const baseFrame = new THREE.Mesh(baseGeometry, frameMaterial);
    baseFrame.position.set(0, 0.075, 0);
    baseFrame.castShadow = true;
    wallGroup.add(baseFrame);

    wallGroup.position.set(...position);
    wallGroup.rotation.y = rotation || 0;
    scene.add(wallGroup);

    walls.push(wallGroup);

    console.log('🧱 Muro flotante creado para dividir espacio');
}

// Crear podio con cuerda delimitadora
function createPodiumWithRope(config) {
    const { position, title } = config;

    const podiumGroup = new THREE.Group();

    // Podio principal
    const podiumGeometry = new THREE.CylinderGeometry(0.4, 0.45, 1.0, 16);
    const podiumMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xf0f0f0,
        roughness: 0.2,
        metalness: 0.0,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1
    });
    const podium = new THREE.Mesh(podiumGeometry, podiumMaterial);
    podium.position.set(0, 0.5, 0);
    podium.castShadow = true;
    podium.receiveShadow = true;
    podiumGroup.add(podium);

    // Objeto decorativo en el podio (esfera de cristal)
    const objectGeometry = new THREE.SphereGeometry(0.15, 32, 32);
    const objectMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        roughness: 0.0,
        metalness: 0.0,
        transmission: 0.95,
        envMapIntensity: 1.5
    });
    const object = new THREE.Mesh(objectGeometry, objectMaterial);
    object.position.set(0, 1.15, 0);
    object.castShadow = true;
    podiumGroup.add(object);

    // Postes de la baranda (4 postes alrededor)
    const postGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.8, 8);
    const postMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x8B6914,
        roughness: 0.2,
        metalness: 0.9
    });

    const ropePositions = [
        [0.6, 0, 0],
        [0, 0, 0.6],
        [-0.6, 0, 0],
        [0, 0, -0.6]
    ];

    ropePositions.forEach((pos, index) => {
        const post = new THREE.Mesh(postGeometry, postMaterial);
        post.position.set(pos[0], 0.4, pos[2]);
        post.castShadow = true;
        podiumGroup.add(post);

        // Tope del poste
        const capGeometry = new THREE.SphereGeometry(0.05, 8, 8);
        const cap = new THREE.Mesh(capGeometry, postMaterial);
        cap.position.set(pos[0], 0.85, pos[2]);
        podiumGroup.add(cap);
    });

    // Cuerdas conectando los postes
    const ropeGeometry = new THREE.CylinderGeometry(0.01, 0.01, 0.6, 8);
    const ropeMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x8B0000,
        roughness: 0.9,
        metalness: 0.0
    });

    for (let i = 0; i < ropePositions.length; i++) {
        const nextIndex = (i + 1) % ropePositions.length;
        const rope = new THREE.Mesh(ropeGeometry, ropeMaterial);
        
        const midX = (ropePositions[i][0] + ropePositions[nextIndex][0]) / 2;
        const midZ = (ropePositions[i][2] + ropePositions[nextIndex][2]) / 2;
        
        rope.position.set(midX, 0.75, midZ);
        rope.rotation.z = Math.PI / 2;
        rope.rotation.y = Math.atan2(
            ropePositions[nextIndex][2] - ropePositions[i][2],
            ropePositions[nextIndex][0] - ropePositions[i][0]
        );
        podiumGroup.add(rope);
    }

    podiumGroup.position.set(...position);
    podiumGroup.userData = { title, type: 'podium' };
    scene.add(podiumGroup);

    museumObjects.push({
        group: podiumGroup,
        config: config
    });

    console.log('🏛️ Podio con baranda creado');
}

// Crear vitrina de exhibición
function createDisplayCase(config) {
    const { position, type, title, description } = config;

    const displayGroup = new THREE.Group();

    // Base de la vitrina
    const baseGeometry = new THREE.BoxGeometry(1.8, 0.1, 1.2);
    const baseMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x333333,
        roughness: 0.2,
        metalness: 0.8,
        envMapIntensity: 1.0
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(0, 0.05, 0);
    base.castShadow = true;
    base.receiveShadow = true;
    displayGroup.add(base);

    // Estructura de la vitrina
    const frameGeometry = new THREE.BoxGeometry(1.8, 1.5, 1.2);
    const frameMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x444444,
        roughness: 0.1,
        metalness: 0.9,
        envMapIntensity: 1.2
    });

    // Crear marco (hueco en el centro)
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.position.set(0, 0.85, 0);
    frame.scale.set(1, 1, 0.1); // Solo el marco
    displayGroup.add(frame);

    // Vidrio de la vitrina
    const glassGeometry = new THREE.BoxGeometry(1.7, 1.4, 1.1);
    const glassMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.1,
        roughness: 0.0,
        metalness: 0.0,
        transmission: 0.95,
        envMapIntensity: 1.0
    });
    const glass = new THREE.Mesh(glassGeometry, glassMaterial);
    glass.position.set(0, 0.85, 0);
    displayGroup.add(glass);

    // Objetos dentro de la vitrina
    createDisplayObjects(displayGroup, type);

    // Placa informativa
    createObjectPlaque(displayGroup, { title, description }, 1.0, 0.1);

    displayGroup.position.set(...position);
    displayGroup.userData = { title, description, type: 'displayCase' };
    scene.add(displayGroup);

    museumObjects.push({
        group: displayGroup,
        config: config
    });
}

// Crear objetos dentro de las vitrinas
function createDisplayObjects(parent, type) {
    switch (type) {
        case 'archaeological':
            // Vasijas pequeñas
            for (let i = 0; i < 3; i++) {
                const vesselGeometry = new THREE.CylinderGeometry(0.1, 0.08, 0.15, 12);
                const vesselMaterial = new THREE.MeshPhysicalMaterial({
                    color: 0x8b4513,
                    roughness: 0.8,
                    metalness: 0.0
                });
                const vessel = new THREE.Mesh(vesselGeometry, vesselMaterial);
                vessel.position.set(
                    (i - 1) * 0.3,
                    0.3,
                    Math.sin(i) * 0.2
                );
                vessel.castShadow = true;
                parent.add(vessel);
            }
            break;
    }
}

// Crear banco de museo
function createMuseumBench(config) {
    const { position, title, rotation } = config;

    const benchGroup = new THREE.Group();

    // Asiento del banco
    const seatGeometry = new THREE.BoxGeometry(2.0, 0.08, 0.4);
    const benchMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x654321,
        roughness: 0.7,
        metalness: 0.1,
        envMapIntensity: 0.5
    });
    const seat = new THREE.Mesh(seatGeometry, benchMaterial);
    seat.position.set(0, 0.4, 0);
    seat.castShadow = true;
    seat.receiveShadow = true;
    benchGroup.add(seat);

    // Patas del banco
    const legGeometry = new THREE.BoxGeometry(0.08, 0.4, 0.08);
    const legPositions = [
        [-0.8, 0.2, -0.15],
        [0.8, 0.2, -0.15],
        [-0.8, 0.2, 0.15],
        [0.8, 0.2, 0.15]
    ];

    legPositions.forEach(pos => {
        const leg = new THREE.Mesh(legGeometry, benchMaterial);
        leg.position.set(...pos);
        leg.castShadow = true;
        leg.receiveShadow = true;
        benchGroup.add(leg);
    });

    benchGroup.position.set(...position);
    if (rotation !== undefined) {
        benchGroup.rotation.y = rotation;
    }
    benchGroup.userData = { title, type: 'bench' };
    scene.add(benchGroup);

    museumObjects.push({
        group: benchGroup,
        config: config
    });
}

// Crear planta de museo
function createMuseumPlant(config) {
    const { position, type } = config;

    const plantGroup = new THREE.Group();

    // Determinar tamaño según tipo
    const sizeMultiplier = type === 'large' ? 1.0 : 0.7;
    const potRadius = 0.3 * sizeMultiplier;
    const stemHeight = 1.2 * sizeMultiplier;

    // Maceta
    const potGeometry = new THREE.CylinderGeometry(potRadius, potRadius * 0.85, 0.4 * sizeMultiplier, 16);
    const potMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x8b4513,
        roughness: 0.6,
        metalness: 0.1
    });
    const pot = new THREE.Mesh(potGeometry, potMaterial);
    pot.position.set(0, 0.2 * sizeMultiplier, 0);
    pot.castShadow = true;
    pot.receiveShadow = true;
    plantGroup.add(pot);

    // Tallo principal
    const stemGeometry = new THREE.CylinderGeometry(0.02 * sizeMultiplier, 0.03 * sizeMultiplier, stemHeight, 8);
    const stemMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x228b22,
        roughness: 0.8,
        metalness: 0.0
    });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.set(0, (0.4 + stemHeight / 2) * sizeMultiplier, 0);
    stem.castShadow = true;
    plantGroup.add(stem);

    // Hojas - más para plantas grandes
    const leafCount = type === 'large' ? 8 : 5;
    const leafGeometry = new THREE.PlaneGeometry(0.3 * sizeMultiplier, 0.6 * sizeMultiplier);
    const leafMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x32cd32,
        roughness: 0.9,
        metalness: 0.0,
        side: THREE.DoubleSide
    });

    for (let i = 0; i < leafCount; i++) {
        const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
        const angle = (i / leafCount) * Math.PI * 2;
        leaf.position.set(
            Math.cos(angle) * 0.2 * sizeMultiplier,
            (0.4 + stemHeight + Math.sin(i) * 0.1) * sizeMultiplier,
            Math.sin(angle) * 0.2 * sizeMultiplier
        );
        leaf.rotation.y = angle;
        leaf.rotation.z = Math.PI / 6;
        leaf.castShadow = true;
        plantGroup.add(leaf);
    }

    plantGroup.position.set(...position);
    plantGroup.userData = { type: 'plant' };
    scene.add(plantGroup);

    museumObjects.push({
        group: plantGroup,
        config: config
    });
}

// Crear mesa de información
function createInformationTable(config) {
    const { position, title, description } = config;

    const tableGroup = new THREE.Group();

    // Superficie de la mesa
    const topGeometry = new THREE.BoxGeometry(1.2, 0.05, 0.8);
    const tableMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xdeb887,
        roughness: 0.3,
        metalness: 0.1,
        clearcoat: 0.8,
        clearcoatRoughness: 0.1
    });
    const top = new THREE.Mesh(topGeometry, tableMaterial);
    top.position.set(0, 0.75, 0);
    top.castShadow = true;
    top.receiveShadow = true;
    tableGroup.add(top);

    // Pata central
    const legGeometry = new THREE.CylinderGeometry(0.05, 0.08, 0.7, 8);
    const leg = new THREE.Mesh(legGeometry, tableMaterial);
    leg.position.set(0, 0.35, 0);
    leg.castShadow = true;
    leg.receiveShadow = true;
    tableGroup.add(leg);

    // Folletos (simulados)
    const brochureGeometry = new THREE.BoxGeometry(0.2, 0.01, 0.3);
    const brochureMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        roughness: 0.9,
        metalness: 0.0
    });

    for (let i = 0; i < 3; i++) {
        const brochure = new THREE.Mesh(brochureGeometry, brochureMaterial);
        brochure.position.set(
            (i - 1) * 0.25,
            0.78,
            0
        );
        brochure.rotation.y = (Math.random() - 0.5) * 0.5;
        brochure.castShadow = true;
        tableGroup.add(brochure);
    }

    tableGroup.position.set(...position);
    tableGroup.userData = { title, description, type: 'table' };
    scene.add(tableGroup);

    museumObjects.push({
        group: tableGroup,
        config: config
    });
}

// Crear columna expositiva
function createExhibitionColumn(config) {
    const { position, title, description } = config;

    const columnGroup = new THREE.Group();

    // Base de la columna
    const baseGeometry = new THREE.CylinderGeometry(0.4, 0.45, 0.2, 16);
    const baseMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xf0f0f0,
        roughness: 0.2,
        metalness: 0.0,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(0, 0.1, 0);
    base.castShadow = true;
    base.receiveShadow = true;
    columnGroup.add(base);

    // Columna principal
    const columnGeometry = new THREE.CylinderGeometry(0.35, 0.35, 1.6, 16);
    const column = new THREE.Mesh(columnGeometry, baseMaterial);
    column.position.set(0, 1.0, 0);
    column.castShadow = true;
    column.receiveShadow = true;
    columnGroup.add(column);

    // Panel informativo
    const panelGeometry = new THREE.BoxGeometry(0.6, 0.8, 0.05);
    const panelMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x2c3e50,
        roughness: 0.1,
        metalness: 0.8
    });
    const panel = new THREE.Mesh(panelGeometry, panelMaterial);
    panel.position.set(0, 1.2, 0.38);
    panel.castShadow = true;
    columnGroup.add(panel);

    columnGroup.position.set(...position);
    columnGroup.userData = { title, description, type: 'column' };
    scene.add(columnGroup);

    museumObjects.push({
        group: columnGroup,
        config: config
    });
}

// Crear placa informativa para objetos
function createObjectPlaque(parent, info, radius, height) {
    const plaqueGroup = new THREE.Group();

    // Base de la placa
    const plaqueGeometry = new THREE.BoxGeometry(0.6, 0.2, 0.03);
    const plaqueMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x2c3e50,
        roughness: 0.1,
        metalness: 0.8
    });
    const plaque = new THREE.Mesh(plaqueGeometry, plaqueMaterial);
    plaque.castShadow = true;
    plaqueGroup.add(plaque);

    // Soporte de la placa
    const supportGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.4);
    const support = new THREE.Mesh(supportGeometry, plaqueMaterial);
    support.position.set(0, -0.3, -0.02);
    support.castShadow = true;
    plaqueGroup.add(support);

    plaqueGroup.position.set(radius + 0.2, height + 0.8, 0);
    plaqueGroup.rotation.y = -Math.PI / 6;

    parent.add(plaqueGroup);
}

// Crear hotspots interactivos avanzados
function createAdvancedHotspot(config, parent = null) {
    const { position, isMainArtwork, isInfoHotspot, artworkData } = config;

    // Geometría del hotspot más sofisticada
    const hotspotGeometry = new THREE.SphereGeometry(0.08, 16, 16);

    let hotspotMaterial;
    if (isInfoHotspot) {
        hotspotMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x44aaff,
            transparent: true,
            opacity: 0.0,
            emissive: 0x002244,
            emissiveIntensity: 0.0,
            roughness: 0.1,
            metalness: 0.0
        });
    } else {
        hotspotMaterial = new THREE.MeshPhysicalMaterial({
            color: isMainArtwork ? 0xff4444 : 0x44ff44,
            transparent: true,
            opacity: 0.0,
            emissive: isMainArtwork ? 0x440000 : 0x004400,
            emissiveIntensity: 0.0,
            roughness: 0.1,
            metalness: 0.0
        });
    }

    const hotspot = new THREE.Mesh(hotspotGeometry, hotspotMaterial);
    hotspot.position.set(...position);
    hotspot.userData = {isMainArtwork, isInfoHotspot, artworkData};
    hotspot.visible = false; // Hacer completamente invisible

    // Anillo exterior animado - DESACTIVADO
    const ringGeometry = new THREE.TorusGeometry(0.12, 0.02, 8, 16);
    const ringMaterial = new THREE.MeshBasicMaterial({
        color: hotspotMaterial.color,
        transparent: true,
        opacity: 0.0
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.copy(hotspot.position);
    ring.visible = false; // Hacer invisible

    // Agregar al padre o a la escena
    if (parent) {
        parent.add(hotspot);
        parent.add(ring);
    } else {
        scene.add(hotspot);
        scene.add(ring);
    }

    // Luz puntual del hotspot - DESACTIVADA
    const hotspotLight = new THREE.PointLight(hotspotMaterial.color, 0, 2, 2);
    hotspotLight.position.copy(hotspot.position);
    hotspotLight.visible = false; // Apagar luz
    if (parent) {
        parent.add(hotspotLight);
    } else {
        scene.add(hotspotLight);
    }

    hotspots.push(hotspot);

    // Animación avanzada - DESACTIVADA
    hotspot.animate = function () {
        // Animaciones desactivadas para mantener hotspots invisibles
        /*
        const time = Date.now() * 0.003;

        // Pulsación del hotspot
        const scale = 1 + Math.sin(time) * 0.15;
        hotspot.scale.setScalar(scale);

        // Rotación del anillo
        ring.rotation.z += 0.02;
        ring.rotation.x = Math.sin(time * 0.5) * 0.3;

        // Variación de opacidad del anillo
        ring.material.opacity = 0.3 + Math.sin(time * 2) * 0.2;

        // Intensidad de luz variable
        hotspotLight.intensity = 3 + Math.sin(time * 3) * 2;
        */
    };

    return hotspot;
}

// Actualizar rotación de cámara con suavizado para movimientos naturales
function updateCameraRotation(deltaTime) {
    // Suavizar rotación usando interpolación (lerp) - más responsive
    const smoothingFactor = Math.min(REALISTIC_CONFIG.movement.smoothing, 1.0);
    
    // Interpolar rotación actual hacia rotación objetivo con factor ajustado por deltaTime
    const lerpFactor = 1 - Math.pow(1 - smoothingFactor, deltaTime * 60);
    
    currentRotationX += (targetRotationX - currentRotationX) * lerpFactor;
    currentRotationY += (targetRotationY - currentRotationY) * lerpFactor;
    
    // Aplicar rotación a la cámara
    camera.rotation.order = 'YXZ'; // Orden importante: primero Y (horizontal), luego X (vertical)
    camera.rotation.x = currentRotationX;
    camera.rotation.y = currentRotationY;
    camera.rotation.z = 0; // Siempre 0 para evitar inclinación lateral antinatural
}

// Sistema de movimiento con colisiones suave
function updateMovement(deltaTime) {
    // Limitar deltaTime para evitar saltos grandes
    deltaTime = Math.min(deltaTime, 0.1);
    
    const speed = isRunning ? REALISTIC_CONFIG.movement.runSpeed : REALISTIC_CONFIG.movement.walkSpeed;

    // Aplicar fricción más suave
    velocity.x -= velocity.x * REALISTIC_CONFIG.movement.friction * deltaTime;
    velocity.z -= velocity.z * REALISTIC_CONFIG.movement.friction * deltaTime;

    // Calcular dirección de movimiento
    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize();

    // Suavizar la aceleración
    const acceleration = REALISTIC_CONFIG.movement.acceleration;

    // Aplicar movimiento basado en la rotación de la cámara con aceleración suave
    if (moveForward || moveBackward) {
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(camera.quaternion);
        forward.y = 0; // Mantener movimiento horizontal
        forward.normalize();

        const targetVelocityZ = direction.z * speed;
        const velocityDiff = targetVelocityZ - (velocity.dot(forward));
        velocity.add(forward.clone().multiplyScalar(velocityDiff * acceleration * deltaTime));
    }

    if (moveLeft || moveRight) {
        const right = new THREE.Vector3(1, 0, 0);
        right.applyQuaternion(camera.quaternion);
        right.y = 0; // Mantener movimiento horizontal
        right.normalize();

        const targetVelocityX = direction.x * speed;
        const velocityDiff = targetVelocityX - (velocity.dot(right));
        velocity.add(right.clone().multiplyScalar(velocityDiff * acceleration * deltaTime));
    }

    // Limitar velocidad máxima
    const maxSpeed = speed * 1.5; // Aumentado de 1.2 para permitir más velocidad
    if (velocity.length() > maxSpeed) {
        velocity.normalize().multiplyScalar(maxSpeed);
    }

    // Aplicar colisiones antes de mover
    const newPosition = camera.position.clone().add(velocity.clone().multiplyScalar(deltaTime));

    // Verificar colisiones con límites del museo
    if (newPosition.x > collisionBounds.minX && newPosition.x < collisionBounds.maxX) {
        camera.position.x = newPosition.x;
    } else {
        // Detener velocidad horizontal al chocar con pared
        velocity.x = 0;
    }

    if (newPosition.z > collisionBounds.minZ && newPosition.z < collisionBounds.maxZ) {
        camera.position.z = newPosition.z;
    } else {
        // Detener velocidad horizontal al chocar con pared
        velocity.z = 0;
    }

    // Nota: La altura Y ahora la maneja updateHeadBob() para el efecto de caminar
    // camera.position.y = 1.7; // Comentado - ahora se controla en updateHeadBob

    // Verificar colisiones con objetos del museo
    checkMuseumObjectCollisions();

    // Actualizar display de posición
    updatePositionDisplay();

    // Actualizar mapa
    updateNavigationMap();
}

// Función de colisiones con objetos del museo
function checkMuseumObjectCollisions() {
    const playerRadius = 0.5; // Radio de colisión del jugador
    const playerPos = new THREE.Vector2(camera.position.x, camera.position.z);

    // Verificar colisiones con todos los objetos decorativos
    decorationCollisions.forEach(collision => {
        const objectPos = new THREE.Vector2(collision.x, collision.z);
        const distance = playerPos.distanceTo(objectPos);
        const minDistance = playerRadius + collision.radius;

        if (distance < minDistance) {
            // Hay colisión - empujar al jugador
            const pushDirection = playerPos.clone().sub(objectPos).normalize();
            const pushAmount = minDistance - distance;
            
            camera.position.x += pushDirection.x * pushAmount;
            camera.position.z += pushDirection.y * pushAmount;
            
            // Detener velocidad en esa dirección
            velocity.x *= 0.5;
            velocity.z *= 0.5;
        }
    });

    // Verificar colisiones con objetos del museo (esculturas, plantas, etc.)
    museumObjects.forEach(obj => {
        if (obj.group && obj.config && obj.config.position) {
            const objPos = new THREE.Vector2(obj.config.position[0], obj.config.position[2]);
            const distance = playerPos.distanceTo(objPos);
            
            // Radio según tipo de objeto
            let objRadius = 0.5;
            if (obj.config.type === 'sculpture') objRadius = 1.5;
            else if (obj.config.type === 'plant') objRadius = 0.4;
            else if (obj.config.type === 'bench') objRadius = 1.0;
            else if (obj.config.type === 'table') objRadius = 0.8;
            else if (obj.config.type === 'column') objRadius = 0.6;
            else if (obj.config.type === 'displayCase') objRadius = 1.0;
            else if (obj.config.type === 'wall') objRadius = 2.0;
            else if (obj.config.type === 'podium') objRadius = 0.8;

            const minDistance = playerRadius + objRadius;

            if (distance < minDistance) {
                // Hay colisión - empujar al jugador
                const pushDirection = playerPos.clone().sub(objPos).normalize();
                const pushAmount = minDistance - distance;
                
                camera.position.x += pushDirection.x * pushAmount;
                camera.position.z += pushDirection.y * pushAmount;
                
                // Detener velocidad
                velocity.x *= 0.3;
                velocity.z *= 0.3;
            }
        }
    });
}

// Efecto de balanceo al caminar (head bob)
function updateHeadBob(deltaTime) {
    if (!headBobConfig.enabled) return;

    // Verificar si el jugador se está moviendo
    const isMoving = moveForward || moveBackward || moveLeft || moveRight;
    
    if (isMoving) {
        headBobActive = true;
        
        // Incrementar el tiempo de caminar basado en la velocidad
        const currentSpeed = velocity.length();
        const speedMultiplier = isRunning ? 1.8 : 1.0; // Mayor multiplicador cuando corre
        walkingTime += deltaTime * headBobConfig.frequency * speedMultiplier;
        
        // Amplitud aumenta al correr
        const amplitudeMultiplier = isRunning ? 1.5 : 1.0;
        
        // Calcular el balanceo vertical (arriba y abajo)
        const verticalBob = Math.sin(walkingTime * 2) * headBobConfig.amplitude * amplitudeMultiplier;
        
        // Calcular el balanceo horizontal (izquierda y derecha)
        const horizontalBob = Math.cos(walkingTime) * headBobConfig.amplitudeHorizontal * amplitudeMultiplier;
        
        // Aplicar el balanceo a la posición Y de la cámara
        const baseHeight = 1.7; // Altura base de los ojos
        camera.position.y = baseHeight + verticalBob;
        
        // Pequeña rotación lateral para mayor realismo
        const tiltAngle = horizontalBob * 0.5;
        camera.rotation.z = tiltAngle;
        
    } else {
        // Suavizar la vuelta a la posición normal cuando se detiene
        if (headBobActive) {
            const baseHeight = 1.7;
            camera.position.y += (baseHeight - camera.position.y) * deltaTime * 5;
            camera.rotation.z += (0 - camera.rotation.z) * deltaTime * 5;
            
            // Detener el efecto cuando esté muy cerca de la posición base
            if (Math.abs(camera.position.y - baseHeight) < 0.001) {
                camera.position.y = baseHeight;
                camera.rotation.z = 0;
                headBobActive = false;
                walkingTime = 0;
            }
        }
    }
}

// Registrar todas las colisiones después de crear los objetos
function registerAllCollisions() {
    console.log('📍 Registrando colisiones de objetos del museo...');
    
    let collisionCount = decorationCollisions.length;
    
    // Los museumObjects ya se verifican dinámicamente en checkMuseumObjectCollisions
    console.log(`✅ Colisiones registradas: ${collisionCount} decoraciones + ${museumObjects.length} objetos del museo`);
}

// Verificar colisiones con obras de arte y esculturas
// Actualizar mapa de navegación
function updateNavigationMap() {
    const mapIndicator = document.querySelector('.map-indicator');
    if (mapIndicator) {
        // Calcular posición relativa en el mapa
        const normalizedX = (camera.position.x + 14) / 28; // Normalizar a 0-1
        const normalizedZ = (camera.position.z + 14) / 28; // Normalizar a 0-1

        // Convertir a coordenadas del mapa (120px x 120px)
        const mapX = normalizedX * 100 + 10; // 10px de padding
        const mapZ = normalizedZ * 100 + 10;

        mapIndicator.style.transform = `translate(${mapX - 6}px, ${mapZ - 6}px)`;

        // Rotar indicador según la dirección de la cámara
        const rotation = camera.rotation.y * (180 / Math.PI);
        mapIndicator.style.transform += ` rotate(${-rotation}deg)`;
    }
}


// Mostrar instrucciones de controles
function showControlInstructions() {
    const instructions = document.createElement('div');
    instructions.id = 'control-instructions';
    
    // Detectar si es móvil para el modal
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
        || (window.innerWidth <= 768);
    
    instructions.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.13);
        backdrop-filter: blur(13.125px);
        color: white;
        padding: ${isMobile ? '20px 25px' : '15.75px 18.375px'};
        border-radius: 7.35px;
        text-align: center;
        z-index: 2000;
        max-width: ${isMobile ? '90%' : '199.5px'};
        border: 1px solid rgba(255, 255, 255, 0.2);
        box-shadow: 0px 4.2px 13.125px rgba(0, 0, 0, 0.4);
    `;

    const instructionText = isMobile 
        ? `<p style="
            margin-bottom: 12.6px; 
            font-size: ${isMobile ? '14px' : '6.825px'};
            line-height: 1.5;
            color: rgba(255, 255, 255, 0.85);
            font-weight: 400;
        ">Usa el joystick izquierdo para moverte y desliza el dedo en la pantalla para mirar. El botón verde te permite interactuar con las obras.</p>`
        : `<p style="
            margin-bottom: 12.6px; 
            font-size: 6.825px;
            line-height: 1.5;
            color: rgba(255, 255, 255, 0.85);
            font-weight: 400;
        ">Elige tu modo de exploración</p>`;

    instructions.innerHTML = `
        <h3 style="
            margin-bottom: 6.3px; 
            color: #ffffff; 
            font-weight: 700;
            font-size: ${isMobile ? '18px' : '11.55px'};
            letter-spacing: 0.42px;
            text-transform: uppercase;
        ">Bienvenido al Museo Virtual</h3>
        ${instructionText}
        <div style="display: flex; flex-direction: column; gap: 5.25px;">
            <button id="start-walking" style="
                background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.85) 100%);
                color: #000;
                border: none;
                padding: ${isMobile ? '14px 24px' : '6.3px 12.6px'};
                border-radius: 4.2px;
                border: 1px solid rgba(255, 255, 255, 0.3);
                cursor: pointer;
                font-weight: 700;
                font-size: ${isMobile ? '14px' : '6.825px'};
                letter-spacing: 0.2625px;
                text-transform: uppercase;
                transition: all 0.3s ease;
                box-shadow: 0 2.1px 6.3px rgba(255, 255, 255, 0.2);
            " onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 3.15px 8.4px rgba(255, 255, 255, 0.3)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2.1px 6.3px rgba(255, 255, 255, 0.2)';">${isMobile ? 'Iniciar Recorrido' : 'Recorrido Libre'}</button>
            
            <button id="start-tour" style="
                background: linear-gradient(135deg, rgba(74, 222, 128, 0.9) 0%, rgba(34, 197, 94, 0.9) 100%);
                color: #000;
                border: none;
                padding: ${isMobile ? '14px 24px' : '6.3px 12.6px'};
                border-radius: 4.2px;
                border: 1px solid rgba(255, 255, 255, 0.3);
                cursor: pointer;
                font-weight: 700;
                font-size: ${isMobile ? '14px' : '6.825px'};
                letter-spacing: 0.2625px;
                text-transform: uppercase;
                transition: all 0.3s ease;
                box-shadow: 0 2.1px 6.3px rgba(74, 222, 128, 0.3);
            " onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 3.15px 8.4px rgba(74, 222, 128, 0.4)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2.1px 6.3px rgba(74, 222, 128, 0.3)';">Recorrido Dinámico</button>
        </div>
    `;

    document.body.appendChild(instructions);

    // Modo libre (exploración manual)
    document.getElementById('start-walking').addEventListener('click', () => {
        document.body.removeChild(instructions);
        if (!isMobile) {
            renderer.domElement.requestPointerLock();
        }
        // En móvil, los controles táctiles ya están activos
    });

    // Modo recorrido dinámico
    document.getElementById('start-tour').addEventListener('click', () => {
        document.body.removeChild(instructions);
        startDynamicTour();
    });
}

// Función para el recorrido dinámico (redirige a Google y cierra el museo)
function startDynamicTour() {
    console.log('🎬 Redirigiendo a recorrido dinámico...');
    
    // Abrir Google en la misma ventana
    window.location.href = 'https://byron-s-dynamic-museum.pages.dev/index.html';
    
    // Limpiar recursos del museo antes de redirigir
    if (renderer) {
        renderer.dispose();
    }
    if (scene) {
        scene.traverse((object) => {
            if (object.geometry) {
                object.geometry.dispose();
            }
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });
    }
}

// Función para manejar el hover sobre pinturas
function onMouseMove(event) {
    // Solo si el pointer NO está bloqueado (modo navegación libre)
    if (document.pointerLockElement === renderer.domElement) {
        return;
    }

    // Calcular posición del mouse
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    // Verificar intersección con pinturas
    const artworkMeshes = artworks.map(artwork => artwork.mesh).filter(mesh => mesh);
    const intersects = raycaster.intersectObjects(artworkMeshes);
}

// Mostrar notificación temporal al hacer click en pintura
function showClickNotification(message) {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        font-family: 'Arial', sans-serif;
        font-size: 14px;
        font-weight: 600;
        z-index: 1001;
        border: 1px solid rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(10px);
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        transition: opacity 0.3s ease;
    `;

    notification.textContent = message;
    document.body.appendChild(notification);

    // Animación de entrada
    requestAnimationFrame(() => {
        notification.style.opacity = '1';
    });

    // Eliminar después de 3 segundos
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Manejar doble click para auto-rotación
function onDoubleClick() {
    controls.autoRotate = !controls.autoRotate;

    // Mostrar indicador
    const indicator = document.createElement('div');
    indicator.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 10px 20px;
        border-radius: 20px;
        font-size: 14px;
        z-index: 1000;
        pointer-events: none;
    `;
    indicator.textContent = `Auto-rotación: ${controls.autoRotate ? 'ON' : 'OFF'}`;
    document.body.appendChild(indicator);

    setTimeout(() => {
        document.body.removeChild(indicator);
    }, 2000);
}

// Mostrar información de obra
function showArtworkInfo(artworkData, persistent = false) {
    const infoPanel = document.getElementById('artwork-info');

    if (artworkData && (artworkData.title || artworkData.description)) {
        document.getElementById('artwork-title').textContent = artworkData.title || 'Sin título';
        document.getElementById('artwork-artist').textContent = artworkData.artist || 'Artista desconocido';
        document.getElementById('artwork-year').textContent = artworkData.year || '';
        document.getElementById('artwork-description').textContent = artworkData.description || 'Sin descripción disponible';

        infoPanel.classList.add('show');

        if (persistent) {
            infoPanel.setAttribute('data-persistent', 'true');
        }
    }
}

// Ocultar información de obra
function hideArtworkInfo() {
    const infoPanel = document.getElementById('artwork-info');
    if (!infoPanel.getAttribute('data-persistent')) {
        infoPanel.classList.remove('show');
    }
}

// Crear control de audio (reducido 50%)
function createAudioToggle() {
    const audioToggle = document.createElement('button');
    audioToggle.style.cssText = `
        position: fixed;
        bottom: 30px;
        left: 40px;
        width: 25px;
        height: 25px;
        border-radius: 50%;
        border: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(255, 255, 255, 0.29);
        color: white;
        font-size: 10px;
        cursor: pointer;
        z-index: 100;
        backdrop-filter: blur(10px);
        transition: all 0.3s ease;
    `;
    audioToggle.innerHTML = '🔇';

    let audioEnabled = false;

    audioToggle.addEventListener('click', () => {
        audioEnabled = !audioEnabled;
        audioToggle.innerHTML = audioEnabled ? '🔊' : '🔇';

        if (ambientAudio) {
            if (audioEnabled) {
                ambientAudio.play().catch(console.error);
            } else {
                ambientAudio.pause();
            }
        }
    });

    return audioToggle;
}

// Configurar audio ambiente
function setupAudio() {
    ambientAudio = document.getElementById('ambient-audio');

    if (ambientAudio) {
        ambientAudio.volume = 0.3;
        ambientAudio.loop = true;

        // Auto-reproducir si es posible
        const playAudio = () => {
            ambientAudio.play().catch(() => {
                // Si falla, mostrar botón de audio
                console.log('Audio requiere interacción del usuario');
            });
        };

        // Intentar reproducir cuando el usuario interactúe
        document.addEventListener('click', playAudio, { once: true });
    } else {
        console.log('Audio ambiente no disponible - continuando sin sonido');
    }
}



// Loop de animación mejorado con movimiento
let frameCount = 0;
// Monitor de rendimiento
let fps = 60;
let fpsFrames = 0;
let fpsTime = 0;
let shadowUpdateInterval = 0;

function animate() {
    requestAnimationFrame(animate);

    frameCount++;
    if (frameCount === 1) {
        console.log('🎬 Primer frame de animación ejecutado');
    }

    const time = performance.now();
    const deltaTime = (time - prevTime) / 1000;
    prevTime = time;

    // Calcular FPS
    fpsFrames++;
    fpsTime += deltaTime;
    if (fpsTime >= 1.0) {
        fps = fpsFrames / fpsTime;
        fpsFrames = 0;
        fpsTime = 0;
        
        // Optimización adaptativa: si FPS < 30, reducir calidad
        if (fps < 30 && renderer.shadowMap.enabled) {
            console.warn('⚠️ FPS bajo detectado:', fps.toFixed(1), '- Optimizando...');
            renderer.shadowMap.autoUpdate = false; // Congelar sombras
        }
    }

    const elapsedTime = clock.getElapsedTime();

    // Actualizar rotación de cámara con suavizado (interpolación)
    updateCameraRotation(deltaTime);

    // Actualizar movimiento y colisiones
    updateMovement(deltaTime);
    
    // Actualizar efecto de caminar (head bob)
    updateHeadBob(deltaTime);

    // Animar hotspots (solo cada 2 frames para rendimiento)
    if (frameCount % 2 === 0) {
        hotspots.forEach(hotspot => {
            if (hotspot.animate) {
                hotspot.animate();
            }
        });
    }

    // Animaciones ambientales (reducidas)
    if (frameCount % 3 === 0) {
        animateEnvironment(elapsedTime);
    }

    // Actualizar sombras solo ocasionalmente si está desactivado autoUpdate
    if (!renderer.shadowMap.autoUpdate) {
        shadowUpdateInterval++;
        if (shadowUpdateInterval > 60) { // Cada 60 frames (~1 segundo)
            renderer.shadowMap.needsUpdate = true;
            shadowUpdateInterval = 0;
        }
    }

    // Renderizar
    if (frameCount === 1) {
        console.log('🎨 Primera llamada a renderer.render', {
            scene: scene ? `${scene.children.length} objetos` : 'null',
            camera: camera ? 'OK' : 'null',
            renderer: renderer ? 'OK' : 'null'
        });
    }

    // Renderizar con estabilización
    renderer.clear();
    renderer.render(scene, camera);
}

// Animaciones ambientales optimizadas
function animateEnvironment(time) {
    // Variación sutil de la luz del tragaluz (solo si FPS es bueno)
    if (fps > 40) {
        const skylights = scene.children.filter(child => child.type === 'DirectionalLight');
        skylights.forEach(light => {
            if (light.position.y > 10) { // Es el tragaluz principal
                light.intensity = 1.3 + Math.sin(time * 0.5) * 0.2;
            }
        });
    }

    // Efecto de respiración en obras DESACTIVADO para rendimiento
    // (consume muchos recursos actualizar scales constantemente)
}

// Manejar redimensionamiento de ventana
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// ==========================================
// CONTROLES MÓVILES
// ==========================================

let isMobileDevice = false;
let touchStartX = 0;
let touchStartY = 0;
let touchMoveX = 0;
let touchMoveY = 0;
let joystickActive = false;
let lookTouchId = null;
let moveTouchId = null;

// Detectar si es dispositivo móvil
function detectMobileDevice() {
    isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
        || (window.innerWidth <= 768);
    console.log('📱 Dispositivo móvil detectado:', isMobileDevice);
    return isMobileDevice;
}

// Crear controles táctiles en pantalla
function createMobileControls() {
    if (!isMobileDevice) return;

    // Crear joystick virtual para movimiento (lado derecho inferior)
    const joystickContainer = document.createElement('div');
    joystickContainer.id = 'mobile-joystick';
    joystickContainer.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 120px;
        height: 120px;
        background: rgba(255, 255, 255, 0.15);
        border: 3px solid rgba(255, 255, 255, 0.4);
        border-radius: 50%;
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        touch-action: none;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;

    const joystickHandle = document.createElement('div');
    joystickHandle.id = 'joystick-handle';
    joystickHandle.style.cssText = `
        width: 50px;
        height: 50px;
        background: rgba(255, 255, 255, 0.7);
        border: 2px solid rgba(255, 255, 255, 0.9);
        border-radius: 50%;
        position: absolute;
        transition: all 0.1s ease;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    `;

    joystickContainer.appendChild(joystickHandle);
    document.body.appendChild(joystickContainer);

    // Área de mirar (toda la pantalla excepto el joystick)
    const lookArea = document.createElement('div');
    lookArea.id = 'mobile-look-area';
    lookArea.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 998;
        touch-action: none;
        pointer-events: auto;
    `;
    document.body.appendChild(lookArea);
    
    // Asegurar que el joystick esté por encima
    joystickContainer.style.zIndex = '1001';

    // Añadir crosshair para móvil
    if (isMobileDevice) {
        const crosshair = document.getElementById('crosshair');
        if (crosshair) {
            crosshair.classList.add('active');
            crosshair.style.opacity = '0.6';
        }
    }

    setupMobileEventListeners(joystickContainer, joystickHandle, lookArea);
}

// Configurar event listeners para móvil
function setupMobileEventListeners(joystick, handle, lookArea) {
    // Joystick para movimiento
    joystick.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation(); // Evitar que se propague al lookArea
        moveTouchId = e.touches[0].identifier;
        joystickActive = true;
        const rect = joystick.getBoundingClientRect();
        touchStartX = rect.left + rect.width / 2;
        touchStartY = rect.top + rect.height / 2;
    }, { passive: false });

    joystick.addEventListener('touchmove', (e) => {
        e.preventDefault();
        e.stopPropagation(); // Evitar que se propague al lookArea
        if (!joystickActive) return;

        const touch = Array.from(e.touches).find(t => t.identifier === moveTouchId);
        if (!touch) return;

        const rect = joystick.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const deltaX = touch.clientX - centerX;
        const deltaY = touch.clientY - centerY;
        
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const maxDistance = 35;
        
        const clampedDistance = Math.min(distance, maxDistance);
        const angle = Math.atan2(deltaY, deltaX);
        
        const handleX = Math.cos(angle) * clampedDistance;
        const handleY = Math.sin(angle) * clampedDistance;
        
        handle.style.transform = `translate(${handleX}px, ${handleY}px)`;

        // Actualizar movimiento basado en el joystick
        const normalizedX = deltaX / maxDistance;
        const normalizedY = deltaY / maxDistance;

        // Actualizar variables de movimiento
        moveForward = normalizedY < -0.3;
        moveBackward = normalizedY > 0.3;
        moveLeft = normalizedX < -0.3;
        moveRight = normalizedX > 0.3;

    }, { passive: false });

    joystick.addEventListener('touchend', (e) => {
        e.stopPropagation(); // Evitar que se propague al lookArea
        const touch = Array.from(e.changedTouches).find(t => t.identifier === moveTouchId);
        if (!touch) return;

        joystickActive = false;
        moveTouchId = null;
        handle.style.transform = 'translate(0, 0)';
        
        // Detener movimiento
        moveForward = false;
        moveBackward = false;
        moveLeft = false;
        moveRight = false;
    }, { passive: false });

    // Área de mirar (drag para rotar cámara) - toda la pantalla
    lookArea.addEventListener('touchstart', (e) => {
        // Verificar si el toque está sobre el joystick
        const rect = joystick.getBoundingClientRect();
        const touch = e.touches[0];
        const isOverJoystick = (
            touch.clientX >= rect.left &&
            touch.clientX <= rect.right &&
            touch.clientY >= rect.top &&
            touch.clientY <= rect.bottom
        );
        
        // Si está sobre el joystick, no procesar
        if (isOverJoystick) return;
        
        e.preventDefault();
        if (lookTouchId !== null) return;
        
        lookTouchId = touch.identifier;
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
    }, { passive: false });

    lookArea.addEventListener('touchmove', (e) => {
        const touch = Array.from(e.touches).find(t => t.identifier === lookTouchId);
        if (!touch) return;
        
        e.preventDefault();

        touchMoveX = touch.clientX - touchStartX;
        touchMoveY = touch.clientY - touchStartY;

        // Actualizar rotación de cámara con mayor sensibilidad
        targetRotationY -= touchMoveX * 0.005; // Sensibilidad horizontal
        targetRotationX -= touchMoveY * 0.005; // Sensibilidad vertical

        const maxVerticalAngle = Math.PI / 3;
        targetRotationX = Math.max(-maxVerticalAngle, Math.min(maxVerticalAngle, targetRotationX));

        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
    }, { passive: false });

    lookArea.addEventListener('touchend', (e) => {
        const touch = Array.from(e.changedTouches).find(t => t.identifier === lookTouchId);
        if (!touch) return;
        
        lookTouchId = null;
    }, { passive: false });
}

// Ajustar UI para móvil
function adjustUIForMobile() {
    if (!isMobileDevice) return;

    const style = document.createElement('style');
    style.innerHTML = `
        @media (max-width: 768px) {
            #logo {
                top: 10px !important;
                left: 10px !important;
                font-size: 0.8em !important;
                padding: 5px 8px !important;
            }
            
            #navigation-controls {
                display: none !important;
            }
            
            #audio-toggle {
                top: 10px !important;
                right: 10px !important;
                width: 40px !important;
                height: 40px !important;
                font-size: 16px !important;
            }
            
            #control-instructions {
                max-width: 90% !important;
                padding: 20px !important;
            }
            
            #control-instructions h3 {
                font-size: 16px !important;
            }
            
            #control-instructions p {
                font-size: 12px !important;
            }
            
            #control-instructions button {
                font-size: 12px !important;
                padding: 12px 20px !important;
            }
            
            .loader-content {
                transform: scale(1) !important;
            }
            
            .loader-spinner {
                width: 50px !important;
                height: 50px !important;
            }
        }
    `;
    document.head.appendChild(style);
}

// Event listeners
window.addEventListener('resize', onWindowResize, false);
// Verificar compatibilidad WebGL
function checkWebGLSupport() {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (!gl) {
            console.error('WebGL no está disponible');
            return false;
        }

        // Verificar extensiones necesarias
        const extensions = [
            'OES_texture_float',
            'OES_standard_derivatives'
        ];

        for (const ext of extensions) {
            if (!gl.getExtension(ext)) {
                console.warn(`Extensión WebGL no disponible: ${ext}`);
            }
        }

        console.log('✅ WebGL verificado correctamente');
        return true;
    } catch (error) {
        console.error('Error verificando WebGL:', error);
        return false;
    }
}

// Verificar dependencias antes de inicializar
function checkDependencies() {
    console.log('Verificando dependencias...');

    if (typeof THREE === 'undefined') {
        console.error('Three.js no está cargado, intentando continuar...');
        // Dar más tiempo para que Three.js cargue
        return false;
    }

    console.log('✅ Three.js cargado, versión:', THREE.REVISION);
    return true;
}

// Inicializar cuando se cargue la página
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM listo, verificando dependencias...');

    let retries = 0;
    const maxRetries = 10; // Intentar hasta 10 veces

    const tryInit = () => {
        if (checkDependencies()) {
            console.log('✅ Dependencias verificadas, iniciando museo...');
            setTimeout(() => {
                init();
            }, 100);
        } else {
            retries++;
            if (retries < maxRetries) {
                console.log(`⏳ Reintento ${retries}/${maxRetries} en 500ms...`);
                setTimeout(tryInit, 500);
            } else {
                console.error('❌ No se pudieron cargar las dependencias después de', maxRetries, 'intentos');
                console.log('🔄 Intentando inicializar de todos modos...');
                setTimeout(() => {
                    init();
                }, 100);
            }
        }
    };

    tryInit();

    // Precargar recursos críticos con soporte móvil mejorado
    const preloadImages = [
        'src/assets/images/Amanecer - Byron.jpeg',
        'src/assets/images/Bailarina - Byron.jpg',
        'src/assets/images/Naturaleza Muerta - Byron.jpg',
        'src/assets/images/Rocas y Cielo - Byron.jpg',
        'src/assets/images/Musicos - Byron.jpg',
        'src/assets/images/Escultura de pie - Byron.jpg',
        'src/assets/images/Escultura sentada - Byron.jpg'
    ];

    let loadedImages = 0;
    const totalImages = preloadImages.length;
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    console.log('📱 Dispositivo móvil detectado:', isMobileDevice);
    console.log('🖼️ Iniciando precarga de', totalImages, 'imágenes...');

    preloadImages.forEach((src, index) => {
        const img = new Image();
        
        // Configurar crossOrigin para evitar problemas de CORS
        img.crossOrigin = 'anonymous';
        
        // Timeout específico para cada imagen (más largo en móvil)
        const imageTimeout = setTimeout(() => {
            if (!img.complete) {
                console.warn(`⏱️ Timeout para imagen ${index + 1}/${totalImages}:`, src);
                loadedImages++;
                checkPreloadComplete();
            }
        }, isMobileDevice ? 15000 : 10000); // 15s en móvil, 10s en desktop
        
        img.onload = () => {
            clearTimeout(imageTimeout);
            loadedImages++;
            console.log(`✅ Imagen ${index + 1}/${totalImages} cargada (${img.width}x${img.height}): ${src}`);
            checkPreloadComplete();
        };
        
        img.onerror = (error) => {
            clearTimeout(imageTimeout);
            loadedImages++;
            console.error(`❌ Error cargando imagen ${index + 1}/${totalImages}:`, src, error);
            checkPreloadComplete();
        };
        
        // Agregar cache busting solo si es necesario
        const cacheBuster = isMobileDevice ? `?t=${Date.now()}` : '';
        img.src = src + cacheBuster;
    });

    function checkPreloadComplete() {
        if (loadedImages === totalImages) {
            console.log(`🎉 Precarga completada: ${loadedImages}/${totalImages} imágenes procesadas`);
        }
    }

    // Timeout de seguridad para precarga (más largo en móvil)
    setTimeout(() => {
        if (loadedImages < totalImages) {
            console.warn(`⏱️ Timeout de precarga: ${loadedImages}/${totalImages} imágenes cargadas`);
            console.log('⚠️ Continuando de todos modos...');
        }
    }, isMobileDevice ? 20000 : 10000);
});

// Exportar funciones principales para depuración
if (typeof window !== 'undefined') {
    window.MuseumDebug = {
        scene,
        camera,
        renderer,
        artworks,
        hotspots
    };
}