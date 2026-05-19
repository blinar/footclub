import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

// Vérifie qu'un cookie JWT existe et qu'il est encore valide
export function requireAuth(request, response, next) {
  const token = request.cookies.token; // Récupère le JWT stocké dans le cookie

  if (!token) return response.redirect('/sign-in.html'); // Sans cookie, la personne doit se reconnecter

  try {
    request.user = jwt.verify(token, process.env.JWT_SECRET); // Décode le token et récupère les infos du compte
    next(); // Le token est valide, on laisse continuer
  } catch {
    response.redirect('/sign-in.html'); // Token expiré ou modifié, retour à la connexion
  }
}

// Vérifie si un joueur est rattaché à une équipe via le champ team_id
export async function hasTeamAccess(userId) {
  try {
    // On ne sélectionne que team_id pour ne pas charger les données inutiles
    const teamQueryResult = await pool.query('SELECT team_id FROM users WHERE id = $1', [userId]);
    const user = teamQueryResult.rows[0];
    // Retourne true si le compte existe et possède une équipe assignée
    return !!user?.team_id;
  } catch {
    return false;
  }
}

// Autorise les admins et entraîneurs, et les joueurs seulement s'ils ont une équipe
export async function requireAppAccess(request, response, next) {
  if (request.user.role === 1 || request.user.role === 2) return next();

  if (request.user.role !== 3) return response.status(403).send('Accès interdit');

  const hasAccess = await hasTeamAccess(request.user.id);

  if (!hasAccess) return response.redirect('/pages/user/access-pending.html'); // Le joueur attend qu'on l'ajoute à une équipe

  next(); // Le compte est rattaché à une équipe, il peut entrer
}

// Vérifie que le compte est bien un admin
export function requireAdmin(request, response, next) {
  if (request.user.role !== 1) return response.status(403).send('Accès interdit');
  next();
}

// Vérifie que le compte est bien un entraîneur
export function requireCoach(request, response, next) {
  if (request.user.role !== 2) return response.status(403).send('Accès interdit');
  next();
}
