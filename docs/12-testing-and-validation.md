# Testing And Validation

## Validation Philosophy

The project has no bundler and no production build step. It now includes a development-only npm manifest and an integrated Playwright browser runner. Validation combines:

- static repository checks;
- standalone Node scripts;
- JavaScript syntax checks;
- manual browser QA;
- automated browser tests;
- optional browser-console benchmark scripts.

This keeps the museum static while giving GitHub Actions enough evidence to verify the main runtime flows.

## Automated Checks Available Now

| Check                      | Command                             | Purpose                                                                           | Current status            |
| -------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- | ------------------------- |
| Static smoke test          | `node scripts/smoke-test.js`        | Confirms entry HTML, DOM mount points, local CSS, module entry, and catalog parse | Passing                   |
| Artwork catalog validation | `node scripts/validate-artworks.js` | Validates required fields, ids, numeric arrays, asset references                  | Passing                   |
| JS syntax check            | `node scripts/check-js-syntax.js`   | Detects parse errors in scripts/modules                                           | Passing                   |
| Browser E2E                | `npm run test:e2e`                  | Boots the museum over HTTP and tests core UI flows in Chromium/mobile viewport    | Passing locally/CI target |
| Full local suite           | `npm test`                          | Runs validation, linting, and browser tests                                       | CI target                 |
| Markdown/Mermaid review    | Manual                              | Ensures diagrams render and docs match code                                       | Required after doc edits  |
| HTTP serving check         | `npm run dev`                       | Confirms app can be served statically                                             | Required for manual QA    |

## Catalog Validation Coverage

`scripts/validate-artworks.js` currently checks:

- `src/data/artworks.json` exists;
- file parses as JSON;
- top-level value is a non-empty array;
- required fields are present;
- ids are unique;
- `position` is numeric `[x, y, z]`;
- `size` is positive numeric `[width, height]`;
- optional `rotation` is numeric `[x, y, z]`;
- local asset paths exist;
- remote `audio`/`video` values are valid URLs.

Recommended future coverage:

- allowed room vocabulary;
- Cloudinary transformation policy;
- image dimension and file-size limits;
- stale local assets not referenced by catalog;
- wall-facing rotation sanity check;
- minimum text completeness for curatorial fields.

## Manual QA Matrix

| Area                      | Test case                               | Expected result                                                | Priority |
| ------------------------- | --------------------------------------- | -------------------------------------------------------------- | -------- |
| Startup                   | Open over HTTP, not `file://`           | Loader then welcome overlay                                    | Critical |
| Catalog                   | Run validator                           | 29 records pass                                                | Critical |
| Scene                     | Enter free exploration                  | Room, artworks, labels, lighting visible                       | Critical |
| Desktop controls          | WASD/arrows and mouse look              | Smooth movement and rotation                                   | Critical |
| Pointer lock              | Click canvas in free exploration        | Pointer lock activates when browser allows                     | High     |
| Collision                 | Walk into walls and decor               | Camera is clamped/pushed back                                  | High     |
| Artwork hover             | Aim at painting                         | Crosshair and frame indicate interactivity                     | High     |
| Artwork selection         | Click painting                          | Detail modal opens once                                        | Critical |
| Modal close               | Click close button                      | Modal closes and does not reopen same artwork                  | Critical |
| Responsive desktop        | Windows/laptop scaled viewport          | Controls and artwork modal fit without browser zoom workaround | Critical |
| Mobile controls           | Narrow viewport/mobile                  | Joystick, look area, and action button appear                  | High     |
| Video                     | Open video artwork                      | Metadata loads lazily and controls work                        | High     |
| Audio                     | Open audio artwork                      | Audio card appears and ambient audio pauses/resumes            | High     |
| Texture zoom              | Switch to texture mode                  | Zoom/pan controls remain usable                                | Medium   |
| Guided tour               | Start guided tour                       | Camera moves through generated route                           | Critical |
| Tour detail               | Close artwork during tour               | Tour advances to next stop                                     | Critical |
| Tour exit                 | Press `Salir`                           | Tour stops and returns to welcome                              | High     |
| Tour completion           | Complete final stop                     | Completion modal and credits sequence appear                   | High     |
| Credits                   | Open/close credits                      | Close button, backdrop, and Escape behavior work               | Medium   |
| Accessibility preferences | Enable reduced motion                   | CSS animations are suppressed                                  | Medium   |
| Performance               | Observe FPS during 60s free exploration | No sustained severe frame drops on target device               | High     |

## Playwright Coverage

Automated browser tests in `tests/e2e/museum.spec.js` currently verify:

- loader hides after the app initializes;
- WebGL canvas is attached and renders at least one frame;
- welcome UI appears with free exploration and guided-tour actions;
- guided tour starts and exits back to the welcome overlay;
- credits modal opens and closes;
- artwork detail modal opens and closes through the initialized app;
- mobile viewport exposes joystick, look area, and action button.

## Browser Matrix

Recommended minimum:

| Platform             | Browser          | Required focus                                           |
| -------------------- | ---------------- | -------------------------------------------------------- |
| Windows laptop       | Chrome or Edge   | Viewport scaling, pointer lock, modal fit                |
| macOS desktop/laptop | Chrome or Safari | WebGL, audio policy, modal layout                        |
| Android              | Chrome           | touch controls, inline media                             |
| iOS                  | Safari           | autoplay rejection, playsinline behavior, viewport units |

## Regression Cases From Recent Fixes

| Regression                           | Why it matters                                          | Verification                                                 |
| ------------------------------------ | ------------------------------------------------------- | ------------------------------------------------------------ |
| Closing artwork reopens same artwork | Close click can fall through to canvas raycast          | Close modal while aimed at artwork; it must stay closed      |
| Canvas/window size mismatch          | OS/browser scaling can misalign controls and raycasts   | Resize viewport and confirm interaction still maps correctly |
| Small-height desktop layout          | Windows laptops may need compact controls               | Test height <= 820px and <= 640px breakpoints                |
| In-scene label year removal          | Label copy must match requested curatorial presentation | Confirm wall plaques show artist, not year                   |

## Performance Measurement Checklist

Use DevTools and `window.app.renderer.info`:

```js
window.app.renderer.info.render;
window.app.renderer.info.memory;
```

Record:

- FPS counter over 60 seconds;
- draw calls in typical view;
- geometry and texture counts;
- cold startup time;
- modal open time;
- Cloudinary metadata time;
- memory before and after opening 5 modals.

Store formal results in:

- `docs/benchmarks/performance-report.md`
- `docs/benchmarks/desktop-results.json`
- `docs/benchmarks/mobile-results.json`

## Evidence Log

Latest local checks performed during documentation update:

```bash
npm run validate
npm run lint
npm run format
npm run test:e2e
```

These checks validate syntax, catalog consistency, static entry wiring, formatting, linting, and core browser behavior. They do not replace device-specific manual QA or formal performance measurement.
