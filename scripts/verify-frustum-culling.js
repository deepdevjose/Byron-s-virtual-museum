// Frustum Culling Verification - Paste in the browser console
// Confirms that Three.js has frustum culling enabled

console.log('Verifying Three.js Frustum Culling...');
console.log('================================================\n');

const app = window.app;
if (!app || !app.scene) {
    console.error('App not found');
} else {
    let totalObjects = 0;
    let cullingEnabled = 0;
    let cullingDisabled = 0;

    const checkObject = (obj, depth = 0) => {
        if (obj.isMesh) {
            totalObjects++;
            if (obj.frustumCulled === true) {
                cullingEnabled++;
            } else {
                cullingDisabled++;
                console.warn(`  frustumCulled=false on: ${obj.name || 'Unnamed'} (${obj.type})`);
            }
        }

        if (obj.children) {
            obj.children.forEach(child => checkObject(child, depth + 1));
        }
    };

    checkObject(app.scene);

    console.log('Results:');
    console.log(`  Total meshes: ${totalObjects}`);
    console.log(`  Frustum Culling ENABLED: ${cullingEnabled}`);
    console.log(`  Frustum Culling DISABLED: ${cullingDisabled} ${cullingDisabled > 0 ? '(Check above for details)' : '(All good)'}`);
    console.log('');

    if (cullingDisabled === 0) {
        console.log('PERFECT: All objects have frustum culling enabled');
        console.log('   Three.js automatically does not render objects outside the view frustum.');
    } else {
        console.log(`WARNING: ${cullingDisabled} objects have frustum culling disabled`);
        console.log('   Consider enabling it with: mesh.frustumCulled = true');
    }

    console.log('\nRenderer Info:');
    console.log(`  Draw calls: ${app.renderer.info.render.calls}`);
    console.log(`  Triangles: ${app.renderer.info.render.triangles}`);
    console.log(`  Textures in memory: ${app.renderer.info.memory.textures}`);
    console.log(`  Geometries in memory: ${app.renderer.info.memory.geometries}`);

    // How to visually verify frustum culling
    console.log('\nTo visually verify frustum culling:');
    console.log('   1. Open DevTools → Performance Monitor');
    console.log('   2. Watch "Draw calls" as you rotate the camera');
    console.log('   3. It should decrease when looking at empty walls');
}
