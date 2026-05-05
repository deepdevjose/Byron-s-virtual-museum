# Article Plan

## Working Title

Building a Web-Based Virtual Museum with Three.js: Architecture, Interaction, and Media Delivery

## Alternative Titles

- Designing an Interactive Virtual Museum for Byron Galvez with Three.js
- From Artwork Metadata to Immersive Web Gallery: A Three.js Museum Case Study
- WebGL for Cultural Dissemination: A Practical Virtual Museum Architecture

## Abstract Draft

This article will describe the design and implementation of a browser-based virtual museum dedicated to Byron Galvez. The project uses Three.js, WebGL, JavaScript, HTML, and CSS to create a navigable 3D gallery with artwork interaction, modal-based media presentation, a guided tour mode, and performance-aware rendering choices. The implementation demonstrates how cultural content can be structured as metadata, displayed as framed 3D artworks, and connected to externally hosted animated videos through Cloudinary delivery URLs. The article will also discuss limitations, testing needs, and future work required for a more complete production-ready museum experience.

## Research Question

How can a lightweight static web application combine real-time 3D rendering, museum-style navigation, artwork metadata, UI overlays, and externally hosted video assets to create an accessible virtual museum experience?

## Main Contributions

- A modular Three.js architecture for a single-room virtual museum.
- A data-driven artwork catalog connected to 3D placement, labels, interaction, and modal content.
- A guided tour controller that derives camera stops from artwork positions.
- A practical media strategy that keeps heavy videos outside the Git repository.
- A documentation system that supports maintenance, portfolio review, and future article writing.

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
- Performance metrics table.
- Testing checklist.
- Asset optimization table.

## Pending Measurement Or Validation

- Browser FPS measurements across desktop and mobile devices.
- GPU memory and texture memory measurements.
- Cloudinary optimized versus unoptimized video delivery comparison.
- Guided tour completion testing across all artwork records.
- Accessibility review for keyboard, screen reader, motion, and media alternatives.
- Cross-browser validation in Chrome, Firefox, Safari, and mobile browsers.
