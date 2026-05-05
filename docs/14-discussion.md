# Discussion

The project demonstrates that a virtual museum can be built with a lightweight static web architecture while still offering spatial navigation, artwork interaction, guided viewing, and multimedia presentation. Three.js provides the real-time rendering layer, while HTML and CSS handle accessible, familiar UI surfaces such as modals, buttons, and native media controls.

From an engineering perspective, the most important value is modular separation. `App` coordinates lifecycle, while world, controls, interaction, UI, tour, audio, and utility modules each own focused responsibilities. This makes the project easier to explain, maintain, and extend.

From a UX and museographic perspective, the project recognizes that a virtual museum is not only a 3D room. It also needs orientation, pacing, metadata, interaction feedback, credits, and media behavior that supports rather than distracts from the artwork. The welcome overlay, guided tour, artwork panel, and modal system all help structure the visitor experience.

The web technology stack has clear tradeoffs. A static app is easy to host and share, but browser performance varies by device and GPU. WebGL gives broad reach, but large textures, video playback, and lighting can still create performance pressure. The lack of a build system keeps the project approachable, but it also means there is no bundling, dependency management, or production optimization pipeline in the current repository.

Cloudinary delivery is a practical choice for animated artwork videos because it keeps heavy media out of Git and can support URL-based optimization. The tradeoff is that video playback depends on external hosting availability, network conditions, and correct delivery URLs.

The quality of a virtual museum depends on both technical architecture and curatorial experience. Rendering, input, and media systems must be reliable, but the experience also needs thoughtful artwork order, labels, credits, pacing, accessibility, and context. Future work should treat engineering and curation as connected parts of the same visitor experience.
