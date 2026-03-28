import { NextRequest, NextResponse } from "next/server";
import { callClaude, isAnthropicConfigured } from "@/lib/anthropic";

const PEPETE_CONTEXT = `
App: Pepete (pepete.fr)
Tagline: "Le compagnon de vos compagnons"
Description: Application mobile et web (PWA) de soins pour animaux de compagnie en France.

FONCTIONNALITES PRINCIPALES:
1. SCANNER DE PRODUITS: Scanne les croquettes/aliments pour animaux, donne un score nutritionnel 0-100, detecte les ingredients suspects. Base de 50 000+ produits.
2. GARDE D'ANIMAUX: Marketplace de pet-sitters verifies pres de chez toi. Reservation, messagerie, paiement integre. Garde a domicile, promenade, toilettage.
3. ASSISTANT IA VETERINAIRE: Pose des questions sur la sante, nutrition, comportement de ton animal. Reponses instantanees 24/7 personnalisees par animal.
4. GESTION DE PROFILS ANIMAUX: Cree des fiches pour chaque animal (chien, chat, rongeur, oiseau, reptile, poisson).

PUBLIC CIBLE: Proprietaires d'animaux 18-35 ans en France, urbains, connectes, soucieux du bien-etre animal.
CONCURRENTS: Rover, Wamiz, Emprunte Mon Toutou, Animaute.
AVANTAGE: Tout-en-un (scanner + garde + IA) - aucun concurrent n'a les 3.
COULEURS: Vert sauge #527A56, creme #FAF6EE, tons chauds.
TON: Bienveillant, moderne, complice, pas corporate.
LANGUE: Francais (France), parler comme un ami pas comme une marque.
`;

type AgentType = "scraper" | "content_tiktok" | "content_insta" | "content_snap" | "seo_aso" | "prospection" | "outreach" | "analytics" | "report";

