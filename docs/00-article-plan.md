# Article Plan

## Working Title

Building a Web-Based Virtual Museum with Three.js: Architecture, Interaction, and Media Delivery

## Alternative Titles

- Designing an Interactive Virtual Museum for Byron Galvez with Three.js
- From Artwork Metadata to Immersive Web Gallery: A Three.js Museum Case Study
- WebGL for Cultural Dissemination: A Practical Virtual Museum Architecture

## Abstract Draft

This article describes the design and implementation of a browser-based virtual museum dedicated to Byron Galvez. The project uses Three.js, WebGL, JavaScript ES modules, HTML, CSS, JSON metadata, local image/audio assets, and Cloudinary video delivery to create a navigable 3D gallery with artwork interaction, modal-based media presentation, texture close-reading, mobile controls, and a metadata-generated guided tour. The current repository contains 29 artwork records, 7 curatorial rooms, 24 generated guided-tour stops, 17 JavaScript modules, 6,364 JavaScript source lines, and 2,559 CSS lines. The case study shows how a static web application can coordinate spatial rendering, curatorial metadata, interaction design, and media delivery without a backend.

## Research Question

How can a lightweight static web application combine real-time 3D rendering, museum-style navigation, artwork metadata, UI overlays, and externally hosted video assets to create an accessible virtual museum experience?

## Main Contributions

- A modular Three.js architecture for a static single-room virtual museum.
- A JSON artwork model connected to 3D placement, labels, lighting, raycasting, modal content, media, and guided-tour generation.
- A guided tour controller that derives 24 camera stops from wall-mounted artwork positions.
- A lazy media strategy that keeps 29 videos outside Git while preserving artwork-level video playback.
- A performance-aware rendering strategy: capped pixel ratio, manual shadows, bounded raycasting, lazy video creation, approximate 2D physics.
- A technical documentation system with architecture diagrams, state diagrams, validation matrices, repository metrics, asset inventory, and engineering decisions.

## Proposed Article Structure

1. Introduction and motivation.
2. Problem statement for web-based cultural experiences.
3. System architecture.
4. Gallery construction and artwork data model.
5. Interaction design and UI overlays.
6. Guided tour implementation.
7. Cloudinary media delivery strategy.
8. Performance considerations.
9. Testing, validation, and results.
10. Discussion, limitations, and future work.

## Keywords

Three.js, WebGL, virtual museum, digital gallery, cultural heritage, interactive media, Cloudinary, JavaScript, guided tour, browser-based 3D.

## Expected Figures And Tables

- Architecture diagram.
- User flow diagram.
- Artwork interaction flow.
- Cloudinary video loading flow.
- Guided tour state flow.
- Technology stack table.
- Repository metrics table.
- Performance metrics table.
- Testing checklist.
- Asset optimization table.
- Engineering decision record.

## Pending Measurement Or Validation

- Browser FPS measurements across desktop and mobile devices.
- GPU memory and texture memory measurements.
- Cloudinary optimized versus unoptimized video delivery comparison.
- Guided tour completion testing across all artwork records.
- Accessibility review for keyboard, screen reader, motion, and media alternatives.
- Cross-browser validation in Chrome, Firefox, Safari, and mobile browsers.

## Documentation Map

- Architecture: [`04-system-architecture.md`](04-system-architecture.md)
- Implementation: [`06-implementation.md`](06-implementation.md)
- Artwork model: [`07-gallery-and-artwork-model.md`](07-gallery-and-artwork-model.md)
- Video delivery: [`08-cloudinary-video-integration.md`](08-cloudinary-video-integration.md)
- Guided tour: [`10-guided-tour.md`](10-guided-tour.md)
- Performance: [`11-performance-optimization.md`](11-performance-optimization.md)
- Testing: [`12-testing-and-validation.md`](12-testing-and-validation.md)
- Results: [`13-results.md`](13-results.md)
- Decisions: [`18-engineering-decisions.md`](18-engineering-decisions.md)
- Metrics: [`tables/repository-metrics.md`](tables/repository-metrics.md)
