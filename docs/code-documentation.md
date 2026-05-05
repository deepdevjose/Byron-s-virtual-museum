# Code Documentation Guide

This project documents source code in concise American English. Comments should
make the Three.js museum easier to maintain without changing runtime behavior or
duplicating obvious code.

## Standards

- Use JSDoc for modules, classes, constructors, public methods, important
  internal helpers, event handlers, configuration objects, and non-obvious data
  structures.
- Prefer comments that explain why a choice exists, especially for rendering,
  camera movement, raycasting, collision, media loading, guided tour state, and
  performance decisions.
- Keep comments accurate to the current implementation. Add a short `TODO` or
  `NOTE` when the intended behavior is unclear.
- Do not document every variable, loop, or DOM assignment.
- Keep UI copy and artwork content separate from code documentation.

## JSDoc Conventions

Use a short summary first, then add context only when it helps future work.
Include `@param` and `@returns` when the signature or object shape is not
immediately obvious.

```js
/**
 * Opens the detail modal for an artwork and creates the needed media element.
 *
 * The media element is injected at open time so remote video delivery URLs are
 * not requested until the visitor asks to view an artwork detail.
 *
 * @param {Object} artwork - Gallery artwork record.
 * @param {Object} options - Detail behavior.
 * @param {boolean} options.autoplayVideo - Whether to attempt autoplay.
 */
```

For lifecycle methods, name side effects clearly:

```js
/**
 * Creates the core Three.js scene, camera, and renderer.
 *
 * The renderer is attached to `#canvas-container` when available and uses
 * manual shadow-map updates because most museum geometry is static after setup.
 */
```

## Inline Comments

Use inline comments sparingly. Good inline comments explain a technical reason,
not the literal operation.

Good:

```js
// Cap large frame gaps so tab stalls do not create a movement jump.
deltaTime = Math.min(deltaTime, 0.1);
```

Avoid:

```js
// Set delta time.
deltaTime = Math.min(deltaTime, 0.1);
```

## CSS Comments

Use section headers for major UI areas and brief one-line comments for small
utility sections.

```css
/* ==========================================================================
   Artwork Detail Modal
   --------------------------------------------------------------------------
   Media-focused modal layout for artwork images, audio cards, and videos.
   ========================================================================== */
```

Do not comment every selector. Group related selectors under meaningful
sections such as loader, canvas, HUD, modal, guided tour, mobile controls,
responsive layout, accessibility preferences, and credits.

## Data And Configuration

`src/js/config.js` documents runtime configuration groups. Keep new config
comments close to the related object and describe who consumes the setting.

`src/data/artworks.json` is plain JSON and cannot contain comments. New artwork
records should follow this schema:

- `id`: unique stable artwork id.
- `title`, `artist`, `year`, `technique`, `description`: display metadata.
- `image`: local image path used by the gallery, labels, and modal poster.
- `video`: optional remote video delivery URL, usually Cloudinary.
- `audio`: optional local or remote audio guide URL.
- `position`: `[x, y, z]` scene coordinates in Three.js units.
- `rotation`: optional `[x, y, z]` radians for wall orientation.
- `size`: `[width, height]` maximum frame size before image aspect fitting.
- `featured`: optional boolean for larger frame styling.
- `viewDistance` and `cameraHeight`: optional guided-tour camera overrides.

Use `scripts/validate-artworks.js` after editing artwork data.

## New Modules

When adding a module:

1. Add a file-level or class-level JSDoc block that explains the module role.
2. Document constructor dependencies and callbacks.
3. Document lifecycle methods such as `setup`, `update`, `render`, `dispose`,
   or cleanup handlers.
4. Document DOM, scene, renderer, audio, or event-listener side effects.
5. Add inline comments only where Three.js behavior, browser behavior, or
   performance tradeoffs would be hard to infer from the code alone.

## Maintainer Notes

- Keep documentation in American English.
- Do not rename files, functions, CSS selectors, assets, or data fields only to
  improve comments.
- Do not rewrite Spanish UI strings as part of code documentation work.
- Cloudinary media values in artwork data are delivery URLs used by media
  elements, not collection or management URLs.
- Videos should stay lazy-loaded through modal creation unless startup behavior
  is intentionally redesigned.
