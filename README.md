# Byron Gálvez Virtual Museum

A browser-based virtual museum dedicated to Byron Gálvez, built with Three.js, WebGL, JavaScript, HTML, and CSS. The project presents a navigable 3D gallery with framed artworks, metadata panels, artwork detail modals, guided tour mode, credits, ambient audio, and externally delivered animated artwork videos.

Preview image: add `docs/figures/museum-overview.png` when a current museum screenshot is available.

## Live Demo

Deployment URL: Pending.

The repository does not currently include a deployment configuration or published demo URL.

## Features

- First-person free exploration with desktop keyboard and pointer-lock controls.
- Runtime mobile controls with joystick, look area, and action button.
- Procedural 3D gallery environment with floor, walls, ceiling, skylight, decor, and generated materials.
- Artwork catalog loaded from `src/data/artworks.json`.
- Framed artwork meshes with image textures and generated in-scene labels.
- Center-screen raycasting for artwork hover and selection.
- Artwork side panel and detail modal for image, audio, or video content.
- Guided tour mode generated from wall-mounted artwork positions.
- Credits modal and guided-tour completion sequence.
- FPS counter and standalone validation or benchmark scripts.

## Technology Stack

- Three.js r128
- WebGL
- JavaScript ES modules
- HTML
- CSS
- JSON artwork data
- Cloudinary delivery URLs for artwork videos
- Node.js for standalone validation scripts

See [`docs/tables/technologies.md`](docs/tables/technologies.md) for a fuller technology table.

## Installation

This is a static web project. There is no `package.json` and no npm install step in the current repository.

Clone the repository, then serve it with a local HTTP server from the repository root:

```bash
python3 -m http.server 8000
```

Open:

```text
http://localhost:8000
```

Using an HTTP server is recommended because the app fetches `src/data/artworks.json`.

## Development Command

```bash
python3 -m http.server 8000
```

## Build Command

No build step is currently configured. The project is designed to run as static files.

## Validation Commands

```bash
node scripts/smoke-test.js
node scripts/validate-artworks.js
```

Browser-console benchmark and verification scripts are available in `scripts/`.

## Project Structure

```text
Byron-s-virtual-museum/
├── index.html
├── README.md
├── docs/
├── scripts/
│   ├── benchmark-lod.js
│   ├── benchmark-occlusion.js
│   ├── benchmark-shadows.js
│   ├── smoke-test.js
│   ├── validate-artworks.js
│   └── verify-frustum-culling.js
└── src/
    ├── assets/
    │   ├── audio/
    │   ├── credits/
    │   └── images/
    ├── css/
    │   └── style.css
    ├── data/
    │   └── artworks.json
    └── js/
        ├── config.js
        ├── main.js
        └── modules/
            ├── Core/
            ├── Interaction/
            ├── Player/
            ├── Tour/
            ├── UI/
            ├── Utils/
            └── World/
```

## Documentation Index

- [`docs/00-article-plan.md`](docs/00-article-plan.md)
- [`docs/01-project-overview.md`](docs/01-project-overview.md)
- [`docs/02-problem-statement.md`](docs/02-problem-statement.md)
- [`docs/03-objectives.md`](docs/03-objectives.md)
- [`docs/04-system-architecture.md`](docs/04-system-architecture.md)
- [`docs/05-methodology.md`](docs/05-methodology.md)
- [`docs/06-implementation.md`](docs/06-implementation.md)
- [`docs/07-gallery-and-artwork-model.md`](docs/07-gallery-and-artwork-model.md)
- [`docs/08-cloudinary-video-integration.md`](docs/08-cloudinary-video-integration.md)
- [`docs/09-ui-ux-design.md`](docs/09-ui-ux-design.md)
- [`docs/10-guided-tour.md`](docs/10-guided-tour.md)
- [`docs/11-performance-optimization.md`](docs/11-performance-optimization.md)
- [`docs/12-testing-and-validation.md`](docs/12-testing-and-validation.md)
- [`docs/13-results.md`](docs/13-results.md)
- [`docs/14-discussion.md`](docs/14-discussion.md)
- [`docs/15-limitations.md`](docs/15-limitations.md)
- [`docs/16-future-work.md`](docs/16-future-work.md)
- [`docs/17-maintenance-guide.md`](docs/17-maintenance-guide.md)
- [`docs/code-documentation.md`](docs/code-documentation.md)

### Diagrams

- [`docs/diagrams/architecture.mmd`](docs/diagrams/architecture.mmd)
- [`docs/diagrams/user-flow.mmd`](docs/diagrams/user-flow.mmd)
- [`docs/diagrams/artwork-interaction-flow.mmd`](docs/diagrams/artwork-interaction-flow.mmd)
- [`docs/diagrams/cloudinary-video-flow.mmd`](docs/diagrams/cloudinary-video-flow.mmd)
- [`docs/diagrams/guided-tour-flow.mmd`](docs/diagrams/guided-tour-flow.mmd)

### Tables

- [`docs/tables/technologies.md`](docs/tables/technologies.md)
- [`docs/tables/performance-metrics.md`](docs/tables/performance-metrics.md)
- [`docs/tables/testing-checklist.md`](docs/tables/testing-checklist.md)
- [`docs/tables/asset-optimization.md`](docs/tables/asset-optimization.md)

## Cloudinary Video Note

Animated artwork videos are intended to be delivered externally through Cloudinary instead of stored directly in this repository. Artwork records currently include Cloudinary delivery URLs in `src/data/artworks.json`, and the detail modal creates media markup only when an artwork is opened.

Recommended future hardening includes standardized Cloudinary transformations such as:

```text
q_auto,f_auto,w_1280
```

and stronger modal cleanup that removes media sources and calls `load()` after closing.

## Project Status

Implemented:

- 3D gallery environment.
- Free exploration controls.
- Artwork data loading and gallery placement.
- Artwork interaction and detail modal.
- Credits modal.
- Guided tour mode.
- Cloudinary video URL support in artwork metadata and modal markup.
- Documentation system for technical article development.

Pending:

- Published live demo URL.
- Formal performance measurements.
- Full Cloudinary optimization rollout.
- Captions and transcripts for media.
- Broader accessibility review.
- Cross-browser and mobile validation matrix.

## Roadmap

- Standardize optimized Cloudinary video URLs.
- Improve artwork metadata and curatorial text.
- Add captions, transcripts, and expanded audio guides.
- Improve guided tour narration and controls.
- Strengthen mobile controls and responsive testing.
- Add formal performance evaluation.
- Consider WebXR as a future experimental track.

## Credits

- Development: José Manuel Cortés Cerón
- Artwork: Byron Gálvez
- Technologies: Three.js, WebGL, JavaScript, HTML, CSS, Cloudinary

## Rights And Usage

The visual artworks presented in this project belong to their respective authors or rights holders. This virtual museum is intended for educational, cultural, and dissemination purposes.

## License

No open-source license file is currently included in the repository. Until a license is added, reuse, redistribution, and commercial use should be treated as restricted.
