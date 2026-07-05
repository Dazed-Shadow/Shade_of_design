#!/usr/bin/env node
/*
 * Brand-token lint scaffold for the SoD Museum (DD-032 Item 7).
 *
 * Walks museum/**\/*.{css,jsx,js} (excluding manifest/ and lint/ themselves)
 * and flags any hex color literal that isn't in Fable's closed palette (§1.6):
 *   Ink #0B1726 · Ember #C97B4A · Slate #5D809D · Ocean #1A3E62 · Paper #FAFAF7
 * Plus the one documented soft variant already used across the landing site's
 * own TileArt components: Ember-soft #E4A57E.
 *
 * Enforcement flipped to BLOCKING at C2 per Opus@CH's C2 arch §6 — this now
 * exits non-zero on any violation. No CI pipeline exists yet to wire this
 * into (see lint-manifests.js header) — run manually:
 *
 *   node museum/lint/lint-brand-tokens.js
 */

const fs = require("fs");
const path = require("path");

const MUSEUM_ROOT = path.join(__dirname, "..");
const SKIP_DIRS = new Set(["manifest", "lint"]);
// C2 extension: scene.js/maze-chase.js are plain .js (not .jsx) — arch §6
// says "no non-token hex in museum CSS/JS," so .js must be scanned too.
const EXTENSIONS = new Set([".css", ".jsx", ".js"]);
const EXIT_NONZERO_ON_VIOLATION = true; // flipped to blocking at C2 per arch §6

const ALLOWED_HEX = new Set([
  "#0B1726", // Ink
  "#C97B4A", // Ember
  "#E4A57E", // Ember-soft (precedent: landing.jsx TileArt uses this for ocean/ember accents)
  "#5D809D", // Slate
  "#1A3E62", // Ocean
  "#FAFAF7", // Paper
]);

function walk(dir, files) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) return;
      walk(path.join(dir, entry.name), files);
      return;
    }
    if (EXTENSIONS.has(path.extname(entry.name))) {
      files.push(path.join(dir, entry.name));
    }
  });
  return files;
}

function main() {
  const files = walk(MUSEUM_ROOT, []);
  const hexPattern = /#[0-9A-Fa-f]{3,8}\b/g;
  // Three.js color literals (scene.js) use the 0xRRGGBB numeric form, not
  // CSS #RRGGBB strings — a distinct pattern the C1-era regex never covered.
  const threeHexPattern = /\b0x([0-9A-Fa-f]{6})\b/g;
  const violations = [];

  files.forEach((filePath) => {
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split("\n");
    lines.forEach((line, idx) => {
      let match;
      hexPattern.lastIndex = 0;
      while ((match = hexPattern.exec(line)) !== null) {
        const hex = match[0].toUpperCase();
        if (!ALLOWED_HEX.has(hex)) {
          violations.push(
            path.relative(MUSEUM_ROOT, filePath) + ":" + (idx + 1) + ": non-token color " + hex
          );
        }
      }
      threeHexPattern.lastIndex = 0;
      while ((match = threeHexPattern.exec(line)) !== null) {
        const hex = "#" + match[1].toUpperCase();
        if (!ALLOWED_HEX.has(hex)) {
          violations.push(
            path.relative(MUSEUM_ROOT, filePath) + ":" + (idx + 1) + ": non-token color " + match[0] + " (" + hex + ")"
          );
        }
      }
    });
  });

  if (violations.length === 0) {
    console.log("Brand-token lint: CLEAN (" + files.length + " files scanned)");
    process.exit(0);
  }

  console.error("Brand-token lint: " + violations.length + " non-token color(s) found (blocking gate since C2)");
  violations.forEach((v) => console.error("  - " + v));
  process.exit(EXIT_NONZERO_ON_VIOLATION ? 1 : 0);
}

main();
