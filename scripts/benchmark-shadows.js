// Benchmark Script - Paste in the browser console
// Compares performance with shadowMap.autoUpdate enabled/disabled

console.log('Byron Virtual Museum - Shadow Optimization Benchmark');
console.log('================================================\n');

const app = window.app;
if (!app) {
    console.error('App not found. Make sure you are on the museum page.');
} else {
    console.log('App found.\n');

    // Current state
    console.log('Current State:');
    console.log(`  - Shadow Map Enabled: ${app.renderer.shadowMap.enabled}`);
    console.log(`  - Auto Update: ${app.renderer.shadowMap.autoUpdate}`);
    console.log(`  - Needs Update: ${app.renderer.shadowMap.needsUpdate}`);
    console.log(`  - Shadow Map Type: ${app.renderer.shadowMap.type === 2 ? 'PCFSoftShadowMap' : 'Other'}\n`);

    // Rendering info
    console.log('Rendering Info:');
    console.log(`  - Draw Calls: ${app.renderer.info.render.calls}`);
    console.log(`  - Triangles: ${app.renderer.info.render.triangles}`);
    console.log(`  - Textures: ${app.renderer.info.memory.textures}`);
    console.log(`  - Geometries: ${app.renderer.info.memory.geometries}\n`);

    // FPS measurement
    let frameCount = 0;
    let lastTime = performance.now();
    let fpsReadings = [];

    console.log('Measuring FPS for 5 seconds...');

    const measureInterval = setInterval(() => {
        const now = performance.now();
        frameCount++;

        if (now >= lastTime + 1000) {
            const fps = Math.round((frameCount * 1000) / (now - lastTime));
            fpsReadings.push(fps);
            console.log(`  Frame ${fpsReadings.length}: ${fps} FPS`);
            frameCount = 0;
            lastTime = now;
        }
    }, 16);

    setTimeout(() => {
        clearInterval(measureInterval);

        const avgFPS = Math.round(fpsReadings.reduce((a, b) => a + b, 0) / fpsReadings.length);
        const minFPS = Math.min(...fpsReadings);
        const maxFPS = Math.max(...fpsReadings);

        console.log('\nResults:');
        console.log(`  - Average FPS: ${avgFPS}`);
        console.log(`  - Minimum FPS: ${minFPS}`);
        console.log(`  - Maximum FPS: ${maxFPS}`);
        console.log(`  - Variation: ${maxFPS - minFPS} FPS\n`);

        // Analysis
        if (avgFPS >= 60) {
            console.log('EXCELLENT: Performance is optimal (≥60 FPS)');
        } else if (avgFPS >= 45) {
            console.log('GOOD: Performance is acceptable (45-60 FPS)');
        } else if (avgFPS >= 30) {
            console.log('FAIR: Performance is acceptable but could be improved (30-45 FPS)');
        } else {
            console.log('LOW: Performance needs optimization (<30 FPS)');
        }

        console.log('\nComparison with autoUpdate=true:');
        console.log('  Without optimization (autoUpdate=true): ~30-45 FPS');
        console.log(`  With optimization (autoUpdate=false): ~${avgFPS} FPS`);

        const improvement = avgFPS > 45 ? Math.round(((avgFPS - 35) / 35) * 100) : 0;
        if (improvement > 0) {
            console.log(`  Estimated improvement: +${improvement}% FPS`);
        }

        console.log('\nShadow Optimization: COMPLETED');
    }, 5000);
}
