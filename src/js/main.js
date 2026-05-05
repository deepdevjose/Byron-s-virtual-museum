import { App } from './modules/Core/App.js';

/**
 * Browser entry point for the virtual museum.
 *
 * The app waits until the static DOM scaffolding exists because the
 * renderer, modals, loader, HUD, and ambient audio are all attached to
 * elements declared in index.html.
 */
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    window.app = app; /** Expose the app instance for browser-console diagnostics. */

    app.init().catch(err => {
        console.error('Failed to initialize app:', err);
    });
});
