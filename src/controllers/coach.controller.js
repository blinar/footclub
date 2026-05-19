// coach.controller.js - Logique métier des entraîneurs
import pool from '../config/db.js';

// Retourne l'id de la saison en cours selon la date du jour
// Dupliquée depuis auth.controller.js pour garder les contrôleurs indépendants
async function getCurrentSeasonId() {
  const result = await pool.query(
    'SELECT id FROM seasons WHERE CURRENT_DATE BETWEEN start_date AND end_date ORDER BY start_date DESC LIMIT 1'
  );

  return result.rows[0]?.id || null;
}

// Récupère le nom de l'équipe de l'entraîneur connecté
export async function getTeamName(request, response) {
  try {
    // Si l'entraîneur n'a pas d'équipe, retourner null
    if (!request.user.team_id) {
      return response.json({ team_name: null });
    }

    // Cherche le nom de l'équipe
    const teamQueryResult = await pool.query(
      'SELECT name FROM teams WHERE id = $1',
      [request.user.team_id]
    );
    const team = teamQueryResult.rows[0];

    response.json({ team_name: team ? team.name : null });
  } catch (error) {
    console.error('Erreur getTeamName :', error);
    response.status(500).json({ error: 'Erreur serveur' });
  }
}

// Récupère tous les membres (entraîneurs + joueurs) de l'équipe de l'entraîneur connecté
// Les entraîneurs apparaissent en premier (role=2), puis les joueurs (role=3)
export async function getMyTeam(request, response) {
  try {
    const teamMembersQueryResult = await pool.query(
      'SELECT id, full_name, email, role FROM users WHERE team_id = $1 AND (role = 2 OR role = 3) ORDER BY role ASC, full_name',
      [request.user.team_id]
    );
    response.json(teamMembersQueryResult.rows);
  } catch (error) {
    console.error('Erreur getMyTeam :', error);
    response.status(500).json({ error: 'Erreur serveur' });
  }
}

// Récupère les joueurs sans équipe disponibles pour être ajoutés
export async function getAvailableUsers(request, response) {
  try {
    const availableUsersQueryResult = await pool.query(
      'SELECT id, full_name, email FROM users WHERE role = 3 AND team_id IS NULL ORDER BY full_name'
    );
    response.json(availableUsersQueryResult.rows);
  } catch (error) {
    console.error('Erreur getAvailableUsers :', error);
    response.status(500).json({ error: 'Erreur serveur' });
  }
}

// Récupère les événements de l'équipe du compte connecté
export async function getEvents(request, response) {
  try {
    const seasonId = request.user.season_id || (await getCurrentSeasonId());

    // On récupère toujours le team_id depuis la base pour éviter les JWT périmés
    const userQueryResult = await pool.query('SELECT team_id FROM users WHERE id = $1', [request.user.id]);
    const teamId = userQueryResult.rows[0]?.team_id || null;

    if (!teamId || !seasonId) {
      return response.json({ season_name: null, events: [] });
    }

    // Récupère le nom de la saison et le nom de l'équipe pour le calendrier côté client
    const seasonQueryResult = await pool.query('SELECT name FROM seasons WHERE id = $1', [seasonId]);
    const season_name = seasonQueryResult.rows[0]?.name || null;

    const teamQueryResult = await pool.query('SELECT name FROM teams WHERE id = $1', [teamId]);
    const team_name = teamQueryResult.rows[0]?.name || null;

    const eventsQueryResult = await pool.query(
      `SELECT id, type, title, start_date, end_date, convocation_date, location, opponent
       FROM events
       WHERE team_id = $1 AND season_id = $2
       ORDER BY start_date DESC`,
      [teamId, seasonId]
    );

    response.json({ season_name, team_name, events: eventsQueryResult.rows });
  } catch (error) {
    console.error('Erreur getEvents :', error);
    response.status(500).json({ error: 'Erreur serveur' });
  }
}

// Récupère un événement précis du coach pour le formulaire de modification
export async function getEvent(request, response) {
  try {
    // AND team_id = $2 dans la requête est important : un coach ne peut lire
    // que les événements de sa propre équipe, même s'il connaît l'id de l'événement
    const eventQueryResult = await pool.query(
      'SELECT id, type, title, start_date, end_date, convocation_date, location, opponent FROM events WHERE id = $1 AND team_id = $2',
      [request.params.id, request.user.team_id]
    );
    if (!eventQueryResult.rows[0]) return response.status(404).json({ error: 'Introuvable' });
    response.json(eventQueryResult.rows[0]);
  } catch (error) {
    console.error('Erreur getEvent :', error);
    response.status(500).json({ error: 'Erreur serveur' });
  }
}

