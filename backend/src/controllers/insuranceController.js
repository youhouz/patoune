// ---------------------------------------------------------------------------
// Comparateur d'assurance animale (affiliation). Chaque clic sur "Obtenir un
// devis" est trace puis redirige vers l'URL partenaire avec un tag UTM.
// Revenu : 30-60 EUR par souscription confirmee via le partenaire.
// ---------------------------------------------------------------------------

const InsuranceClick = require('../models/InsuranceClick');

// Partenaires statiques. Les URLs peuvent etre surchargees par env (AFFIL_URL_*)
// pour ne pas exposer les liens d'affiliation en dur dans le code public.
function buildPartners() {
  return [
    {
      id: 'santevet',
      name: 'SantéVet',
      tagline: 'Le leader français de l\'assurance animale',
      pricingFrom: 7.90,
      highlights: ['Jusqu\'a 100% rembourse', 'Sans delai de carence accident', 'Teleconsultation veto incluse'],
      animals: ['chien', 'chat'],
      logo: null,
      affiliateUrl: process.env.AFFIL_URL_SANTEVET || 'https://santevet.com/?utm_source=pepete&utm_medium=app',
      commission: 'Jusqu\'a 45 EUR / souscription',
    },
    {
      id: 'dalma',
      name: 'Dalma',
      tagline: 'L\'assurance nouvelle generation',
      pricingFrom: 9.90,
      highlights: ['100% digital', 'Remboursement en 48h', 'Prevention incluse'],
      animals: ['chien', 'chat'],
      logo: null,
      affiliateUrl: process.env.AFFIL_URL_DALMA || 'https://www.dalma.co/?utm_source=pepete&utm_medium=app',
      commission: 'Jusqu\'a 55 EUR / souscription',
    },
    {
      id: 'bullebleue',
      name: 'Bulle Bleue',
      tagline: 'L\'assurance claire et humaine',
      pricingFrom: 8.50,
      highlights: ['Formules sur mesure', 'Accompagnement personnalise', 'Prise en charge prevention'],
      animals: ['chien', 'chat', 'nac'],
      logo: null,
      affiliateUrl: process.env.AFFIL_URL_BULLEBLEUE || 'https://www.bullebleue.fr/?utm_source=pepete&utm_medium=app',
      commission: 'Jusqu\'a 40 EUR / souscription',
    },
  ];
}

function publicPartner(p) {
  const { commission, affiliateUrl, ...publicFields } = p;
  return publicFields;
}

// @desc    Lister les partenaires (sans URLs d'affiliation)
// @route   GET /api/insurance/partners
exports.listPartners = async (req, res) => {
  const partners = buildPartners().map(publicPartner);
  res.json({ success: true, partners });
};

// @desc    Tracer un clic + renvoyer l'URL affiliee
// @route   POST /api/insurance/click  { partner, animalSpecies?, animalAge?, source? }
exports.trackClick = async (req, res, next) => {
  try {
    const { partner, animalSpecies, animalAge, source } = req.body || {};
    const found = buildPartners().find(p => p.id === partner);
    if (!found) return res.status(404).json({ success: false, error: 'Partenaire inconnu' });

    await InsuranceClick.create({
      user: req.user ? req.user.id : null,
      partner: found.id,
      source: source || 'app',
      animalSpecies: animalSpecies || '',
      animalAge: typeof animalAge === 'number' ? animalAge : null,
      ip: req.ip || '',
    });

    res.json({ success: true, url: found.affiliateUrl });
  } catch (err) {
    next(err);
  }
};
