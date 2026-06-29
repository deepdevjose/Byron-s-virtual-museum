# Future Work

## Roadmap Strategy

Future work should prioritize evidence and robustness before adding spectacle. The museum already has a strong experiential foundation; the next engineering gains come from measurement, accessibility, media hardening, and validation.

## Phase 1: Reliability And QA

| Task | Impact | Effort |
|---|---|---|
| Add `package.json` with validation scripts | Makes checks discoverable and repeatable | Low |
| Add JSON Schema for `artworks.json` | Stronger catalog governance | Medium |
| Add Playwright smoke test | Confirms app loads in real browser | Medium |
| Add responsive screenshot regression tests | Protects Windows/laptop/mobile layout fixes | Medium |
| Add markdown/Mermaid validation | Keeps documentation renderable | Low |

## Phase 2: Performance Measurement

| Task | Metric produced |
|---|---|
| Record desktop FPS and draw calls | Baseline rendering performance |
| Record mobile FPS | Mobile viability |
| Measure cold load | Startup budget |
| Capture renderer memory | Texture/geometry budget |
| Measure video metadata time | Cloudinary delivery performance |
| Open/close modal stress test | Media cleanup confidence |

Results should be written back into [`tables/performance-metrics.md`](tables/performance-metrics.md).

## Phase 3: Media Hardening

| Task | Rationale |
|---|---|
| Standardize Cloudinary transformations | Reduce bandwidth and decode cost |
| Add mobile-specific video width policy | Improve low-power devices |
| Detach media sources on close | Release buffers more aggressively |
| Add captions and transcripts | Accessibility and archival quality |
| Add optional poster field | Decouple video poster from artwork image |

## Phase 4: Accessibility

| Task | Rationale |
|---|---|
| Add focus trap and restoration for modals | Keyboard usability |
| Review all controls with keyboard only | Non-pointer access |
| Add screen reader labels and modal roles | Assistive technology compatibility |
| Provide DOM alternatives for key canvas labels | Canvas text is not directly accessible |
| Add captions/transcripts | Media accessibility |
| Audit contrast in all overlays | Visual accessibility |

## Phase 5: Catalog And Curatorial Depth

| Task | Rationale |
|---|---|
| Add dimensions and rights metadata | Stronger museum-standard records |
| Expand audio guide coverage | Richer interpretation |
| Add room-level introductory texts | Better visitor orientation |
| Add bilingual content | Wider audience |
| Add curator notes or bibliography | Research credibility |

## Phase 6: Rendering And Navigation Enhancements

Only after reliability and measurement:

- integrate frustum/occlusion culling if metrics justify it;
- expose quality settings for shadows/pixel ratio;
- add minimap only if user testing shows orientation problems;
- add previous/next/pause controls to guided tour;
- explore WebXR as an experimental branch, not core dependency.

## Not Recommended Immediately

| Idea | Reason to defer |
|---|---|
| Full backend/CMS | Current static catalog is sufficient |
| Heavy frontend framework | Existing DOM UI does not require it yet |
| Physics engine | Current movement does not need rigid-body simulation |
| Committing videos to Git | Would harm repository and deployment size |
| Major visual redesign | Current priority is validation and polish |

