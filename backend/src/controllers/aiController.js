const Anthropic = require('@anthropic-ai/sdk');

// Rate limiting en memoire : 10 requetes par utilisateur par heure
const rateLimitMap = new Map();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 heure en ms

function checkRateLimit(userId) {
  const now = Date.now();
  const userKey = userId.toString();

  if (!rateLimitMap.has(userKey)) {
    rateLimitMap.set(userKey, []);
  }

  const timestamps = rateLimitMap.get(userKey);

  // Nettoyer les entrees expirees
  const valid = timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW);
  rateLimitMap.set(userKey, valid);

  if (valid.length >= RATE_LIMIT_MAX) {
    return false;
  }

  valid.push(now);
  return true;
}

const SYSTEM_PROMPT = `Tu es Patoune Assistant, un assistant IA specialise dans les soins aux animaux de compagnie. Tu reponds en francais. Tu donnes des conseils generaux sur la sante, la nutrition et le bien-etre des animaux. IMPORTANT: Tu n'es PAS veterinaire. Pour tout probleme de sante, il faut consulter un veterinaire. Ne pose jamais de diagnostic. Ne prescris jamais de medicament. Tu peux conseiller sur: alimentation, exercice, hygiene, comportement, premiers gestes d'urgence (tout en insistant sur l'urgence veterinaire). Reste concis (max 200 mots). Sois chaleureux et bienveillant.`;

const DISCLAIMER = "Rappel : Je suis un assistant IA, pas un veterinaire. Pour toute urgence ou probleme de sante, consultez un professionnel.";