const AGENT_PROMPTS: Record<AgentType, { system: string; user: string }> = {
  scraper: {
    system: `Tu es un expert en analyse concurrentielle et positionnement. Analyse l'app Pepete et ses concurrents. Reponds en francais. Structure ta reponse en sections claires avec des emojis.`,
    user: `${PEPETE_CONTEXT}

Fais une analyse complete:
1. FORCES de Pepete vs concurrents (Rover, Wamiz, Emprunte Mon Toutou)
2. FAIBLESSES et opportunites
3. POSITIONNEMENT UNIQUE - pourquoi Pepete gagne
4. AUDIENCE CIBLE detaillee (personas)
5. CANAUX DE CROISSANCE recommandes par priorite
6. 10 HOOKS VIRAUX qui marcheraient pour Pepete

Sois precis, actionnable, pas de blabla corporate.`,
  },

  content_tiktok: {
    system: `Tu es un expert TikTok viral specialise dans le contenu animalier en France. Tu connais les tendances, les formats qui marchent, les hooks qui stoppent le scroll. Reponds en francais.`,
    user: `${PEPETE_CONTEXT}

Genere exactement 15 contenus TikTok pour Pepete. Pour CHAQUE contenu donne:

**FORMAT:** (utilise un de ces formats: POV, Storytime, Avant/Apres, Test produit, Tutorial, React, Trend audio)

**HOOK (3 premieres secondes):** La phrase qui arrete le scroll

**SCRIPT COMPLET (30-60s):** Ce que la personne dit/fait seconde par seconde

**TEXTE CAPTION:** Le texte sous la video

**HASHTAGS:** 8-10 hashtags pertinents

**MUSIQUE/SON SUGGERE:** Quel son trending utiliser

Les sujets doivent tourner autour de:
- Scanner des croquettes avec Pepete et decouvrir des ingredients choquants
- Trouver un pet-sitter de confiance
- Utiliser l'IA pour comprendre le comportement de son animal
- Moments emotionnels avec son animal
- Comparaison avec les concurrents (sans les nommer directement)

Sois TRES specifique. Pas de contenu generique. Chaque video doit donner envie de telecharger Pepete.`,
  },

  content_insta: {
    system: `Tu es un expert Instagram specialise dans le contenu animalier premium en France. Tu maitrises les Reels, carrousels educatifs et stories engageantes. Reponds en francais.`,
    user: `${PEPETE_CONTEXT}

Genere un pack complet Instagram pour Pepete:

**5 REELS** (script complet avec hook, deroulement, CTA)
- Sujets: scanner croquettes, pet-sitter, IA veterinaire, comparaison avant/apres Pepete, temoignage utilisateur fictif

**5 CARROUSELS EDUCATIFS** (10 slides chacun)
- Sujets: "5 ingredients dangereux dans les croquettes", "Comment choisir un pet-sitter", "Les signes que ton chat est stresse", "Guide alimentation chiot", "Pepete vs faire soi-meme"

**10 STORIES** avec stickers/sondages
- Engagement: questions, sondages, quizz sur les animaux

Pour chaque contenu: texte exact, CTA, hashtags.
Ton: chaleureux, expert mais accessible, comme un ami veterinaire.`,
  },

  content_snap: {
    system: `Tu es un expert en marketing viral sur Snapchat aupres des 18-25 ans en France. Tu sais creer des messages qui ressemblent a un pote qui partage un bon plan, pas une pub. Reponds en francais.`,
    user: `${PEPETE_CONTEXT}

Genere 15 messages Snapchat pour promouvoir Pepete de facon NATURELLE.

Chaque message doit:
- Ressembler a un snap qu'un ami enverrait
- Pas de ton commercial du tout
- Inclure une emotion (surprise, choc, attendrissement, humour)
- Donner envie de cliquer/telecharger

Categorise-les:
- 5x "DECOUVERTE CHOC" (genre "wtf j'ai scanne les croquettes de mon chien...")
- 5x "BON PLAN" (genre "les gars j'ai trouve une app de ouf...")
- 5x "MOMENT CUTE" (genre "mon petsitter m'a envoye une photo de mon chat...")

Pour chaque snap: le texte exact + l'emoji/sticker suggere + le contexte visuel (selfie, photo ecran, etc).`,
  },

  seo_aso: {
    system: `Tu es un expert SEO et ASO (App Store Optimization) pour le marche francais. Tu maitrises le referencement Google, App Store et Play Store. Reponds en francais.`,
    user: `${PEPETE_CONTEXT}

Fais un audit SEO/ASO complet pour Pepete:

**ASO (App Store Optimization):**
1. Titre optimal pour l'App Store et Play Store
2. Sous-titre/description courte
3. 20 mots-cles prioritaires (avec volume de recherche estime)
4. Description longue optimisee (4000 caracteres)
5. Suggestions de screenshots/previews

**SEO Web (pepete.fr):**
1. 15 mots-cles longue traine a cibler
2. 10 idees d'articles de blog pour le SEO
3. Balises title et meta description optimales pour chaque page
4. Strategie de backlinks (10 sites ou obtenir des liens)
5. Schema markup recommande

**Google Ads:**
1. 5 campagnes suggeres avec mots-cles et budget
2. Textes d'annonces optimises

Sois ultra precis avec des vrais mots-cles en francais.`,
  },

  prospection: {
    system: `Tu es un expert en marketing d'influence dans la niche animaux/pets en France. Tu connais les micro-influenceurs TikTok et Instagram francophones. Reponds en francais.`,
    user: `${PEPETE_CONTEXT}

Trouve et decris 30 PROFILS D'INFLUENCEURS ideaux pour un partenariat Pepete.

Pour chaque profil, donne:
- **Pseudo type** (invente des pseudos realistes genre @monchienetmoi, @lavet_pauline)
- **Plateforme** (TikTok ou Instagram)
- **Niche precise** (chien, chat, NAC, veterinaire, toiletteur, eleveur, refuge)
- **Taille estimee** (micro: 3k-30k, mid: 30k-100k)
- **Type de contenu** qu'ils font
- **Pourquoi c'est pertinent** pour Pepete
- **Angle de collaboration** (test scanner, code promo, takeover, unboxing)
- **Score de pertinence** /100

Classe-les par priorite. Les 10 premiers doivent etre les plus faciles a convaincre (micro-influenceurs passionnes).

IMPORTANT: Base-toi sur les vrais types de comptes qui existent dans la niche animaux FR sur TikTok/Instagram.`,
  },

  outreach: {
    system: `Tu es un expert en outreach et relations influenceurs. Tu sais ecrire des DMs qui obtiennent des reponses, pas des messages generiques ignores. Reponds en francais.`,
    user: `${PEPETE_CONTEXT}

Genere des VRAIS messages de prospection pour contacter les influenceurs animaux:

**5 PREMIERS MESSAGES** (premier contact)
- Chaque message doit etre different et adapte a un type d'influenceur
- Ton: naturel, pas commercial, montrer qu'on connait leur contenu
- Mentionner Pepete naturellement
- Proposer une vraie valeur (pas juste "promote notre app")

**3 MESSAGES DE RELANCE** (si pas de reponse apres 3-5 jours)
- Leger, pas insistant, apporter un element nouveau

**3 PROPOSITIONS DE COLLABORATION** (apres reponse positive)
- Detailler le partenariat: ce qu'on offre, ce qu'on demande
- Acces gratuit premium, commission, contenu co-cree

**2 MESSAGES POST-COLLAB** (pour maintenir la relation)
- Remercier, partager les resultats, proposer du long terme

Pour chaque message: le texte EXACT pret a copier-coller, avec des [PRENOM] et [PSEUDO] a remplacer.`,
  },

  analytics: {
    system: `Tu es un growth hacker expert en metriques et KPIs pour les apps mobiles. Tu sais definir des objectifs realistes et des tableaux de bord. Reponds en francais.`,
    user: `${PEPETE_CONTEXT}

Cree un PLAN DE METRIQUES complet pour la croissance de Pepete:

**KPIs PRINCIPAUX** (les 5 metriques qui comptent le plus)
- Pour chaque KPI: definition, formule, objectif mois 1/3/6

**PROJECTIONS DE CROISSANCE** (realistes pour une app FR dans cette niche)
- Mois 1: installations, DAU, retention J7
- Mois 3: objectifs
- Mois 6: objectifs

**FUNNEL DE CONVERSION**
- Decouverte → Telechargement → Inscription → Premier scan → Retention
- Taux de conversion estime a chaque etape
- Actions pour ameliorer chaque etape

**PLAN DE CROISSANCE 30 JOURS** (jour par jour)
- Semaine 1: Fondations
- Semaine 2: Lancement contenu
- Semaine 3: Influenceurs
- Semaine 4: Optimisation

Pour chaque jour: action precise, plateforme, KPI a suivre.

**OUTILS RECOMMANDES** (gratuits/pas chers)
- Analytics, attribution, A/B testing, social scheduling`,
  },

  report: {
    system: `Tu es un consultant growth senior. Tu rediges des rapports de strategie clairs et actionnables pour des startups. Reponds en francais.`,
    user: `${PEPETE_CONTEXT}

Redige un RAPPORT DE STRATEGIE GROWTH complet pour Pepete.

Structure:
1. **RESUME EXECUTIF** (5 lignes max)
2. **ANALYSE DU MARCHE** (pet-tech en France, taille, tendances)
3. **AVANTAGE COMPETITIF** (pourquoi Pepete gagne)
4. **STRATEGIE D'ACQUISITION** (les 3 canaux prioritaires avec budget)
5. **PLAN DE CONTENU** (resume des contenus a produire par plateforme)
6. **STRATEGIE INFLUENCEURS** (approche, budget, ROI attendu)
7. **ROADMAP 90 JOURS** (phases, milestones, KPIs)
8. **BUDGET RECOMMANDE** (reparti par canal)
9. **RISQUES ET MITIGATIONS**
10. **NEXT STEPS** (les 5 actions a faire cette semaine)

Sois concret, avec des chiffres. Pas de blabla. Chaque section doit etre actionnable.`,
  },
};

export async function POST(request: NextRequest) {
  try {
    const { agentId } = await request.json();

    if (!agentId || !AGENT_PROMPTS[agentId as AgentType]) {
      return NextResponse.json({ error: "Agent invalide" }, { status: 400 });
    }

    const prompt = AGENT_PROMPTS[agentId as AgentType];

    if (!isAnthropicConfigured()) {
      return NextResponse.json({
        error: "Cle API Anthropic non configuree. Ajoute ANTHROPIC_API_KEY dans les variables d'environnement Vercel.",
      }, { status: 500 });
    }

    const result = await callClaude(prompt.system, prompt.user, {
      maxTokens: 8192,
      temperature: 0.8,
    });

    return NextResponse.json({ result, agentId });
  } catch (error) {
    console.error("Agent execution error:", error);
    return NextResponse.json({ error: "Erreur lors de l'execution de l'agent" }, { status: 500 });
  }
}
