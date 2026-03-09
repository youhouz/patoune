# 🐾 Pépète

**Le compagnon de vos compagnons** — Scanner produits, garde animaux, assistant IA.

## Architecture

| Dossier | Description |
|---------|-------------|
| `backend/` | API Node.js/Express + MongoDB + Socket.IO |
| `app-expo/` | Application Expo (iOS, Android, Web/PWA) |
| `app/` | Application React Native legacy |

## Démarrage rapide

### Backend

```bash
cd backend
cp .env.example .env   # Configurer MONGODB_URI, JWT_SECRET, etc.
npm install
npm run dev
```

Vérifier : `http://localhost:5000/api/health`

### App Expo

```bash
cd app-expo
cp .env.example .env   # Configurer EXPO_PUBLIC_API_URL
npm install
npm start
```

- Web : `w`
- iOS : `i`
- Android : `a`

## Fonctionnalités

- **Scanner** — Scan de codes-barres de produits alimentaires pour animaux avec score nutritionnel
- **Garde** — Recherche géolocalisée de gardiens, réservation, messagerie temps réel
- **IA** — Assistant IA spécialisé animaux de compagnie (Claude)
- **Profil** — Gestion animaux, historique scans, réservations

## API Endpoints

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/auth/register` | Inscription |
| POST | `/api/auth/login` | Connexion |
| GET | `/api/auth/me` | Profil connecté |
| GET | `/api/pets` | Mes animaux |
| POST | `/api/pets` | Ajouter un animal |
| GET | `/api/products/scan/:barcode` | Scanner un produit |
| GET | `/api/products/history` | Historique scans |
| GET | `/api/petsitters` | Rechercher des gardiens |
| POST | `/api/bookings` | Créer une réservation |
| POST | `/api/messages` | Envoyer un message |
| POST | `/api/reviews` | Laisser un avis |
| POST | `/api/ai/ask` | Assistant IA |
| GET | `/api/health` | Santé du serveur |

## Déploiement

- **Backend** : Vercel (serverless via `api/index.js`) ou Render (`render.yaml`)
- **Frontend** : Expo EAS Build / Expo Web export

## Variables d'environnement

Voir les fichiers `.env.example` dans chaque dossier.
