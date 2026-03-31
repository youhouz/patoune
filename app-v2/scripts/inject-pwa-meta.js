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

// Copy public/assets files (og-image, etc.) to dist/assets/
const publicAssetsDir = path.join(__dirname, '..', 'public', 'assets');
const publicAssetsToCopy = ['og-image.png'];
for (const file of publicAssetsToCopy) {
  const src = path.join(publicAssetsDir, file);
  const dest = path.join(assetsDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`✓ Copied public/assets/${file} → dist/assets/${file}`);
  } else {
    console.warn(`⚠ Source asset not found: public/assets/${file}`);
  }
}

// Copy PWA files (manifest.json, service-worker.js) to dist/
const publicDir = path.join(__dirname, '..', 'public');
const pwaFiles = ['manifest.json', 'service-worker.js', 'robots.txt', 'sitemap.xml', 'llms.txt', 'landing.html', 'indexnow.json', 'fef37dc422ec45c2bdae7c5a0e1f6a8e.txt'];
for (const file of pwaFiles) {
  const src = path.join(publicDir, file);
  const dest = path.join(distDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`✓ Copied public/${file} → dist/${file}`);
  }
}

// Copy blog directory (static SEO articles)
const blogSrcDir = path.join(publicDir, 'blog');
const blogDestDir = path.join(distDir, 'blog');
if (fs.existsSync(blogSrcDir)) {
  if (!fs.existsSync(blogDestDir)) fs.mkdirSync(blogDestDir, { recursive: true });
  const blogFiles = fs.readdirSync(blogSrcDir);
  for (const file of blogFiles) {
    const src = path.join(blogSrcDir, file);
    const dest = path.join(blogDestDir, file);
    if (fs.statSync(src).isFile()) {
      fs.copyFileSync(src, dest);
      console.log(`✓ Copied blog/${file} → dist/blog/${file}`);
    }
  }
  console.log(`✓ Blog: ${blogFiles.length} articles copied`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 4: Inject PWA meta tags into dist/index.html
// ─────────────────────────────────────────────────────────────────────────────
let html = fs.readFileSync(distHtml, 'utf-8');

// Remove Expo-generated duplicates before injecting ours
html = html.replace(/<meta name="theme-color"[^>]*>\n?/g, '');
html = html.replace(/<meta name="description"[^>]*>\n?/g, '');
html = html.replace(/<meta name="keywords"[^>]*>\n?/g, '');
html = html.replace(/<title>[^<]*<\/title>\n?/g, '');

const SITE_URL = 'https://pepete.fr';

const metaTags = `
    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- SEO / GEO / PWA Meta Tags (injected by post-build script)        -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->

    <!-- Fondamentaux SEO -->
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Pépète — Scanner produits animaux, Garde animaux & Assistant IA vétérinaire</title>
    <meta name="description" content="Pépète, l'app n°1 pour vos animaux en France. Scannez les produits alimentaires, trouvez un pet-sitter de confiance près de chez vous, et posez vos questions à notre assistant IA vétérinaire. Chien, chat, NAC — tout pour le bien-être de vos compagnons." />
    <meta name="keywords" content="pépète, pepete, garde animaux, pet sitter, pet-sitting, garde chien, garde chat, scanner produit animal, alimentation animaux, croquettes chien, croquettes chat, assistant vétérinaire IA, santé animaux, bien-être animal, garde animaux France, pet sitter Paris, garde animaux Lyon, garde animaux Marseille, application animaux, app animaux de compagnie, garde NAC, nourriture animaux, vétérinaire en ligne" />
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
    <meta name="author" content="Pépète" />
    <meta name="application-name" content="Pépète" />
    <meta name="theme-color" content="#7B8B6F" />
    <link rel="canonical" href="${SITE_URL}/" />
    <link rel="alternate" hreflang="fr" href="${SITE_URL}/" />
    <link rel="alternate" hreflang="x-default" href="${SITE_URL}/" />

    <!-- GEO Meta Tags (référencement local France) -->
    <meta name="geo.region" content="FR" />
    <meta name="geo.placename" content="France" />
    <meta name="geo.position" content="46.603354;1.888334" />
    <meta name="ICBM" content="46.603354, 1.888334" />
    <meta name="language" content="fr" />
    <meta name="content-language" content="fr-FR" />
    <meta http-equiv="content-language" content="fr-FR" />

    <!-- PWA / Mobile -->
    <link rel="manifest" href="/manifest.json" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="Pépète" />
    <link rel="apple-touch-icon" href="/assets/icon.png" />
    <link rel="icon" type="image/png" sizes="48x48" href="/assets/favicon.png" />
    <link rel="icon" type="image/png" sizes="192x192" href="/assets/icon.png" />

    <!-- Open Graph (Facebook, LinkedIn, WhatsApp, iMessage) -->
    <meta property="og:title" content="Pépète — Scanner produits animaux, Garde & Assistant IA vétérinaire" />
    <meta property="og:description" content="L'app n°1 pour vos animaux : scannez les produits, trouvez un pet-sitter près de chez vous, posez vos questions à l'assistant IA vétérinaire. Chien, chat, NAC." />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${SITE_URL}/" />
    <meta property="og:site_name" content="Pépète" />
    <meta property="og:image" content="${SITE_URL}/assets/og-image.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:alt" content="Pépète — Le compagnon de vos compagnons : scanner produits, garde animaux, assistant IA" />
    <meta property="og:locale" content="fr_FR" />
    <meta property="og:see_also" content="${SITE_URL}/" />

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Pépète — Scanner produits animaux, Garde & Assistant IA" />
    <meta name="twitter:description" content="Scannez les produits, trouvez un pet-sitter, posez vos questions à l'IA vétérinaire. L'app pour chien, chat et NAC." />
    <meta name="twitter:image" content="${SITE_URL}/assets/og-image.png" />
    <meta name="twitter:image:alt" content="Pépète — Le compagnon de vos compagnons" />

    <!-- JSON-LD Structured Data — SoftwareApplication -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Pépète",
      "alternateName": ["Pepete", "Pépète App", "Pepete App"],
      "headline": "Pépète — Le compagnon de vos compagnons",
      "description": "Application mobile et web pour le bien-être de vos animaux de compagnie. Scanner de produits alimentaires, service de garde animaux (pet-sitting) et assistant IA vétérinaire.",
      "url": "${SITE_URL}",
      "applicationCategory": "LifestyleApplication",
      "applicationSubCategory": "PetCare",
      "operatingSystem": "Web, iOS, Android",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "EUR",
        "availability": "https://schema.org/InStock"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "ratingCount": "150",
        "bestRating": "5",
        "worstRating": "1"
      },
      "author": {
        "@type": "Organization",
        "name": "Pépète",
        "url": "${SITE_URL}"
      },
      "image": "${SITE_URL}/assets/og-image.png",
      "screenshot": "${SITE_URL}/assets/og-image.png",
      "inLanguage": "fr-FR",
      "isAccessibleForFree": true,
      "keywords": "garde animaux, pet sitter, scanner produit animal, assistant vétérinaire IA, bien-être animal, garde chien, garde chat"
    }
    </script>

    <!-- JSON-LD Structured Data — LocalBusiness (GEO/Local SEO) -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": "Pépète",
      "description": "Service de garde d'animaux et scanner de produits pour animaux de compagnie, disponible partout en France.",
      "url": "${SITE_URL}",
      "image": "${SITE_URL}/assets/og-image.png",
      "logo": "${SITE_URL}/assets/icon.png",
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "FR",
        "addressRegion": "France"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": "46.603354",
        "longitude": "1.888334"
      },
      "areaServed": {
        "@type": "Country",
        "name": "France"
      },
      "serviceType": ["Garde d'animaux", "Pet-sitting", "Scanner produits animaux", "Conseil vétérinaire IA"],
      "priceRange": "Gratuit",
      "openingHoursSpecification": {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
        "opens": "00:00",
        "closes": "23:59"
      },
      "sameAs": []
    }
    </script>

    <!-- JSON-LD Structured Data — WebApplication -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Pépète",
      "url": "${SITE_URL}",
      "description": "Application web progressive pour le bien-être de vos animaux de compagnie.",
      "applicationCategory": "LifestyleApplication",
      "browserRequirements": "Requires JavaScript. Requires HTML5.",
      "operatingSystem": "All",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "EUR"
      },
      "featureList": [
        "Scanner de produits alimentaires pour animaux",
        "Service de garde d'animaux et pet-sitting",
        "Assistant IA vétérinaire",
        "Compatible chien, chat et NAC",
        "Disponible partout en France"
      ]
    }
    </script>

    <!-- JSON-LD Structured Data — FAQPage (SEO boost) -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Qu'est-ce que Pépète ?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Pépète est une application gratuite pour le bien-être de vos animaux de compagnie. Elle permet de scanner les produits alimentaires pour vérifier leur qualité, de trouver un pet-sitter de confiance près de chez vous, et de poser vos questions à un assistant IA vétérinaire."
          }
        },
        {
          "@type": "Question",
          "name": "Comment scanner un produit pour mon animal ?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Ouvrez l'application Pépète, accédez au scanner, et scannez le code-barres du produit. Pépète analyse instantanément la composition et vous indique si le produit est adapté à votre animal (chien, chat ou NAC)."
          }
        },
        {
          "@type": "Question",
          "name": "Comment trouver un pet-sitter sur Pépète ?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Depuis l'application, accédez à la section Garde. Pépète vous propose des pet-sitters vérifiés et disponibles près de chez vous, partout en France. Vous pouvez consulter leurs profils, avis et tarifs."
          }
        },
        {
          "@type": "Question",
          "name": "L'assistant IA vétérinaire est-il fiable ?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "L'assistant IA de Pépète fournit des conseils généraux sur la santé et le bien-être de vos animaux. Il ne remplace pas une consultation vétérinaire mais peut vous aider à évaluer une situation et vous orienter."
          }
        },
        {
          "@type": "Question",
          "name": "Pépète est-il gratuit ?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Oui, Pépète est entièrement gratuit. Vous pouvez scanner des produits, trouver un pet-sitter et utiliser l'assistant IA sans aucun frais."
          }
        }
      ]
    }
    </script>

    <!-- JSON-LD Structured Data — BreadcrumbList -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Accueil",
          "item": "${SITE_URL}/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Scanner produits",
          "item": "${SITE_URL}/scanner"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "Garde animaux",
          "item": "${SITE_URL}/garde"
        },
        {
          "@type": "ListItem",
          "position": 4,
          "name": "Assistant IA",
          "item": "${SITE_URL}/assistant"
        }
      ]
    }
    </script>

    <!-- JSON-LD Structured Data — Organization -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Pépète",
      "url": "${SITE_URL}",
      "logo": "${SITE_URL}/assets/icon.png",
      "description": "Pépète — Le compagnon de vos compagnons. Application pour le bien-être des animaux de compagnie en France.",
      "foundingDate": "2025",
      "areaServed": "FR",
      "knowsAbout": ["Garde d'animaux", "Pet-sitting", "Alimentation animale", "Santé animale", "Bien-être animal"],
      "sameAs": []
    }
    </script>
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
