# Performance Metrics

## Current Engineering Budget

| Metric | Current value | Evidence | Status |
|---|---:|---|---|
| Artwork records | 29 | `artworks.json` | Measured from repo |
| Raycast targets | Up to 29 artwork meshes | `Gallery.artworks` -> `ArtworkInteraction.updateTargets()` | Inferred from code |
| Guided-tour stops | 24 | `createTourPathFromArtworks()` | Measured from repo |
| Local image payload | 9.96 MB | `src/assets/images/` byte total | Measured from repo |
| Local audio payload | 4.51 MB | `src/assets/audio/` byte total | Measured from repo |
| Remote videos | 29 | `video` URLs | Measured from repo |
| Shadow-map size | 1024 x 1024 | `CONFIG.shadows.mapSize` and `Lighting.js` | Inferred from code |
| Pixel ratio cap | 2 | `CONFIG.performance.pixelRatio` | Inferred from code |
| Tour interpolation duration | 2.6s per stop | `TourController.moveDuration` | Inferred from code |
| Image preload timeout | 2.5s | `App.preloadImages()` | Inferred from code |

## Measurement Matrix

| Metric | Instrument | Procedure | Target | Status |
|---|---|---|---|---|
| Average desktop FPS | FPS counter + DevTools Performance | 60s free exploration | >= 50 FPS on modern laptop | Pending formal measurement |
| Minimum desktop FPS | DevTools Performance | Rotate rapidly near dense artwork wall | No sustained drops below 30 FPS | Pending formal measurement |
| Average mobile FPS | Remote debugging + FPS counter | 60s touch navigation | >= 30 FPS | Pending formal measurement |
| Cold load time | DevTools Network/Performance | Hard refresh over local HTTP | Document actual value | Pending formal measurement |
| Draw calls | `window.app.renderer.info.render.calls` | Capture after scene load and during movement | Establish baseline | Pending formal measurement |
| Geometry count | `window.app.renderer.info.memory.geometries` | Capture after scene load | Establish baseline | Pending formal measurement |
| Texture count | `window.app.renderer.info.memory.textures` | Capture after scene load and after modal opens | Establish baseline | Pending formal measurement |
| Video metadata time | `loadedmetadata` timestamp | Open video modal | < 1.5s broadband target | Pending formal measurement |
| Modal open latency | Performance marks/manual stopwatch | Click artwork to visible modal | < 300ms target excluding network media | Pending formal measurement |
| Memory after repeated modals | Browser task manager/performance memory | Open/close 5 media modals | No unbounded growth | Pending formal measurement |
| Guided tour stability | DevTools Performance | 5 consecutive stops | No visible stutter | Pending formal measurement |

## Console Snippets

```js
window.app.renderer.info.render
window.app.renderer.info.memory
window.app.gallery.artworks.length
window.app.tourController.path.length
```

## Interpretation Rules

- Repo-derived metrics are objective but not runtime performance measurements.
- Renderer info is useful for baselines but can vary by browser and GPU.
- FPS must be measured on target hardware; it should not be inferred from code alone.
- Video metrics require network conditions to be recorded with the result.

