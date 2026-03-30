import { NextRequest, NextResponse } from "next/server";
import { callClaude, isAnthropicConfigured } from "@/lib/anthropic";
import { verifyAuthToken } from "@/lib/auth";

// Rate limiting per agent execution
const executionLog = new Map<string, { count: number; windowStart: number }>();
const MAX_EXECUTIONS_PER_HOUR = 20;
const WINDOW_MS = 60 * 60 * 1000;

function checkExecutionRate(ip: string): boolean {
  const now = Date.now();
  const record = executionLog.get(ip);
  if (!record || now - record.windowStart > WINDOW_MS) {
    executionLog.set(ip, { count: 1, windowStart: now });
    return true;
  }
  if (record.count >= MAX_EXECUTIONS_PER_HOUR) return false;
  record.count += 1;
  return true;
}

// Strict whitelist
const VALID_AGENT_IDS = new Set([
  "analyst", "email_campaign", "influencer_email", "article_writer",
  "directory_submit", "forum_commenter", "backlink_builder", "review_booster",
  "content_tiktok", "content_insta", "social_commenter", "press_release",
]);

const PEPETE = `
APP: Pepete (pepete.fr)
SLOGAN: "Le compagnon de vos compagnons"
DESCRIPTION: Application tout-en-un pour proprietaires d'animaux en France.
3 FONCTIONNALITES CLES:
1. SCANNER CROQUETTES: Scanne le code-barres, analyse les ingredients, score nutritionnel 0-100, detecte les additifs dangereux. 50 000+ produits.
2. GARDE ANIMAUX: Marketplace de pet-sitters verifies. Reservation, messagerie, paiement. Garde a domicile, promenade, toilettage.
3. ASSISTANT IA VETERINAIRE: Questions sante/nutrition/comportement. Reponses instantanees 24/7 par animal.
PUBLIC: Proprietaires d'animaux 18-35 ans, France, urbains, connectes.
CONCURRENTS: Rover (garde uniquement), Wamiz (media), Emprunte Mon Toutou (garde), Animaute (garde).
AVANTAGE: SEULE app qui combine scanner + garde + IA veterinaire.
URL: https://pepete.fr
COULEURS: Vert sauge #527A56, creme #FAF6EE
`;