// Ajoute un joueur à l'équipe de l'entraîneur connecté
export async function addMemberToTeam(request, response) {
  const { userId } = request.body;

  // Vérifie que l'ID utilisateur est fourni
  if (!userId) return response.redirect('/pages/coach/team.html?error=1');

  try {
    // Cherche le joueur pour vérifier qu'il existe
    const memberQueryResult = await pool.query(
      'SELECT id, team_id FROM users WHERE id = $1',
      [userId]
    );
    const memberData = memberQueryResult.rows[0];

    // Vérifie que le joueur existe et n'a pas déjà d'équipe
    if (!memberData || memberData.team_id !== null) {
      return response.redirect('/pages/coach/team.html?error=2');
    }

    // Assigne le joueur à l'équipe de l'entraîneur
    await pool.query(
      'UPDATE users SET team_id = $1 WHERE id = $2',
      [request.user.team_id, userId]
    );

    response.redirect('/pages/coach/team.html?success=1');
  } catch (error) {
    console.error('Erreur addMemberToTeam :', error);
    response.redirect('/pages/coach/team.html?error=1');
  }
}

// Détache un joueur de l'équipe de l'entraîneur connecté
export async function removeMemberFromTeam(request, response) {
  const { userId } = request.body;

  // Vérifie que l'ID utilisateur est fourni
  if (!userId) return response.redirect('/pages/coach/team.html?error=1');

  try {
    // On retire seulement si le joueur appartient bien à l'équipe du coach
    await pool.query(
      'UPDATE users SET team_id = NULL WHERE id = $1 AND team_id = $2',
      [userId, request.user.team_id]
    );

    // Redirige vers la page équipe avec un état succès spécifique
    return response.redirect('/pages/coach/team.html?success=2');
  } catch (error) {
    console.error('Erreur removeMemberFromTeam :', error);
    return response.redirect('/pages/coach/team.html?error=2');
  }
}

// Ajoute un entraînement ou un match au calendrier de l'équipe
export async function addEvent(request, response) {
  const { type, title, start_date, end_date, convocation_date, location, opponent } = request.body;

  // Les champs principaux doivent être remplis
  if (!type || !start_date || !end_date || !convocation_date || !location) {
    return response.redirect('/pages/coach/calendar.html?error=1');
  }

  const eventType = Number(type);
  if (eventType !== 1 && eventType !== 2 || !request.user.team_id) {
    return response.redirect('/pages/coach/calendar.html?error=1');
  }

  const eventTitle = title?.trim() || null;
  const eventOpponent = eventType === 2 ? opponent?.trim() || null : null;

  try {
    // Si le cookie est ancien et ne contient pas la saison, on prend la saison en cours
    let seasonId = request.user.season_id || (await getCurrentSeasonId());

    if (!seasonId) {
      return response.redirect('/pages/coach/calendar.html?error=1');
    }

    await pool.query(
      `INSERT INTO events (type, title, start_date, end_date, convocation_date, location, opponent, team_id, season_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        eventType,
        eventTitle,
        start_date,
        end_date,
        convocation_date,
        location.trim(),
        eventOpponent,
        request.user.team_id,
        seasonId
      ]
    );

    return response.redirect('/pages/coach/calendar.html?success=1');
  } catch (error) {
    console.error('Erreur addEvent :', error);
    return response.redirect('/pages/coach/calendar.html?error=1');
  }
}

// Met à jour un événement existant du coach
export async function updateEvent(request, response) {
  const { type, title, start_date, end_date, convocation_date, location, opponent } = request.body;
  // Tous les champs obligatoires doivent être présents avant de mettre à jour
  if (!type || !title || !start_date || !end_date || !convocation_date || !location) return response.redirect('/pages/coach/edit-event.html?error=1');
  try {
    // AND team_id = $9 : un coach ne peut modifier que ses propres événements
    // Pour les entraînements (type 1), l'adversaire n'a pas de sens donc on le vide
    await pool.query(
      'UPDATE events SET type = $1, title = $2, start_date = $3, end_date = $4, convocation_date = $5, location = $6, opponent = $7 WHERE id = $8 AND team_id = $9',
      [type, title.trim(), start_date, end_date, convocation_date, location.trim(), Number(type) === 2 ? opponent?.trim() || null : null, request.params.id, request.user.team_id]
    );
    return response.redirect('/pages/coach/calendar.html?success=2');
  } catch (error) {
    console.error('Erreur updateEvent :', error);
    return response.redirect('/pages/coach/edit-event.html?error=1');
  }
}

// Supprime un événement du calendrier de l'équipe du coach
export async function deleteEvent(request, response) {
  try {
    // AND team_id = $2 pour que le coach ne supprime que ses propres événements
    // RETURNING id sert à savoir si la suppression a vraiment eu lieu :
    // si rows est vide c'est que l'événement n'existait pas ou n'appartenait pas à ce coach
    const deleteQueryResult = await pool.query('DELETE FROM events WHERE id = $1 AND team_id = $2 RETURNING id', [request.params.id, request.user.team_id]);
    if (!deleteQueryResult.rows[0]) return response.status(403).json({ error: 'Accès refusé' });
    return response.redirect('/pages/coach/calendar.html?success=3');
  } catch (error) {
    console.error('Erreur deleteEvent :', error);
    return response.redirect('/pages/coach/calendar.html?error=1');
  }
}

