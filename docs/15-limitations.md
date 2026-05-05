# Limitations

## Browser Performance Variability

Performance depends on browser, GPU, device memory, display resolution, and current system load. Formal measurements are pending.

## Mobile Limitations

The project includes mobile controls, but mobile WebGL performance and touch ergonomics can vary significantly. More device testing is needed.

## Heavy Asset Constraints

Artwork images and procedural textures can affect load time and memory. Videos are remote, but unoptimized delivery URLs can still affect bandwidth and startup time.

## Accessibility Limitations

Current accessibility support is partial. Reduced-motion and high-contrast CSS are present, and native media controls are used, but the project still needs:

- Captions for videos.
- Transcripts for audio and video.
- Formal keyboard-only testing.
- Focus-management review for modals.
- Screen reader review.

## External Video Hosting Dependency

Cloudinary video playback depends on external availability and network conditions. Offline use would require a different asset strategy.

## Planned Or Partially Implemented Features

- Cloudinary URLs are present, but optimized transformation URLs are not standardized.
- Video cleanup pauses and rewinds media, but does not yet remove sources and call `load()`.
- LOD and occlusion utilities exist as experimental or benchmark-oriented utilities; the current main app does not actively use them in the render loop.
- Browser-console benchmark scripts reference some diagnostic properties that may not exist in the current app instance without additional integration.

## Codebase-Specific Limitations

- There is no `package.json`, build command, or automated test runner.
- Three.js is loaded from a CDN through an import map.
- The app should be served over HTTP for `fetch()` to load `src/data/artworks.json`.
- Some user-facing text is Spanish; code documentation is American English.
