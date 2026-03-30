export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--bg1)] text-gray-300 p-6 max-w-3xl mx-auto">
      <div className="mb-8">
        <a href="/" className="text-violet-400 text-sm hover:underline">&larr; Retour au cockpit</a>
      </div>

      <h1 className="text-2xl font-bold text-white mb-2">Politique de Confidentialite &amp; Securite</h1>
      <p className="text-sm text-gray-500 mb-8">Derniere mise a jour : Mars 2026</p>

      <div className="space-y-8 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-bold text-white mb-3">1. Protection des Donnees</h2>
          <ul className="space-y-2 list-disc pl-5">
            <li><strong className="text-white">Chiffrement en transit :</strong> Toutes les communications sont chiffrees via TLS 1.3 (HTTPS force via HSTS).</li>
            <li><strong className="text-white">Chiffrement au repos :</strong> Les donnees stockees dans Supabase (PostgreSQL) sont chiffrees avec AES-256.</li>
            <li><strong className="text-white">Aucune cle API stockee en clair :</strong> Toutes les cles (Anthropic, Supabase) sont dans des variables d&apos;environnement securisees Vercel, jamais dans le code source.</li>
            <li><strong className="text-white">Cookies signes :</strong> L&apos;authentification utilise des tokens HMAC-SHA256 signes, HTTPOnly, Secure, SameSite=Strict.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-3">2. Securite de l&apos;Authentification</h2>
          <ul className="space-y-2 list-disc pl-5">
            <li><strong className="text-white">Anti-bruteforce :</strong> 5 tentatives max, puis blocage 15 minutes par IP.</li>
            <li><strong className="text-white">Comparaison securisee :</strong> Les mots de passe sont compares en temps constant (timing-safe) pour empecher les attaques par timing.</li>
            <li><strong className="text-white">Tokens expires :</strong> Les sessions expirent automatiquement apres 7 jours.</li>
            <li><strong className="text-white">Pas de mot de passe par defaut :</strong> Le serveur refuse de demarrer sans variable ADMIN_PASSWORD configuree.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-3">3. Protection contre les Attaques</h2>
          <ul className="space-y-2 list-disc pl-5">
            <li><strong className="text-white">Rate Limiting :</strong> 20 executions d&apos;agent max par heure, anti-bruteforce sur le login.</li>
            <li><strong className="text-white">CSP (Content Security Policy) :</strong> Bloque l&apos;injection de scripts tiers, le clickjacking (X-Frame-Options: DENY), et les attaques XSS.</li>
            <li><strong className="text-white">Validation stricte :</strong> Whitelist des agents autorises, limite de taille des requetes (1KB), validation JSON.</li>
            <li><strong className="text-white">Headers de securite :</strong> HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy actifs sur toutes les routes.</li>
            <li><strong className="text-white">Pas de fuite d&apos;erreur :</strong> Les erreurs internes ne sont jamais exposees aux utilisateurs.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-3">4. Donnees Utilisees par l&apos;IA</h2>
          <ul className="space-y-2 list-disc pl-5">
            <li>L&apos;IA (Claude par Anthropic) est utilisee uniquement pour generer du contenu marketing.</li>
            <li><strong className="text-white">Aucune donnee personnelle</strong> n&apos;est envoyee a l&apos;IA — seules les descriptions de l&apos;application Pepete sont transmises.</li>
            <li>Les prompts sont pre-definis et valides cote serveur — l&apos;utilisateur ne peut pas injecter de prompts personnalises.</li>
            <li>Les reponses de l&apos;IA sont stockees temporairement en memoire et ne sont pas persistees sans action explicite.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-3">5. Conformite RGPD</h2>
          <ul className="space-y-2 list-disc pl-5">
            <li><strong className="text-white">Minimisation des donnees :</strong> Nous ne collectons que le strict necessaire (pas d&apos;email, pas de nom, pas de tracking).</li>
            <li><strong className="text-white">Pas de cookies tiers :</strong> Aucun tracker, analytics, ou pixel publicitaire.</li>
            <li><strong className="text-white">Droit a l&apos;effacement :</strong> Toutes les donnees peuvent etre supprimees sur simple demande.</li>
            <li><strong className="text-white">Hebergement UE :</strong> Supabase sur infrastructure AWS EU (Frankfurt).</li>
            <li><strong className="text-white">Pas de revente :</strong> Vos donnees ne sont JAMAIS vendues, partagees ou transferees a des tiers.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-3">6. Infrastructure</h2>
          <ul className="space-y-2 list-disc pl-5">
            <li><strong className="text-white">Hebergement :</strong> Vercel (Edge Network mondial, DDoS protection integree).</li>
            <li><strong className="text-white">Base de donnees :</strong> Supabase PostgreSQL avec Row Level Security (RLS).</li>
            <li><strong className="text-white">API IA :</strong> Anthropic Claude — SOC 2 Type II certifie.</li>
            <li><strong className="text-white">DNS :</strong> Protection DDoS via le CDN Vercel.</li>
            <li><strong className="text-white">Pas de logs sensibles :</strong> Les erreurs sont loguees sans donnees utilisateur.</li>
          </ul>
        </section>

        <section className="bg-[var(--bg3)] rounded-xl p-5 border border-violet-500/20">
          <h2 className="text-lg font-bold text-violet-400 mb-3">Garantie Securite Pepete</h2>
          <p className="mb-3">Nous nous engageons a :</p>
          <ul className="space-y-1.5 list-disc pl-5">
            <li>Ne JAMAIS stocker de mots de passe en clair</li>
            <li>Ne JAMAIS exposer de cles API dans le code source ou le navigateur</li>
            <li>Ne JAMAIS envoyer de donnees personnelles a des services tiers sans consentement</li>
            <li>Ne JAMAIS vendre ou partager vos donnees</li>
            <li>Maintenir les protections anti-bruteforce, rate limiting et chiffrement actifs en permanence</li>
            <li>Appliquer les mises a jour de securite dans les 48h suivant leur publication</li>
          </ul>
        </section>

        <p className="text-gray-600 text-xs pt-4">
          Contact : securite@pepete.fr | Pepete SAS, France
        </p>
      </div>
    </div>
  );
}
