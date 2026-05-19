# FootClub

## C'est quoi ?

**FootClub** est une application web pour gérer un club de football. Ce projet a été fait dans le cadre du **TPI CFC Informaticien 2026** par **Blinar Fetiu**.

- Les **joueurs** peuvent voir le calendrier de leur équipe, les membres de leur groupe et leurs paramètres.
- Les **entraîneurs** peuvent gérer les matchs, les entraînements et les joueurs de leur équipe.
- L'**admin** (le gérant du club) peut créer des équipes et assigner des entraîneurs.

---

## Technologies utilisées

Le projet ne peut pas utiliser de frameworks front-end. Voici ce qui est utilisé :

**Côté serveur (backend) :**

- **Node.js** avec `"type": "module"` pour les imports.
- **Express.js** pour les routes et les vérifications d'accès.
- **PostgreSQL** avec la librairie `pg` pour la base de données.
- **bcrypt** pour chiffrer les mots de passe.
- **jsonwebtoken** pour créer un token de connexion (JWT) stocké dans un cookie.
- **dotenv** pour les variables d'environnement.
- **cookie-parser** pour lire le cookie dans les requêtes.

**Côté navigateur (frontend) :**

- **HTML5** pur, sans framework.
- **CSS3** pur, sans framework.
- **JavaScript** pur avec `fetch` pour appeler le serveur.

---

## Structure des fichiers

```text
footclub/
├── server.js                   # Démarrage du serveur, enregistrement des routes
├── package.json                # Liste des packages et scripts
├── .env                        # Paramètres de connexion (port, base de données, secret JWT)
├── Script.sql                  # Création de la base de données + données de départ
│
├── src/
│   ├── config/
│   │   └── db.js               # Connexion à la base de données PostgreSQL
│   │
│   ├── controllers/            # Code qui traite les requêtes et parle à la base de données
│   │   ├── auth.controller.js          # Connexion, inscription, déconnexion, changement de mot de passe
│   │   ├── coach.controller.js         # Équipe et événements (entraîneur)
│   │   ├── user.controller.js          # Équipe en lecture seule (joueur)
│   │   ├── admin.teams.controller.js   # Gestion des équipes et entraîneurs (admin)
│   │   ├── events.controller.js        # Page liste des événements
│   │   └── settings.controller.js      # Pages paramètres (avec nom et équipe injectés)
│   │
│   ├── middleware/
│   │   └── auth.middleware.js   # Vérifie si l'utilisateur est connecté et a le bon rôle
│   │
│   └── routes/
│       ├── auth.routes.js       # /auth/* : connexion, inscription, déconnexion
│       ├── admin.routes.js      # /admin/* : réservé à l'admin
│       ├── coach.routes.js      # /coach/* : réservé à l'entraîneur
│       └── user.routes.js       # /user/* : réservé au joueur connecté
│
└── public/                      # Fichiers envoyés directement au navigateur
    ├── css/
    │   ├── style.css            # Styles de l'application (pages connectées)
    │   └── landing.css          # Styles des pages publiques (accueil, équipes, contact)
    │
    ├── js/
    │   ├── sign-in.js / sign-up.js     # Formulaires de connexion et d'inscription
    │   ├── calendar-coach.js           # Calendrier de l'entraîneur
    │   ├── calendar-user.js            # Calendrier du joueur
    │   ├── team-coach.js               # Gestion des membres de l'équipe (entraîneur)
    │   ├── team-user.js                # Vue des membres de l'équipe (joueur)
    │   ├── add-member.js               # Formulaire pour ajouter un joueur
    │   ├── add-event.js                # Formulaire pour créer un événement
    │   ├── edit-event.js               # Formulaire pour modifier un événement
    │   └── admin-teams.js              # Gestion des équipes (admin)
    │
    ├── images/                  # Logos et images
    ├── sign-in.html             # Page de connexion (accessible à tous)
    ├── sign-up.html             # Page d'inscription (accessible à tous)
    │
    └── pages/
        ├── home.html            # Page d'accueil (accessible à tous)
        ├── teams.html           # Présentation des équipes (accessible à tous)
        ├── contact-us.html      # Page contact (accessible à tous)
        │
        ├── admin/
        │   ├── teams.html       # Tableau de bord admin
        │   └── settings.html    # Paramètres admin
        │
        ├── coach/
        │   ├── calendar.html    # Calendrier de l'équipe
        │   ├── team.html        # Membres de l'équipe
        │   ├── add-member.html  # Ajouter un joueur
        │   ├── add-event.html   # Créer un événement
        │   ├── edit-event.html  # Modifier un événement
        │   └── settings.html    # Paramètres entraîneur
        │
        └── user/
            ├── calendar.html    # Calendrier (lecture seule)
            ├── team.html        # Membres de l'équipe (lecture seule)
            ├── settings.html    # Paramètres joueur
            └── access-pending.html  # Page d'attente si le joueur n'a pas encore d'équipe
```

---

## Comment ça marche ?

### 1. Connexion

