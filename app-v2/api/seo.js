// ═══════════════════════════════════════════════════════════════════════════════
// Pepete — Vercel Serverless SEO Engine
// Generates crawlable HTML pages from MongoDB product data
// Routes: /produit/:barcode, /marque/:brand, /croquettes-:animal,
//         /classement/:animal, /ingredients-dangereux, /sitemap*.xml
// ═══════════════════════════════════════════════════════════════════════════════

const SITE = 'https://pepete.fr';
const API = process.env.EXPO_PUBLIC_API_URL || 'https://pepete-fr.vercel.app/api';

// ─── Fetch helper ────────────────────────────────────────────────────────────
async function api(path) {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) return null;
  return res.json();
}

// ─── HTML helpers ────────────────────────────────────────────────────────────
const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const SCORE_COLORS = { excellent: '#2E7D32', bon: '#558B2F', moyen: '#F9A825', mediocre: '#E65100', mauvais: '#C62828' };
function getScoreInfo(score) {
  if (score >= 80) return { label: 'Excellent', color: SCORE_COLORS.excellent, emoji: '🟢' };
  if (score >= 60) return { label: 'Bon', color: SCORE_COLORS.bon, emoji: '🟡' };
  if (score >= 40) return { label: 'Moyen', color: SCORE_COLORS.moyen, emoji: '🟠' };
  if (score >= 20) return { label: 'Mediocre', color: SCORE_COLORS.mediocre, emoji: '🟠' };
  return { label: 'Mauvais', color: SCORE_COLORS.mauvais, emoji: '🔴' };
}

const ANIMAL_LABELS = { chien: 'Chien', chat: 'Chat', rongeur: 'Rongeur', oiseau: 'Oiseau', reptile: 'Reptile', poisson: 'Poisson' };
const ANIMAL_EMOJI = { chien: '🐶', chat: '🐱', rongeur: '🐹', oiseau: '🐦', reptile: '🦎', poisson: '🐟' };

