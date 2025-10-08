const fs = require('fs');
const path = require('path');

const candidates = [
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
