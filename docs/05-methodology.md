# Methodology

## Development Process

The project follows an iterative static-web development process. The museum is built as a single-page experience, with the HTML document providing stable DOM anchors and JavaScript modules adding the 3D world, input handling, UI state, and media behavior.

## Design And Implementation Stages

1. Establish the static entry point and import map in `index.html`.
2. Define shared configuration in `src/js/config.js`.
3. Build the core app lifecycle in `src/js/modules/Core/App.js`.
4. Add world construction modules for environment, lighting, gallery, and physics.
5. Add player controls and mobile interaction support.
6. Connect artwork data from `src/data/artworks.json`.
7. Add UI overlays, artwork panel, detail modal, credits modal, and guided tour HUD.
8. Add utility scripts for validation and performance experiments.
9. Document architecture, data, performance, limitations, and maintenance steps.

## Technical Decision Process

The implementation favors a static deployment model, browser-native ES modules, and Three.js loaded through an import map. This avoids a build pipeline and keeps the repository approachable. The tradeoff is that there are no package scripts or bundler-based optimizations in the current repository.

## UX Decision Process

The museum experience starts with a welcome overlay so visitors can choose free exploration or guided tour mode. Interaction is centered around the crosshair in pointer-lock navigation, which keeps selection consistent with first-person movement. Detail content appears in HTML modals so video and audio controls can use native browser media behavior.

## Asset Handling Process

Artwork images and audio files are stored under `src/assets/`. Animated videos are referenced through remote delivery URLs in `src/data/artworks.json`, which keeps heavy media out of Git history. Cloudinary optimization transformations are recommended for future rollout.

## Testing And Validation Approach

The repository currently includes standalone scripts:

- `scripts/smoke-test.js`
- `scripts/validate-artworks.js`
- `scripts/benchmark-shadows.js`
- `scripts/benchmark-occlusion.js`
- `scripts/benchmark-lod.js`
- `scripts/verify-frustum-culling.js`

There is no `package.json`, so these scripts are run directly with Node or pasted into the browser console as documented by each script.

## Documentation For Future Article Work

The documentation system separates project overview, architecture, methodology, implementation, results, discussion, limitations, and future work. This structure mirrors a technical article outline while preserving practical maintenance instructions for the repository.
