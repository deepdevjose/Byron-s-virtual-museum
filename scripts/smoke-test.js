/**
 * Static application smoke test.
 *
 * This script confirms that the static entry document points to real local
 * CSS and module files, that required DOM mount points exist, and that the
 * artwork catalog can be parsed. Browser behavior is covered by Playwright.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const indexPath = path.join(root, 'index.html');
const requiredDomIds = ['container', 'canvas-container', 'loader', 'video-modal', 'credits-modal'];

function fail(message) {
    console.error(`Smoke test failed: ${message}`);
    process.exit(1);
}

if (!fs.existsSync(indexPath)) {
    fail('index.html does not exist');
}

const html = fs.readFileSync(indexPath, 'utf8');

for (const id of requiredDomIds) {
    if (!html.includes(`id="${id}"`)) {
        fail(`index.html is missing #${id}`);
    }
}

const moduleMatch = html.match(/<script[^>]+type=["']module["'][^>]+src=["']([^"']+)["']/);
if (!moduleMatch) {
    fail('index.html does not declare a module entry script');
}

const modulePath = normalizeLocalPath(moduleMatch[1]);
if (!fs.existsSync(path.join(root, modulePath))) {
    fail(`module entry not found: ${moduleMatch[1]}`);
}

const stylesheetMatches = [...html.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["']/g)];
if (stylesheetMatches.length === 0) {
    fail('index.html does not declare a stylesheet');
}

for (const [, href] of stylesheetMatches) {
    if (/^https?:\/\//i.test(href)) continue;

    const stylesheetPath = normalizeLocalPath(href);
    if (!fs.existsSync(path.join(root, stylesheetPath))) {
        fail(`stylesheet not found: ${href}`);
    }
}

const catalogPath = path.join(root, 'src/data/artworks.json');
if (!fs.existsSync(catalogPath)) {
    fail('src/data/artworks.json does not exist');
}

const artworks = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
if (!Array.isArray(artworks) || artworks.length === 0) {
    fail('artwork catalog is empty');
}

console.log(`Smoke test passed: ${modulePath}, ${stylesheetMatches.length} stylesheet(s), ${artworks.length} artworks`);

function normalizeLocalPath(value) {
    return value.replace(/^\.\//, '');
}
