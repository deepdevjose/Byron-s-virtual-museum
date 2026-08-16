import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
    const consoleErrors = [];
    const pageErrors = [];

    page.on('console', (message) => {
        if (message.type() === 'error') {
            consoleErrors.push(message.text());
        }
    });
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await page.goto('/');
    await expect(page.locator('#control-instructions')).toBeVisible();
    await page.waitForFunction(() => window.app?.renderer && window.app?.gallery?.artworks?.length > 0);

    expect(pageErrors, 'uncaught browser errors').toEqual([]);
    expect(
        consoleErrors.filter((message) => !message.includes('THREE.WebGLRenderer') && !message.includes('favicon')),
        'console errors',
    ).toEqual([]);
});

test('museum boots, hides loader, and renders the welcome UI', async ({ page }) => {
    await expect(page.locator('#loader')).not.toBeVisible();
    await expect(page.locator('#control-instructions')).toBeVisible();
    await expect(page.locator('#canvas-container canvas')).toBeVisible();
    await expect(page.locator('#start-walking')).toBeVisible();
    await expect(page.locator('#start-tour')).toBeVisible();

    const renderStats = await page.evaluate(() => ({
        artworks: window.app.gallery.artworks.length,
        tourStops: window.app.tourController.path.length,
        calls: window.app.renderer.info.render.calls,
    }));

    expect(renderStats.artworks).toBeGreaterThanOrEqual(24);
    expect(renderStats.tourStops).toBeGreaterThanOrEqual(1);
    expect(renderStats.calls).toBeGreaterThanOrEqual(1);
});

test('guided tour starts and can exit back to the welcome overlay', async ({ page }) => {
    await page.locator('#start-tour').click();

    await expect(page.locator('#tour-hud')).toHaveClass(/is-visible/);
    await expect(page.locator('body')).toHaveClass(/guided-tour-active/);

    await page.locator('.tour-hud__button').click();

    await expect(page.locator('#tour-hud')).not.toHaveClass(/is-visible/);
    await expect(page.locator('#control-instructions')).toBeVisible();
});

test('credits modal opens from the welcome UI and closes', async ({ page }) => {
    await page.locator('#start-credits').click();

    await expect(page.locator('#credits-modal')).toHaveClass(/show/);
    await expect(page.locator('.credits-content')).toContainText('José Manuel Cortés Cerón');

    await page.locator('#close-credits').click();
    await expect(page.locator('#credits-modal')).not.toHaveClass(/show/);
});

test('artwork detail opens and closes through the initialized app', async ({ page }) => {
    await page.evaluate(() => {
        const artwork = window.app.gallery.artworks[0];
        window.app.selectArtwork(artwork, { source: 'click' });
    });

    await expect(page.locator('#video-modal')).toHaveClass(/show/);
    await expect(page.locator('.artwork-detail')).toBeVisible();
    await expect(page.locator('.artwork-detail__body h2')).not.toBeEmpty();

    await page.locator('#close-modal').click();
    await expect(page.locator('#video-modal')).not.toHaveClass(/show/);
    await expect(page.locator('body')).not.toHaveClass(/artwork-detail-open/);
});

test('mobile viewport exposes touch controls during free exploration', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile controls are only expected in mobile project.');

    await page.locator('#start-walking').click();

    await expect(page.locator('body')).toHaveClass(/has-mobile-controls/);
    await expect(page.locator('#mobile-joystick')).toBeVisible();
    await expect(page.locator('#mobile-look-area')).toBeVisible();
    await expect(page.locator('#mobile-action-button')).toBeVisible();

    const mobileRenderStats = await page.evaluate(() => {
        const lightTypes = [];
        window.app.scene.traverse((object) => {
            if (object.isLight) lightTypes.push(object.type);
        });

        return {
            profile: window.app.renderProfile.mobileSafe,
            lightProfile: window.app.lighting.lightProfile.name,
            shadows: window.app.renderer.shadowMap.enabled,
            spotlights: lightTypes.filter((type) => type === 'SpotLight').length,
        };
    });

    expect(mobileRenderStats.profile).toBe(true);
    expect(mobileRenderStats.lightProfile).toBe('mobile-safe');
    expect(mobileRenderStats.shadows).toBe(false);
    expect(mobileRenderStats.spotlights).toBeLessThanOrEqual(6);
});
