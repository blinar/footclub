// server.js - Point d'entrée de l'application
import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import cookieParser from 'cookie-parser';
import 'dotenv/config';
import './src/config/db.js';
import adminRoutes from './src/routes/admin.routes.js';
import authRoutes from './src/routes/auth.routes.js';
import coachRoutes from './src/routes/coach.routes.js';
import userRoutes from './src/routes/user.routes.js';
import { renderEventsListPage } from './src/controllers/events.controller.js';
import { renderAdminTeamsPage } from './src/controllers/admin.teams.controller.js';
import { renderSettingsPage } from './src/controllers/settings.controller.js';
import { requireAuth, requireAdmin, requireCoach, requireAppAccess } from './src/middleware/auth.middleware.js';

const app = express();
const port = process.env.PORT;

// Lit un fichier HTML et l'envoie tel quel
async function sendHtmlPage(response, relativePath) {
  const filePath = path.resolve(relativePath);
  const html = await fs.readFile(filePath, 'utf8');
  response.type('html').send(html);
}

// Lit le cookie "token" depuis le navigateur et le rend accessible via request.cookies
app.use(cookieParser());

// Lecture des données des formulaires HTML (POST)
app.use(express.urlencoded({ extended: false }));

// Non protégée : destination après l'inscription, le token n'existe pas encore
app.get('/pages/user/access-pending.html', async (request, response) => {
  try {
    await sendHtmlPage(response, 'public/pages/user/access-pending.html');
  } catch (error) {
    console.error('Erreur page attente :', error);
    response.status(500).send('Erreur serveur');
  }
});

// Pages admin protégées
app.get('/pages/admin/teams.html', requireAuth, requireAppAccess, requireAdmin, renderAdminTeamsPage);

app.get('/pages/admin/settings.html', requireAuth, requireAppAccess, requireAdmin, renderSettingsPage('public/pages/admin/settings.html'));

// Pages coach protégées
app.get('/pages/coach/calendar.html', requireAuth, requireAppAccess, requireCoach, async (request, response) => {
  try {
    await sendHtmlPage(response, 'public/pages/coach/calendar.html');
  } catch (error) {
    console.error('Erreur page coach calendar :', error);
    response.status(500).send('Erreur serveur');
  }
});

app.get('/pages/coach/team.html', requireAuth, requireAppAccess, requireCoach, async (request, response) => {
  try {
    await sendHtmlPage(response, 'public/pages/coach/team.html');
  } catch (error) {
    console.error('Erreur page coach team :', error);
    response.status(500).send('Erreur serveur');
  }
});

app.get('/pages/coach/add-member.html', requireAuth, requireAppAccess, requireCoach, async (request, response) => {
  try {
    await sendHtmlPage(response, 'public/pages/coach/add-member.html');
  } catch (error) {
    console.error('Erreur page add member :', error);
    response.status(500).send('Erreur serveur');
  }
});

app.get('/pages/coach/add-event.html', requireAuth, requireAppAccess, requireCoach, async (request, response) => {
  try {
    await sendHtmlPage(response, 'public/pages/coach/add-event.html');
  } catch (error) {
    console.error('Erreur page add event :', error);
    response.status(500).send('Erreur serveur');
  }
});

app.get('/pages/coach/edit-event.html', requireAuth, requireAppAccess, requireCoach, async (request, response) => {
  try {
    await sendHtmlPage(response, 'public/pages/coach/edit-event.html');
  } catch (error) {
    console.error('Erreur page edit event :', error);
    response.status(500).send('Erreur serveur');
  }
});

app.get('/pages/coach/events-list.html', requireAuth, requireAppAccess, requireCoach, renderEventsListPage);

app.get('/pages/user/events-list.html', requireAuth, requireAppAccess, renderEventsListPage);

app.get('/pages/coach/settings.html', requireAuth, requireAppAccess, requireCoach, renderSettingsPage('public/pages/coach/settings.html'));

// Calendrier utilisateur protégé
app.get('/pages/user/calendar.html', requireAuth, requireAppAccess, async (request, response) => {
  try {
    await sendHtmlPage(response, 'public/pages/user/calendar.html');
  } catch (error) {
    console.error('Erreur page user calendar :', error);
    response.status(500).send('Erreur serveur');
  }
});

// Page équipe utilisateur protégée (lecture seule)
app.get('/pages/user/team.html', requireAuth, requireAppAccess, async (request, response) => {
  try {
    await sendHtmlPage(response, 'public/pages/user/team.html');
  } catch (error) {
    console.error('Erreur page user team :', error);
    response.status(500).send('Erreur serveur');
  }
});

// Paramètres utilisateur protégés
app.get('/pages/user/settings.html', requireAuth, requireAppAccess, renderSettingsPage('public/pages/user/settings.html'));

// Redirige / vers la page d'accueil
app.get('/', (request, response) => response.redirect('/pages/home.html'));

// Fichiers statiques, placé après les routes protégées
app.use(express.static('public'));

app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/coach', coachRoutes);
app.use('/user', userRoutes);

// Aucune route ne correspond : on renvoie une 404 simple
app.use((request, response) => {
  response.status(404).send('Page non trouvée');
});

app.listen(port, () => {
  console.log(`Serveur démarré sur le port ${port}`);
});
