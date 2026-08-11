# DCP Matériel — Frontend (React + Vite)

Interface web du système de gestion de matériel de la DCP, Trésor Madagascar.
Consomme l'API du dossier `dcp-backend`.

## Structure

```
dcp-frontend/
├─ src/
│  ├─ api/client.js         → wrapper fetch : attache le JWT, gère les erreurs 401
│  ├─ context/AuthContext.jsx → login/logout, utilisateur courant (persisté en localStorage)
│  ├─ components/
│  │  ├─ Sidebar.jsx        → navigation
│  │  ├─ Layout.jsx         → sidebar + zone de contenu
│  │  └─ ProtectedRoute.jsx → redirige vers /login si non authentifié
│  ├─ pages/
│  │  ├─ Login.jsx
│  │  ├─ Dashboard.jsx      → KPIs + alertes de stock bas
│  │  ├─ Materiels.jsx      → catalogue
│  │  ├─ NouvelleSortie.jsx → écran principal (reprend le mockup validé)
│  │  ├─ Sorties.jsx        → historique des bordereaux
│  │  ├─ Agents.jsx / Services.jsx / Fournisseurs.jsx → annuaires
│  ├─ styles/theme.css      → thème visuel (vert bouteille + or), repris du mockup
│  └─ App.jsx                → routes
```

## Installation

### 1. Prérequis
Le backend (`dcp-backend`) doit être démarré sur `http://localhost:4000`.

### 2. Configurer l'environnement
```bash
cp .env.example .env
# VITE_API_URL doit pointer vers votre API (par défaut http://localhost:4000/api)
```

### 3. Installer et lancer
```bash
npm install
npm run dev
```

L'application est disponible sur `http://localhost:5173`.

Connectez-vous avec le compte de démonstration du backend :
- **email** : `admin@tresor.mg`
- **mot de passe** : `admin1234`

## Fonctionnement de l'écran "Nouvelle sortie"

1. Au chargement, la page récupère `/materiels`, `/services` et `/agents`.
2. Cliquer sur un matériel l'ajoute au bordereau (respecte le stock disponible).
3. Le bénéficiaire (service ou agent) et le type de mouvement sont choisis dans le panneau de droite.
4. "Valider la sortie" envoie `POST /api/sorties` — le backend vérifie et décrémente
   le stock dans une transaction. Les stocks affichés sont rafraîchis après validation.

## Prochaines étapes suggérées

- Pages de création/édition pour Matériels, Agents, Services, Fournisseurs
  (le backend expose déjà les routes `POST`/`PUT`/`DELETE` correspondantes).
- Modules Entrées, Maintenance, Inventaire annuel côté frontend, une fois
  leurs contrôleurs ajoutés côté backend.
- Pagination sur les listes si le volume de données augmente.
