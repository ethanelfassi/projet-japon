# 🇯🇵 Projet Japon - Planificateur de Voyage & Journal de Souvenirs

Un planificateur de voyage interactif et un journal de souvenirs collaboratif conçu pour organiser votre voyage au Japon. L'application combine une gestion de budget et de planning, une carte interactive pour visualiser les lieux et activités, et un carnet de timbres (stamps) pour documenter les souvenirs avec un style rétro japonais.

---

## 🌟 Fonctionnalités

### 1. 📅 Planification des Lieux et Activités
* **Organisation structurée** : Ajoutez des lieux à visiter (temples, restaurants, boutiques...) ou des activités à faire.
* **Statut en temps réel** : Marquez les lieux comme `Planifié` (Planned) ou `Visité` (Visited).
* **Filtres intelligents** : Filtrez et recherchez les lieux par type, statut, visibilité, ou recherche textuelle.
* **Géolocalisation** : Assignez des coordonnées géographiques (latitude et longitude) à chaque lieu.

### 2. 🗺️ Carte Interactive (Leaflet)
* **Visualisation cartographique** : Tous vos points d'intérêt s'affichent sur une carte dynamique interactive alimentée par Leaflet.
* **Navigation directe** : Cliquez sur un marqueur sur la carte pour accéder instantanément aux détails du lieu dans la liste.

### 3. 📸 Carnet de Timbres (Stamps) & Album Photo
* **Photos de souvenirs** : Associez plusieurs photos à chaque lieu visité.
* **Système de "Stamps" (Timbres)** : Option permettant de transformer une photo en timbre souvenir virtuel avec plusieurs styles de bordures et de designs (par exemple, le style *classic* inspiré des timbres de gares japonaises).
* **Gestion d'album** : Visualisez l'intégralité de vos photos et timbres classés par ordre chronologique, avec possibilité de les supprimer.

### 4. 👥 Groupes & Collaboration
* **Voyage à plusieurs** : Créez des groupes de voyage et invitez d'autres membres enregistrés sur l'application.
* **Gestion fine de la visibilité** :
  * `Public` : Visible par tout le monde (visiteurs compris).
  * `Privé` : Uniquement visible par son créateur.
  * `Groupe` : Partagé uniquement avec les membres d'un groupe spécifique pour planifier ensemble.

### 5. 🔐 Authentification & Sécurité
* **Comptes utilisateurs** : Inscription et connexion sécurisées.
* **Sécurité des données** : Hashage des mots de passe avec `bcrypt` côté backend et sécurisation des routes API via des tokens `JSON Web Tokens (JWT)`.

---

## 🛠️ Stack Technique

### Backend
* **Runtime** : Node.js (v20)
* **Framework** : Express (v5)
* **Base de données** : SQLite (via `better-sqlite3` pour d'excellentes performances)
* **Uploads** : Multer (gestion des fichiers images)
* **Sécurité & Auth** : `bcrypt` (hashage) & `jsonwebtoken` (sessions JWT)
* **Développement** : `nodemon` pour le rechargement à chaud

### Frontend
* **Build tool** : Vite
* **Framework** : React 19
* **Cartographie** : Leaflet & React-Leaflet
* **Animations** : Framer Motion (transitions fluides, micro-animations)
* **Icônes** : Lucide React
* **Requêtes HTTP** : Axios
* **Styling** : CSS natif (Design premium avec thématique sombre, effets de flou type glassmorphism et dégradés modernes)

### Conteneurisation
* **Docker** : Dockerfiles optimisés pour le multi-stage build (frontend servi via Nginx).
* **Docker Compose** : Orchestration en une seule commande pour le frontend et le backend.

---

## 📂 Structure du Projet

```text
projet_japon/
├── backend/
│   ├── database.js          # Initialisation de SQLite & structure des tables
│   ├── migrate.js           # Scripts de migration de la base de données
│   ├── server.js            # Serveur Express & API endpoints
│   ├── japan_trip.db        # Fichier de base de données SQLite (généré)
│   ├── Dockerfile           # Configuration Docker du backend
│   └── uploads/             # Dossier contenant les photos envoyées (ignoré par Git)
├── frontend/
│   ├── src/
│   │   ├── components/      # Composants React (Auth, Map, Album, PlaceList...)
│   │   ├── App.jsx          # Logique principale & routage d'onglets
│   │   ├── index.css        # Charte graphique & variables CSS
│   │   └── main.jsx         # Point d'entrée React
│   ├── Dockerfile           # Configuration Docker du frontend (Nginx)
│   ├── nginx.conf           # Configuration du serveur web Nginx pour le SPA React
│   └── vite.config.js       # Configuration Vite
└── docker-compose.yml       # Orchestration des conteneurs
```

---

## 💾 Schéma de la Base de Données (SQLite)

```sql
-- Utilisateurs
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Groupes de voyage
CREATE TABLE groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  created_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Membres des groupes
CREATE TABLE group_members (
  group_id INTEGER,
  user_id INTEGER,
  PRIMARY KEY (group_id, user_id),
  FOREIGN KEY (group_id) REFERENCES groups(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Lieux et Activités
CREATE TABLE places (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  type TEXT DEFAULT 'place',                     -- 'place' ou 'activity'
  status TEXT DEFAULT 'planned',                 -- 'planned' ou 'visited'
  lat REAL,
  lng REAL,
  visibility TEXT DEFAULT 'public',              -- 'public', 'private' ou 'group'
  created_by INTEGER,
  group_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (group_id) REFERENCES groups(id)
);

-- Photos & Stamps
CREATE TABLE photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  place_id INTEGER,
  url TEXT NOT NULL,
  caption TEXT,
  is_stamp INTEGER DEFAULT 0,                    -- 1 pour Oui, 0 pour Non
  stamp_style TEXT DEFAULT 'classic',            -- Style visuel du timbre
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (place_id) REFERENCES places(id)
);
```

---

## 🚀 Démarrage et Installation

### Option 1 : Via Docker Compose (Recommandé)

Assurez-vous d'avoir Docker et Docker Compose installés sur votre machine.

1. **Lancer les services** :
   ```bash
   docker-compose up --build
   ```
2. **Accéder à l'application** :
   * Frontend : [http://localhost:8080](http://localhost:8080)
   * Backend API : [http://localhost:5000](http://localhost:5000)

*Note : Les volumes Docker sont configurés pour sauvegarder localement la base de données (`backend/japan_trip.db`) et les fichiers envoyés (`backend/uploads/`).*

---

### Option 2 : Installation Locale (Développement)

#### 1. Backend
1. Naviguez dans le dossier backend :
   ```bash
   cd backend
   ```
2. Installez les dépendances :
   ```bash
   npm install
   ```
3. Initialisez/Lancez la migration de la base de données :
   ```bash
   node migrate.js
   ```
4. Démarrez le serveur en mode développement :
   ```bash
   npm run dev
   ```
   Le serveur s'exécutera sur `http://localhost:5000`.

#### 2. Frontend
1. Naviguez dans le dossier frontend :
   ```bash
   cd ../frontend
   ```
2. Installez les dépendances :
   ```bash
   npm install
   ```
3. Lancez le serveur de développement Vite :
   ```bash
   npm run dev
   ```
   L'application sera accessible sur `http://localhost:5173`.
