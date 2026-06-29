# Engineering Decisions

This document records the major engineering decisions behind the current implementation. It is written as an architectural decision record summary rather than a narrative feature list.

## Decision 1: Static Web Application

| Field | Detail |
|---|---|
| Decision | Build as static HTML/CSS/JS with ES modules |
| Drivers | GitHub Pages deployment, low operational complexity, academic portability |
| Benefits | No backend, no build step, easy local server, transparent source |
| Costs | No bundling, no typed compile step, no integrated test runner |
| Status | Accepted |

The museum does not require user accounts, server-side content management, or dynamic persistence. Static deployment matches the project scope.

## Decision 2: Three.js Over Raw WebGL

| Field | Detail |
|---|---|
| Decision | Use Three.js r128 through an import map |
| Drivers | Need scene graph, materials, lights, raycaster, texture loading |
| Benefits | Faster implementation, maintainable 3D abstractions |
| Costs | Version-specific API surface, external CDN dependency |
| Status | Accepted |

Three.js provides the right abstraction level for a museum scene where the engineering challenge is spatial composition and interaction, not writing low-level shader infrastructure from scratch.

## Decision 3: DOM/CSS For UI Overlays

| Field | Detail |
|---|---|
| Decision | Keep modals, HUDs, controls, and credits in HTML/CSS |
| Drivers | Native media controls, responsive UI, accessibility primitives |
| Benefits | Faster UI iteration, better text layout, real form/media controls |
| Costs | Must guard against DOM clicks leaking into WebGL raycasts |
| Status | Accepted |

The app uses `data-ui-interactive="true"` to separate UI events from 3D selection.

## Decision 4: JSON As Domain Model

| Field | Detail |
|---|---|
| Decision | Store artwork catalog in `src/data/artworks.json` |
| Drivers | Static deployment, version control, curator-friendly edits |
| Benefits | Single source for placement, media, labels, modal content, tour |
| Costs | Schema discipline required; invalid spatial values can break experience |
| Status | Accepted |

The JSON file functions as both content catalog and spatial configuration. This is powerful but requires validation.

## Decision 5: Metadata-Generated Guided Tour

| Field | Detail |
|---|---|
| Decision | Generate route from artwork positions and room metadata |
| Drivers | Avoid duplicated route data, keep tour aligned with catalog |
| Benefits | New wall artwork can join tour automatically |
| Costs | Route quality depends on correct coordinates and rotations |
| Status | Accepted |

The current route produces 24 stops from 29 artwork records.

## Decision 6: Lightweight 2D Physics

| Field | Detail |
|---|---|
| Decision | Implement X/Z collision constraints instead of a physics engine |
| Drivers | Museum navigation needs simple boundaries and obstacle avoidance |
| Benefits | Small code, low CPU cost, no dependency |
| Costs | Approximate collisions; no rigid-body dynamics |
| Status | Accepted |

The museum has no dynamic object simulation, so a full physics engine would be unnecessary complexity.

## Decision 7: Lazy Video Creation

| Field | Detail |
|---|---|
| Decision | Store video URLs in JSON and create video DOM only on modal open |
| Drivers | Avoid loading 29 videos during startup |
| Benefits | Lower startup network and media memory pressure |
| Costs | First video interaction depends on remote CDN latency |
| Status | Accepted |

Cloudinary delivery should be further standardized with transformation policies.

## Decision 8: Manual Shadow Updates

| Field | Detail |
|---|---|
| Decision | Disable automatic shadow-map updates after setup |
| Drivers | Mostly static museum geometry |
| Benefits | Lower per-frame rendering cost |
| Costs | Code must mark shadows dirty after scene mutations |
| Status | Accepted |

This matches the scene: most objects do not move after initialization.

## Decision 9: Canvas-Generated Labels

| Field | Detail |
|---|---|
| Decision | Render wall labels into canvas textures |
| Drivers | Labels should exist spatially inside the 3D gallery |
| Benefits | Perspective-correct plaques, no HTML projection math |
| Costs | Text is rasterized; accessibility requires separate DOM alternatives in future |
| Status | Accepted |

The current label content is title, artist, technique, and description. Years remain in metadata but are not shown in wall labels.

## Decision 10: No Build Step

| Field | Detail |
|---|---|
| Decision | Avoid npm/build pipeline |
| Drivers | Simplicity and static hosting |
| Benefits | Clone, serve, run |
| Costs | No linting/typechecking pipeline by default |
| Status | Accepted for current prototype |

If the project grows, the next step should be incremental: add scripts and tests before adding a heavy framework.

