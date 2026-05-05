# Problem Statement

Static digital galleries often present artwork as flat image grids or isolated pages. That format is easy to publish, but it does not communicate spatial scale, visitor movement, or the feeling of being inside an exhibition. A virtual museum can add context by placing works in a navigable room and allowing visitors to approach, inspect, and compare pieces in a more embodied way.

The project addresses the need for accessible web-based cultural experiences. A browser-based museum can be shared through a URL and viewed on common devices, reducing the friction of native app installation. This is especially useful for educational, cultural, portfolio, and dissemination contexts.

The core technical challenge is combining several systems that normally compete for attention and resources:

- Real-time 3D rendering through WebGL.
- Camera setup and first-person navigation.
- Scene construction with walls, ceiling, floor, lights, frames, labels, and decor.
- Artwork interaction through raycasting.
- HTML/CSS overlays for panels, modals, HUDs, and credits.
- Guided tour state and camera interpolation.
- Heavy media assets, especially animated artwork videos.
- Performance constraints across browsers and devices.

The repository also needs a practical asset strategy. Video files can be too large for Git history and can slow clone, review, and deployment workflows. The current data model stores video delivery URLs, primarily from Cloudinary, so animated media can live outside the repository while remaining available to the modal system.

The problem is therefore both museographic and technical: provide an experience that respects the artwork and feels coherent as a museum, while keeping the codebase maintainable, performant, and deployable as a static web project.
