#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Patoune v2.0 — Post-build script
// Run after: npx expo export --platform web
//
// This script does 4 things:
// 1. Renames dist/assets/node_modules/ → dist/assets/vendor/
//    (Vercel filters node_modules/ from static deployments)
// 2. Patches JS bundle to replace "node_modules" → "vendor" in asset paths
// 3. Copies icon assets (icon.png, favicon.png) to dist/assets/
// 4. Injects PWA meta tags into dist/index.html
// ---------------------------------------------------------------------------

const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const distHtml = path.join(distDir, 'index.html');
const assetsDir = path.join(distDir, 'assets');
const nodeModulesDir = path.join(assetsDir, 'node_modules');
const vendorDir = path.join(assetsDir, 'vendor');
const sourceAssets = path.join(__dirname, '..', 'assets');
const bundleDir = path.join(distDir, '_expo', 'static', 'js', 'web');

// Check dist/ exists
if (!fs.existsSync(distHtml)) {
  console.error('ERROR: dist/index.html not found. Run "npx expo export --platform web" first.');
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 1: Recursively rename ALL node_modules/ → vendor/ in dist/assets/
// Vercel filters ANY path containing "node_modules" — including nested ones
// e.g. dist/assets/node_modules/expo/node_modules/@expo/vector-icons/...
// ─────────────────────────────────────────────────────────────────────────────
function renameNodeModulesRecursive(dir) {
  if (!fs.existsSync(dir)) return 0;
  let count = 0;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.name === 'node_modules') {
      const vendorPath = path.join(dir, 'vendor');
      if (fs.existsSync(vendorPath)) {
        fs.rmSync(vendorPath, { recursive: true });
      }
      fs.renameSync(fullPath, vendorPath);
      count++;
      // Continue recursing into the renamed directory
      count += renameNodeModulesRecursive(vendorPath);
    } else {
      count += renameNodeModulesRecursive(fullPath);
    }
  }
  return count;
}

const renamedCount = renameNodeModulesRecursive(assetsDir);
if (renamedCount > 0) {
  console.log(`✓ Renamed ${renamedCount} "node_modules" directories → "vendor" in dist/assets/`);
} else {
  console.log('✓ No node_modules directories found (already renamed or clean)');
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 2: Patch JS bundle — replace "node_modules" → "vendor" in asset paths
// ─────────────────────────────────────────────────────────────────────────────
if (fs.existsSync(bundleDir)) {
  const bundles = fs.readdirSync(bundleDir).filter(f => f.endsWith('.js'));
  for (const bundle of bundles) {
    const bundlePath = path.join(bundleDir, bundle);
    let content = fs.readFileSync(bundlePath, 'utf-8');
    const count = (content.match(/node_modules/g) || []).length;
    if (count > 0) {
      content = content.replace(/node_modules/g, 'vendor');
      fs.writeFileSync(bundlePath, content, 'utf-8');
      console.log(`✓ Patched ${bundle}: replaced ${count} occurrences of "node_modules" → "vendor"`);
    }
  }
} else {
  console.warn('⚠ Bundle directory not found: dist/_expo/static/js/web/');
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 3: Copy icon assets to dist/assets/
// ─────────────────────────────────────────────────────────────────────────────
const iconsToCopy = ['icon.png', 'favicon.png'];
for (const icon of iconsToCopy) {
  const src = path.join(sourceAssets, icon);
  const dest = path.join(assetsDir, icon);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`✓ Copied assets/${icon} → dist/assets/${icon}`);
  } else {
    console.warn(`⚠ Source asset not found: assets/${icon}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 4: Inject PWA meta tags into dist/index.html
// ─────────────────────────────────────────────────────────────────────────────
let html = fs.readFileSync(distHtml, 'utf-8');

// Remove Expo-generated duplicates before injecting ours
html = html.replace(/<meta name="theme-color"[^>]*>\n?/g, '');
html = html.replace(/<meta name="description"[^>]*>\n?/g, '');

const metaTags = `
    <!-- PWA Meta Tags (injected by post-build script) -->
    <meta name="theme-color" content="#C4704B" />
    <meta name="description" content="Patoune - Le compagnon de vos compagnons. Scanner produits, garde animaux, assistant IA." />
    <link rel="manifest" href="/manifest.json" />

    <!-- PWA Meta Tags -->
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="Patoune" />
    <link rel="apple-touch-icon" href="/assets/icon.png" />

    <!-- Open Graph -->
    <meta property="og:title" content="Patoune" />
    <meta property="og:description" content="Le compagnon de vos compagnons" />
    <meta property="og:type" content="website" />
    <meta property="og:image" content="/assets/icon.png" />
`;

if (html.includes('</head>')) {
  html = html.replace('</head>', metaTags + '\n  </head>');
  fs.writeFileSync(distHtml, html, 'utf-8');
  console.log('✓ PWA meta tags injected into dist/index.html');
} else {
  console.error('ERROR: Could not find </head> in index.html');
  process.exit(1);
}

console.log('\n✅ Post-build complete! Ready to deploy.');
