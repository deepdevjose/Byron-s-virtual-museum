# Discussion

## Engineering Interpretation

The project demonstrates that a static web architecture can support a technically credible virtual museum when responsibilities are separated carefully. The strongest design decision is the use of `artworks.json` as a domain model that coordinates multiple subsystems: spatial placement, image textures, wall labels, lighting, raycasting, modal readings, media playback, proximity text, and guided-tour stops.

This is more than a content file. It is the museum's technical-curatorial contract.

## Static Architecture Tradeoff

The static deployment model is appropriate for cultural dissemination because it lowers operational complexity. A visitor only needs a browser; a maintainer only needs static hosting. This makes the project portable and resilient against backend maintenance failure.

The cost is engineering discipline. Without a backend, build system, type system, or automated browser runner, correctness depends on:

- consistent JSON schema;
- standalone validators;
- manual browser QA;
- documentation that records architectural intent.

The current documentation now compensates for that by making metrics, flows, and decisions explicit.

## WebGL And DOM Hybrid

The hybrid model is effective: Three.js handles embodied spatial experience, while HTML/CSS handles text-heavy and interaction-heavy UI. This division is technically sound because modals, native media controls, tabbed readings, credits, and responsive controls are better served by the DOM.

The main integration risk is event leakage between DOM and WebGL. The project addresses this with `data-ui-interactive="true"` and post-modal selection suppression. That recent fix is important because it shows the project has moved beyond naive canvas interaction.

## Data-Driven Tour

Generating the guided tour from artwork metadata is a strong maintainability decision. A separate hand-authored route would drift from the catalog; deriving stops from wall positions keeps spatial and curatorial data aligned.

The tradeoff is that spatial metadata must be accurate. A wrong rotation or wall coordinate is not only a visual placement issue; it can produce a bad camera stop, lighting direction, or tour sequence. This is why future validation should include spatial sanity checks.

## Performance Posture

The project applies sensible first-order optimizations:

- bounded raycasting against artwork meshes only;
- lazy video creation;
- manual shadow updates;
- capped pixel ratio;
- approximate 2D collision instead of a physics engine;
- no global video preload.

However, the project should not claim performance results until measured across devices. The correct research framing is: the architecture is performance-aware, and the next step is empirical measurement.

## Museographic Interpretation

Technically, the museum is a 3D room. Curatorially, it is an interpretive system. The project succeeds when navigation, light, media, text, pacing, and artwork order reinforce the reading of Byron Galvez's work rather than competing with it.

The guided tour, proximity phrases, room narration, and close-reading texture mode are important because they move the project beyond a simple 3D image wall. They create a structured encounter with the artwork.

## Threats To Validity

| Threat | Impact |
|---|---|
| Single-project case study | Findings may not generalize to larger museums |
| No formal user study | UX quality is based on inspection, not visitor data |
| Pending performance measurements | Optimization claims are architectural, not empirical |
| Static catalog | No evidence yet for large-scale content-management workflow |
| External media dependency | Video behavior depends on Cloudinary and network conditions |
| Limited accessibility validation | Experience may exclude some visitors until remediated |

## Research Contribution

The project is strongest as an engineering case study for small-to-medium virtual exhibitions: it shows how to coordinate WebGL rendering, artwork metadata, DOM UI, remote media, and guided navigation in a static deployment model. Its value is not that every feature is production-perfect, but that the architecture is explainable, extensible, and grounded in actual running code.

