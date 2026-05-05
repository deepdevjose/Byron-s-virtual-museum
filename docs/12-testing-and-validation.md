# Testing And Validation

The repository has no package manifest or automated test runner. Current validation relies on standalone Node scripts, browser-console benchmark scripts, and manual QA.

## Available Script Checks

| Check | Command | Expected result |
|---|---|---|
| Smoke test | `node scripts/smoke-test.js` | Finds `src/js/main.js`. |
| Artwork data validation | `node scripts/validate-artworks.js` | Validates required fields and local/remote asset references. |
| JavaScript syntax | `node --check scripts/*.js` and module syntax checks | No syntax errors. |

## Manual Testing Checklist

| Test area | Test case | Expected result | Status |
|---|---|---|---|
| Scene loading | Open app through a local HTTP server | Loader appears, then the welcome overlay appears | Pending manual test |
| Artwork data | Run artwork validator | All records pass validation | Available |
| Free exploration | Choose free exploration | Controls enable and pointer lock works on desktop | Pending manual test |
| Navigation | Move with WASD and arrow keys | Camera moves smoothly and stays inside gallery bounds | Pending manual test |
| Running | Hold Shift while moving | Movement speed increases | Pending manual test |
| Mobile controls | Open on narrow viewport or mobile device | Joystick, look area, and action button appear | Pending manual test |
| Artwork hover | Aim at artwork center | Crosshair becomes interactive and frame highlights | Pending manual test |
| Artwork selection | Click artwork in free mode | Detail modal opens | Pending manual test |
| Modal close | Close detail modal | Modal closes and free exploration resumes | Pending manual test |
| Video playback | Open artwork with video | Video element appears and can play when browser allows | Pending manual test |
| Audio guide | Open artwork with audio | Audio guide plays after user gesture | Pending manual test |
| Guided tour | Choose guided tour | Camera moves through generated stops | Pending manual test |
| Tour exit | Click exit tour button | Free exploration resumes | Pending manual test |
| Tour completion | Finish final stop | Completion modal then credits flow appears | Pending manual test |
| Credits | Open and close credits | Modal opens and closes by button, backdrop, or Escape | Pending manual test |
| Responsive layout | Test desktop and mobile widths | Panels and modals remain usable | Pending manual test |
| Accessibility preferences | Enable reduced motion | CSS animations are disabled | Pending manual test |
| Browser compatibility | Test Chrome, Firefox, Safari | App loads and controls work | Pending manual test |
| Performance | Observe FPS counter | FPS remains acceptable for target device | Pending measurement |