// ─── Shared CSS ──────────────────────────────────────────────────────────────
const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#FAFAF5;color:#2C2825;line-height:1.7;-webkit-font-smoothing:antialiased}
a{color:#527A56;text-decoration:none}a:hover{text-decoration:underline}
.container{max-width:760px;margin:0 auto;padding:0 20px}
header{background:linear-gradient(135deg,#1C2B1E,#2C3E2F,#3D5E41);color:#fff;padding:20px 0;border-bottom:3px solid #527A56}
header .container{display:flex;justify-content:space-between;align-items:center}
.logo{font-size:1.4rem;font-weight:700;color:#fff}.logo span{color:#8CB092}
.nav-links{display:flex;gap:16px}.nav-links a{color:rgba(255,255,255,.8);font-size:.9rem}
.hero{text-align:center;padding:48px 20px 32px}
.hero h1{font-size:2rem;font-weight:800;letter-spacing:-.5px;margin-bottom:8px}
.hero p{font-size:1.1rem;color:#6B6B6B;max-width:600px;margin:0 auto}
.card{background:#fff;border-radius:16px;padding:24px;margin-bottom:20px;box-shadow:0 1px 3px rgba(0,0,0,.06)}
.score-big{display:inline-flex;align-items:center;justify-content:center;width:100px;height:100px;border-radius:50%;font-size:2.4rem;font-weight:900;color:#fff;margin:16px auto;display:flex}
.badge{display:inline-block;padding:4px 12px;border-radius:20px;font-size:.8rem;font-weight:600}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px}
.product-card{background:#fff;border-radius:12px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,.06);transition:transform .15s}
.product-card:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,.1)}
.product-card h3{font-size:.95rem;font-weight:600;margin-bottom:4px}
.product-card .brand{font-size:.8rem;color:#888}
.product-card .score{font-size:1.3rem;font-weight:800;margin-top:8px}
.ingredient-list{list-style:none;padding:0}.ingredient-list li{padding:6px 0;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;gap:8px}
.risk-dot{width:8px;height:8px;border-radius:4px;flex-shrink:0}
.cta-section{text-align:center;padding:40px 20px;background:linear-gradient(135deg,#527A56,#6B8F71);border-radius:16px;margin:32px 0;color:#fff}
.cta-section h2{font-size:1.6rem;margin-bottom:8px}
.cta-btn{display:inline-block;background:#fff;color:#527A56;padding:14px 32px;border-radius:12px;font-weight:700;font-size:1rem;margin-top:16px;text-decoration:none}
footer{background:#1C2B1E;color:rgba(255,255,255,.7);padding:32px 0;margin-top:48px}
footer .container{display:flex;flex-wrap:wrap;gap:24px;justify-content:center}
footer a{color:rgba(255,255,255,.6);font-size:.85rem}footer a:hover{color:#fff}
.breadcrumb{font-size:.85rem;color:#888;margin-bottom:16px}
.breadcrumb a{color:#527A56}
@media(max-width:600px){.hero h1{font-size:1.5rem}.grid{grid-template-columns:1fr}}
`;

function layout(title, description, url, content, jsonLd = [], breadcrumbs = []) {
  const bcMarkup = breadcrumbs.length > 0
    ? `<nav class="breadcrumb">${breadcrumbs.map((b, i) => i < breadcrumbs.length - 1 ? `<a href="${esc(b.url)}">${esc(b.name)}</a> &rsaquo; ` : `<span>${esc(b.name)}</span>`).join('')}</nav>`
    : '';

  const bcJsonLd = breadcrumbs.length > 0 ? JSON.stringify({
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((b, i) => ({ '@type': 'ListItem', position: i + 1, name: b.name, ...(b.url ? { item: b.url } : {}) })),
  }) : null;

  const allJsonLd = [...jsonLd, ...(bcJsonLd ? [bcJsonLd] : [])];

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
<link rel="canonical" href="${esc(url)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Pepete">
<meta property="og:locale" content="fr_FR">
<meta property="og:image" content="${SITE}/assets/og-image.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="geo.region" content="FR">
<meta name="geo.placename" content="France">
<meta name="language" content="fr">
<link rel="icon" type="image/png" href="/assets/favicon.png">
${allJsonLd.map(j => `<script type="application/ld+json">${typeof j === 'string' ? j : JSON.stringify(j)}</script>`).join('\n')}
<style>${CSS}</style>
</head>
<body>
<header><div class="container">
<a href="/" class="logo">pepete<span>.</span></a>
<nav class="nav-links">
<a href="/croquettes-chien">Chien</a>
<a href="/croquettes-chat">Chat</a>
<a href="/blog/">Blog</a>
<a href="/">Scanner</a>
</nav>
</div></header>
<main class="container" style="padding-top:24px">
${bcMarkup}
${content}
<div class="cta-section">
<h2>Scannez les croquettes de votre animal</h2>
<p>Pepete analyse gratuitement la composition et vous donne un score de qualite instantane.</p>
<a href="/" class="cta-btn">Scanner gratuitement</a>
</div>
</main>
<footer><div class="container">
<a href="/">Accueil</a>
<a href="/croquettes-chien">Croquettes Chien</a>
<a href="/croquettes-chat">Croquettes Chat</a>
<a href="/croquettes-rongeur">Rongeur</a>
<a href="/blog/">Blog</a>
<a href="/blog/scanner-croquettes-chien-chat.html">Guide Scanner</a>
<a href="/blog/ingredients-dangereux-croquettes.html">Ingredients Dangereux</a>
<a href="/ingredients-dangereux">Top Additifs a Eviter</a>
</div></footer>
</body>
</html>`;
}

function productCard(p) {
  const s = p.nutritionScore ?? 0;
  const info = getScoreInfo(s);
  return `<a href="/produit/${esc(p.barcode)}" class="product-card">
<h3>${esc(p.name)}</h3>
<span class="brand">${esc(p.brand)}</span>
<div class="score" style="color:${info.color}">${info.emoji} ${s}/100</div>
<span class="badge" style="background:${info.color}15;color:${info.color}">${info.label}</span>
</a>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Page Generators
// ═══════════════════════════════════════════════════════════════════════════════

async function productPage(barcode) {
  const data = await api(`/products/public/${barcode}`);
  if (!data?.product) return null;
  const p = data.product;
  const score = p.nutritionScore ?? 0;
  const info = getScoreInfo(score);
  const brandText = p.brand ? ` de ${p.brand}` : '';
  const animals = (p.targetAnimal || []).map(a => ANIMAL_LABELS[a] || a).join(', ');
  const animalsForUrl = (p.targetAnimal || [])[0] || '';
  const dangerous = (p.dangerousIngredients || []);
  const ingredients = p.ingredients || [];

  const title = `${p.name}${brandText} — Score ${score}/100 | Avis Pepete`;
  const desc = `Analyse de ${p.name}${brandText}${animals ? ` pour ${animals}` : ''}. Score Pepete : ${score}/100. ${ingredients.length} ingredients${dangerous.length > 0 ? `, ${dangerous.length} a risque` : ''}. Scannez vos croquettes gratuitement.`;
  const url = `${SITE}/produit/${barcode}`;

  const breadcrumbs = [
    { name: 'Accueil', url: SITE },
    ...(animalsForUrl ? [{ name: `Croquettes ${ANIMAL_LABELS[animalsForUrl] || animalsForUrl}`, url: `${SITE}/croquettes-${animalsForUrl}` }] : []),
    ...(p.brand ? [{ name: p.brand, url: `${SITE}/marque/${encodeURIComponent(p.brand.toLowerCase().replace(/\s+/g, '-'))}` }] : []),
    { name: p.name },
  ];

  const jsonLd = [
    {
      '@context': 'https://schema.org', '@type': 'Product', name: p.name,
      brand: p.brand ? { '@type': 'Brand', name: p.brand } : undefined,
      image: p.image || `${SITE}/assets/og-image.png`,
      description: desc,
      category: p.category || 'alimentation',
      review: { '@type': 'Review', author: { '@type': 'Organization', name: 'Pepete' }, reviewRating: { '@type': 'Rating', ratingValue: score, bestRating: 100, worstRating: 0 }, reviewBody: `Score Pepete : ${info.label} (${score}/100)` },
    },
    {
      '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: [
        { '@type': 'Question', name: `${p.name} est-il un bon produit pour mon ${animalsForUrl || 'animal'} ?`, acceptedAnswer: { '@type': 'Answer', text: `${p.name}${brandText} obtient un score de ${score}/100 sur Pepete (${info.label}). ${score >= 60 ? 'Ce produit est de bonne qualite.' : 'Ce produit pourrait etre ameliore.'} ${dangerous.length > 0 ? `Attention : ${dangerous.length} ingredient(s) a risque detecte(s).` : 'Aucun ingredient dangereux detecte.'}` } },
        { '@type': 'Question', name: `Quelle est la composition de ${p.name} ?`, acceptedAnswer: { '@type': 'Answer', text: `${p.name} contient ${ingredients.length} ingredients analyses par Pepete. ${dangerous.length > 0 ? `Parmi eux, ${dangerous.length} sont consideres comme potentiellement dangereux : ${dangerous.map(d => d.name).join(', ')}.` : 'Tous les ingredients sont consideres comme surs.'}` } },
      ],
    },
  ];

  const ingredientsList = ingredients.length > 0
    ? `<div class="card"><h2 style="margin-bottom:16px">Ingredients (${ingredients.length})</h2>
<ul class="ingredient-list">${ingredients.map(i => {
  const color = i.risk === 'dangerous' ? '#C62828' : i.risk === 'moderate' ? '#E65100' : '#2E7D32';
  return `<li><span class="risk-dot" style="background:${color}"></span><span>${esc(i.name)}</span><span class="badge" style="background:${color}15;color:${color};margin-left:auto">${i.risk === 'dangerous' ? 'Dangereux' : i.risk === 'moderate' ? 'Modere' : 'OK'}</span></li>`;
}).join('')}</ul></div>` : '';

  const content = `
<div class="hero">
<h1>${info.emoji} ${esc(p.name)}</h1>
<p>${esc(p.brand || '')}${animals ? ` — Pour ${animals}` : ''}</p>
</div>

<div class="card" style="text-align:center">
<div class="score-big" style="background:${info.color}">${score}</div>
<div><span class="badge" style="background:${info.color}15;color:${info.color};font-size:1.1rem">${info.label}</span></div>
<p style="margin-top:12px;color:#888">Score sur 100 — analyse par IA Pepete</p>
${p.scanCount ? `<p style="margin-top:8px;font-size:.9rem;color:#888">Scanne ${p.scanCount} fois par la communaute</p>` : ''}
</div>

${dangerous.length > 0 ? `<div class="card" style="border-left:4px solid #C62828">
<h2 style="color:#C62828;margin-bottom:12px">⚠️ ${dangerous.length} ingredient${dangerous.length > 1 ? 's' : ''} a risque</h2>
${dangerous.map(d => `<div style="margin-bottom:8px"><strong>${esc(d.name)}</strong>${d.description ? `<br><span style="color:#666;font-size:.9rem">${esc(d.description)}</span>` : ''}</div>`).join('')}
</div>` : ''}

${ingredientsList}

${p.brand ? `<div class="card"><h2>Autres produits ${esc(p.brand)}</h2><p style="margin-top:8px"><a href="/marque/${encodeURIComponent(p.brand.toLowerCase().replace(/\s+/g, '-'))}">Voir tous les produits ${esc(p.brand)} →</a></p></div>` : ''}
`;

  return layout(title, desc, url, content, jsonLd, breadcrumbs);
}

async function brandPage(brandSlug) {
  const data = await api(`/products/brand/${encodeURIComponent(brandSlug)}`);
  if (!data?.products) return null;

  const brand = data.brand;
  const products = data.products;
  const avg = data.avgScore;
  const info = getScoreInfo(avg);
  const title = `${brand} — Analyse et classement des croquettes | Pepete`;
  const desc = `Tous les produits ${brand} analyses par Pepete. Score moyen : ${avg}/100. ${products.length} produits testes. Decouvrez les meilleurs et les pires.`;
  const url = `${SITE}/marque/${brandSlug}`;

  const breadcrumbs = [{ name: 'Accueil', url: SITE }, { name: brand }];
  const jsonLd = [{
    '@context': 'https://schema.org', '@type': 'ItemList', name: `Produits ${brand}`,
    numberOfItems: products.length,
    itemListElement: products.slice(0, 20).map((p, i) => ({
      '@type': 'ListItem', position: i + 1, name: p.name,
      url: `${SITE}/produit/${p.barcode}`,
    })),
  }];

  const content = `
<div class="hero">
<h1>${esc(brand)}</h1>
<p>Score moyen : <strong style="color:${info.color}">${avg}/100</strong> — ${products.length} produits analyses</p>
</div>
<div class="card" style="text-align:center;margin-bottom:24px">
<div class="score-big" style="background:${info.color}">${avg}</div>
<p style="color:#888">Score moyen de la marque</p>
</div>
<h2 style="margin-bottom:16px">${products.length} produits ${esc(brand)}</h2>
<div class="grid">${products.map(productCard).join('')}</div>
`;

  return layout(title, desc, url, content, jsonLd, breadcrumbs);
}

async function animalPage(animal) {
  const data = await api(`/products/animal/${animal}`);
  if (!data) return null;

  const label = ANIMAL_LABELS[animal] || animal;
  const emoji = ANIMAL_EMOJI[animal] || '🐾';
  const title = `Meilleures croquettes ${label} 2026 — Classement Pepete`;
  const desc = `Classement des meilleures croquettes pour ${label} en 2026. ${data.totalCount} produits analyses par notre IA. Top des meilleurs produits + ceux a eviter absolument.`;
  const url = `${SITE}/croquettes-${animal}`;

  const breadcrumbs = [{ name: 'Accueil', url: SITE }, { name: `Croquettes ${label}` }];
  const jsonLd = [{
    '@context': 'https://schema.org', '@type': 'ItemList', name: `Meilleures croquettes ${label}`,
    numberOfItems: data.topProducts.length,
    itemListElement: data.topProducts.slice(0, 10).map((p, i) => ({
      '@type': 'ListItem', position: i + 1, name: p.name, url: `${SITE}/produit/${p.barcode}`,
    })),
  }];

  const content = `
<div class="hero">
<h1>${emoji} Meilleures croquettes ${esc(label)} 2026</h1>
<p>${data.totalCount} produits pour ${esc(label)} analyses par Pepete</p>
</div>

<h2 style="margin-bottom:16px;color:#2E7D32">🏆 Top ${Math.min(data.topProducts.length, 20)} — Les meilleurs</h2>
<div class="grid">${data.topProducts.slice(0, 20).map(productCard).join('')}</div>

${data.worstProducts.length > 0 ? `
<h2 style="margin:32px 0 16px;color:#C62828">⚠️ A eviter — Les pires produits</h2>
<div class="grid">${data.worstProducts.map(productCard).join('')}</div>
` : ''}

<div class="card" style="margin-top:32px">
<h2>Voir aussi</h2>
<ul style="margin-top:12px;list-style:none;padding:0">
${Object.keys(ANIMAL_LABELS).filter(a => a !== animal).map(a => `<li style="margin-bottom:8px"><a href="/croquettes-${a}">${ANIMAL_EMOJI[a]} Croquettes ${ANIMAL_LABELS[a]}</a></li>`).join('')}
</ul>
</div>
`;

  return layout(title, desc, url, content, jsonLd, breadcrumbs);
}

async function comparatifPage(slug) {
  // slug format: "barcode1-vs-barcode2"
  const match = String(slug || '').match(/^(\d+)-vs-(\d+)$/);
  if (!match) return null;
  const [, b1, b2] = match;

  const [d1, d2] = await Promise.all([
    api(`/products/public/${b1}`),
    api(`/products/public/${b2}`),
  ]);
  if (!d1?.product || !d2?.product) return null;

  const p1 = d1.product;
  const p2 = d2.product;
  const s1 = p1.nutritionScore ?? 0;
  const s2 = p2.nutritionScore ?? 0;
  const i1 = getScoreInfo(s1);
  const i2 = getScoreInfo(s2);
  const winner = s1 === s2 ? null : (s1 > s2 ? p1 : p2);
  const winnerScore = s1 === s2 ? s1 : Math.max(s1, s2);

  const title = `${p1.name} vs ${p2.name} — Comparatif Pepete`;
  const desc = `Comparatif detaille entre ${p1.name} (${s1}/100) et ${p2.name} (${s2}/100). ${winner ? `${winner.name} l'emporte avec ${winnerScore}/100.` : 'Match nul.'} Analyse IA des ingredients.`;
  const url = `${SITE}/comparatif/${slug}`;

  const breadcrumbs = [
    { name: 'Accueil', url: SITE },
    { name: 'Comparatifs', url: `${SITE}/blog/comparatif-croquettes-chien-premium.html` },
    { name: `${p1.name} vs ${p2.name}` },
  ];

  const jsonLd = [{
    '@context': 'https://schema.org', '@type': 'Article',
    headline: title, description: desc,
    author: { '@type': 'Organization', name: 'Pepete' },
    publisher: { '@type': 'Organization', name: 'Pepete', url: SITE },
    datePublished: new Date().toISOString().split('T')[0],
    dateModified: new Date().toISOString().split('T')[0],
  }];

  const renderCol = (p, s, info) => {
    const dangerous = (p.dangerousIngredients || []).length;
    return `<div class="card" style="text-align:center">
<h2 style="font-size:1.1rem;margin-bottom:8px"><a href="/produit/${esc(p.barcode)}">${esc(p.name)}</a></h2>
<p style="color:#888;font-size:.9rem;margin-bottom:12px">${esc(p.brand || '')}</p>
<div class="score-big" style="background:${info.color}">${s}</div>
<div><span class="badge" style="background:${info.color}15;color:${info.color}">${info.label}</span></div>
<p style="margin-top:12px;font-size:.85rem;color:#666">${(p.ingredients || []).length} ingredients · ${dangerous} a risque</p>
</div>`;
  };

  const content = `
<div class="hero">
<h1>⚔️ ${esc(p1.name)} vs ${esc(p2.name)}</h1>
<p>Comparatif Pepete — Lequel choisir ?</p>
</div>

<div class="grid" style="grid-template-columns:1fr 1fr;gap:20px">
${renderCol(p1, s1, i1)}
${renderCol(p2, s2, i2)}
</div>

<div class="card" style="text-align:center;margin-top:24px;border-left:4px solid ${winner ? getScoreInfo(winnerScore).color : '#888'}">
<h2 style="margin-bottom:8px">${winner ? `🏆 ${esc(winner.name)} gagne` : '🤝 Match nul'}</h2>
<p style="color:#666">${winner ? `Avec un score de ${winnerScore}/100, ${esc(winner.name)} obtient une meilleure note Pepete.` : `Les deux produits obtiennent le meme score de ${s1}/100.`}</p>
</div>

<div class="card">
<h2>Comment Pepete compare les croquettes ?</h2>
<p style="margin-top:12px">Notre IA analyse chaque ingredient sur des criteres scientifiques : qualite des proteines, presence d'additifs dangereux, taux de cereales, sources animales identifiees, et conformite aux besoins nutritionnels de l'animal cible.</p>
<p style="margin-top:8px"><a href="/">Scannez vos propres croquettes</a> pour obtenir un score instantane.</p>
</div>
`;

  return layout(title, desc, url, content, jsonLd, breadcrumbs);
}

async function dangerousPage() {
  const data = await api('/products/dangerous-ingredients');
  if (!data) return null;

  const title = 'Ingredients dangereux dans les croquettes — Guide Pepete 2026';
  const desc = `Les ${data.count} ingredients les plus dangereux trouves dans les croquettes pour animaux. Apprenez a les reconnaitre et protegez votre animal.`;
  const url = `${SITE}/ingredients-dangereux`;

  const breadcrumbs = [{ name: 'Accueil', url: SITE }, { name: 'Ingredients dangereux' }];
  const jsonLd = [{
    '@context': 'https://schema.org', '@type': 'Article',
    headline: title, description: desc, author: { '@type': 'Organization', name: 'Pepete' },
    publisher: { '@type': 'Organization', name: 'Pepete', url: SITE },
    datePublished: '2026-04-01', dateModified: new Date().toISOString().split('T')[0],
  }];

  const content = `
<div class="hero">
<h1>⚠️ Ingredients dangereux dans les croquettes</h1>
<p>Les additifs et ingredients les plus frequemment detectes comme dangereux par Pepete</p>
</div>
<div class="card">
<table style="width:100%;border-collapse:collapse">
<thead><tr><th style="text-align:left;padding:8px;border-bottom:2px solid #eee">Ingredient</th><th style="text-align:right;padding:8px;border-bottom:2px solid #eee">Produits concernes</th></tr></thead>
<tbody>
${(data.ingredients || []).map((ing, i) => `<tr style="background:${i % 2 === 0 ? '#fff' : '#fafafa'}"><td style="padding:8px;border-bottom:1px solid #f0f0f0"><span style="color:#C62828;font-weight:600">${esc(ing.name)}</span></td><td style="text-align:right;padding:8px;border-bottom:1px solid #f0f0f0">${ing.count}</td></tr>`).join('')}
</tbody>
</table>
</div>
<div class="card">
<h2>Comment eviter ces ingredients ?</h2>
<p style="margin-top:12px">Utilisez le <a href="/">scanner Pepete</a> pour verifier instantanement la composition des croquettes de votre animal. L'IA analyse chaque ingredient et vous alerte en cas de danger.</p>
<p style="margin-top:8px">Consultez aussi notre <a href="/blog/ingredients-dangereux-croquettes.html">guide complet des ingredients dangereux</a>.</p>
</div>
`;

  return layout(title, desc, url, content, jsonLd, breadcrumbs);
}

// ─── Sitemaps ────────────────────────────────────────────────────────────────

async function sitemapIndex() {
  const data = await api('/products/sitemap-data?page=1');
  const totalPages = data?.totalPages || 1;

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  xml += `<sitemap><loc>${SITE}/sitemap-pages.xml</loc></sitemap>\n`;
  for (let i = 1; i <= totalPages; i++) {
    xml += `<sitemap><loc>${SITE}/sitemap-products-${i}.xml</loc></sitemap>\n`;
  }
  xml += `<sitemap><loc>${SITE}/sitemap-brands.xml</loc></sitemap>\n`;
  xml += `</sitemapindex>`;
  return xml;
}

async function sitemapPages() {
  const today = new Date().toISOString().split('T')[0];
  const animals = ['chien', 'chat', 'rongeur', 'oiseau', 'reptile', 'poisson'];
  const blogArticles = [
    'scanner-croquettes-chien-chat',
    'trouver-pet-sitter-confiance',
    'assistant-ia-veterinaire',
    'ingredients-dangereux-croquettes',
    'meilleures-croquettes-chien-2026',
    'meilleures-croquettes-chat-2026',
    'royal-canin-avis-test',
    'purina-pro-plan-avis',
    'croquettes-sans-cereales-chien',
    'comparatif-croquettes-chien-premium',
    'alimentation-chiot-guide',
    'additifs-dangereux-croquettes',
  ];
  const pages = [
    { loc: '/', priority: '1.0', freq: 'daily' },
    { loc: '/scanner', priority: '0.9', freq: 'weekly' },
    { loc: '/garde', priority: '0.9', freq: 'weekly' },
    { loc: '/assistant', priority: '0.8', freq: 'weekly' },
    { loc: '/blog/', priority: '0.8', freq: 'weekly' },
    { loc: '/ingredients-dangereux', priority: '0.7', freq: 'weekly' },
    ...animals.map(a => ({ loc: `/croquettes-${a}`, priority: '0.8', freq: 'weekly' })),
    ...animals.map(a => ({ loc: `/classement/${a}`, priority: '0.7', freq: 'weekly' })),
    ...blogArticles.map(a => ({ loc: `/blog/${a}.html`, priority: '0.7', freq: 'monthly' })),
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  for (const p of pages) {
    xml += `<url><loc>${SITE}${p.loc}</loc><lastmod>${today}</lastmod><changefreq>${p.freq}</changefreq><priority>${p.priority}</priority></url>\n`;
  }
  xml += `</urlset>`;
  return xml;
}

async function sitemapProducts(page) {
  const data = await api(`/products/sitemap-data?page=${page}`);
  if (!data?.products) return null;

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  for (const p of data.products) {
    xml += `<url><loc>${SITE}/produit/${p.barcode}</loc><lastmod>${p.lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.6</priority></url>\n`;
  }
  xml += `</urlset>`;
  return xml;
}

async function sitemapBrands() {
  const data = await api('/products/brands');
  if (!data?.brands) return null;
  const today = new Date().toISOString().split('T')[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  for (const b of data.brands) {
    const slug = b.brand.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    xml += `<url><loc>${SITE}/marque/${slug}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>\n`;
  }
  xml += `</urlset>`;
  return xml;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Vercel Handler
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = async (req, res) => {
  const { type } = req.query;

  try {
    let html = null;
    let isXml = false;

    switch (type) {
      case 'product': {
        html = await productPage(req.query.barcode);
        break;
      }
      case 'brand': {
        html = await brandPage(req.query.brand);
        break;
      }
      case 'animal': {
        html = await animalPage(req.query.animal);
        break;
      }
      case 'ranking': {
        // Ranking is same as animal page
        html = await animalPage(req.query.animal);
        break;
      }
      case 'dangerous': {
        html = await dangerousPage();
        break;
      }
      case 'comparatif': {
        html = await comparatifPage(req.query.slug);
        break;
      }
      case 'sitemap-index': {
        html = await sitemapIndex();
        isXml = true;
        break;
      }
      case 'sitemap-pages': {
        html = await sitemapPages();
        isXml = true;
        break;
      }
      case 'sitemap-products': {
        html = await sitemapProducts(req.query.page || '1');
        isXml = true;
        break;
      }
      case 'sitemap-brands': {
        html = await sitemapBrands();
        isXml = true;
        break;
      }
      default:
        return res.status(400).send('Invalid type');
    }

    if (!html) {
      res.setHeader('Cache-Control', 'public, s-maxage=60');
      return res.status(404).send(layout(
        'Page non trouvee — Pepete',
        'La page que vous cherchez n\'existe pas.',
        SITE,
        '<div class="hero"><h1>404 — Page non trouvee</h1><p>Ce produit n\'existe pas encore dans notre base. <a href="/">Scannez-le pour l\'ajouter !</a></p></div>',
      ));
    }

    if (isXml) {
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    } else {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
    }
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).send(html);
  } catch (err) {
    console.error('SEO Error:', err);
    res.setHeader('Cache-Control', 'public, s-maxage=60');
    return res.status(500).send('Internal Error');
  }
};
