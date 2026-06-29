# Repository Metrics

Snapshot generated from the local repository on 2026-06-29. Values are intended to be reproducible with Node.js, `find`, and `wc`; they should be refreshed whenever the catalog, assets, or module structure changes.

## Catalog And Media

| Metric | Value | Source |
|---|---:|---|
| Artwork records | 29 | `src/data/artworks.json` |
| Curatorial rooms represented | 7 | `room` field in artwork records |
| Guided-tour stops generated from wall artwork | 24 | `createTourPathFromArtworks()` |
| Local image files | 27 | `src/assets/images/` |
| Local image payload | 9.96 MB | filesystem byte total |
| Local audio files | 2 | `src/assets/audio/` |
| Local audio payload | 4.51 MB | filesystem byte total |
| Artwork records with Cloudinary video URLs | 29 | `video` field |
| Artwork records with audio guide | 1 | `audio` field |
| Featured artwork records | 2 | `featured` field |
| Distinct thematic tags | 26 | `themes` arrays |
| Distinct visual keywords | 33 | `visualKeywords` arrays |

## Spatial Distribution

| Placement region | Artwork count | Notes |
|---|---:|---|
| North/back wall | 6 | `z ~= 13.7` |
| South/front wall | 6 | `z ~= -13.7` |
| East wall | 6 | `x ~= 13.7` |
| West wall | 6 | `x ~= -13.7` |
| Central/non-tour region | 5 | Includes freestanding or non-main-wall placements |

## Codebase Size

| Area | Count |
|---|---:|
| JavaScript modules under `src/js` | 17 |
| JavaScript source lines under `src/js` | 6,364 |
| CSS source lines | 2,559 |
| Markdown/Mermaid documentation files | 31 |
| Documentation lines after metrics file addition | approx. 1,400+ before this documentation expansion |

## Largest Runtime Modules

| Module | Lines | Responsibility |
|---|---:|---|
| `World/Environment.js` | 1,396 | Procedural architecture, generated textures, static spatial shell |
| `Core/App.js` | 1,169 | Lifecycle orchestration, overlays, mode switching, render loop |
| `UI/ArtworkPanel.js` | 726 | Artwork panel, modal markup, media lifecycle, close-reading controls |
| `World/Gallery.js` | 688 | Artwork meshes, frames, labels, decorative objects, collision records |
| `World/Lighting.js` | 361 | Ambient, directional, fill, artwork, and sconce lighting |

## Current Rendering Configuration

| Parameter | Value | Source |
|---|---:|---|
| Camera FOV | 60 degrees | `CONFIG.camera.fov` |
| Camera near/far | 0.1 / 200 | `CONFIG.camera.near/far` |
| Camera start position | `[0, 1.7, -8]` | `CONFIG.camera.startPos` |
| Walk/run speed | 3.35 / 5.65 scene units per second | `CONFIG.movement` |
| Pointer look speed | 0.002 | `CONFIG.movement.lookSpeed` |
| Pixel ratio cap | `min(devicePixelRatio, 2)` | `CONFIG.performance.pixelRatio` |
| Antialias | `false` | `CONFIG.performance.antialias` |
| Shadow-map size | 1024 | `CONFIG.shadows.mapSize` |
| Tone mapping | ACES Filmic | `App.setupScene()` |
| Output encoding | sRGB | `App.setupScene()` |

