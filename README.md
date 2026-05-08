# FootClub

Application web simple pour la gestion d'un club de football junior (FC Ste-Croix).

Auteur
-------
Blinar FETIU (apprenti CFC 4e année informaticien, infrastructure)

Objectif
-------
Fournir une interface légère pour gérer les équipes, les entraîneurs, les événements et les membres du club FC Ste-Croix (Réalisation TPI 2026).

Stack
-----
- Backend : Node.js + Express (ES Modules)
- Frontend : HTML, CSS et JS natif (pas de frameworks)
- Base de données : PostgreSQL via `pg`
- Auth : `express-session` + `bcrypt`
- Configuration : fichier `.env` lu via `dotenv`
- Créer un fichier `.env` à la racine en copiant `.env.example` (pas encore créé)

Structure principale
-------------------
- `server.js` : point d'entrée (chargement des middleware, routes et serveur)
- `src/config/db.js` : connexion PostgreSQL
- `src/routes/` : déclarations des routes
- `src/controllers/` : logique métier et requêtes DB
- `src/middleware/` : vérification de session / rôles
- `public/` : assets statiques (pages HTML, CSS, JS, images)


