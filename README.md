# Projet Japon

Application web collaborative pour planifier et partager un voyage au Japon — carte interactive, album photo, timbres-souvenirs et gestion de groupes.

## Stack

| Rôle | Service | URL |
|---|---|---|
| Frontend | React + Vite → Vercel | https://projet-japon-frontend.vercel.app |
| Backend | Node.js + Express → Vercel (serverless) | https://backend-three-self-67.vercel.app |
| Base de données | PostgreSQL → Neon | neon.tech |
| Stockage photos | Cloudinary | cloudinary.com |

## Fonctionnalités

- Liste des lieux et activités avec statut (planifié / visité)
- Carte interactive (Leaflet)
- Album photo + timbres-souvenirs style rétro japonais
- Groupes de voyage avec visibilité par groupe
- Système de rôles (visiteur / éditeur / admin)

## Rôles

| Rôle | Voir | Modifier / Uploader | Gérer les rôles |
|---|---|---|---|
| Visiteur | Oui | Non | Non |
| Editeur | Oui | Oui | Non |
| Admin | Oui | Oui | Oui |

Les admins sont assignés automatiquement à l'inscription selon le pseudo :
`ethan`, `laurine`, `lwi`, `ruben`, `ameline` → **admin**
Tous les autres → **visiteur** (promouvable par un admin depuis le panel)

---

## Déploiement en production

### Prérequis

- Node.js installé
- Vercel CLI installé : `npm install -g vercel`
- Connecté à Vercel : `vercel login` (compte `annelouis082`)

### Déployer après chaque modification

```bash
# Backend
cd backend
vercel --prod

# Frontend
cd ../frontend
vercel --prod
```

### Variables d'environnement (backend)

Configurées sur le dashboard Vercel du projet `backend` :

```
DATABASE_URL          → Connection string Neon
JWT_SECRET            → japan2026secretkey
CLOUDINARY_CLOUD_NAME → dashboard Cloudinary
CLOUDINARY_API_KEY    → dashboard Cloudinary
CLOUDINARY_API_SECRET → dashboard Cloudinary
```

Pour le développement local, copie `backend/.env.example` en `backend/.env` et remplis les valeurs.

---

## Développement local

```bash
# Backend (port 5000)
cd backend
npm install
npm run dev

# Frontend (port 5173) — dans un autre terminal
cd frontend
npm install
npm run dev
```

Le frontend proxifie automatiquement `/api` vers `localhost:5000` en local.

## Structure du projet

```
projet-japon/
├── backend/
│   ├── server.js       # API Express (routes, auth, rôles)
│   ├── database.js     # Connexion Neon + création des tables
│   ├── vercel.json     # Config déploiement Vercel serverless
│   └── .env.example    # Modèle des variables d'environnement
├── frontend/
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── App.jsx     # Routing et état global
│   │   └── index.css   # Design glassmorphism
│   └── vercel.json     # Config SPA routing Vercel
└── docker-compose.yml  # Environnement Docker local
```
