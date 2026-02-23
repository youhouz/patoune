const Anthropic = require('@anthropic-ai/sdk');

// Rate limiting en mémoire : 10 requêtes par utilisateur par heure
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

  // Nettoyer les entrées expirées
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

// @desc    Poser une question à l'assistant IA
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

    // Vérifier le rate limit
    if (!checkRateLimit(req.user.id)) {
      return res.status(429).json({
        success: false,
        error: 'Limite atteinte : 10 questions par heure maximum. Reessayez plus tard.'
      });
    }

    // Construire le message utilisateur avec contexte animal si fourni
    let userMessage = question.trim();
    if (petContext && petContext.species) {
      const parts = [`Mon animal: ${petContext.species}`];
      if (petContext.breed) parts[0] += ` ${petContext.breed}`;
      if (petContext.age) parts.push(`${petContext.age} ans`);
      if (petContext.weight) parts.push(`${petContext.weight}kg`);
      userMessage = `${parts.join(', ')}. Question: ${userMessage}`;
    }

    // Appel à l'API Anthropic
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

    // Extraire la réponse texte
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
    // Gérer les erreurs spécifiques de l'API Anthropic
    if (error.status === 401) {
      return res.status(500).json({
        success: false,
        error: 'Erreur de configuration du service IA'
      });
    }
    if (error.status === 429) {
      return res.status(503).json({
        success: false,
        error: 'Le service IA est temporairement surchargé. Reessayez dans quelques instants.'
      });
    }
    next(error);
  }
};
