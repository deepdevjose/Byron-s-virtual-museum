# Technologies

| Technology | Project role | Why it is used | Engineering notes |
|---|---|---|---|
| Three.js r128 | 3D scene abstraction | Provides camera, renderer, geometry, materials, lights, textures, raycasting | Loaded from `unpkg` through import map; no bundler |
| WebGL | GPU rendering backend | Enables real-time spatial museum | Accessed through `THREE.WebGLRenderer` |
| JavaScript ES modules | Application architecture | Native browser module loading keeps static deployment simple | 17 modules under `src/js` |
| HTML | Static shell | Provides container, loader, modal roots, audio, credits | No framework runtime |
| CSS | Overlay and responsive UI | Handles HUDs, modals, mobile controls, accessibility preferences | 2,559 source lines; major UI surface |
| JSON | Domain/content model | Drives artwork placement, media, labels, readings, tour | 29 records in `src/data/artworks.json` |
| Canvas API | Generated textures and labels | Produces wall labels and procedural environment textures without extra assets | Converted to `THREE.CanvasTexture` |
| Cloudinary | Remote video delivery | Keeps heavy MP4 assets out of Git | 29 video URLs in catalog |
| Browser Media APIs | Audio/video playback | Native controls reduce custom player complexity | Autoplay policy must be handled |
| Pointer Lock API | Desktop first-person look | Enables immersive mouse-look navigation | Requires user gesture and browser permission |
| Touch Events | Mobile navigation | Joystick/look/action controls | Created dynamically for mobile/narrow layouts |
| Node.js | Local validation scripts | Catalog validation and smoke checks without npm package | Scripts run directly |
| Mermaid | Architecture documentation | Maintains diagrams as text in repo | Sources in `docs/diagrams/` |

## Deliberately Not Used

| Technology | Reason |
|---|---|
| React/Vue/Svelte | UI surface is small enough for direct DOM/CSS; avoiding framework runtime keeps deployment simple |
| Bundler | Static ES modules are sufficient for current size and GitHub Pages deployment |
| Physics engine | Collision needs are simple 2D constraints, not rigid-body simulation |
| Backend/database | Catalog is static and versioned in Git |
| Video files in Git | Would bloat repository and deployment payload |

