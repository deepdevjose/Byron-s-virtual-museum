# UI And UX Design

## Visual Direction

The interface uses a dark museum-like overlay style with translucent panels, restrained borders, and gold accent colors. The visual system supports the gallery rather than replacing it; UI elements are designed to sit above the WebGL canvas while keeping focus on artwork and navigation.

## Welcome Overlay

The experience begins with a welcome overlay created by `App.showControlInstructions()`. Visitors choose between:

- Free exploration.
- Guided tour.
- Credits.

This prevents accidental movement before the visitor understands the available modes.

## Free Exploration And Guided Tour Choice

Free exploration enables manual controls and artwork interaction. Guided tour disables manual movement and pointer lock while `TourController` moves the camera through generated stops.

## Navigation HUD

`index.html` includes navigation hints and an FPS counter. Desktop visitors see WASD, look, run, and FPS information. Mobile visitors receive touch controls created at runtime.

## Artwork Modal And Panel

`ArtworkPanel` creates a side panel for artwork metadata and action buttons. Detail content appears in the `#video-modal` container, using image, audio, or video markup depending on the artwork metadata.

## Credits Modal

The credits modal is static HTML in `index.html` and is connected by `App.setupCreditsModal()`. It can be opened from the welcome overlay and after guided tour completion.

## Responsive Considerations

The CSS includes mobile-specific rules for overlays, the artwork panel, modal layout, guided tour HUD, joystick, look area, and action button. `App.detectMobileDevice()` uses user-agent checks and viewport width.

## Accessibility Considerations

Implemented accessibility-related details include:

- Reduced-motion CSS handling through `prefers-reduced-motion`.
- High-contrast preference styles through `prefers-contrast`.
- Native media controls for audio and video.
- Modal close buttons.
- `data-ui-interactive` boundaries to prevent UI clicks from also triggering 3D interactions.

Pending accessibility work includes captions, transcripts, keyboard-only modal review, screen reader semantics, and a more formal focus-management pass.

## UX Principles

- Keep overlays compact and contextual.
- Use free exploration for discovery and guided tour for structured viewing.
- Avoid loading heavy media until the visitor asks for detail content.
- Use hover feedback to communicate artwork interactivity.
- Keep credits and authorship visible without interrupting the main experience.