const PROMPTS: Record<string, { system: string; user: string }> = {
  analyst: {
    system: "Tu es un growth strategist senior. Analyse en francais. Sois concret et actionnable.",
    user: `${PEPETE}\n\nFais une analyse COMPLETE:\n1. SWOT de Pepete\n2. 5 personas utilisateurs detailles\n3. Les 10 canaux de croissance par priorite\n4. Benchmark concurrents (features, prix, audience)\n5. 20 hooks viraux specifiques a Pepete\n6. Strategie de pricing recommandee\n7. Les 5 actions a lancer CETTE SEMAINE`,
  },

  email_campaign: {
    system: "Tu es un expert email marketing. Cree des emails qui convertissent. Reponds en francais. Chaque email doit etre PRET A ENVOYER - sujet, corps complet en HTML.",
    user: `${PEPETE}\n\nCree 10 EMAILS DE CAMPAGNE complets prets a envoyer:\n\n1. EMAIL DE BIENVENUE: Pour les nouveaux inscrits\n2. EMAIL SCANNER: "Savez-vous ce que contiennent les croquettes de votre chien?"\n3. EMAIL PET-SITTER: "Partez en vacances l'esprit tranquille"\n4. EMAIL IA: "Votre veterinaire de poche 24/7"\n5. EMAIL URGENCE: "Alerte: ces ingredients sont dangereux pour votre animal"\n6. EMAIL TEMOIGNAGE: Faux temoignage realiste d'un utilisateur\n7. EMAIL PROMO: Offre de lancement\n8. EMAIL PARRAINAGE: "Invitez un ami, gagnez 1 mois premium"\n9. EMAIL REACTIVATION: Pour les utilisateurs inactifs\n10. EMAIL NEWSLETTER: Actualites pet-care + mise en avant Pepete\n\nPour CHAQUE email:\n- Objet (A/B test: 2 versions)\n- Pre-header\n- Corps complet en texte (avec emojis, mise en forme)\n- CTA principal\n- PS/footer\n\nTon: amical, pas corporate, comme un ami qui s'y connait en animaux.`,
  },

  influencer_email: {
    system: "Tu es un expert en relations influenceurs et outreach. Reponds en francais.",
    user: `${PEPETE}\n\nCree une STRATEGIE D'OUTREACH INFLUENCEURS complete:\n\n**PARTIE 1: 30 PROFILS D'INFLUENCEURS CIBLES**\nPour chaque profil:\n- Pseudo realiste (@...) et plateforme\n- Niche (chien, chat, NAC, veto, toiletteur, refuge, lifestyle animal)\n- Taille estimee et type de contenu\n- Email de contact type (prenom@gmail.com)\n- Angle de collaboration specifique\n\n**PARTIE 2: 5 TEMPLATES D'EMAILS D'OUTREACH**\n- Premier contact (chaleureux, pas commercial)\n- Relance J+3\n- Relance J+7 avec offre\n- Proposition de partenariat detaillee\n- Remerciement post-collab\n\nChaque email: objet + corps complet pret a copier-coller avec [PRENOM] [PSEUDO] a remplacer.\n\n**PARTIE 3: OFFRE INFLUENCEUR**\n- Ce qu'on offre (acces premium, commission, produits)\n- Ce qu'on demande (post, story, review)\n- Contrat type simplifie`,
  },

  article_writer: {
    system: "Tu es un redacteur SEO expert. Ecris des articles complets, optimises pour le referencement Google, en francais. Chaque article doit etre publiable tel quel.",
    user: `${PEPETE}\n\nEcris 5 ARTICLES SEO COMPLETS (800-1200 mots chacun) prets a publier sur Medium/blogs:\n\n1. "Comment savoir si les croquettes de votre chien sont vraiment bonnes? Le guide complet"\n2. "Pet-sitting en France: comment trouver un gardien de confiance pour votre animal"\n3. "Mon chat est malade: quand consulter un veterinaire? L'IA au secours"\n4. "Les 10 ingredients dangereux caches dans les croquettes de votre animal"\n5. "Pepete: l'application qui revolutionne le soin des animaux de compagnie"\n\nPour CHAQUE article:\n- Titre SEO optimise\n- Meta description (155 caracteres)\n- Introduction accrocheuse\n- 3-5 sous-titres H2\n- Contenu complet avec donnees/stats\n- CTA naturel vers Pepete integre dans le texte\n- 5 mots-cles cibles\n- Tags pour Medium`,
  },

  directory_submit: {
    system: "Tu es un expert en distribution d'apps et soumission sur les annuaires. Reponds en francais.",
    user: `${PEPETE}\n\nCree un PLAN DE SOUMISSION SUR 50+ SITES avec les infos pretes a coller:\n\n**PARTIE 1: FICHE APP STANDARD** (a copier sur chaque site)\n- Nom, description courte (80 car), description longue (500 car)\n- Categories: principale et secondaires\n- Tags/mots-cles\n- Screenshots recommandes\n\n**PARTIE 2: LISTE DE 50 SITES** ou soumettre Pepete\nPour chaque site:\n- Nom du site et URL exacte de soumission\n- Type (annuaire apps, product hunt, startup directory, comparateur)\n- Gratuit ou payant\n- Priorite (haute/moyenne/basse)\n- Instructions specifiques\n\nInclure:\n- Product Hunt, AlternativeTo, SaaSHub, BetaList, StartupStash\n- Annuaires francais: FrenchWeb, Maddyness, JDN\n- Annuaires animaux: sites specialises pets\n- Annuaires apps: AppAdvice, AppFollow, AppAnnie\n- Comparateurs: Capterra, G2, Trustpilot\n- Directories generiques: Crunchbase, AngelList\n\n**PARTIE 3: FICHE PRODUCT HUNT** complete\n- Tagline, description, first comment, maker comment`,
  },

  forum_commenter: {
    system: "Tu es un expert community marketing. Tu sais participer a des conversations en ligne de facon naturelle sans spammer. Reponds en francais.",
    user: `${PEPETE}\n\nCree 30 COMMENTAIRES/REPONSES prets a poster sur differents forums:\n\n**REDDIT (10 commentaires)**\nPour r/france, r/animaux, r/chien, r/chat, r/petcare:\n- La question/post auquel on repond (invente un contexte realiste)\n- Le commentaire complet (naturel, utile, mentionne Pepete subtilement)\n- Le subreddit cible\n\n**QUORA (10 reponses)**\nPour des questions type:\n- "Quelles sont les meilleures croquettes pour chien?"\n- "Comment trouver un pet-sitter de confiance?"\n- "Mon chat ne mange plus, que faire?"\n- Reponse complete, experte, avec mention naturelle de Pepete\n\n**FORUMS ANIMAUX FR (10 posts)**\nPour Wamiz forum, 30 millions d'amis forum, AuFeminin animaux:\n- Sujet du thread\n- Reponse detaillee et utile\n- Mention naturelle de Pepete en fin de reponse\n\nREGLE: Chaque commentaire doit etre UTILE d'abord. Pepete est mentionne comme une suggestion, jamais comme une pub.`,
  },

  backlink_builder: {
    system: "Tu es un expert SEO et link building. Reponds en francais.",
    user: `${PEPETE}\n\nCree une STRATEGIE DE BACKLINKS complete:\n\n**30 OPPORTUNITES DE BACKLINKS** avec pour chacune:\n- Site web (URL exacte de la page)\n- Type (guest post, commentaire, directory, partenariat, broken link)\n- DA estime du site\n- Methode exacte pour obtenir le lien\n- Template d'email/message pour contacter le webmaster\n- Texte d'ancrage recommande\n- Priorite (1-5)\n\nInclure:\n- 5 guest posts sur blogs animaux FR\n- 5 commentaires de blog avec lien\n- 5 annuaires/directories\n- 5 partenariats avec sites complementaires\n- 5 pages de ressources ou Pepete a sa place\n- 5 broken link building opportunities\n\n**BONUS: STRATEGIE DE CONTENU POUR BACKLINKS**\n- 3 infographies a creer (que les blogs voudront partager)\n- 2 etudes/statistiques a publier\n- 1 outil gratuit a proposer`,
  },

  review_booster: {
    system: "Tu es un expert en reputation management et avis clients. Reponds en francais.",
    user: `${PEPETE}\n\nCree une STRATEGIE COMPLETE pour obtenir des avis 5 etoiles:\n\n**PARTIE 1: IN-APP REVIEW STRATEGY**\n- Quand demander un avis (quel moment dans le parcours utilisateur)\n- Le message exact a afficher (3 variantes)\n- Flow de decision (si utilisateur content → App Store, si mecontent → support)\n\n**PARTIE 2: 20 TEMPLATES DE DEMANDE D'AVIS**\n- 5 emails post-premier-scan\n- 5 emails post-reservation-petsitter\n- 5 push notifications\n- 5 messages in-app\n\n**PARTIE 3: REPONSES AUX AVIS**\n- 5 reponses aux avis positifs\n- 5 reponses aux avis negatifs (transformer en positif)\n- 3 reponses aux avis neutres\n\n**PARTIE 4: SITES D'AVIS A CIBLER**\n- App Store, Play Store, Trustpilot, Google My Business, Capterra\n- Pour chaque: la fiche a optimiser`,
  },

  content_tiktok: {
    system: "Tu es un expert TikTok viral specialise dans le contenu animalier en France. Reponds en francais.",
    user: `${PEPETE}\n\nGenere 15 SCRIPTS TIKTOK COMPLETS:\n\nPour CHAQUE video:\n- FORMAT (POV, Storytime, Avant/Apres, Test, Tutorial, React, Trend)\n- HOOK (3 premieres secondes - LA phrase qui arrete le scroll)\n- SCRIPT SECONDE PAR SECONDE (30-60s)\n- TEXTE CAPTION complet\n- 10 HASHTAGS\n- SON/MUSIQUE suggere\n- DESCRIPTION DE LA MINIATURE\n\nSujets obligatoires:\n- 3x Scanner des croquettes choquantes\n- 3x Trouver un pet-sitter\n- 3x L'IA qui repond sur la sante animale\n- 3x Moments emotionnels avec animaux\n- 3x Comparaison lifestyle avec/sans Pepete`,
  },

  content_insta: {
    system: "Tu es un expert Instagram specialise contenu animalier premium. Reponds en francais.",
    user: `${PEPETE}\n\nGenere un PACK INSTAGRAM COMPLET:\n\n**5 REELS** (script complet 30-60s avec hook/deroulement/CTA)\n**5 CARROUSELS** (10 slides chacun - texte exact de chaque slide)\n**10 STORIES** (texte + sticker/sondage/quiz)\n**5 POSTS PHOTO** (caption complete + hashtags)\n\nPour chaque contenu: texte EXACT pret a utiliser, hashtags, CTA.`,
  },

  social_commenter: {
    system: "Tu es un community manager expert. Tu sais engager les communautes en ligne de maniere authentique. Reponds en francais.",
    user: `${PEPETE}\n\nCree 25 COMMENTAIRES prets a poster sous des posts viraux d'animaux:\n\n**TIKTOK (10 commentaires)**\n- Description du type de video (ex: "video cute d'un chien qui fait une betise")\n- Commentaire naturel qui mentionne subtilement Pepete\n- Le commentaire doit avoir envie d'etre like par les viewers\n\n**INSTAGRAM (10 commentaires)**\n- Type de post cible (reel animal, post educatif, post de refuge)\n- Commentaire pertinent avec mention subtile\n\n**YOUTUBE (5 commentaires)**\n- Type de video (vlog animalier, review croquettes, conseils veto)\n- Commentaire detaille et utile\n\nREGLES:\n- Jamais "telecharge Pepete!" direct\n- Toujours apporter de la valeur d'abord\n- Mentionner Pepete comme une suggestion naturelle\n- Varier les formulations`,
  },

  press_release: {
    system: "Tu es un expert en relations presse et communication. Reponds en francais.",
    user: `${PEPETE}\n\nCree un KIT PRESSE COMPLET:\n\n**1. COMMUNIQUE DE PRESSE** (format standard, pret a envoyer)\n- Titre accrocheur\n- Sous-titre\n- Corps complet (qui, quoi, quand, ou, pourquoi)\n- Citation du fondateur\n- A propos de Pepete\n- Contact presse\n\n**2. PITCH EMAIL pour journalistes** (5 variantes)\n- Pour medias tech (FrenchWeb, Maddyness, BPI France)\n- Pour medias animaux (30 Millions d'Amis, Wamiz, Woopets)\n- Pour medias lifestyle (Madame Figaro, Elle, Marie Claire)\n- Pour medias locaux\n- Pour podcasts animaux/tech\n\n**3. DOSSIER DE PRESSE** (structure et contenu)\n- Faits et chiffres cles\n- L'histoire de Pepete\n- Les fonctionnalites en detail\n- Visuels et assets necessaires\n- FAQ journaliste\n\n**4. LISTE DE 30 CONTACTS PRESSE**\nPour chaque: nom du media, section, email type, sujet du pitch`,
  },
};

