#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Pépète v2.0 — Post-build script
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

// Copy PWA files (manifest.json, service-worker.js) to dist/
const publicDir = path.join(__dirname, '..', 'public');
const pwaFiles = ['manifest.json', 'service-worker.js'];
for (const file of pwaFiles) {
  const src = path.join(publicDir, file);
  const dest = path.join(distDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`✓ Copied public/${file} → dist/${file}`);
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
    <meta name="theme-color" content="#7B8B6F" />
    <meta name="description" content="Pépète - Le compagnon de vos compagnons. Scanner produits, garde animaux, assistant IA." />
    <link rel="manifest" href="/manifest.json" />

    <!-- PWA Meta Tags -->
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="Pépète" />
    <link rel="apple-touch-icon" href="/assets/icon.png" />

    <!-- Open Graph -->
    <meta property="og:title" content="Pépète" />
    <meta property="og:description" content="Le compagnon de vos compagnons" />
    <meta property="og:type" content="website" />
    <meta property="og:image" content="/assets/icon.png" />
`;

if (html.includes('</head>')) {
  html = html.replace('</head>', metaTags + '\n  </head>');

  // Inject premium splash screen before <div id="root">
  const splashHtml = `
    <!-- Premium splash while JS loads -->
    <div id="splash-screen" style="position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(155deg,#7B8B6F 0%,#96A88A 50%,#A3B296 100%);z-index:9999;transition:opacity .5s ease">
      <div style="animation:sf 3s ease-in-out infinite;margin-bottom:16px">
        <svg width="100" height="100" viewBox="0 0 120 120" fill="none"><path d="M38 108C38 108 36 95 36 80L36 52C36 52 36 40 42 32C48 24 56 20 60 18C60 18 54 14 50 8C48 5 50 2 54 4C58 6 62 10 64 14C68 10 74 6 78 4C82 2 84 5 82 8C78 14 72 18 72 18C80 22 88 30 90 42C92 54 84 68 72 72C64 74 56 72 50 66L50 80C50 95 48 108 48 108Z" fill="#fff"/><circle cx="58" cy="38" r="1.8" fill="#2C2825"/><path d="M62 45L64 48L60 48Z" fill="#A3B296"/><path d="M92 96C92 92 96 88 100 88C104 88 108 92 108 96C108 100 104 104 100 104C96 104 92 100 92 96Z" fill="rgba(255,255,255,.7)"/><circle cx="91" cy="86" r="3" fill="rgba(255,255,255,.7)"/><circle cx="98" cy="82" r="3.2" fill="rgba(255,255,255,.7)"/><circle cx="106" cy="84" r="3" fill="rgba(255,255,255,.7)"/></svg>
      </div>
      <h1 style="font-family:Georgia,serif;font-size:36px;font-weight:700;color:#FFF;letter-spacing:3px;margin:0 0 8px;text-transform:lowercase">pépète</h1>
      <p style="font-size:15px;color:rgba(255,255,255,.8);margin:0;font-weight:500">Le compagnon de vos compagnons</p>
      <div style="display:flex;gap:8px;margin-top:32px"><span class="sd"></span><span class="sd" style="animation-delay:.2s"></span><span class="sd" style="animation-delay:.4s"></span></div>
      <style>@keyframes sf{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}.sd{width:8px;height:8px;border-radius:4px;background:rgba(255,255,255,.5);animation:sp 1.4s ease-in-out infinite}@keyframes sp{0%,80%,100%{opacity:.3;transform:scale(1)}40%{opacity:1;transform:scale(1.3)}}</style>
    </div>
  `;

  if (html.includes('<div id="root">')) {
    html = html.replace('<div id="root">', splashHtml + '\n    <div id="root">');
  }

  // Inject splash-hide + service worker script before </body>
  const scripts = `
    <script>
      window.addEventListener('load',function(){setTimeout(function(){var s=document.getElementById('splash-screen');if(s){s.style.opacity='0';setTimeout(function(){s.remove()},600)}},600)});
      if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/service-worker.js').catch(function(){})})}
    </script>
  `;
  html = html.replace('</body>', scripts + '\n  </body>');

  fs.writeFileSync(distHtml, html, 'utf-8');
  console.log('✓ PWA meta tags + splash screen + service worker injected into dist/index.html');
} else {
  console.error('ERROR: Could not find </head> in index.html');
  process.exit(1);
}

console.log('\n✅ Post-build complete! Ready to deploy.');