1. L'utilisateur entre son email et son mot de passe sur `sign-in.html`.
2. Le serveur vérifie le mot de passe (avec `bcrypt`).
3. Si c'est bon, un **token JWT** (valable 8h) est créé et mis dans un cookie sécurisé.
4. Le cookie est `httpOnly` (JavaScript ne peut pas le lire) et `sameSite: strict` (il ne part pas vers d'autres sites).
5. Selon le rôle : `1` = admin, `2` = entraîneur, `3` = joueur (ou page d'attente si pas encore dans une équipe).

### 2. Vérification des accès

Chaque page et chaque appel API passe d'abord par une vérification avant d'arriver au code principal :

| Vérification       | Ce qu'elle fait                                                                 |
| ------------------ | ------------------------------------------------------------------------------- |
| `requireAuth`      | Vérifie que le cookie JWT est présent et valide, sinon renvoie vers la connexion |
| `requireAppAccess` | Admin et entraîneur passent toujours. Un joueur sans équipe est bloqué sur la page d'attente |
| `requireAdmin`     | Bloque si le rôle n'est pas `1`                                                 |
| `requireCoach`     | Bloque si le rôle n'est pas `2`                                                 |

### 3. Appels au serveur

Le JavaScript dans le navigateur ne parle jamais directement à la base de données. Il passe toujours par le serveur :

1. Le navigateur appelle `fetch('/coach/events')`.
2. Express reçoit la demande et vérifie les accès (middlewares).
3. Le bon contrôleur fait la requête à la base de données.
4. Le résultat est renvoyé en JSON et la page est mise à jour.

### 4. Pages avec données injectées

Certaines pages reçoivent des données directement dans le HTML avant d'arriver au navigateur (nom de l'utilisateur, équipe…). Le serveur lit le fichier HTML, remplace les valeurs, et envoie le résultat :

- `settings.controller.js` → injecte le nom et l'équipe dans les pages paramètres.
- `admin.teams.controller.js` → injecte la liste des équipes dans la page admin.
- `events.controller.js` → injecte la liste des événements dans la page liste.

---

## Routes API

| Route                          | Méthode | Accès          | Description                                              |
| ------------------------------ | ------- | -------------- | -------------------------------------------------------- |
| `/auth/login`                  | POST    | Tous           | Connexion, crée le cookie JWT                            |
| `/auth/register`               | POST    | Tous           | Créer un compte joueur                                   |
| `/auth/logout`                 | GET/POST| Tous           | Supprime le cookie et redirige vers la connexion         |
| `/auth/change-password`        | POST    | Connecté       | Changer son mot de passe                                 |
| `/coach/team`                  | GET     | Entraîneur     | Voir les membres de son équipe                           |
| `/coach/team`                  | POST    | Entraîneur     | Ajouter un joueur à son équipe                           |
| `/coach/team/remove`           | POST    | Entraîneur     | Retirer un joueur de son équipe                          |
| `/coach/users`                 | GET     | Entraîneur     | Voir les joueurs sans équipe                             |
| `/coach/team-name`             | GET     | Entraîneur     | Nom de son équipe                                        |
| `/coach/events`                | GET     | Entraîneur     | Liste des événements de son équipe                       |
| `/coach/events/:id`            | GET     | Entraîneur     | Détails d'un événement                                   |
| `/coach/events`                | POST    | Entraîneur     | Créer un événement                                       |
| `/coach/events/:id/update`     | POST    | Entraîneur     | Modifier un événement                                    |
| `/coach/events/:id/delete`     | POST    | Entraîneur     | Supprimer un événement                                   |
| `/user/events`                 | GET     | Joueur         | Voir les événements de son équipe                        |
| `/user/team`                   | GET     | Joueur         | Voir les membres de son équipe                           |
| `/admin/teams`                 | POST    | Admin          | Créer une équipe                                         |
| `/admin/teams/:id/coach`       | POST    | Admin          | Assigner un entraîneur à une équipe                      |
| `/admin/teams/:id/coach/remove`| POST    | Admin          | Retirer un entraîneur d'une équipe                       |
| `/admin/teams/:id/delete`      | POST    | Admin          | Supprimer une équipe                                     |

> Les mots de passe ne sont jamais envoyés en clair. Toutes les requêtes SQL utilisent des paramètres (`$1`, `$2`…) pour éviter les injections.

---

## Base de données

Cinq tables principales :

- **`users`** : les comptes. `role` : `1` = admin, `2` = entraîneur, `3` = joueur. Les joueurs ont un `team_id` qui peut être vide (= pas encore dans une équipe).
- **`teams`** : les équipes du club, avec un `coach_id` optionnel.
- **`seasons`** : les saisons avec une date de début et de fin. L'ID de la saison en cours est mis dans le JWT à la connexion.
- **`events`** : les matchs et entraînements, liés à une équipe et une saison.
- **`event_types`** : les types d'événements (`match`, `training`).

Le fichier `Script.sql` crée toutes les tables et insère des données de départ (3 équipes, 4 entraîneurs, 6 joueurs, des événements).

---

## Lancer le projet

### Ce qu'il faut avoir

- **Node.js** installé
- **PostgreSQL** qui tourne avec une base de données

### Étape 1 : Créer le fichier de configuration

Créez un fichier `.env` à la racine du projet (`footclub/`) :

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=footclub
DB_USER=postgres
DB_PASSWORD=secret
SESSION_SECRET=votre_secret_session
JWT_SECRET=super_secret_token_1234
```

### Étape 2 : Créer la base de données

Dans PostgreSQL, créez une base de données puis lancez le fichier `Script.sql` :

```bash
psql -U postgres -d footclub_db -f Script.sql
```

### Étape 3 : Installer les packages

```bash
npm install
```

### Étape 4 : Démarrer le serveur

```bash
npm start
```

L'application est accessible sur `http://localhost:3000`.

### Comptes de test

| Rôle        | Email                        | Mot de passe   |
| ----------- | ---------------------------- | -------------- |
| Admin       | `fc-admin@footclub.com`      | `admin123`     |
| Entraîneur  | `florian.rochat@footclub.com`| `footclub123`  |
| Joueur      | `romain.bertholet@footclub.com` | `footclub123` |


