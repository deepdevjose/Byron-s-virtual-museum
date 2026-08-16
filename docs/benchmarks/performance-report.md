# Performance Report

This report is a template for recording reproducible runtime evidence. Values
should be captured from the deployed or locally served static museum over HTTP,
not inferred from source code.

## Test Environment

| Field              | Value               |
| ------------------ | ------------------- |
| Date               | Pending measurement |
| App version/commit | Pending measurement |
| Device             | Pending measurement |
| CPU/GPU            | Pending measurement |
| Memory             | Pending measurement |
| Browser            | Pending measurement |
| Viewport           | Pending measurement |
| Network profile    | Pending measurement |

## Summary

| Metric                     | Baseline | Optimized/current | Evidence source                   | Status  |
| -------------------------- | -------: | ----------------: | --------------------------------- | ------- |
| Average FPS                |  Pending |           Pending | FPS counter / DevTools            | Pending |
| 1% low FPS                 |  Pending |           Pending | DevTools Performance              | Pending |
| Draw calls                 |  Pending |           Pending | `renderer.info.render.calls`      | Pending |
| Geometries                 |  Pending |           Pending | `renderer.info.memory.geometries` | Pending |
| Textures                   |  Pending |           Pending | `renderer.info.memory.textures`   | Pending |
| Cold startup               |  Pending |           Pending | Performance panel                 | Pending |
| Loader visible time        |  Pending |           Pending | User timing / stopwatch           | Pending |
| Artwork modal open latency |  Pending |           Pending | Performance marks                 | Pending |
| Video metadata time        |  Pending |           Pending | `loadedmetadata` timing           | Pending |

## Procedure

1. Serve the repository with `npm run dev`.
2. Open the museum in a clean browser profile.
3. Hard refresh and record startup/load timing.
4. Start free exploration and record 60 seconds of movement through dense walls.
5. Open and close at least five artwork modals.
6. Start the guided tour and record at least five stops.
7. Capture renderer statistics from:

```js
window.app.renderer.info.render;
window.app.renderer.info.memory;
```

## Notes

- Record raw measurements in `desktop-results.json` and `mobile-results.json`.
- Keep baseline and optimized/current values separate when comparing branches.
- Include screenshots or DevTools exports under `docs/benchmarks/figures/`.
