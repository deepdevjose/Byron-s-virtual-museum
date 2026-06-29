# Results

## Implemented Result

The current project delivers a navigable virtual museum as a static WebGL application. It includes a procedurally built gallery, artwork catalog, image-textured paintings, generated wall labels, lighting, first-person controls, mobile controls, artwork modal, close-reading zoom, guided tour, credits flow, ambient audio, and validation scripts.

## Quantified Output

| Category | Result |
|---|---:|
| Artwork records displayed from catalog | 29 |
| Curatorial rooms represented | 7 |
| Guided-tour stops generated | 24 |
| Local artwork images | 27 |
| Remote Cloudinary videos | 29 |
| Local audio assets | 2 |
| JavaScript modules | 17 |
| JavaScript source lines | 6,364 |
| CSS source lines | 2,559 |
| Documentation/diagram files | 31+ |

## Feature Completion

| Feature | Status | Evidence |
|---|---|---|
| Static app boot | Implemented | `index.html`, `src/js/main.js`, `Core/App.js` |
| Artwork JSON loading | Implemented | `App.loadArtworks()` |
| Image preload fallback | Implemented | `App.preloadImages()` timeout |
| Procedural gallery shell | Implemented | `World/Environment.js` |
| Framed artwork meshes | Implemented | `World/Gallery.js` |
| In-scene wall labels | Implemented | Canvas texture labels |
| Free exploration | Implemented | `Player/Controls.js`, `App.enableFreeExploration()` |
| Mobile controls | Implemented | `App.createMobileControls()` |
| Collision | Implemented | `World/Physics.js` |
| Artwork hover/selection | Implemented | `Interaction/ArtworkInteraction.js` |
| Detail modal | Implemented | `UI/ArtworkPanel.js` |
| Texture zoom mode | Implemented | `ArtworkPanel.setupCloseReading()` |
| Cloudinary video lazy creation | Implemented | `ArtworkPanel.createVideoMarkup()` |
| Ambient audio pause/resume | Implemented | `Utils/Audio.js`, `ArtworkPanel` |
| Guided tour | Implemented | `Tour/tourPath.js`, `Tour/TourController.js` |
| Credits flow | Implemented | `index.html`, `App.setupCreditsModal()` |
| Validation scripts | Implemented | `scripts/validate-artworks.js`, `scripts/smoke-test.js` |

## Engineering Improvements Captured

Recent implementation fixes reflected in the documentation:

- artwork modal close no longer immediately reopens the same artwork;
- canvas sizing and raycasting now use the actual renderer canvas/container dimensions;
- responsive CSS includes desktop low-height breakpoints for Windows/laptop scaling;
- in-scene wall labels no longer show years, while catalog metadata keeps them available.

## Validated Checks

Latest local validation:

| Check | Result |
|---|---|
| `node scripts/validate-artworks.js` | Passing, 29 records |
| `node scripts/smoke-test.js` | Passing |
| `node --check` on recently modified JS modules | Passing |
| `git diff --check` during recent code fixes | Passing |

## Performance Result Status

The project contains performance-oriented engineering decisions, but formal device measurements are still pending.

| Metric | Current status |
|---|---|
| Desktop FPS | Pending measured QA |
| Mobile FPS | Pending measured QA |
| Cold startup time | Pending measured QA |
| Draw calls | Pending renderer.info capture |
| Texture memory | Pending renderer.info capture |
| Video metadata time | Pending network measurement |
| Memory after repeated modal opens | Pending browser profiling |

## Research Result

The project demonstrates that a static WebGL architecture can support a meaningful curatorial museum experience without a backend. The strongest result is not only visual: the same artwork metadata drives spatial placement, lighting, UI readings, media delivery, and guided-tour sequencing. This gives the project a coherent technical-curatorial backbone.

## Current Limitations

The implementation is strong for a static prototype, but not yet production-complete:

- no automated browser regression suite;
- no formal performance dataset across devices;
- Cloudinary transformations are not normalized;
- media cleanup can be hardened;
- accessibility needs broader review;
- no typed schema or JSON Schema validation;
- no build-time optimization pipeline.

## Screenshots

Existing figure:

- `docs/figures/museum-overview.png`

Recommended additional captures:

- welcome overlay;
- free exploration with interactive crosshair;
- artwork detail modal;
- texture zoom mode;
- guided tour HUD;
- credits modal;
- DevTools performance summary.

