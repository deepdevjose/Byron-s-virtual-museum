const fs = require('fs');
const path = require('path');

const root = process.cwd();
const filePath = path.join(root, 'src/data/artworks.json');
const requiredFields = ['id', 'title', 'artist', 'year', 'technique', 'description', 'image', 'position', 'size'];

function fail(message) {
  console.error(`Artwork validation failed: ${message}`);
  process.exit(1);
}

if (!fs.existsSync(filePath)) {
  fail('src/data/artworks.json does not exist');
}

let artworks;
try {
  artworks = JSON.parse(fs.readFileSync(filePath, 'utf8'));
} catch (error) {
  fail(`invalid JSON: ${error.message}`);
}

if (!Array.isArray(artworks) || artworks.length === 0) {
  fail('artworks.json must be a non-empty array');
}

const ids = new Set();

artworks.forEach((artwork, index) => {
  requiredFields.forEach((field) => {
    if (artwork[field] === undefined || artwork[field] === null || artwork[field] === '') {
      fail(`record ${index} is missing required field "${field}"`);
    }
  });

  if (ids.has(artwork.id)) {
    fail(`duplicate id "${artwork.id}"`);
  }
  ids.add(artwork.id);

  if (!Array.isArray(artwork.position) || artwork.position.length !== 3 || artwork.position.some((value) => typeof value !== 'number')) {
    fail(`"${artwork.id}" must have numeric position [x, y, z]`);
  }

  if (!Array.isArray(artwork.size) || artwork.size.length !== 2 || artwork.size.some((value) => typeof value !== 'number' || value <= 0)) {
    fail(`"${artwork.id}" must have positive numeric size [width, height]`);
  }

  if (artwork.rotation && (!Array.isArray(artwork.rotation) || artwork.rotation.length !== 3 || artwork.rotation.some((value) => typeof value !== 'number'))) {
    fail(`"${artwork.id}" must have numeric rotation [x, y, z]`);
  }

  const imagePath = artwork.image.replace(/^\.\//, '');
  if (!fs.existsSync(path.join(root, imagePath))) {
    fail(`"${artwork.id}" image not found: ${artwork.image}`);
  }

  if (artwork.audio) {
    const audioPath = artwork.audio.replace(/^\.\//, '');
    if (!fs.existsSync(path.join(root, audioPath))) {
      fail(`"${artwork.id}" audio not found: ${artwork.audio}`);
    }
  }
});

console.log(`Artwork validation passed: ${artworks.length} records`);
