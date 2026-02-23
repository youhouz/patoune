#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Patoune v2.0 — Post-build script
// Injects PWA meta tags and iOS web app tags into the Expo-generated index.html
// Run after: npx expo export --platform web
// ---------------------------------------------------------------------------

const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, '..', 'dist', 'index.html');

if (!fs.existsSync(distPath)) {
  console.error('dist/index.html not found. Run "npx expo export --platform web" first.');
  process.exit(1);
}

let html = fs.readFileSync(distPath, 'utf-8');

// Remove Expo-generated duplicates (theme-color, description) before injecting ours
html = html.replace(/<meta name="theme-color"[^>]*>\n?/g, '');
html = html.replace(/<meta name="description"[^>]*>\n?/g, '');

// Meta tags to inject before </head>
const metaTags = `
    <!-- PWA Meta Tags (injected by post-build script) -->
    <meta name="theme-color" content="#C4704B" />
    <meta name="description" content="Patoune - Le compagnon de vos compagnons. Scanner produits, garde animaux, assistant IA." />
    <link rel="manifest" href="/manifest.json" />

    <!-- iOS PWA Meta Tags -->
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="Patoune" />
    <link rel="apple-touch-icon" href="/assets/icon.png" />

    <!-- Open Graph -->
    <meta property="og:title" content="Patoune" />
    <meta property="og:description" content="Le compagnon de vos compagnons" />
    <meta property="og:type" content="website" />
    <meta property="og:image" content="/assets/icon.png" />
`;

// Inject before </head>
if (html.includes('</head>')) {
  html = html.replace('</head>', metaTags + '\n  </head>');
  fs.writeFileSync(distPath, html, 'utf-8');
  console.log('PWA meta tags injected into dist/index.html');
} else {
  console.error('Could not find </head> in index.html');
  process.exit(1);
}