export async function POST(request: NextRequest) {
  try {
    // Double-check auth
    const authCookie = request.cookies.get("growth_agent_auth");
    if (!authCookie?.value || !verifyAuthToken(authCookie.value)) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    // Rate limit
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!checkExecutionRate(ip)) {
      return NextResponse.json({ error: "Limite 20 executions/heure atteinte." }, { status: 429 });
    }

    // Limit body size
    const bodyText = await request.text();
    if (bodyText.length > 1024) {
      return NextResponse.json({ error: "Requete trop grande" }, { status: 413 });
    }

    let parsed: { agentId?: unknown };
    try { parsed = JSON.parse(bodyText); } catch {
      return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
    }

    const { agentId } = parsed;
    if (typeof agentId !== "string" || !VALID_AGENT_IDS.has(agentId)) {
      return NextResponse.json({ error: "Agent invalide" }, { status: 400 });
    }

    const prompt = PROMPTS[agentId];
    if (!isAnthropicConfigured()) {
      return NextResponse.json({
        error: "Cle API Anthropic non configuree. Ajoute ANTHROPIC_API_KEY dans Vercel > Settings > Environment Variables.",
      }, { status: 500 });
    }

    const result = await callClaude(prompt.system, prompt.user, { maxTokens: 8192, temperature: 0.8 });
    return NextResponse.json({ result, agentId });
  } catch {
    return NextResponse.json({ error: "Erreur execution agent" }, { status: 500 });
  }
}
