// events.controller.js - Rendu serveur de la page liste des événements
import pool from '../config/db.js';

// Rend la page liste des événements côté serveur pour coach et utilisateur
export async function renderEventsListPage(request, response) {
  try {
    const type = request.query.type;
    const params = [request.user.team_id];

    // Requête de base : tous les événements de l'équipe du compte connecté
    let query = 'SELECT id, type, title, start_date, location, opponent FROM events WHERE team_id = $1';

    // Si un filtre de type est passé (1=entraînement, 2=match), on restreint la requête
    if (type === '1' || type === '2') {
      query += ' AND type = $2';
      params.push(type);
    }
    query += ' ORDER BY start_date DESC';

    const events = (await pool.query(query, params)).rows;

    // Le rôle détermine vers quelle section de pages on crée les liens de navigation
    const page = request.user.role === 2 ? 'coach' : 'user';

    // Ajoute la classe CSS is-active sur le pill correspondant au filtre actif
    const active = value => (type === value || (!type && value === 'all')) ? ' is-active active' : '';

    // Génère une carte HTML par événement
    const cards = events.map(event => {
      const date = new Date(event.start_date).toLocaleDateString('fr-FR');
      const typeLabel = event.type == 2 ? 'Match' : 'Entraînement';
      const typePill = event.type == 2 ? 'status-pill--red' : 'status-pill--primary';
      const opponentLine = event.type == 2 && event.opponent ? ` • Adversaire : ${event.opponent}` : '';
      return `<article class="event-card"><div class="event-card__left"><div class="event-card__date"><span class="status-pill ${typePill}">${typeLabel}</span></div><div><h3 class="event-card__title">${event.title || 'Sans titre'}</h3><p class="event-card__meta">${date} • ${event.location || 'Lieu non défini'}${opponentLine}</p></div></div></article>`;
    }).join('');

    // Navigation spécifique au rôle : le coach a des liens supplémentaires (équipe, paramètres)
    const coachNav = '<a href="/pages/coach/team.html" class="floating-action"><span class="material-symbols-outlined">groups</span><span>Mon équipe</span></a><a href="/pages/coach/settings.html" class="floating-action"><span class="material-symbols-outlined">settings</span><span>Paramètres</span></a>';
    const userNav = '<a href="/pages/user/settings.html" class="floating-action"><span class="material-symbols-outlined">settings</span><span>Paramètres</span></a>';

    response.type('html').send(`<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>FootClub - Événements</title><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"><link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"><link rel="stylesheet" href="/css/style.css"></head><body class="app-layout app-layout--calendar"><div class="calendar-preview-shell"><header class="floating-header"><a href="/pages/${page}/calendar.html" class="floating-brand"><img src="/images/logo/4.png" alt="FootClub" class="site-logo site-logo--small"><span class="floating-brand-copy"><strong>FOOTCLUB</strong><span>FC Ste-Croix</span></span></a><nav class="floating-actions"><a href="/pages/${page}/calendar.html" class="floating-action"><span class="material-symbols-outlined">calendar_today</span><span>Calendrier</span></a><a href="/pages/${page}/events-list.html" class="floating-action is-active active"><span class="material-symbols-outlined">list</span><span>Événements</span></a>${page === 'coach' ? coachNav : userNav}</nav><a href="/auth/logout" class="floating-action floating-action--danger"><span class="material-symbols-outlined">logout</span></a></header><main class="content calendar-preview-content"><section class="page-head calendar-page-head"><div><h2>Événements</h2><p>Tous les entraînements et matchs de votre équipe.</p></div><div class="calendar-toolbar calendar-toolbar--compact"><a class="filter-pill${active('all')}" href="/pages/${page}/events-list.html">Tous</a><a class="filter-pill${active('1')}" href="/pages/${page}/events-list.html?type=1">Entraînements</a><a class="filter-pill${active('2')}" href="/pages/${page}/events-list.html?type=2">Matchs</a></div></section><section class="event-list">${cards || '<p>Aucun événement.</p>'}</section></main></div></body></html>`);
  } catch (error) {
    console.error('Erreur renderEventsListPage :', error);
    response.status(500).send('Erreur serveur');
  }
}
