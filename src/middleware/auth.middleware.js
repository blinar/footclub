import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

// Vérifie qu'un cookie JWT existe et qu'il est encore valide
export function requireAuth(req, res, next) {
  const token = req.cookies.token; // Récupère le JWT stocké dans le cookie

  if (!token) return res.redirect('/pages/sign-in.html'); // Sans cookie, la personne doit se reconnecter

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET); // Décode le token et récupère les infos du compte
    next(); // Le token est valide, on laisse continuer
  } catch {
    res.redirect('/pages/sign-in.html'); // Token expiré ou modifié, retour à la connexion
  }
}

// Vérifie si un joueur est déjà relié à une équipe
export async function hasTeamAccess(userId) {
  try {
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    if (!user) return false;

    // Cas simple : le compte a déjà un champ team_id rempli
    if ('team_id' in user && user.team_id) return true;

    // Sinon, on teste les tables de liaison possibles du projet
    const checks = [
      'SELECT 1 FROM user_teams WHERE user_id = $1 LIMIT 1',
      'SELECT 1 FROM team_members WHERE user_id = $1 LIMIT 1',
      'SELECT 1 FROM members WHERE user_id = $1 LIMIT 1'
    ];

    for (const queryText of checks) {
      try {
        const result = await pool.query(queryText, [userId]);
        if (result.rowCount > 0) return true;
      } catch {
        // Si la table n'existe pas, on essaie la suivante
      }
    }

    return false;
  } catch {
    return false;
  }
}

// Autorise les admins et entraîneurs, et les joueurs seulement s'ils ont une équipe
export async function requireAppAccess(req, res, next) {
  if (req.user.role === 1 || req.user.role === 2) return next();

  if (req.user.role !== 3) return res.status(403).send('Accès interdit');

  const hasAccess = await hasTeamAccess(req.user.id);

  if (!hasAccess) return res.redirect('/pages/access-pending.html'); // Le joueur attend qu'on l'ajoute à une équipe

  next(); // Le compte est rattaché à une équipe, il peut entrer
}

// Vérifie que le compte est bien un admin
export function requireAdmin(req, res, next) {
  if (req.user.role !== 1) return res.status(403).send('Accès interdit');
  next();
}

// Vérifie que le compte est bien un entraîneur
export function requireCoach(req, res, next) {
  if (req.user.role !== 2) return res.status(403).send('Accès interdit');
  next();
}
