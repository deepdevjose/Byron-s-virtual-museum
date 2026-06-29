# Performance Optimization

## Performance Position

The museum is designed as a visually rich WebGL scene that still runs as a static website. Performance strategy is therefore based on limiting steady-state GPU cost, lazy-loading expensive media, and avoiding unnecessary runtime systems.

Current performance claims should be read as engineering strategy unless marked as measured. Formal cross-device FPS and load-time results are still a future validation task.

## Current Budget Snapshot

| Dimension | Current value | Performance implication |
|---|---:|---|
| Artwork records | 29 | Bounded raycast target set |
| Guided-tour stops | 24 | Deterministic route cost |
| Local artwork image payload | 9.96 MB | Startup/image memory pressure |
| Local audio payload | 4.51 MB | Audio loaded through browser media pipeline |
| Remote videos | 29 | Kept out of startup path through lazy modal creation |
| JavaScript modules | 17 | No bundle, modules parsed separately |
| CSS lines | 2,559 | Large overlay surface, but no CSS framework runtime |
| Shadow-map size | 1024 | Moderate shadow resolution |
| Pixel ratio cap | 2 | Prevents excessive HiDPI render target growth |

## Renderer-Level Strategy

`App.setupScene()` configures:

- `powerPreference: "high-performance"`;
- `antialias: false`;
- `renderer.setPixelRatio(min(devicePixelRatio, 2))`;
- sRGB output encoding;
- ACES filmic tone mapping;
- manual shadow-map updates.

The two most important renderer decisions are antialias off and pixel-ratio cap. On high-DPI displays, uncontrolled pixel ratio can multiply fragment work; capping it protects mobile and laptop GPUs.

## Shadow Strategy

The app enables shadows but disables automatic shadow updates:

```js
renderer.shadowMap.autoUpdate = false;
renderer.shadowMap.needsUpdate = true;
```

This is appropriate because the museum is mostly static after initialization. Static architecture, frames, labels, and decorative objects do not need a shadow-map render every frame. When scene geometry changes, `App.updateShadowsIfNeeded()` marks shadows dirty.

Lighting cost is controlled by:

- one primary shadow-casting directional skylight;
- shadowless artwork spotlights;
- shadowless wall sconces;
- emissive fixture meshes where visual light can be faked.

## Texture Strategy

Artwork textures use:

- sRGB encoding;
- mipmaps;
- linear mipmap minification;
- linear magnification;
- anisotropy capped to `min(4, renderer.capabilities.getMaxAnisotropy())`.

Procedural environment textures are generated in JavaScript through canvas and reused as `THREE.CanvasTexture` materials. This avoids extra image files but shifts some work to startup.

The current `LODSystem` module exists as an experimental utility. The production path currently relies on Three.js mipmaps and bounded texture dimensions rather than active runtime texture replacement.

## Media Strategy

All 29 videos are remote Cloudinary URLs and are not inserted into the DOM at startup. `ArtworkPanel` creates the media node only when the visitor opens the artwork detail view.

Benefits:

- lower initial network pressure;
- less browser media memory on startup;
- avoids downloading videos that the visitor never opens.

Current remaining risk:

- close cleanup pauses and rewinds, but does not aggressively detach `src` values.

## Raycasting Strategy

`ArtworkInteraction` raycasts only against the artwork mesh list, not the whole scene. With 29 artwork records, this keeps intersection testing bounded and predictable.

The raycast target list is updated after the gallery builds. Decorative objects, environment meshes, labels, and frames are not treated as selection targets. This improves both performance and semantic precision.

## Collision Strategy

Physics runs as lightweight X/Z collision:

- clamp camera within room bounds;
- push camera out of circular decoration obstacles;
- damp velocity after collision.

There is no broadphase acceleration structure, but the obstacle count is small enough that simple iteration is appropriate. The benefit is no physics engine dependency and no per-triangle collision work.

## DOM/UI Strategy

Heavy interaction UI lives in HTML/CSS:

- modal layout;
- tabs;
- native video/audio controls;
- credits;
- responsive breakpoints;
- mobile controls.

This avoids rendering text-heavy UI inside WebGL and allows the browser to handle accessibility primitives and media controls. The tradeoff is a large CSS file and the need to prevent DOM clicks from leaking into WebGL raycasting.

## Experimental Performance Utilities

The repository includes scripts for browser-console experimentation:

| Script | Purpose |
|---|---|
| `scripts/benchmark-shadows.js` | Inspect impact of shadow choices |
| `scripts/benchmark-occlusion.js` | Evaluate optional wall-based occlusion behavior |
| `scripts/benchmark-lod.js` | Explore texture LOD switching behavior |
| `scripts/verify-frustum-culling.js` | Validate optional frustum culling assumptions |

These are not CI tests. They are engineering probes for manual investigation.

## Measurement Protocol

Recommended repeatable procedure:

1. Serve locally with `python3 -m http.server 8000`.
2. Open browser DevTools Performance panel.
3. Record cold load from navigation to welcome overlay.
4. Record 60 seconds of free exploration.
5. Record opening and closing 5 artwork modals.
6. Record full guided tour segment across at least 5 stops.
7. Capture `renderer.info.render.calls`, `renderer.info.memory`, FPS counter, and network payload.
8. Repeat on desktop, Windows laptop scaling scenario, and one mobile device.

## Metrics Table

See [`tables/performance-metrics.md`](tables/performance-metrics.md) for the maintained measurement matrix.

## Known Bottlenecks And Mitigations

| Risk | Current mitigation | Next mitigation |
|---|---|---|
| Large local image payload | Preload timeout and mipmaps | Normalize image max dimensions and compression policy |
| High-DPI GPU pressure | Pixel ratio cap | Expose adaptive quality switch |
| Shadow cost | Manual shadow updates, single primary shadow light | Benchmark shadow off/low modes |
| Remote video bandwidth | Lazy video creation | Standard Cloudinary transformations |
| Mobile memory pressure | No global video preload | Detach media sources on close |
| CSS overlay complexity | DOM UI separation | Add responsive regression screenshots |
| Raycast cost growth | Target only artwork meshes | Spatial partition if catalog grows significantly |

## Engineering Conclusion

The project already applies the highest-impact optimizations for a static WebGL museum: bounded raycasting, lazy media, capped pixel ratio, manual shadows, and approximate physics. The strongest next step is measurement discipline, not speculative optimization.

