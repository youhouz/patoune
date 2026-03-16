# Audit UX Complet — Pépète (Patoune)
## Test des parcours utilisateur comme de vrais utilisateurs

**Date** : Mars 2026
**Méthode** : Simulation de scénarios réels d'utilisateurs (personas)
**Version auditée** : v1.0.0

---

## Personas testés

| Persona | Profil | Objectif |
|---------|--------|----------|
| **Marie, 28 ans** | Propriétaire d'un Berger Australien | Trouver un pet-sitter pour ses vacances |
| **Lucas, 35 ans** | Veut devenir pet-sitter | S'inscrire et proposer ses services |
| **Sophie, 42 ans** | Propriétaire de 2 chats | Scanner la nourriture de ses chats |
| **Thomas, 22 ans** | Étudiant, nouveau sur l'app | Découvrir l'app sans créer de compte |

---

## 1. PARCOURS INSCRIPTION (Marie veut créer un compte)

### Scénario
> Marie télécharge l'app. Elle veut créer un compte pour trouver un pet-sitter pour Rex.

### Ce qui fonctionne bien
- **Onboarding** : Écran d'accueil attractif avec slider de présentation
- **Choix de rôle** : Possibilité de choisir "Propriétaire", "Pet-sitter" ou les deux — excellent
- **Indicateur de force du mot de passe** : Barre visuelle + labels (Faible/Moyen/Fort/Excellent) — très bien
- **Confirmation en temps réel** : Feedback visuel quand les mots de passe correspondent
- **Validation frontend** : Messages d'erreur clairs et en français
- **Animation shake** : Feedback visuel quand le formulaire est invalide
- **Scroll avec clavier** : Bien géré (keyboardShouldPersistTaps, automaticallyAdjustKeyboardInsets)

### Problèmes identifiés

| Sévérité | Problème | Détail |
|----------|----------|--------|
| **CRITIQUE** | Pas de "Mot de passe oublié" | Aucun mécanisme de récupération de mot de passe. Si Marie perd son mdp, elle est bloquée. |
| **MAJEUR** | Pas de validation email | Aucune vérification d'email (pas de mail de confirmation). N'importe qui peut créer un compte avec un faux email. |
| **MAJEUR** | Mot de passe trop faible accepté | Le minimum est 6 caractères. "123456" est accepté. Il faudrait exiger au moins une lettre + un chiffre. |
| **MINEUR** | Téléphone non validé | Le champ téléphone accepte n'importe quelle valeur (lettres incluses). Pas de regex de validation. |
| **MINEUR** | Pas de CGU/RGPD | Aucune case à cocher pour les conditions d'utilisation ni la politique de confidentialité. Obligatoire légalement en France. |
| **MINEUR** | Pas de connexion sociale | Pas d'inscription via Google/Apple/Facebook. Frein pour l'acquisition utilisateur. |
| **UX** | Navigation post-inscription confuse | Le code `navigation.getParent()?.getParent()?.reset(...)` est fragile. Si la hiérarchie change, ça casse. |

### Verdict : 6/10
> L'inscription fonctionne, est jolie et intuitive, mais manque de sécurité basique (récupération mdp, validation email).

---

## 2. PARCOURS CONNEXION (Marie revient sur l'app)

### Scénario
> Marie a déjà un compte et veut se reconnecter.

### Ce qui fonctionne bien
- **UI propre** : Design cohérent avec l'inscription
- **Persistance du token** : Le token JWT est stocké dans AsyncStorage, Marie reste connectée
- **Refresh du profil au lancement** : `checkAuth()` appelle `/api/auth/me` pour vérifier la validité du token
- **Messages d'erreur explicites** : "Identifiants invalides" côté backend
- **Rate limiting** : 50 requêtes par 15 min (protection brute-force)

### Problèmes identifiés

