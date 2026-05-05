/**
 * Minimal repository smoke test.
 *
 * This script confirms that a known JavaScript entry file exists. The project
 * is a static browser app with no package manifest, so this check intentionally
 * avoids invoking a bundler or dev server.
 */
const fs = require('fs');
const path = require('path');

const candidates = [
  'src/js/main.js',
  'src/index.js',
  'src/main.js',
  'index.js',
  'main.js'
];

const found = candidates.find(p => fs.existsSync(path.join(process.cwd(), p)));

if (found) {
  console.log(`Smoke test: found entry file: ${found}`);
  process.exit(0);
} else {
  console.error('Smoke test failed: no entry file found. Checked:', candidates.join(', '));
  process.exit(1);
}
