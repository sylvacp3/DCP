# DCP Matériel — Backend (Node + Express + PostgreSQL)

API du système de gestion de matériel de la DCP, Trésor Madagascar.

## Structure

```
dcp-backend/
├─ src/
│  ├─ config/db.js          → pool de connexion PostgreSQL
│  ├─ db/
│  │  ├─ schema.sql         → schéma complet (tables, types, index, triggers)
│  │  ├─ seed.sql           → données de démonstration
│  │  ├─ migrate.js         → applique schema.sql
│  │  └─ runSeed.js         → charge seed.sql
│  ├─ middleware/auth.js    → vérification JWT + contrôle des rôles
│  ├─ controllers/          → logique métier par module
│  ├─ routes/               → définition des endpoints par module
│  ├─ utils/asyncHandler.js → wrapper pour les erreurs async
│  ├─ app.js                → configuration Express (middlewares, routes, erreurs)
│  └─ server.js             → point d'entrée (démarre le serveur HTTP)
├─ .env.example
└─ package.json
```

## Modèle de données

Tables principales : `utilisateurs`, `services`, `agents`, `fournisseurs`,
`categories_materiel`, `materiels`, `entrees` / `entree_lignes`,
`sorties` / `sortie_lignes`, `maintenances`, `inventaires` / `inventaire_lignes`.

Le cœur du système est **`materiels.stock_disponible`**, mis à jour de façon
transactionnelle à chaque bordereau de sortie (`sorties`) : le stock est
vérifié et décrémenté dans une seule transaction PostgreSQL (`BEGIN` /
`COMMIT` / `ROLLBACK`), avec verrouillage de ligne (`FOR UPDATE`) pour éviter
les doubles affectations en cas d'accès concurrents.

## Installation

### 1. Prérequis
- Node.js 18+
- PostgreSQL 14+ installé et démarré

### 2. Créer la base
```bash
createdb dcp_materiel
```

### 3. Configurer l'environnement
```bash
cp .env.example .env
# Éditez .env avec vos identifiants PostgreSQL et un JWT_SECRET fort
```

### 4. Installer les dépendances
```bash
npm install
```

### 5. Appliquer le schéma puis charger les données de démonstration
```bash
npm run db:init   # applique src/db/schema.sql
npm run db:seed   # insère src/db/seed.sql
```

### 6. Démarrer le serveur
```bash
npm run dev     # avec rechargement automatique (nodemon)
# ou
npm start
```

L'API est disponible sur `http://localhost:4000/api`.

## Compte de démonstration

Après le seed, un utilisateur admin est disponible :

- **email** : `admin@tresor.mg`
- **mot de passe** : `admin1234`

⚠️ À changer avant tout déploiement réel.

## Créer un nouvel utilisateur (hash bcrypt manuel)

Tant qu'il n'y a pas encore de route d'inscription, générez un hash et
insérez-le vous-même :

```bash
node -e "console.log(require('bcryptjs').hashSync('votre_mot_de_passe', 10))"
```

```sql
INSERT INTO utilisateurs (nom, email, mot_de_passe, role)
VALUES ('Nom Agent', 'email@tresor.mg', '<hash_généré>', 'gestionnaire');
```

## Endpoints principaux

Toutes les routes (sauf `/auth/login` et `/health`) nécessitent
l'en-tête `Authorization: Bearer <token>`.

| Méthode | Route                        | Rôle requis            | Description                          |
|---------|------------------------------|-------------------------|--------------------------------------|
| POST    | `/api/auth/login`            | —                       | Connexion, retourne un JWT           |
| GET     | `/api/auth/me`                | authentifié             | Profil de l'utilisateur connecté     |
| GET     | `/api/materiels`              | authentifié             | Liste + recherche (`?recherche=`)    |
| POST    | `/api/materiels`              | admin, gestionnaire     | Créer un matériel                    |
| PUT     | `/api/materiels/:id`          | admin, gestionnaire     | Modifier un matériel                 |
| DELETE  | `/api/materiels/:id`          | admin                   | Supprimer un matériel                |
| GET     | `/api/services`               | authentifié             | Liste des services                   |
| GET     | `/api/agents`                 | authentifié             | Liste des agents (`?service_id=`)    |
| GET     | `/api/fournisseurs`           | authentifié             | Liste des fournisseurs               |
| GET     | `/api/sorties`                | authentifié             | Liste des bordereaux (`?statut=`)    |
| GET     | `/api/sorties/:id`            | authentifié             | Détail d'un bordereau + ses lignes   |
| POST    | `/api/sorties`                | admin, gestionnaire     | Créer un bordereau (décrémente le stock) |
| POST    | `/api/sorties/:id/annuler`    | admin, gestionnaire     | Annule un bordereau, restitue le stock |

### Exemple : connexion

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@tresor.mg","mot_de_passe":"admin1234"}'
```

### Exemple : créer un bordereau de sortie

```bash
curl -X POST http://localhost:4000/api/sorties \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
        "service_id": 1,
        "type_mouvement": "definitive",
        "lignes": [
          { "materiel_id": 1, "quantite": 2 },
          { "materiel_id": 2, "quantite": 1 }
        ]
      }'
```

## Prochaines étapes suggérées

- Ajouter les modules **Entrées**, **Maintenance** et **Inventaire annuel**
  (le schéma les couvre déjà, seuls les contrôleurs/routes restent à écrire,
  sur le même modèle que `sorties`).
- Construire le frontend React qui consomme cette API à partir du mockup déjà validé.
- Ajouter des tests (Jest + supertest) sur les contrôleurs critiques (`sorties`).
