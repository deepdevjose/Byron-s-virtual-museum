# Implementation

## Technologies Used

The app uses Three.js r128 through an import map, WebGL rendering, JavaScript ES modules, HTML, CSS, JSON artwork data, and Cloudinary delivery URLs for remote video media.

## Initialization

`src/js/main.js` waits for `DOMContentLoaded`, creates an `App` instance, assigns it to `window.app`, and calls `init()`. `window.app` is useful for diagnostics and the browser-console benchmark scripts.

`App.init()` loads artwork data, preloads images, sets up the scene, creates modules, registers events, hides the loader, shows the welcome overlay, and starts animation.

## Animation And Render Loop

`App.animate()` uses `requestAnimationFrame`. Each frame:

- Updates the FPS counter.
- Reads a capped delta time from `THREE.Clock`.
- Updates guided tour interpolation when tour mode is active.
- Otherwise updates controls, physics, and organic camera motion.
- Updates artwork hover raycasting.
- Renders the scene with `renderer.render(scene, camera)`.

## User Input

Desktop input is handled by `src/js/modules/Player/Controls.js`:

- WASD and arrow keys move the visitor.
- Shift toggles running.
- Pointer lock provides mouse look.
- Drag-look works as a fallback when pointer lock is not active.

Mobile controls are created by `App.createMobileControls()` when needed. The joystick updates movement flags on the same controls object, and the look area updates camera rotation from touch movement.

## Scene Construction

The scene is assembled through modules:

- `Environment.setup()` creates architecture and procedural materials.
- `Lighting.setup()` adds real and emissive lighting elements.
- `Gallery.setup()` creates artwork groups, then decorative objects.
- `Physics.update()` keeps the visitor inside room bounds and away from objects.

## UI Overlays

Most UI is HTML/CSS above the WebGL canvas:

- Loader and static modal containers are in `index.html`.
- Welcome overlay is created by `App.showControlInstructions()`.
- Artwork panel and detail modal content are managed by `ArtworkPanel`.
- Credits modal is static HTML connected by `App.setupCreditsModal()`.
- Guided tour HUD is created by `TourController.createHud()`.

DOM elements that should not trigger 3D artwork selection use `data-ui-interactive="true"`.

## Modal Triggering

Artwork selection starts in `ArtworkInteraction.handleClick()`. In free exploration, selected artwork opens the detail modal directly. In guided tour mode, the side panel is shown with locked close behavior so the tour can advance after the detail view closes.

## Code Organization

```text
src/js/main.js                    JavaScript entry point
src/js/config.js                  Shared configuration
src/js/modules/Core/App.js        App lifecycle and orchestration
src/js/modules/World/             Environment, gallery, lighting, physics
src/js/modules/Player/            First-person controls
src/js/modules/Interaction/       Artwork raycasting
src/js/modules/UI/                Artwork panel and detail modal
src/js/modules/Tour/              Guided tour controller and path generation
src/js/modules/Utils/             Audio and experimental performance utilities
```

No source behavior was changed to create this documentation.
