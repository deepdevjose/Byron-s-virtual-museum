# Virtual Museum - Byron Gálvez Gallery

A WebGL-based virtual museum application built with Three.js, featuring photorealistic rendering, physically-based materials, and immersive navigation controls.

## Technical Overview

**Rendering Engine:** Three.js r128 with WebGL 2.0
**Architecture:** Single-page application with procedural geometry generation  
**Lighting:** 49-light system with shadow mapping (4 shadow-casting lights max)  
**Materials:** PBR workflow with metalness, roughness, and transmission properties  
**Performance:** Optimized for 60 FPS on mid-range hardware

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
museito/
│
├── index.html                    # Application entry point
├── main.js                       # Three.js scene logic (4600+ lines)
├── style.css                     # UI styling with liquid glass effects
├── config.js                     # Centralized configuration parameters
├── README.md                     # Project documentation
│
└── assets/                       # Media resources
    │
    ├── audio/
    │   └── ambient_sound.mp3     # Background ambient audio
    │
    └── images/                   # Artwork textures
        ├── Amanecer - Byron.jpeg
        ├── Bailarina - Byron.jpg
        ├── Escultura de pie - Byron.jpg
        ├── Escultura sentada - Byron.jpg
        ├── Musicos - Byron.jpg
        ├── MusicosM.jpg
        ├── Naturaleza Muerta - Byron.jpg
        ├── Rocas y Cielo - Byron.jpg
        ├── Vela.jpg
        ├── Violincello.jpg
```

## Technical Specifications

- **Camera:** Perspective, FOV 60°, near 0.1, far 1000
- **Shadow Resolution:** 2048×2048 for primary lights, 1024×1024 for secondary
- **Collision System:** 2D circle-based distance checking with push-back
- **Movement:** WASD controls with velocity-based physics and lerp smoothing
- **Tone Mapping:** ACESFilmicToneMapping with exposure 0.8

## Browser Requirements

- Modern browser with WebGL 2.0 support
- Recommended: Chrome 90+, Firefox 88+, Safari 14+
- Minimum GPU: Integrated graphics (Intel HD 4000 or equivalent)

## Credits

**Developer:** Jose Manuel Cortes Ceron  
**Artwork:** Byron Gálvez  
**License:** Non-commercial use only

---

*This project is intended for educational and portfolio purposes. All rights reserved. Not for commercial distribution.*