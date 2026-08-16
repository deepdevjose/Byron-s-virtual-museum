import { spawnSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const roots = ['src/js', 'scripts'];
const files = roots.flatMap((root) => collectJavaScriptFiles(root));

if (files.length === 0) {
    console.error('JS syntax check failed: no JavaScript files found.');
    process.exit(1);
}

for (const file of files) {
    const result = spawnSync(process.execPath, ['--check', file], {
        encoding: 'utf8',
    });

    if (result.status !== 0) {
        process.stderr.write(result.stderr || result.stdout);
        console.error(`JS syntax check failed: ${file}`);
        process.exit(result.status || 1);
    }
}

console.log(`JS syntax check passed: ${files.length} files`);

function collectJavaScriptFiles(directory) {
    return readdirSync(directory)
        .flatMap((entry) => {
            const fullPath = join(directory, entry);
            const stats = statSync(fullPath);

            if (stats.isDirectory()) {
                return collectJavaScriptFiles(fullPath);
            }

            return entry.endsWith('.js') ? [fullPath] : [];
        })
        .sort();
}
