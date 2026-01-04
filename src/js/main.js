import { App } from './modules/Core/App.js';

// Wait for DOM
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    window.app = app; // For debugging
    app.init().catch(err => {
        console.error('Failed to initialize app:', err);
    });
});