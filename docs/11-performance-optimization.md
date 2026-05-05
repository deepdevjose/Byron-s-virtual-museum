# Performance Optimization

## Performance Goals

The project aims to keep the virtual museum responsive on modern desktop browsers and usable on mobile devices where possible. Formal performance measurements are still pending.

## Rendering Considerations

The renderer is configured in `App.setupScene()` with:

- `powerPreference: 'high-performance'`.
- Pixel ratio capped through `CONFIG.performance.pixelRatio`.
- sRGB output encoding.
- ACES filmic tone mapping.
- Manual shadow-map updates.

## Shadow Strategy

`renderer.shadowMap.autoUpdate` is set to `false`, and the app marks shadows dirty with `updateShadowsIfNeeded()` after static scene mutations. This is appropriate because most museum geometry is static after setup.

Lighting choices also reduce cost:

- Ceiling fixtures use emissive materials instead of many point lights.
- Artwork spotlights are shadowless.
- Wall sconce lights are shadowless.
- The main directional skylight is the primary shadow-casting light.

## Texture Strategy

Artwork textures use sRGB encoding, mipmaps, linear filters, and limited anisotropy. Procedural textures are generated with canvas and configured for repeat wrapping. The experimental `LODSystem` exists, but current app behavior relies primarily on Three.js mipmaps rather than active texture swapping.

## Video Lazy Loading Strategy

The current detail modal creates video markup only when an artwork detail opens. This avoids requesting all Cloudinary videos during startup. Future work should standardize optimized Cloudinary transformation URLs and add stronger cleanup on modal close.

## UI Separation From WebGL

The UI is HTML/CSS layered above the WebGL canvas. This keeps modals, buttons, credits, native media controls, and responsive layouts outside the Three.js scene graph.

## Current Debug Display

`index.html` includes `#fps-counter`, and `App.updateFPS()` updates it once per second.

## Known Performance Risks

- Mobile GPU variability.
- Procedural texture generation cost at startup.
- Large artwork image dimensions.
- Unoptimized Cloudinary video URLs.
- Multiple real-time lights and shadows if future changes add more shadow-casting lights.
- Browser memory pressure from video playback if cleanup is not hardened.

## What Should Be Measured Later

- Average, minimum, and maximum FPS by device and browser.
- Initial load time.
- Texture memory and geometry count.
- Video startup time with and without Cloudinary transformations.
- Mobile touch-control responsiveness.
- Guided tour smoothness across the full route.
