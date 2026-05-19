// user.controller.js - Logique métier des joueurs
import pool from '../config/db.js';

// Retourne le nom de l'équipe et ses membres pour le joueur connecté (lecture seule)
export async function getUserTeam(request, response) {
  try {
    // On récupère toujours le team_id depuis la base de données (pas depuis le JWT)
    // Un JWT peut être périmé : le joueur a pu changer d'équipe depuis sa dernière connexion
    const userQueryResult = await pool.query('SELECT team_id FROM users WHERE id = $1', [request.user.id]);
    const teamId = userQueryResult.rows[0]?.team_id || null;

    // Si le joueur n'est rattaché à aucune équipe, on retourne une réponse vide
    if (!teamId) {
      return response.json({ team_name: null, members: [] });
    }

    // Récupère le nom de l'équipe pour l'afficher dans le titre de la page
    const teamQueryResult = await pool.query('SELECT name FROM teams WHERE id = $1', [teamId]);
    const team_name = teamQueryResult.rows[0]?.name || null;

    // Récupère tous les membres de l'équipe : entraîneurs (role=2) d'abord, puis joueurs (role=3)
    const membersQueryResult = await pool.query(
      'SELECT full_name, email, role FROM users WHERE team_id = $1 AND (role = 2 OR role = 3) ORDER BY role ASC, full_name',
      [teamId]
    );

    // Envoie le nom de l'équipe et la liste des membres au navigateur
    response.json({ team_name, members: membersQueryResult.rows });
  } catch (error) {
    console.error('Erreur getUserTeam :', error);
    response.status(500).json({ error: 'Erreur serveur' });
  }
}