// ---------------------------------------------------------------------------
// Mode fallback : reponses pre-ecrites quand ANTHROPIC_API_KEY non configuree
// ---------------------------------------------------------------------------
const FALLBACK_RESPONSES = [
  {
    keywords: ['mange plus', 'mange pas', 'appetit', 'alimentation', 'croquette', 'nourriture', 'nourrir', 'repas', 'gamelle'],
    answer: (ctx) =>
      `${ctx}La perte d'appetit peut avoir plusieurs causes : stress, changement de croquettes, chaleur, ou un souci de sante. Voici quelques conseils :\n\n- Verifiez que la nourriture n'est pas perimee et que la gamelle est propre\n- Essayez de tiedir legerement la nourriture pour liberer les aromes\n- Proposez la nourriture a heures fixes et retirez la gamelle apres 20 minutes\n- Evitez de donner trop de friandises entre les repas\n- Assurez-vous que votre animal a acces a de l'eau fraiche\n\nSi la perte d'appetit dure plus de 24h (chien) ou 12h (chat), consultez votre veterinaire car cela peut indiquer un probleme sous-jacent.`
  },
  {
    keywords: ['urgence', 'bless', 'sang', 'empoisonn', 'intoxic', 'avale', 'etouffe', 'accident', 'vomit', 'diarrhee'],
    answer: (ctx) =>
      `${ctx}En cas d'urgence, voici les premiers gestes importants :\n\n- Restez calme pour ne pas stresser davantage votre animal\n- Eloignez la source de danger si possible\n- Ne donnez jamais de medicament humain a un animal\n- En cas de saignement, appliquez une compresse propre avec une pression douce\n- En cas d'ingestion de produit toxique, ne faites PAS vomir votre animal\n\n**Appelez immediatement votre veterinaire ou les urgences veterinaires.** Chaque minute compte. Gardez toujours le numero de votre clinique veterinaire a portee de main.\n\nNumero SOS Veterinaire (France) : consultez votre clinique la plus proche.`
  },
  {
    keywords: ['comportement', 'aboie', 'griffe', 'mord', 'agress', 'peur', 'stress', 'anxie', 'detruit', 'fugue'],
    answer: (ctx) =>
      `${ctx}Les problemes de comportement sont souvent lies au stress, a l'ennui ou a un manque de stimulation. Quelques pistes :\n\n- Assurez-vous que votre animal fait suffisamment d'exercice quotidien\n- Proposez des jouets d'occupation et de reflexion (Kong, puzzles)\n- Etablissez une routine reguliere (repas, promenades, repos)\n- Utilisez le renforcement positif : recompensez les bons comportements\n- Evitez les punitions qui augmentent le stress\n- Creez un espace calme et securisant (panier, couverture)\n\nSi le comportement persiste ou s'aggrave, consultez un educateur canin ou un comportementaliste certifie. Un bilan veterinaire peut aussi reveler une douleur cachee.`
  },
  {
    keywords: ['eduquer', 'chiot', 'chaton', 'proprete', 'dresser', 'apprendre', 'obei', 'rappel', 'laisse'],
    answer: (ctx) =>
      `${ctx}L'education positive est la methode la plus efficace et respectueuse. Voici les bases :\n\n- Commencez des le plus jeune age, mais il n'est jamais trop tard\n- Sessions courtes (5-10 min) plusieurs fois par jour\n- Recompensez immediatement le bon comportement (friandise, caresse, voix joyeuse)\n- Soyez patient et coherent : toute la famille doit appliquer les memes regles\n- Pour la proprete, sortez votre chiot apres chaque repas et reveil\n- Ne grondez jamais un accident decouvert apres coup\n\nLes ordres de base a enseigner en premier : "assis", "couche", "au pied", et le rappel. Utilisez toujours le meme mot pour chaque ordre.`
  },
  {
    keywords: ['toilettage', 'bain', 'poil', 'dent', 'griffe', 'ongle', 'oreille', 'pelage', 'bross'],
    answer: (ctx) =>
      `${ctx}L'hygiene reguliere est essentielle pour la sante de votre animal :\n\n- **Brossage** : 2-3 fois par semaine pour les poils courts, quotidien pour les poils longs\n- **Bain** : tous les 1-3 mois pour les chiens (pas plus souvent), rarement pour les chats\n- **Dents** : brossage 2-3 fois par semaine avec un dentifrice special animal\n- **Oreilles** : nettoyage hebdomadaire avec un produit adapte\n- **Griffes** : coupe mensuelle si elles ne s'usent pas naturellement\n\nUtilisez toujours des produits specifiques pour animaux. Les shampoings humains sont trop agressifs pour leur peau. Si vous n'etes pas a l'aise avec la coupe des griffes, demandez a votre veterinaire ou toiletteur.`
  },
  {
    keywords: ['vaccin', 'vermifuge', 'puce', 'tique', 'parasite', 'steril', 'castre', 'identifi'],
    answer: (ctx) =>
      `${ctx}La prevention est la cle d'une bonne sante animale :\n\n- **Vaccins** : protocole initial (chiot/chaton) puis rappels annuels\n- **Vermifuge** : tous les 3 mois pour les adultes, mensuellement pour les jeunes\n- **Anti-puces/tiques** : traitement regulier, surtout au printemps et en ete\n- **Identification** : puce electronique obligatoire en France\n- **Sterilisation** : recommandee pour la sante et la prevention de portees non desirees\n\nTenez un carnet de sante a jour et respectez le calendrier de vaccination recommande par votre veterinaire. Un bilan annuel permet de detecter precocement d'eventuels problemes.`
  },
  {
    keywords: ['exercice', 'promenade', 'jouer', 'sport', 'courir', 'activ', 'jeu', 'ennui'],
    answer: (ctx) =>
      `${ctx}L'activite physique est cruciale pour le bien-etre de votre animal :\n\n- **Chiens** : minimum 30 min a 2h de promenade par jour selon la race et l'age\n- **Chats** : 15-30 min de jeu interactif quotidien (plumeau, laser, balle)\n- Variez les activites : promenade, jeux de recherche, agilite, natation\n- Adaptez l'intensite a l'age et la condition physique\n- Evitez l'exercice intense juste apres les repas (risque de torsion d'estomac chez les grands chiens)\n\nLes jouets d'intelligence (puzzles alimentaires, Kong fourre) sont excellents pour la stimulation mentale. Un animal qui s'ennuie peut developper des comportements destructeurs.`
  },
];

