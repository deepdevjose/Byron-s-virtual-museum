# Testing Checklist

Use this checklist after code, catalog, asset, or documentation changes. Mark results with date, browser, OS, viewport, and tester initials when used in a formal QA pass.

| Priority | Area | Test case | Expected result | Status |
|---|---|---|---|---|
| Critical | Repository | `node scripts/smoke-test.js` | Entry file is found | Available |
| Critical | Catalog | `node scripts/validate-artworks.js` | 29 artwork records pass | Available |
| Critical | Startup | Serve over HTTP and open `/` | Loader appears, then welcome overlay | Manual |
| Critical | Renderer | Inspect canvas after load | Canvas fills visible viewport | Manual |
| Critical | Free exploration | Start free exploration | Movement, HUD, crosshair and interaction enable | Manual |
| Critical | Modal regression | Select artwork, close with X | Modal stays closed and same artwork does not reopen | Manual |
| Critical | Responsive regression | Test laptop-height viewport <= 820px | Controls and modal fit without browser zoom workaround | Manual |
| High | Desktop movement | WASD/arrows | Camera moves smoothly on X/Z plane | Manual |
| High | Running | Hold Shift while moving | Speed increases without instability | Manual |
| High | Pointer lock | Click canvas | Pointer lock activates where browser allows | Manual |
| High | Drag fallback | Drag without pointer lock | Camera rotates without snapping | Manual |
| High | Boundaries | Walk into perimeter walls | Camera remains inside bounds | Manual |
| High | Decor collisions | Walk into table/bench/podium/wall object | Camera is pushed away | Manual |
| High | Artwork hover | Aim at painting | Frame highlights and crosshair becomes interactive | Manual |
| High | Artwork selection | Click/tap action | Correct artwork detail opens | Manual |
| High | Raycast alignment | Resize viewport and select artwork | Click target remains aligned with rendered canvas | Manual |
| High | Image modal | Open image-only mode | Artwork displays contained in modal | Manual |
| High | Audio modal | Open audio-priority artwork | Native audio controls appear; ambient pauses/resumes | Manual |
| High | Video modal | Open video artwork | Native video controls appear; metadata loads lazily | Manual |
| Medium | Texture zoom | Use texture mode slider/pan | Image zooms and resets correctly | Manual |
| Critical | Guided tour start | Start guided tour | Camera begins generated route | Manual |
| Critical | Guided tour stop | Reach stop | Artwork opens in tour context | Manual |
| Critical | Guided tour advance | Close detail | Tour advances to next stop | Manual |
| High | Guided tour exit | Press `Salir` | Tour stops and welcome overlay returns | Manual |
| High | Guided tour completion | Finish final stop | Completion modal then credits appear | Manual |
| Medium | Credits | Open/close credits | Button/backdrop/Escape behavior works | Manual |
| Medium | Mobile controls | Open narrow/mobile viewport | Joystick, look area, action button appear | Manual |
| Medium | Reduced motion | Enable OS/browser reduced motion | CSS animations are suppressed | Manual |
| Medium | High contrast | Enable high contrast | High contrast styles apply where supported | Manual |
| High | Performance | 60s free exploration | Record average FPS, min FPS, draw calls | Measurement |
| High | Media memory | Open/close 5 media modals | No obvious unbounded memory growth | Measurement |

