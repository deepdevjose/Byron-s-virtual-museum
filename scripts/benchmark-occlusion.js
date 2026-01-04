// Benchmark Occlusion Culling - Paste in the browser console
// Checks how many objects are being hidden behind walls

console.log('Byron Virtual Museum - Occlusion Culling Benchmark');
console.log('======================================================\n');

const app = window.app;
if (!app || !app.gallery || !app.gallery.occlusionCulling) {
    console.error('Occlusion Culling not found. Please make sure the museum is loaded.');
} else {
    console.log('Occlusion Culling found.\n');

    // Initial state
    const initialStats = app.getOcclusionStats();

    console.log('\nMonitoring for 20 seconds...');
    console.log('TIP: Rotate the camera to see how artworks are hidden behind walls\n');

    const samples = [];
    let sampleCount = 0;

    const monitorInterval = setInterval(() => {
        const stats = app.gallery.occlusionCulling.getStats();
        samples.push({
            visible: stats.visible,
            culled: stats.culled,
            percentage: stats.cullPercentage
        });

        sampleCount++;
        console.log(`[${sampleCount * 2}s] Visible: ${stats.visible}, Hidden: ${stats.culled} (${stats.cullPercentage}%)`);
    }, 2000);

    setTimeout(() => {
        clearInterval(monitorInterval);

        const finalStats = app.getOcclusionStats();

        console.log('\nFinal Results:');
        console.log('========================\n');

        // Calculate averages
        const avgVisible = samples.reduce((sum, s) => sum + s.visible, 0) / samples.length;
        const avgCulled = samples.reduce((sum, s) => sum + s.culled, 0) / samples.length;
        const avgPercentage = samples.reduce((sum, s) => sum + s.percentage, 0) / samples.length;

        console.log('Averages:');
        console.log(`  Average visible artworks: ${avgVisible.toFixed(1)}`);
        console.log(`  Average hidden artworks: ${avgCulled.toFixed(1)}`);
        console.log(`  Average hidden percentage: ${avgPercentage.toFixed(1)}%\n`);

        console.log('Current State:');
        console.log(`  Total: ${finalStats.total} artworks`);
        console.log(`  Visible: ${finalStats.visible}`);
        console.log(`  Hidden: ${finalStats.culled} (${finalStats.cullPercentage}%)`);
        console.log(`  Draw calls saved: ~${finalStats.drawCallsSaved}\n`);

        // Calculate performance impact
        const drawCallsPerFrame = 50; // Base estimate
        const savedDrawCalls = finalStats.drawCallsSaved;
        const reductionPercent = ((savedDrawCalls / (drawCallsPerFrame + savedDrawCalls)) * 100).toFixed(1);

        console.log('Performance Impact:');
        console.log(`  Draw calls without culling: ~${drawCallsPerFrame + savedDrawCalls}`);
        console.log(`  Draw calls with culling: ~${drawCallsPerFrame}`);
        console.log(`  Reduction: ${reductionPercent}%\n`);

        // Efficiency analysis
        console.log('Efficiency Analysis:');

        if (avgPercentage > 60) {
            console.log(`  EXCELLENT: Hiding ${avgPercentage.toFixed(0)}% of artworks`);
            console.log('     The system is working very well.');
            console.log('     Expected FPS gain: +25-35%');
        } else if (avgPercentage > 40) {
            console.log(`  GOOD: Hiding ${avgPercentage.toFixed(0)}% of artworks`);
            console.log('     Effective balance between visibility and performance.');
            console.log('     Expected FPS gain: +15-25%');
        } else if (avgPercentage > 20) {
            console.log(`  MODERATE: Hiding ${avgPercentage.toFixed(0)}% of artworks`);
            console.log('     Working but with room for improvement.');
            console.log('     Expected FPS gain: +10-15%');
        } else {
            console.log(`  LOW: Only hiding ${avgPercentage.toFixed(0)}% of artworks`);
            console.log('     Consider adjusting the visibilityThreshold.');
            console.log('     Expected FPS gain: +5-10%');
        }

        // Ideal scenarios
        console.log('\nScenario Analysis:');
        console.log('  Ideal scenario 1: Looking at a wall');
        console.log('    → Should hide ~75% of artworks (3 out of 4 walls)');
        console.log('  Ideal scenario 2: In a corner');
        console.log('    → Should hide ~50% of artworks (2 out of 4 walls)');
        console.log('  Ideal scenario 3: In the center');
        console.log('    → Should hide ~25-50% depending on rotation\n');

        // Check consistency
        const maxCulled = Math.max(...samples.map(s => s.culled));
        const minCulled = Math.min(...samples.map(s => s.culled));
        const variance = maxCulled - minCulled;

        console.log('System Consistency:');
        console.log(`  Minimum hidden: ${minCulled}`);
        console.log(`  Maximum hidden: ${maxCulled}`);
        console.log(`  Variance: ${variance}`);

        if (variance < 3) {
            console.log('  LOW variance: You may not have moved much');
        } else if (variance < 6) {
            console.log('  NORMAL variance: The system is responding correctly');
        } else {
            console.log('  HIGH variance: Excellent, you tested different angles');
        }

        console.log('\nRecommendations:');

        if (avgPercentage < 30) {
            console.log('  • Adjust visibilityThreshold from 0.3 to 0.5');
            console.log('    window.app.gallery.occlusionCulling.visibilityThreshold = 0.5');
        }

        if (finalStats.drawCallsSaved < 10) {
            console.log('  • The impact is low because few artworks are hidden');
            console.log('  • This is normal in small museums (<15 artworks)');
        }

        if (avgPercentage > 70) {
            console.log('  • System is very aggressive, check for pop-in');
            console.log('  • If you see flickering, reduce visibilityThreshold to 0.2');
        }

        console.log('\nOcclusion Culling: COMPLETED');
        console.log('System optimized for indoor museums\n');

        // Useful commands
        console.log('Useful Commands:');
        console.log('  - window.app.getOcclusionStats() // View current stats');
        console.log('  - window.app.gallery.occlusionCulling.visibilityThreshold = 0.4 // Adjust');
        console.log('  - window.app.gallery.occlusionCulling.reset() // Reset system');

    }, 20000);
}