const FALLBACK_DEFAULT = (ctx) =>
  `${ctx}Merci pour votre question ! Je suis Patoune Assistant, specialise dans les soins aux animaux de compagnie.\n\nJe peux vous aider sur de nombreux sujets :\n- **Alimentation** : choix de croquettes, regime adapte, quantites\n- **Sante** : premiers gestes, prevention, hygiene\n- **Comportement** : education, socialisation, problemes courants\n- **Bien-etre** : exercice, jeux, toilettage\n\nN'hesitez pas a me poser une question precise et je ferai de mon mieux pour vous orienter. Pour tout probleme de sante, je vous recommande toujours de consulter un veterinaire.`;

function getFallbackAnswer(question, petContext) {
  const q = question.toLowerCase();

  // Construire le contexte animal
  let ctx = '';
  if (petContext && petContext.species) {
    const parts = [petContext.species];
    if (petContext.breed) parts.push(petContext.breed);
    ctx = `Pour votre ${parts.join(' ')}`;
    if (petContext.age) ctx += ` de ${petContext.age} ans`;
    if (petContext.weight) ctx += ` (${petContext.weight}kg)`;
    ctx += ', voici mes conseils :\n\n';
  }

  // Chercher la meilleure correspondance par mots-cles
  let bestMatch = null;
  let bestScore = 0;

  for (const entry of FALLBACK_RESPONSES) {
    const score = entry.keywords.filter(kw => q.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = entry;
    }
  }

  if (bestMatch && bestScore > 0) {
    return bestMatch.answer(ctx);
  }

  return FALLBACK_DEFAULT(ctx);
}

// @desc    Poser une question a l'assistant IA
// @route   POST /api/ai/ask
exports.ask = async (req, res, next) => {
  try {
    const { question, petContext } = req.body;

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'La question est requise'
      });
    }

    if (question.trim().length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'La question ne doit pas depasser 1000 caracteres'
      });
    }

    // Verifier le rate limit
    if (!checkRateLimit(req.user.id)) {
      return res.status(429).json({
        success: false,
        error: 'Limite atteinte : 10 questions par heure maximum. Reessayez plus tard.'
      });
    }

    // -----------------------------------------------------------------------
    // Mode fallback : si pas de cle API, utiliser les reponses pre-ecrites
    // -----------------------------------------------------------------------
    if (!process.env.ANTHROPIC_API_KEY) {
      const answer = getFallbackAnswer(question.trim(), petContext);
      return res.json({
        success: true,
        answer,
        disclaimer: DISCLAIMER,
        mode: 'demo'
      });
    }

    // -----------------------------------------------------------------------
    // Mode normal : appel Claude API
    // -----------------------------------------------------------------------
    let userMessage = question.trim();
    if (petContext && petContext.species) {
      const parts = [`Mon animal: ${petContext.species}`];
      if (petContext.breed) parts[0] += ` ${petContext.breed}`;
      if (petContext.age) parts.push(`${petContext.age} ans`);
      if (petContext.weight) parts.push(`${petContext.weight}kg`);
      userMessage = `${parts.join(', ')}. Question: ${userMessage}`;
    }

    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: userMessage }
      ]
    });

    // Extraire la reponse texte
    const answer = message.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n');

    res.json({
      success: true,
      answer,
      disclaimer: DISCLAIMER
    });
  } catch (error) {
    // Gerer les erreurs specifiques de l'API Anthropic
    if (error.status === 401) {
      return res.status(500).json({
        success: false,
        error: 'Erreur de configuration du service IA'
      });
    }
    if (error.status === 429) {
      return res.status(503).json({
        success: false,
        error: 'Le service IA est temporairement surcharge. Reessayez dans quelques instants.'
      });
    }
    next(error);
  }
};
