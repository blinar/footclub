import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { hasTeamAccess } from '../middleware/auth.middleware.js';

// Cherche la saison en cours pour l'ajouter au cookie JWT
async function getCurrentSeasonId() {
  const result = await pool.query(
    'SELECT id FROM seasons WHERE CURRENT_DATE BETWEEN start_date AND end_date ORDER BY start_date DESC LIMIT 1'
  );

  return result.rows[0]?.id || null;
}

// Connexion : cherche le compte, vérifie le mot de passe et crée le cookie JWT
export async function login(request, response) {
  const { email, password } = request.body;

  // Sans email ou mot de passe, on ne peut pas comparer avec la base
  if (!email || !password) return response.redirect('/sign-in.html?error=1');

  try {
    // Cherche le compte lié à l'email saisi
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    // Si le compte n'existe pas ou si le mot de passe est faux
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return response.redirect('/sign-in.html?error=1');
    }

    const season_id = await getCurrentSeasonId();

    // Le token contient l'id, le rôle, le nom, l'équipe et la saison courante
    const token = jwt.sign(
      { id: user.id, role: user.role, full_name: user.full_name, team_id: user.team_id, season_id },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    // httpOnly : JavaScript ne peut pas lire le cookie (protection XSS)
    // sameSite strict : le cookie n'est pas envoyé depuis un autre site (protection CSRF)
    response.cookie('token', token, { httpOnly: true, sameSite: 'strict' });

    // Chaque rôle arrive sur sa propre page
    if (user.role === 1) return response.redirect('/pages/admin/teams.html');
    if (user.role === 2) return response.redirect('/pages/coach/calendar.html');

    // Un joueur sans équipe ne peut pas encore entrer dans l'application
    const hasAccess = await hasTeamAccess(user.id);
    if (!hasAccess) return response.redirect('/pages/user/access-pending.html');

    return response.redirect('/pages/user/calendar.html');

  } catch (error) {
    console.error('Erreur login :', error);
    response.redirect('/sign-in.html?error=1');
  }
}

// Inscription : crée un compte joueur avec le rôle 3
export async function register(request, response) {
  const { full_name, email, password } = request.body;
  try {
    // Vérifie si l'email existe déjà pour éviter un doublon
    const existingUserQuery = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUserQuery.rows.length > 0) {
      return response.redirect('/sign-up.html?error=1');
    }

    // On hash le mot de passe avant de l'enregistrer
    const hashedPassword = await bcrypt.hash(password, 10);

    // Le compte est créé en rôle 3, donc joueur standard
    await pool.query(
      'INSERT INTO users (full_name, email, password, role) VALUES ($1, $2, $3, 3)',
      [full_name, email, hashedPassword]
    );

    response.redirect('/pages/user/access-pending.html');
  } catch (error) {
    console.error('Erreur register :', error);
    response.redirect('/sign-up.html?error=1');
  }
}

// Changement de mot de passe : vérifie l'ancien mot de passe puis remplace par le nouveau
export async function changePassword(request, response) {
  const { currentPassword, newPassword, confirmPassword, returnTo } = request.body;
  const targetPages = ['/pages/user/settings.html', '/pages/coach/settings.html', '/pages/admin/settings.html'];
  const targetPage = targetPages.includes(returnTo) ? returnTo : '/pages/user/settings.html';

  if (!currentPassword || !newPassword) {
    return response.redirect(`${targetPage}?error=1`);
  }

  // Les deux nouveaux mots de passe doivent être identiques
  if (!confirmPassword || newPassword !== confirmPassword) {
    return response.redirect(`${targetPage}?error=3`);
  }

  try {
    // On récupère le mot de passe actuel du compte connecté
    const result = await pool.query('SELECT id, password FROM users WHERE id = $1', [request.user.id]);
    const user = result.rows[0];

    // Si le mot de passe actuel est faux, on refuse la mise à jour
    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
      return response.redirect(`${targetPage}?error=2`);
    }

    // On hash le nouveau mot de passe avant l'enregistrement
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, request.user.id]);

    response.redirect(`${targetPage}?success=1`);
  } catch (error) {
    console.error('Erreur changePassword :', error);
    response.redirect(`${targetPage}?error=1`);
  }
}

// Déconnexion : supprime le cookie JWT et renvoie vers la connexion
export function logout(request, response) {
  response.clearCookie('token');
  response.redirect('/sign-in.html');
}
