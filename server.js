import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import cookieParser from 'cookie-parser';
import 'dotenv/config';
import './src/config/db.js';
import authRoutes from './src/routes/auth.routes.js';
import { requireAuth, requireAdmin, requireCoach, requireAppAccess } from './src/middleware/auth.middleware.js';

const app = express();
const port = process.env.PORT;

// Lit un fichier HTML et l'envoie tel quel
async function sendHtmlPage(res, relativePath) {
  const filePath = path.resolve(relativePath);
  const html = await fs.readFile(filePath, 'utf8');
  res.type('html').send(html);
}

app.use(cookieParser());

app.use(express.urlencoded({ extended: false }));

// Page d'attente pour les joueurs sans équipe
app.get('/pages/access-pending.html', async (req, res) => {
  try {
    await sendHtmlPage(res, 'public/pages/access-pending.html');
  } catch (err) {
    console.error('Erreur page attente :', err);
    res.status(500).send('Erreur serveur');
  }
});

// Pages admin protégées
app.get('/pages/admin/teams.html', requireAuth, requireAppAccess, requireAdmin, async (req, res) => {
  try {
    await sendHtmlPage(res, 'public/pages/admin/teams.html');
  } catch (err) {
    console.error('Erreur page admin teams :', err);
    res.status(500).send('Erreur serveur');
  }
});

app.get('/pages/admin/create-team.html', requireAuth, requireAppAccess, requireAdmin, async (req, res) => {
  try {
    await sendHtmlPage(res, 'public/pages/admin/create-team.html');
  } catch (err) {
    console.error('Erreur page create team :', err);
    res.status(500).send('Erreur serveur');
  }
});

app.get('/pages/admin/add-coach.html', requireAuth, requireAppAccess, requireAdmin, async (req, res) => {
  try {
    await sendHtmlPage(res, 'public/pages/admin/add-coach.html');
  } catch (err) {
    console.error('Erreur page add coach :', err);
    res.status(500).send('Erreur serveur');
  }
});

app.get('/pages/admin/settings.html', requireAuth, requireAppAccess, requireAdmin, async (req, res) => {
  try {
    let html = await fs.readFile(path.resolve('public/pages/admin/settings.html'), 'utf8');

    let stateClass = 'settings-state-default';
    if (req.query.error === '1') stateClass = 'settings-state-error-1';
    if (req.query.error === '2') stateClass = 'settings-state-error-2';
    if (req.query.success === '1') stateClass = 'settings-state-success';

    html = html.replace('settings-state-default', stateClass);
    res.type('html').send(html);
  } catch (err) {
    console.error('Erreur page admin settings :', err);
    res.status(500).send('Erreur serveur');
  }
});

// Pages coach protégées
app.get('/pages/coach/calendar.html', requireAuth, requireAppAccess, requireCoach, async (req, res) => {
  try {
    await sendHtmlPage(res, 'public/pages/coach/calendar.html');
  } catch (err) {
    console.error('Erreur page coach calendar :', err);
    res.status(500).send('Erreur serveur');
  }
});

app.get('/pages/coach/team.html', requireAuth, requireAppAccess, requireCoach, async (req, res) => {
  try {
    await sendHtmlPage(res, 'public/pages/coach/team.html');
  } catch (err) {
    console.error('Erreur page coach team :', err);
    res.status(500).send('Erreur serveur');
  }
});

app.get('/pages/coach/add-member.html', requireAuth, requireAppAccess, requireCoach, async (req, res) => {
  try {
    await sendHtmlPage(res, 'public/pages/coach/add-member.html');
  } catch (err) {
    console.error('Erreur page add member :', err);
    res.status(500).send('Erreur serveur');
  }
});

app.get('/pages/coach/add-event.html', requireAuth, requireAppAccess, requireCoach, async (req, res) => {
  try {
    await sendHtmlPage(res, 'public/pages/coach/add-event.html');
  } catch (err) {
    console.error('Erreur page add event :', err);
    res.status(500).send('Erreur serveur');
  }
});

app.get('/pages/coach/edit-event.html', requireAuth, requireAppAccess, requireCoach, async (req, res) => {
  try {
    await sendHtmlPage(res, 'public/pages/coach/edit-event.html');
  } catch (err) {
    console.error('Erreur page edit event :', err);
    res.status(500).send('Erreur serveur');
  }
});

app.get('/pages/coach/settings.html', requireAuth, requireAppAccess, requireCoach, async (req, res) => {
  try {
    let html = await fs.readFile(path.resolve('public/pages/coach/settings.html'), 'utf8');

    let stateClass = 'settings-state-default';
    if (req.query.error === '1') stateClass = 'settings-state-error-1';
    if (req.query.error === '2') stateClass = 'settings-state-error-2';
    if (req.query.success === '1') stateClass = 'settings-state-success';

    html = html.replace('settings-state-default', stateClass);
    res.type('html').send(html);
  } catch (err) {
    console.error('Erreur page coach settings :', err);
    res.status(500).send('Erreur serveur');
  }
});

// Calendrier utilisateur protégé
app.get('/pages/user/calendar.html', requireAuth, requireAppAccess, async (req, res) => {
  try {
    await sendHtmlPage(res, 'public/pages/user/calendar.html');
  } catch (err) {
    console.error('Erreur page user calendar :', err);
    res.status(500).send('Erreur serveur');
  }
});

// Paramètres utilisateur protégés
app.get('/pages/settings.html', requireAuth, requireAppAccess, async (req, res) => {
  try {
    let html = await fs.readFile(path.resolve('public/pages/settings.html'), 'utf8');

    let stateClass = 'settings-state-default';
    if (req.query.error === '1') stateClass = 'settings-state-error-1';
    if (req.query.error === '2') stateClass = 'settings-state-error-2';
    if (req.query.success === '1') stateClass = 'settings-state-success';

    html = html.replace('settings-state-default', stateClass);
    res.type('html').send(html);
  } catch (err) {
    console.error('Erreur settings page :', err);
    res.status(500).send('Erreur serveur');
  }
});

app.use(express.static('public'));

app.use('/auth', authRoutes);

app.listen(port, () => {
  console.log(`Serveur démarré sur le port ${port}`);
});
