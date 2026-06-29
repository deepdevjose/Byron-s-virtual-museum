# Limitations

## Summary

The current implementation is a strong static WebGL prototype, not a fully production-hardened museum platform. Its main limitations fall into six categories: measurement, accessibility, media delivery, validation, scalability, and operational tooling.

## Measurement Limitations

Formal performance data is not yet available. The code includes FPS display and benchmark-oriented scripts, but the documentation should not claim measured FPS, memory, draw-call, or load-time results until a device/browser test pass is recorded.

Missing measurements:

- average/minimum FPS on desktop;
- average/minimum FPS on mobile;
- cold startup time;
- GPU texture/geometry memory;
- draw-call baseline;
- Cloudinary metadata and first-frame time;
- memory behavior after repeated modal openings.

## Accessibility Limitations

Current accessibility support is partial:

- reduced-motion CSS exists;
- high-contrast CSS exists;
- native audio/video controls are used;
- modals are visually clear.

Still missing:

- captions for videos;
- transcripts for audio/video;
- formal keyboard-only pass;
- focus trap and focus restoration for modals;
- screen reader review;
- text alternatives for canvas-rendered in-scene labels;
- non-pointer equivalent for all interactions.

## Media Limitations

All artwork records include Cloudinary video URLs, which is good for repository size. However:

- URL transformations are not standardized;
- video cleanup pauses and rewinds but does not detach sources;
- playback depends on network and Cloudinary availability;
- autoplay behavior varies by browser;
- offline use is not supported.

## Validation Limitations

`scripts/validate-artworks.js` validates essential catalog structure, but it does not yet enforce all domain constraints.

Missing validation:

- approved room names;
- required curatorial fields by publication quality level;
- image dimension and file-size limits;
- Cloudinary transformation policy;
- wall-facing rotations;
- safe camera stop placement;
- unreferenced asset detection.

## Rendering And Scalability Limitations

The scene is designed for the current catalog scale. If the museum grows significantly, the following may need rework:

- raycasting target management;
- texture memory policy;
- route generation and room segmentation;
- occlusion/frustum culling integration;
- asset compression workflow;
- UI search/filter/navigation for larger collections.

The existing `OcclusionCulling`, `FrustumCulling`, and `LODSystem` utilities are exploratory and not core production systems in the current render loop.

## Operational Limitations

The repository intentionally has no `package.json`, build pipeline, lint script, formatter, automated browser tests, or dependency lockfile. This keeps the project simple, but it also limits repeatable CI quality gates.

If the project becomes production-facing, minimum operational additions should include:

- `package.json` scripts for validation;
- markdown/diagram linting;
- Playwright smoke tests;
- JSON Schema validation;
- image-size audit script;
- deployment checklist.

## Documentation Limitations

The documentation is now more complete, but screenshots and measured results still need to be captured:

- welcome overlay;
- free exploration;
- artwork modal;
- texture zoom mode;
- guided tour HUD;
- credits modal;
- performance profiler snapshots.

