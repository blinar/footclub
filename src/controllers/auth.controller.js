import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { hasTeamAccess } from '../middleware/auth.middleware.js';

// Connexion : cherche le compte, vérifie le mot de passe et crée le cookie JWT
export async function login(req, res) {
  const { email, password } = req.body;

  // Sans email ou mot de passe, on ne peut pas comparer avec la base
  if (!email || !password) return res.redirect('/pages/sign-in.html?error=1');

  try {
    // Cherche le compte lié à l'email saisi
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    // Si le compte n'existe pas ou si le mot de passe est faux
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.redirect('/pages/sign-in.html?error=1');
    }

    // Le token contient l'id et le rôle pour reconnaître la personne plus tard
    const token = jwt.sign(
      { id: user.id, role: user.role, full_name: user.full_name },
      process.env.JWT_SECRET
    );

    // Le cookie HTTP-only évite que le JavaScript du navigateur lise le token
    res.cookie('token', token, { httpOnly: true });

    // Chaque rôle arrive sur sa propre page
    if (user.role === 1) return res.redirect('/pages/admin/teams.html');
    if (user.role === 2) return res.redirect('/pages/coach/calendar.html');

    // Un joueur sans équipe ne peut pas encore entrer dans l'application
    const hasAccess = await hasTeamAccess(user.id);
    if (!hasAccess) return res.redirect('/pages/access-pending.html');

    return res.redirect('/pages/user/calendar.html');

  } catch (err) {
    console.error('Erreur login :', err);
    res.redirect('/pages/sign-in.html?error=1');
  }
}

// Inscription : crée un compte joueur avec le rôle 3
export async function register(req, res) {
  const { full_name, email, password } = req.body;
  try {
    // Vérifie si l'email existe déjà pour éviter un doublon
    const existant = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existant.rows.length > 0) {
      return res.redirect('/pages/sign-up.html?error=1');
    }

    // On hash le mot de passe avant de l'enregistrer
    const hash = await bcrypt.hash(password, 10);

    // Le compte est créé en rôle 3, donc joueur standard
    await pool.query(
      'INSERT INTO users (full_name, email, password, role) VALUES ($1, $2, $3, 3)',
      [full_name, email, hash]
    );

    res.redirect('/pages/access-pending.html');
  } catch (err) {
    console.error('Erreur register :', err);
    res.redirect('/pages/sign-up.html?error=1');
  }
}

// Changement de mot de passe : vérifie l'ancien mot de passe puis remplace par le nouveau
export async function changePassword(req, res) {
  const { currentPassword, newPassword, confirmPassword, returnTo } = req.body;
  const targetPages = ['/pages/settings.html', '/pages/coach/settings.html', '/pages/admin/settings.html'];
  const targetPage = targetPages.includes(returnTo) ? returnTo : '/pages/settings.html';

  if (!currentPassword || !newPassword) {
    return res.redirect(`${targetPage}?error=1`);
  }

  // Les deux nouveaux mots de passe doivent être identiques
  if (!confirmPassword || newPassword !== confirmPassword) {
    return res.redirect(`${targetPage}?error=3`);
  }

  try {
    // On récupère le mot de passe actuel du compte connecté
    const result = await pool.query('SELECT id, password FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];

    // Si le mot de passe actuel est faux, on refuse la mise à jour
    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
      return res.redirect(`${targetPage}?error=2`);
    }

    // On hash le nouveau mot de passe avant l'enregistrement
    const hash = await bcrypt.hash(newPassword, 10);

    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hash, req.user.id]);

    res.redirect(`${targetPage}?success=1`);
  } catch (err) {
    console.error('Erreur changePassword :', err);
    res.redirect(`${targetPage}?error=1`);
  }
}

// Déconnexion : supprime le cookie JWT et renvoie vers la connexion
export function logout(req, res) {
  res.clearCookie('token');
  res.redirect('/pages/sign-in.html');
}