| Sévérité | Problème | Détail |
|----------|----------|--------|
| **CRITIQUE** | Pas de "Mot de passe oublié" | Pas de lien "Mot de passe oublié" sur l'écran de connexion. Bloquant. |
| **MAJEUR** | Pas de déconnexion automatique | Le token expire après 30 jours (`JWT_EXPIRE`), mais il n'y a pas de refresh token. Si le token est compromis, il reste valide 30 jours. |
| **MINEUR** | Déconnexion silencieuse sur web | `handleLogout` fait un `doLogout()` directement sur web sans confirmation (pas d'Alert.alert sur web). C'est correct techniquement mais un clic accidentel déconnecte sans recours. |
| **UX** | Pas de "Se souvenir de moi" | L'email n'est pas pré-rempli si Marie revient après une déconnexion. |

### Verdict : 7/10
> Connexion fluide, mais le manque de "Mot de passe oublié" est rédhibitoire pour une app en production.

---

## 3. PARCOURS PROFIL UTILISATEUR (Marie consulte son profil)

### Scénario
> Marie veut voir son profil, ses stats, et modifier ses infos.

### Ce qui fonctionne bien
- **Design premium** : Header gradient avec avatar initiales, badge Pet-sitter si applicable
- **Stats en temps réel** : Nombre d'animaux, scans et gardes chargés via API (Promise.allSettled — robuste)
- **Pull-to-refresh** : RefreshControl bien implémenté
- **Menu clair** : Sections "Mes compagnons" et "Paramètres" bien organisées
- **Badge Pet-sitter** : Affiché si `user.isPetSitter === true`
- **Footer élégant** : Logo + version de l'app

### Problèmes identifiés

| Sévérité | Problème | Détail |
|----------|----------|--------|
| **MAJEUR** | Pas de modification de l'avatar | Marie ne peut pas changer sa photo de profil. L'avatar est toujours des initiales. Le champ `avatar` existe dans le modèle User mais n'est jamais modifiable. |
| **MAJEUR** | Pas de modification de l'email | Dans les Settings, Marie peut changer son nom et téléphone, mais pas son email. |
| **MAJEUR** | Pas de changement de mot de passe | Aucun écran pour modifier le mot de passe. |
| **MINEUR** | Pas d'historique des gardes | Le ProfileScreen montre le compteur de gardes mais pas de liste. Pas d'écran "Mes réservations". |
| **UX** | Pas d'accès direct à la messagerie | Pas de section "Mes conversations" depuis le profil. |

### Verdict : 6/10
> Profil visuellement réussi mais fonctionnellement limité (pas de modification avatar, email, mot de passe).

---

## 4. PARCOURS AJOUT D'ANIMAL (Marie ajoute Rex)

### Scénario
> Marie veut enregistrer Rex, son Berger Australien mâle de 3 ans.

### Ce qui fonctionne bien
- **Photo picker** : Upload de photo avec crop carré et compression (quality 0.5) — bien pensé
- **7 espèces supportées** : Chien, Chat, Rongeur, Oiseau, Reptile, Poisson, Autre — bon coverage
- **Sélection genre** : UI claire Mâle ♂ / Femelle ♀
- **Champs optionnels bien identifiés** : Race, Âge, Poids, Besoins spéciaux
- **Toggle vacciné** : Switch avec feedback visuel
- **Mode édition** : La même screen sert pour créer ET modifier un animal
- **Validation** : Nom, espèce et genre obligatoires. Validation de l'âge et du poids (pas négatifs)
- **Bouton dynamique** : "Ajouter Rex" (avec le nom de l'animal)

### Problèmes identifiés

| Sévérité | Problème | Détail |
|----------|----------|--------|
| **MAJEUR** | Photos stockées en base64 dans MongoDB | `photoUri` est un data URI base64 envoyé dans le payload JSON. Pour une photo de 2MB, ça fait un JSON de ~3MB. Pas de stockage cloud (S3, Cloudinary). Ça va exploser avec beaucoup d'utilisateurs. |
| **MINEUR** | Pas de limite de nombre d'animaux | Marie pourrait ajouter 1000 animaux. Pas de limite côté API. |
| **MINEUR** | Pas de champ "stérilisé" | Courant pour les annonces animales. |
| **UX** | Suppression sans animation | La suppression d'un animal dans MyPetsScreen utilise `Alert.alert` (ne marche pas sur web). |

### Verdict : 8/10
> Excellent parcours d'ajout d'animal. Le problème de stockage base64 est le seul point bloquant pour la mise en production.

---

## 5. PARCOURS PET-SITTER (Lucas veut proposer ses services)

### Scénario
> Lucas s'inscrit comme pet-sitter et veut créer son profil.

### Ce qui fonctionne bien
- **Double rôle à l'inscription** : Lucas peut choisir "Pet-sitter" ou "Les deux" dès l'inscription
- **Auto-création du profil PetSitter** : Si `role === 'guardian'`, un profil PetSitter est auto-créé dans la DB
- **API becomePetSitter** : Route POST `/api/petsitters` pour devenir gardien après-coup
- **Édition du profil gardien** : PUT `/api/petsitters/me` avec whitelist de champs (sécurisé)
- **Recherche géolocalisée** : Agrégation MongoDB `$geoNear` avec calcul de distance — performant
- **Filtres animaux** : Tous, Chiens, Chats, Rongeurs, Oiseaux, Reptiles
- **Filtres rayon** : 5km, 10km, 25km, 50km
- **Recherche par ville** : Geocoding intégré (input ville → coordonnées)
- **Skeleton loading** : Beau placeholder pendant le chargement
- **Protection ReDoS** : `escapeRegex()` sur les recherches — bien

### Problèmes identifiés

| Sévérité | Problème | Détail |
|----------|----------|--------|
| **CRITIQUE** | Pas d'écran de création de profil gardien dans l'app | Lucas choisit "Pet-sitter" à l'inscription, mais il n'y a **aucun écran** dans l'app pour remplir sa bio, ses tarifs, ses services, ses animaux acceptés. Le `guardianProfile` est envoyé à l'inscription, mais le formulaire d'inscription ne contient PAS ces champs ! Le profil PetSitter est créé vide (bio='', pricePerDay=0, services=[], acceptedAnimals=[]). |
| **CRITIQUE** | Pas d'écran pour modifier son profil gardien | L'API PUT `/api/petsitters/me` existe mais il n'y a **aucun écran** dans l'app pour l'appeler. Lucas ne peut jamais configurer ses tarifs, services ou bio depuis l'app. |
| **MAJEUR** | Limitation à 20 résultats sans pagination | `$limit: 20` hardcodé. Si Marie est dans une grande ville avec 50 pet-sitters, elle n'en voit que 20 sans possibilité de charger plus. |
| **MAJEUR** | Recherche locale doublement filtrée | Le frontend filtre AUSSI les résultats localement (`filteredPetsitters`), ce qui peut donner des résultats incohérents avec le count affiché. |
| **MINEUR** | Disponibilité fictive | `petsitter.availability?.includes(day.key) ?? (idx < 5)` : si pas de disponibilité définie, on affiche Lun-Ven comme "disponible" par défaut. C'est trompeur. |
| **MINEUR** | Accents manquants dans l'UI | "Verifie", "trouve", "specialite", "Reinitialiser" — pas d'accents dans PetSittersListScreen et PetSitterDetailScreen. |
| **UX** | Icônes d'animaux peu intuitives | `github` pour Chat, `gitlab` pour Chien, `zap` pour Reptile — ce sont des icônes Feather qui n'ont rien à voir avec des animaux. |

### Verdict : 4/10
> Le parcours pet-sitter est **cassé**. Lucas ne peut pas configurer son profil gardien (tarifs, bio, services) depuis l'app. C'est le plus gros problème de l'application.

---

## 6. PARCOURS RÉSERVATION (Marie réserve un pet-sitter)

### Scénario
> Marie a trouvé un pet-sitter et veut réserver pour les vacances de Noël.

### Ce qui fonctionne bien
- **Step indicator** : Beau stepper visuel (Animal → Service → Dates → Confirmer)
- **Sélection d'animal** : Grille avec emoji et check — excellent UX
- **Sélection de service** : Radio buttons avec prix unitaire affiché
- **Auto-formatage des dates** : Insertion automatique des tirets dans AAAA-MM-JJ
- **Calcul du prix en temps réel** : `jours × prix/jour` ou `jours × prix/heure`
- **Récapitulatif** : Section résumé avec tous les détails avant confirmation
- **Validation backend robuste** : Dates futures obligatoires, endDate > startDate, tous les champs requis
- **Gestion "pas d'animal"** : Message + bouton pour ajouter un animal si la liste est vide

### Problèmes identifiés

| Sévérité | Problème | Détail |
|----------|----------|--------|
| **MAJEUR** | Pas de date picker natif | L'utilisateur doit taper manuellement les dates au format AAAA-MM-JJ. C'est très mauvais en UX mobile. Il faudrait un calendrier interactif. |
| **MAJEUR** | Pas de vérification de disponibilité | Marie peut réserver même si le pet-sitter est déjà pris. Pas de vérification de conflit de dates côté backend. |
| **MAJEUR** | Pas de notifications au pet-sitter | Quand Marie réserve, Lucas ne reçoit aucune notification (ni push, ni in-app, ni email). |
| **MAJEUR** | Pas d'écran "Mes réservations" | Marie ne peut pas voir la liste de ses réservations passées/en cours. L'API `GET /api/bookings` existe mais aucun écran ne l'affiche. |
| **MINEUR** | Calcul approximatif | Pour "promenade" et "visite", le prix est calculé par JOUR (nombre de jours × pricePerHour), ce qui est incohérent. |
| **MINEUR** | Notes limitées à 500 chars affichées mais pas validées backend | Le frontend affiche un compteur `/500` mais le backend ne valide pas la longueur des notes. |
| **UX** | Pas de sélection d'heure | Pour une promenade, Marie devrait pouvoir choisir une heure. |

### Verdict : 5/10
> Le flow existe et le stepper est bien fait, mais l'absence de date picker et d'écran "Mes réservations" est problématique.

---

## 7. PARCOURS MESSAGERIE (Marie contacte Lucas)

### Scénario
> Marie veut poser des questions à Lucas avant de réserver.

### Ce qui fonctionne bien
- **Messages en temps réel** : Polling toutes les 5 secondes
- **Groupement de messages** : Messages consécutifs du même auteur sont groupés (bulles arrondies adaptées)
- **Séparateurs de date** : "Aujourd'hui", "Hier", date formatée en français
- **Suggestions de messages** : Chips pré-remplies ("Bonjour !", "Disponible cette semaine ?", etc.)
- **Scroll to bottom FAB** : Bouton flottant pour revenir en bas
- **Auto-scroll** : Scroll automatique quand un nouveau message arrive et qu'on est en bas
- **Limit de caractères** : MAX_MESSAGE_LENGTH = 1000

### Problèmes identifiés

| Sévérité | Problème | Détail |
|----------|----------|--------|
| **MAJEUR** | Polling au lieu de WebSocket | Requêtes toutes les 5 secondes = latence + charge serveur. Pas de temps réel vrai. |
| **MAJEUR** | Pas de liste de conversations | Marie ne peut accéder à une conversation QUE depuis le profil d'un pet-sitter. L'API `GET /api/messages/conversations` existe mais aucun écran ne l'utilise. |
| **MAJEUR** | Statut "En ligne" toujours affiché | `headerOnlineDot` est toujours vert, `headerOnlineText` dit toujours "En ligne". C'est faux — il n'y a pas de système de présence. |
| **MINEUR** | Pas de suppression de messages | Impossible de supprimer un message envoyé par erreur. |
| **MINEUR** | Pas de notification de nouveau message | Pas de badge sur le tab bar, pas de push notification. |
| **UX** | Pas de typing indicator | Marie ne sait pas si Lucas est en train de taper. |

### Verdict : 5/10
> La messagerie fonctionne mais manque de fonctionnalités essentielles (liste de conversations, notifications, WebSocket).

---

## 8. PARCOURS AVIS/REVIEWS (Marie laisse un avis)

### Scénario
> Marie a terminé sa garde et veut laisser un avis sur Lucas.

### Ce qui fonctionne bien
- **Système de notes 1-5 étoiles** : Modèle bien structuré
- **Un seul avis par booking** : Index unique `(author, booking)` — empêche les doublons
- **Recalcul automatique** : La moyenne et le nombre d'avis sont recalculés à chaque nouvel avis
- **Affichage des avis** : Distribution des notes + liste paginée sur le profil du pet-sitter
- **Protection** : Seul le propriétaire de la réservation peut noter, et seulement si `status === 'completed'`

### Problèmes identifiés

| Sévérité | Problème | Détail |
|----------|----------|--------|
| **CRITIQUE** | Pas d'écran pour laisser un avis dans l'app | L'API POST `/api/reviews` existe et est bien codée, mais il n'y a **aucun formulaire** dans l'app pour soumettre un avis. Marie ne peut JAMAIS laisser un avis. |
| **CRITIQUE** | Pas d'écran "Mes réservations" pour déclencher l'avis | Pour laisser un avis, il faut un booking complété. Mais comme il n'y a pas d'écran "Mes réservations", le workflow est entièrement cassé. |
| **MAJEUR** | Pas de modération | Aucun système pour signaler un avis inapproprié. |

### Verdict : 2/10
> Le backend est prêt mais le frontend est complètement absent. Le système d'avis est inutilisable.

---

## 9. PARCOURS SCANNER (Sophie scanne la nourriture de son chat)

### Scénario
> Sophie veut vérifier si la pâtée de son chat est de bonne qualité.

### Ce qui fonctionne bien
- **Accessible sans compte** : Le scanner est dans les 3 tabs principaux, accessible en mode invité
- **Historique des scans** : ScanHistoryScreen permet de revoir les produits scannés
- **Score nutritionnel** : Système de score /100 avec labels et couleurs

### Problèmes identifiés
- *(Scanner non audité en profondeur car dépend de l'API AI et de la caméra — fonctionnalité technique spécifique)*

### Verdict : 7/10
> Bon concept, bien intégré dans la navigation.

---

## 10. PARCOURS VISITEUR (Thomas découvre l'app sans compte)

### Scénario
> Thomas installe l'app et veut explorer sans créer de compte.

### Ce qui fonctionne bien
- **Accueil accessible** : HomeScreen visible sans authentification
- **Scanner accessible** : Tab Scanner utilisable sans compte
- **Assistant IA accessible** : AIAssistantScreen accessible en mode invité
- **GuestGateScreen** : Quand Thomas essaie d'accéder aux Pet-sitters ou au Profil, un écran élégant lui présente les avantages de l'inscription
- **Message rassurant** : "Le scanner et l'assistant IA restent accessibles sans compte"

### Problèmes identifiés

| Sévérité | Problème | Détail |
|----------|----------|--------|
| **MINEUR** | Pas de preview des pet-sitters en mode invité | Thomas ne peut pas du tout voir la liste des pet-sitters sans compte. Même une vue limitée donnerait envie de s'inscrire. |
| **MINEUR** | PWA Install Banner | Le composant `PWAInstallBanner` est inclus mais non audité — bonne idée pour la conversion web. |

### Verdict : 8/10
> Très bon parcours invité. Le scanner gratuit est un excellent hook d'acquisition.

---

## 11. NAVIGATION ET UX GÉNÉRALE

### Architecture

```
App
├── Onboarding (première visite)
├── Tabs (3 onglets)
│   ├── Accueil (HomeScreen)
│   ├── Scanner
│   │   ├── ScannerScreen
│   │   ├── ProductResultScreen
│   │   └── ScanHistoryScreen
│   └── Profil (auth required)
│       ├── ProfileScreen
│       ├── MyPetsScreen
│       ├── AddPetScreen
│       └── SettingsScreen
├── Garde (auth required)
│   ├── PetSittersListScreen
│   ├── PetSitterDetailScreen
│   ├── BookingScreen
│   └── MessagesScreen
├── Assistant IA
└── AuthStack
    ├── LoginScreen
    └── RegisterScreen
```

### Ce qui fonctionne bien
- **3 tabs seulement** : Simple, pas surchargé
- **Design system cohérent** : Couleurs (`colors.js`), typographie (`typography.js`), spacing/radius/shadows constants
- **Gradients premium** : Vert foncé → vert moyen, cohérent partout
- **Animations soignées** : Fade-in, slide-up, scale, shake — professionnelles
- **Responsive** : Hook `useResponsive` pour adaptation tablet/mobile
- **Safe area** : `useSafeAreaInsets` partout — bien
- **Splash screen** : Animation élaborée avec animaux SVG et paw loader

### Problèmes identifiés

| Sévérité | Problème | Détail |
|----------|----------|--------|
| **MAJEUR** | Pas de deep linking | Pas de configuration de liens profonds. Impossible de partager un profil de pet-sitter par URL. |
| **MAJEUR** | Pas de gestion d'erreur réseau globale | Si le serveur est down, chaque écran gère (ou pas) l'erreur individuellement. Pas d'intercepteur Axios global avec retry/toast. |
| **MINEUR** | 3 tabs seulement, pas de tab "Garde" | Pour accéder aux pet-sitters, il faut passer par le HomeScreen. Pas de tab dédié. |
| **MINEUR** | Pas de dark mode | Bien que le design soit sombre dans les headers, le reste de l'app est light only. |
| **UX** | Incohérence de navigation | Certains écrans ont un `headerShown: false` (navigation custom) tandis que d'autres utilisent le header par défaut de React Navigation. |

---

## RÉSUMÉ GLOBAL

### Tableau de scores par parcours

| Parcours | Score | État |
|----------|-------|------|
| Inscription | 6/10 | Fonctionnel, manque sécurité |
| Connexion | 7/10 | Bon, manque récup mdp |
| Profil | 6/10 | Joli mais limité |
| Ajout animal | 8/10 | Excellent sauf stockage photos |
| Pet-sitter | **4/10** | **Profil gardien non configurable** |
| Réservation | 5/10 | Pas de date picker, pas de "Mes réservations" |
| Messagerie | 5/10 | Fonctionnel mais basique |
| Avis/Reviews | **2/10** | **Aucun écran frontend** |
| Scanner | 7/10 | Bonne feature d'acquisition |
| Mode invité | 8/10 | Très bien pensé |
| Navigation/UX | 7/10 | Design premium |
| **MOYENNE** | **5.9/10** | |

### Top 5 des problèmes critiques à résoudre en priorité

1. **Créer l'écran de gestion du profil Pet-sitter** — Sans ça, Lucas ne peut pas configurer ses tarifs, bio, services. L'app est inutilisable pour les gardiens.

2. **Ajouter "Mot de passe oublié"** — Fonctionnalité basique manquante. Bloquant pour tout utilisateur qui perd son mot de passe.

3. **Créer l'écran "Mes réservations"** — Le propriétaire ET le gardien n'ont aucune visibilité sur leurs réservations en cours.

4. **Créer l'écran pour laisser un avis** — Le backend est prêt, il manque juste le formulaire frontend.

5. **Créer l'écran "Mes conversations"** — La messagerie n'est accessible que depuis un profil de pet-sitter. Pas de vue centralisée.

### Top 5 des améliorations UX à faire

1. **Date picker natif** pour les réservations (au lieu de saisie manuelle AAAA-MM-JJ)
2. **Stockage photos cloud** (S3/Cloudinary) au lieu de base64 en MongoDB
3. **Notifications push** pour les messages et réservations
4. **WebSocket** pour la messagerie en temps réel
5. **Validation email** à l'inscription

### Ce qui est vraiment bien fait

- Le design system est premium et cohérent (digne d'une app de qualité)
- Le mode invité avec scanner gratuit est excellent pour l'acquisition
- L'architecture backend est propre (models, controllers, routes, middleware)
- La sécurité de base est correcte (JWT, bcrypt, rate limiting, input sanitization, ReDoS protection)
- Les animations sont professionnelles et fluides
- Le responsive est pris en compte
- Le code est bien organisé et maintenable
