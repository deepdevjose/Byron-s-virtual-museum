# Technologies

| Technology | Role in the project | Notes |
|---|---|---|
| Three.js r128 | 3D rendering library | Loaded from `https://unpkg.com` through the import map in `index.html`. |
| WebGL | Browser graphics runtime | Used through `THREE.WebGLRenderer`. |
| JavaScript ES modules | Application logic | Modules live under `src/js/`. |
| HTML | Static document structure | Provides canvas container, loader, modals, audio element, and script entry. |
| CSS | UI overlays and responsive layout | Main stylesheet is `src/css/style.css`. |
| JSON | Artwork metadata | `src/data/artworks.json` drives gallery placement and modal content. |
| Canvas API | Procedural labels and textures | Used for artwork labels and environment textures. |
| Cloudinary | Remote video delivery | Artwork records contain Cloudinary delivery URLs. Optimization transformations are recommended. |
| Node.js | Validation scripts | Scripts are run directly; no `package.json` is present. |
