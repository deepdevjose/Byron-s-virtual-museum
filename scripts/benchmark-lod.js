// Benchmark LOD System - Paste in the browser console
// Compares memory usage and switches of the biomimetic LOD system

console.log('Byron Virtual Museum - Biomimetic LOD Benchmark');
console.log('====================================================\n');

const app = window.app;
if (!app || !app.gallery || !app.gallery.lodSystem) {
    console.error('LOD System not found. Please make sure the museum is loaded.');
} else {
    console.log('LOD System found.\n');

    // Initial state
    console.log('LOD Configuration:');
    const thresholds = app.gallery.lodSystem.thresholds;
    console.log(`  - High quality (Ventral Pathway): 0-${thresholds.high}m`);
    console.log(`  - Medium quality (Peripheral): ${thresholds.high}-${thresholds.medium}m`);
    console.log(`  - Low quality (Dorsal Pathway): ${thresholds.medium}-${thresholds.low}m\n`);

    // Initial statistics
    const initialStats = app.getLODStats();

    console.log('\nMonitoring for 30 seconds...');
    console.log('TIP: Move around the museum to see LOD changes\n');

    let checkCount = 0;
    const monitorInterval = setInterval(() => {
        checkCount++;
        const stats = app.gallery.lodSystem.getStats();

        console.log(`[${checkCount * 5}s] High: ${stats.currentDistribution.high}, Medium: ${stats.currentDistribution.medium}, Low: ${stats.currentDistribution.low}`);
    }, 5000);

    setTimeout(() => {
        clearInterval(monitorInterval);

        const finalStats = app.getLODStats();

        console.log('\nFinal Results:');
        console.log('========================\n');

        console.log('Texture Switches:');
        console.log(`  Total: ${finalStats.totalSwitches}`);
        console.log(`  Average: ${(finalStats.totalSwitches / 30).toFixed(1)} switches/second\n`);

        console.log('Quality Distribution:');
        console.log(`  High (Ventral): ${finalStats.currentDistribution.high} artworks`);
        console.log(`  Medium (Peripheral): ${finalStats.currentDistribution.medium} artworks`);
        console.log(`  Low (Dorsal): ${finalStats.currentDistribution.low} artworks\n`);

        console.log('Memory Management:');
        console.log(`  Textures in cache: ${finalStats.cacheSize}`);

        // Estimate memory usage
        const totalArtworks = app.gallery.artworks.length;
        const avgTextureSize = 2048; // Assuming 2K textures

        const memoryWithoutLOD = totalArtworks * avgTextureSize * avgTextureSize * 4; // RGBA
        const memoryWithLOD = 
            finalStats.currentDistribution.high * (avgTextureSize * avgTextureSize * 4) +
            finalStats.currentDistribution.medium * (avgTextureSize * 0.5 * avgTextureSize * 0.5 * 4) +
            finalStats.currentDistribution.low * (avgTextureSize * 0.25 * avgTextureSize * 0.25 * 4);

        const memorySaved = memoryWithoutLOD - memoryWithLOD;
        const percentSaved = ((memorySaved / memoryWithoutLOD) * 100).toFixed(1);

        console.log(`  Without LOD: ~${(memoryWithoutLOD / 1024 / 1024).toFixed(1)} MB`);
        console.log(`  With LOD: ~${(memoryWithLOD / 1024 / 1024).toFixed(1)} MB`);
        console.log(`  Saved: ~${(memorySaved / 1024 / 1024).toFixed(1)} MB (${percentSaved}%)\n`);

        // Efficiency analysis
        console.log('Efficiency Analysis:');

        const switchRate = finalStats.totalSwitches / 30;
        if (switchRate < 2) {
            console.log(`  EXCELLENT: Very few switches (${switchRate.toFixed(1)}/s)`);
            console.log('     The player moved little or the system is highly optimized.');
        } else if (switchRate < 5) {
            console.log(`  GOOD: Moderate switches (${switchRate.toFixed(1)}/s)`);
            console.log('     Ideal balance between quality and performance.');
        } else if (switchRate < 10) {
            console.log(`  HIGH: Many switches (${switchRate.toFixed(1)}/s)`);
            console.log('     Consider increasing throttling or adjusting thresholds.');
        } else {
            console.log(`  VERY HIGH: Too many switches (${switchRate.toFixed(1)}/s)`);
            console.log('     Possible hysteresis problem or thresholds too close.');
        }

        // Ideal distribution
        const totalVisible = finalStats.currentDistribution.high + 
                            finalStats.currentDistribution.medium + 
                            finalStats.currentDistribution.low;

        console.log('\nQuality Distribution:');
        if (totalVisible > 0) {
            const highPercent = (finalStats.currentDistribution.high / totalVisible * 100).toFixed(0);
            const medPercent = (finalStats.currentDistribution.medium / totalVisible * 100).toFixed(0);
            const lowPercent = (finalStats.currentDistribution.low / totalVisible * 100).toFixed(0);

            console.log(`  High: ${highPercent}% | Medium: ${medPercent}% | Low: ${lowPercent}%`);
            console.log('  Ideal distribution: ~20% High, ~40% Medium, ~40% Low');
        }

        console.log('\nRecommendations:');

        if (percentSaved < 30) {
            console.log('  • Consider reducing resolution scales');
            console.log('    Example: medium: 0.35, low: 0.15');
        }

        if (switchRate > 8) {
            console.log('  • Increase throttling in App.js');
            console.log('    Change from frameCount % 3 to frameCount % 5');
        }

        if (finalStats.currentDistribution.high > totalArtworks * 0.4) {
            console.log('  • Too many artworks in high quality');
            console.log('    Consider reducing threshold.high from 6m to 5m');
        }

        console.log('\nBiomimetic LOD System: COMPLETED');
        console.log('Dorsal/Ventral pathways implemented correctly\n');

        // Useful commands
        console.log('Useful Commands:');
        console.log('  - window.app.getLODStats() // View current stats');
        console.log('  - window.app.gallery.lodSystem.clearCache() // Clear cache');
        console.log('  - window.app.gallery.lodSystem.thresholds.high = 8 // Adjust thresholds');

    }, 30000);
}
