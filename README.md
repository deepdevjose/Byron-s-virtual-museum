# Virtual Museum - Byron Gálvez Gallery

A WebGL-based virtual museum application built with Three.js, featuring photorealistic rendering, physically-based materials, and immersive navigation controls.

## Technical Overview

**Rendering Engine:** Three.js r128 with WebGL 2.0
**Architecture:** Single-page application with procedural geometry generation  
**Lighting:** 49-light system with shadow mapping (4 shadow-casting lights max)  
**Materials:** PBR workflow with metalness, roughness, and transmission properties  
**Performance:** Optimized for ~60 FPS on mid-range hardware

## Core Features

- **First-person navigation** with pointer lock controls and collision detection
- **Advanced lighting system** with spotlights, point lights, and directional skylight
- **Realistic artwork display** with multi-layered frames and LED accent lighting
- **Interactive modals** with video playback support
- **Procedural materials** for floors, walls, and architectural elements
- **Shadow mapping** with PCF soft shadows (2048×2048 resolution)
- **Tone mapping** using ACES Filmic for cinematic color grading


## Project Structure

```
Byron-s-virtual-museum/
│
├── index.html                    # Application entry point
├── README.md                     # Project documentation
│
├── src/
│   ├── js/
│   │   ├── main.js               # Main Three.js scene logic
│   │   ├── config.js             # Centralized configuration parameters
│   │   └── modules/
│   │       ├── Core/
│   │       │   └── App.js        # Application bootstrap and core logic
│   │       ├── Player/
│   │       │   └── Controls.js   # First-person controls and navigation
│   │       ├── Utils/
│   │       │   ├── Audio.js              # Audio management utilities
│   │       │   ├── FrustumCulling.js     # Frustum culling logic
│   │       │   ├── LODSystem.js          # Level-of-detail system
│   │       │   └── OcclusionCulling.js   # Occlusion culling logic
│   │       └── World/
│   │           ├── Environment.js        # Environment setup
│   │           ├── Gallery.js            # Gallery and artwork logic
│   │           ├── Lighting.js           # Lighting system
│   │           └── Physics.js            # Physics and collision
│   ├── css/
│   │   └── style.css            # UI styling with liquid glass effects
│   └── assets/
│       ├── audio/
│       │   └── ambient_sound.mp3 # Background ambient audio
│       └── images/               # Artwork and texture images
│           ├── Amanecer - Byron.jpeg
│           ├── Bailarina - Byron.jpg
│           ├── Byron2.png
│           ├── Copas - Byron.jpg
│           ├── Escultura de pie - Byron.jpg
│           ├── Escultura sentada - Byron.jpg
│           ├── Flautistas - Byron.jpg
│           ├── Frutas - Byron.jpg
│           ├── Maquillaje - Byron.jpg
│           ├── Musicos - Byron.jpg
│           ├── MusicosM - Byron.jpg
│           ├── Naturaleza Muerta - Byron.jpg
│           ├── Rocas y Cielo - Byron.jpg
│           ├── Vanidad - Byron.jpg
│           ├── Vela - Byron.jpg
│           ├── Vela2 - Byron.jpg
│           ├── Veladoras - Byron.jpg
│           └── Violincello - Byron.jpg
│
├── scripts/                      # Benchmark and verification scripts
│   ├── benchmark-lod.js          # LOD system performance test
│   ├── benchmark-occlusion.js    # Occlusion culling benchmark
│   ├── benchmark-shadows.js      # Shadow system benchmark
│   ├── smoke-test.js             # Basic scene and asset load test
│   └── verify-frustum-culling.js # Frustum culling verification
```

## Technical Specifications

- **Camera:** Perspective, FOV 60°, near 0.1, far 1000
- **Shadow Resolution:** 2048×2048 for primary lights, 1024×1024 for secondary
- **Collision System:** 2D circle-based distance checking with push-back
- **Movement:** WASD controls with velocity-based physics and lerp smoothing
- **Tone Mapping:** ACESFilmicToneMapping with exposure 0.8
- **Modular Architecture:** Scene logic, controls, utilities, and world features are organized in ES6 modules for maintainability and scalability.
- **Utility Scripts:** Dedicated scripts for benchmarking LOD, occlusion, shadows, and verifying culling systems.
- **Asset Management:** All images and audio are organized under `src/assets` for easy reference and extension.
## Scripts & Utilities

The `scripts/` directory contains standalone Node.js/JS scripts for performance testing and verification:

- **benchmark-lod.js**: Benchmarks the Level-of-Detail (LOD) system.
- **benchmark-occlusion.js**: Tests occlusion culling performance.
- **benchmark-shadows.js**: Evaluates shadow rendering and performance.
- **smoke-test.js**: Runs a basic scene and asset load test.
- **verify-frustum-culling.js**: Verifies frustum culling logic.

These scripts are useful for profiling, regression testing, and validating optimizations.

## Browser Requirements

## Modular Codebase

The project is organized into feature-based modules:

- **Core:** Application bootstrap and main logic (`App.js`)
- **Player:** Navigation and controls (`Controls.js`)
- **Utils:** Audio, frustum culling, LOD, and occlusion utilities
- **World:** Environment, gallery, lighting, and physics systems

- Modern browser with WebGL 2.0 support
- Recommended: Chrome 90+, Firefox 88+, Safari 14+
- Minimum GPU: Integrated graphics (Intel HD 4000 or equivalent)

## Credits

**Developer:** Jose Manuel Cortes Ceron  
**Artwork:** Byron Gálvez  
**License:** Non-commercial use only

---

*This project is intended for educational and portfolio purposes. All rights reserved. Not for commercial distribution.*