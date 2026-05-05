# Testing Checklist

| Test area | Test case | Expected result | Status |
|---|---|---|---|
| Repository | Run `node scripts/smoke-test.js` | Entry file is found | Available |
| Artwork data | Run `node scripts/validate-artworks.js` | All artwork records pass | Available |
| Startup | Serve project over HTTP and open `/` | Loader appears, then welcome overlay appears | Pending manual test |
| Renderer | Inspect canvas creation | WebGL canvas fills viewport | Pending manual test |
| Free exploration | Click free exploration | Manual movement and artwork interaction enable | Pending manual test |
| Desktop movement | Press WASD or arrow keys | Camera moves on X/Z plane | Pending manual test |
| Running | Hold Shift while moving | Speed increases | Pending manual test |
| Mouse look | Click canvas on desktop | Pointer lock and look controls work | Pending manual test |
| Drag look | Use mouse without pointer lock | Drag-look fallback works | Pending manual test |
| Mobile controls | Open on mobile width | Joystick, look area, and action button appear | Pending manual test |
| Boundaries | Move into walls | Camera remains inside gallery bounds | Pending manual test |
| Object collisions | Move into benches or decor | Camera is pushed away | Pending manual test |
| Artwork hover | Aim at artwork center | Frame highlights and crosshair changes | Pending manual test |
| Artwork detail | Select artwork | Detail modal opens with metadata and media | Pending manual test |
| Image detail | Open artwork without active audio preference | Image displays correctly | Pending manual test |
| Audio detail | Open artwork with audio | Native audio controls appear and play after gesture | Pending manual test |
| Video detail | Open artwork with video | Native video controls appear and playback can start | Pending manual test |
| Modal cleanup | Close detail modal | Media pauses and modal closes | Pending manual test |
| Guided tour start | Choose guided tour | Camera begins moving through stops | Pending manual test |
| Guided tour stop | Camera reaches stop | Artwork panel opens in tour context | Pending manual test |
| Guided tour completion | Finish final stop | Completion modal and credits sequence appears | Pending manual test |
| Tour exit | Click exit tour button | Free exploration resumes | Pending manual test |
| Credits | Open credits | Credits modal appears | Pending manual test |
| Credits close | Button, backdrop, or Escape | Credits modal closes | Pending manual test |
| Responsive layout | Test multiple viewport widths | UI remains usable without overlap | Pending manual test |
| Reduced motion | Enable reduced motion preference | CSS animations are disabled | Pending manual test |
| High contrast | Enable high contrast preference | Contrast styles apply | Pending manual test |
| Browser support | Test Chrome, Firefox, Safari | App loads and core controls work | Pending manual test |
| Performance | Watch FPS counter while moving | FPS is acceptable for target device | Pending measurement |
