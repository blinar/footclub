// Gestion des équipes pour l'admin : créer, supprimer, assigner des coachs, afficher la page.

// fs permet de lire des fichiers sur le disque
import fs from 'fs/promises';
// path permet de construire des chemins de fichiers qui marchent sur tous les systèmes
import path from 'path';
// pool est la connexion à la base de données PostgreSQL
import pool from '../config/db.js';

// admin.teams.controller.js - Gestion des équipes

// Chemin vers le fichier HTML de la page admin des équipes, lu depuis le disque au moment de l'affichage
const ADMIN_TEAMS_TEMPLATE = path.resolve('public/pages/admin/teams.html');

// Remplace les caractères spéciaux HTML par leur version sûre pour éviter les injections de code.
// Ex : si quelqu'un écrit "<script>" dans un champ, ça devient "&lt;script&gt;" et ça ne s'exécute pas.
function escapeHtml(value) {
	return String(value)
		.replaceAll('&', '&amp;')   // le & doit être converti en premier
		.replaceAll('<', '&lt;')    // balise ouvrante
		.replaceAll('>', '&gt;')    // balise fermante
		.replaceAll('"', '&quot;') // guillemet double
		.replaceAll("'", '&#39;'); // guillemet simple
}

// Lit le paramètre dans l'URL après une action (?error=1, ?success=2...) et renvoie le bloc HTML du message à afficher.
// Si aucun paramètre ne correspond, renvoie une chaîne vide (pas de message).
function renderFlashMessage(query) {
	// message = texte à afficher, isError = true si c'est une erreur (rouge), false si c'est un succès (vert)
	let message = '';
	let isError = false;

	if (query?.error === '1') {
		message = 'Veuillez remplir tous les champs.';
		isError = true;
	} else if (query?.error === '2') {
		message = 'Une erreur est survenue.';
		isError = true;
	} else if (query?.error === '3') {
		message = 'Nombre maximal d\'entraîneurs atteint (2).';
		isError = true;
	} else if (query?.success === '1') {
		message = 'Équipe créée.';
	} else if (query?.success === '2') {
		message = 'Entraîneur affecté.';
	} else if (query?.success === '3') {
		message = 'Équipe supprimée.';
	} else if (query?.success === '4') {
		message = 'Entraîneur retiré.';
	}

	// Aucun paramètre reconnu : pas de message à afficher
	if (!message) {
		return '';
	}

	// Rouge pour les erreurs, vert pour les succès
	const borderColor = isError ? '#B91C1C' : '#16a34a';

	// On retourne le bloc HTML du message
	return `
		<section id="admin-flash" class="panel-card" style="margin: 0 0 24px; max-width: 720px; padding: 18px 24px; border-left: 4px solid ${borderColor};">
			<p style="margin: 0; font-weight: 600;">${escapeHtml(message)}</p>
		</section>
	`;
}

// Construit les balises <option> du menu déroulant pour choisir un entraîneur.
function buildCoachOptions(coaches) {
	// Aucun entraîneur dans la base : on affiche un message dans le menu
	if (!coaches.length) {
		return '<option value="" selected disabled>Aucun entraîneur disponible</option>';
	}

	// On fabrique toutes les options et on les colle ensemble en une seule chaîne
	return [
		// Option par défaut vide : force l'admin à choisir un entraîneur
		'<option value="" selected>Sélectionner un entraîneur</option>',
		...coaches.map((coach) => {
			// Si le coach est déjà dans une équipe, on l'indique entre parenthèses
			const teamLabel = coach.team_name ? ` - ${coach.team_name}` : '';
			return `<option value="${coach.id}" data-team-id="${coach.team_id || ''}">${escapeHtml(coach.full_name)} (${escapeHtml(coach.email)}${escapeHtml(teamLabel)})</option>`;
		}),
	].join('');
}

// Construit le HTML des cartes d'équipe (nom, liste des coachs, formulaires) pour la page admin.
// Ce HTML est fabriqué dans Node.js et envoyé tel quel au navigateur.
function buildTeamCards(teams, coaches) {
	// Aucune équipe dans la base : on affiche un message par défaut
	if (!teams.length) {
		return '<article class="panel-card team-card"><p>Aucune équipe pour le moment.</p></article>';
	}

	// On prépare le menu des coachs une fois, il sera réutilisé dans chaque carte
	const coachOptions = buildCoachOptions(coaches);

	// Pour chaque équipe, on fabrique une carte HTML
	return teams.map((team) => {
		// Si l'équipe a des coachs, on affiche la liste ; sinon un texte vide
		const coachesHtml = team.coaches.length
			? `<ul class="team-card__list">${team.coaches.map((coach) => `
				<li class="team-card__member" style="display: flex; justify-content: space-between; align-items: center; gap: 16px;">
					<div>
						<strong>${escapeHtml(coach.full_name)}</strong>
						<span>${escapeHtml(coach.email)}</span>
					</div>
					<form action="/admin/teams/${team.id}/coach/remove" method="POST" style="display:inline; margin-left: auto;" class="remove-coach-form">
						<input type="hidden" name="coachId" value="${coach.id}">
						<button type="submit" class="icon-button" title="Retirer" style="background:none;border:none;cursor:pointer;padding:8px;">
							<span class="material-symbols-outlined" style="font-size: 22px;">close</span>
						</button>
					</form>
				</li>
			`).join('')}</ul>`
			: '<p style="margin: 16px 0 0;">Aucun staff assigné</p>';

		return `
			<article class="panel-card team-card">
				<div class="team-card__head">
					<div>
						<h3 class="team-card__name">${escapeHtml(team.name)}</h3>
					</div>
				</div>

				<div>
					<span class="team-card__section-title">Entraîneurs</span>
					${coachesHtml}
				</div>

				<!-- Formulaire pour assigner un entraîneur à l'équipe -->
				<form action="/admin/teams/${team.id}/coach" method="POST" class="team-card__footer team-coach-form" data-team-id="${team.id}" style="display: flex; gap: 12px; flex-direction: column; align-items: stretch;">
					<!-- Select avec classe dédiée pour afficher une flèche CSS -->
					<select name="coachId" required class="team-coach-select">
						${coachOptions}
					</select>
					<button type="submit" class="btn-secondary" style="justify-content: center;">
						<span class="material-symbols-outlined">person_add</span>
						<span>Ajouter un entraîneur</span>
					</button>
				</form>

				<form action="/admin/teams/${team.id}/delete" method="POST" class="team-card__footer delete-team-form" style="margin-top: 12px;">
					<button type="submit" class="btn-secondary" style="justify-content: center; width: 100%;">
						<span class="material-symbols-outlined">delete</span>
						<span>Supprimer l'équipe</span>
					</button>
				</form>
			</article>
		`;
	}).join('');
}

// Récupère les équipes et les coachs depuis la base, puis associe chaque coach à son équipe.
async function loadTeamsPageData() {
	// Toutes les équipes, triées par ordre alphabétique
	const teamsResult = await pool.query('SELECT id, name FROM teams ORDER BY name ASC');

	// Tous les coachs (role = 2), avec le nom de leur équipe si ils en ont une
	const coachesResult = await pool.query(
		`SELECT users.id, users.full_name, users.email, users.team_id, teams.name AS team_name
		 FROM users
		 LEFT JOIN teams ON teams.id = users.team_id
		 WHERE users.role = 2
		 ORDER BY users.full_name ASC`
	);

	// coachesByTeam est un dictionnaire : clé = ID de l'équipe, valeur = liste de ses coachs.
	// Ça permet de retrouver les coachs d'une équipe directement par son ID.
	const coachesByTeam = new Map();

	for (const coach of coachesResult.rows) {
		// Ce coach n'est dans aucune équipe, on passe au suivant
		if (!coach.team_id) {
			continue;
		}

		// Si c'est la première fois qu'on voit cette équipe, on crée une liste vide pour elle
		if (!coachesByTeam.has(coach.team_id)) {
			coachesByTeam.set(coach.team_id, []);
		}

		// On ajoute ce coach à la liste de son équipe
		coachesByTeam.get(coach.team_id).push({
			id: coach.id,
			full_name: coach.full_name,
			email: coach.email,
		});
	}

	// On regroupe chaque équipe avec ses coachs. Si elle n'en a pas, on met une liste vide.
	const teams = teamsResult.rows.map((team) => ({
		id: team.id,
		name: team.name,
		coaches: coachesByTeam.get(team.id) || [],
	}));

	// On retourne les équipes (avec leurs coachs) et tous les coachs (pour le menu déroulant)
	return {
		teams,
		coaches: coachesResult.rows,
	};
}

// Crée une équipe à partir du nom saisi dans le formulaire de création
export async function createTeam(request, response) {
	// On récupère le nom de l'équipe et on retire les espaces inutiles
	const name = request.body.name?.trim();

	// Si le champ est vide, on renvoie une erreur
	if (!name) {
		return response.redirect('/pages/admin/teams.html?error=1');
	}

	try {
		// On insère la nouvelle équipe dans la base
		await pool.query('INSERT INTO teams (name) VALUES ($1)', [name]);
		response.redirect('/pages/admin/teams.html?success=1');
	} catch (error) {
		// Peut échouer si le nom existe déjà (contrainte UNIQUE dans la base)
		console.error('Erreur createTeam :', error);
		response.redirect('/pages/admin/teams.html?error=2');
	}
}

// Associe un entraîneur à une équipe (peut avoir été assigné à une autre auparavant)
export async function addCoachToTeam(request, response) {
	// On récupère l'ID de l'équipe depuis l'URL et l'ID de l'entraîneur depuis le formulaire
	const teamId = Number(request.params.id);
	const coachId = Number(request.body.coachId);

	// Sans ces deux IDs, l'opération n'a pas de sens
	if (!teamId || !coachId) {
		return response.redirect('/pages/admin/teams.html?error=1');
	}

	try {
		// Récupère l'équipe et le coach depuis la base
		const teamResult = await pool.query('SELECT id, name FROM teams WHERE id = $1', [teamId]);
		const team = teamResult.rows[0];

		const coachResult = await pool.query(
			`SELECT users.id, users.full_name, users.email, users.team_id, teams.name AS team_name
			 FROM users
			 LEFT JOIN teams ON teams.id = users.team_id
			 WHERE users.id = $1 AND users.role = 2`,
			[coachId]
		);
		const coach = coachResult.rows[0];

		if (!team || !coach) {
			return response.redirect('/pages/admin/teams.html?error=2');
		}

		// Vérifie qu'il n'y a pas déjà 2 entraîneurs assignés à cette équipe
		const countResult = await pool.query('SELECT COUNT(*) FROM users WHERE team_id = $1 AND role = 2', [teamId]);
		const currentCoachCount = Number(countResult.rows[0].count || 0);

		if (currentCoachCount >= 2 && coach.team_id !== teamId) {
			return response.redirect('/pages/admin/teams.html?error=3');
		}

		const result = await pool.query(
			'UPDATE users SET team_id = $1 WHERE id = $2 AND role = 2',
			[teamId, coachId]
		);

		// Si rowCount = 0, le coach n'existe pas ou n'est pas entraîneur
		if (result.rowCount === 0) {
			return response.redirect('/pages/admin/teams.html?error=2');
		}

		response.redirect('/pages/admin/teams.html?success=2');
	} catch (error) {
		console.error('Erreur addCoachToTeam :', error);
		response.redirect('/pages/admin/teams.html?error=2');
	}
}

// Supprime une équipe et détache automatiquement tous les entraîneurs qui lui étaient assignés
export async function deleteTeam(request, response) {
	// On récupère l'ID de l'équipe à supprimer depuis l'URL
	const teamId = Number(request.params.id);

	// Sans ID valide, on ne peut pas supprimer
	if (!teamId) {
		return response.redirect('/pages/admin/teams.html?error=1');
	}

	try {
		// D'abord, on enlève tous les coachs de cette équipe (sinon ils se retrouveraient sans équipe valide)
		await pool.query('UPDATE users SET team_id = NULL WHERE team_id = $1', [teamId]);
		// Ensuite, on supprime l'équipe
		await pool.query('DELETE FROM teams WHERE id = $1', [teamId]);

		response.redirect('/pages/admin/teams.html?success=3');
	} catch (error) {
		console.error('Erreur deleteTeam :', error);
		response.redirect('/pages/admin/teams.html?error=2');
	}
}

// Retire un entraîneur d'une équipe (le remettre à NULL)
export async function removeCoachFromTeam(request, response) {
	// On récupère l'ID de l'équipe depuis l'URL et l'ID du coach depuis le formulaire
	const teamId = Number(request.params.id);
	const coachId = Number(request.body.coachId);

	// Sans ces deux IDs, l'opération n'a pas de sens
	if (!teamId || !coachId) {
		return response.redirect('/pages/admin/teams.html?error=1');
	}

	try {
		// On vérifie que l'équipe existe en base
		const teamResult = await pool.query('SELECT id, name FROM teams WHERE id = $1', [teamId]);
		const team = teamResult.rows[0];

		// On vérifie que l'utilisateur est bien un coach (role = 2)
		const coachResult = await pool.query(
			`SELECT users.id, users.full_name, users.email, users.team_id, teams.name AS team_name
			 FROM users
			 LEFT JOIN teams ON teams.id = users.team_id
			 WHERE users.id = $1 AND users.role = 2`,
			[coachId]
		);
		const coach = coachResult.rows[0];

		// On s'assure que le coach est bien dans cette équipe avant de le retirer
		if (!team || !coach || coach.team_id !== teamId) {
			return response.redirect('/pages/admin/teams.html?error=2');
		}

		// On met team_id à NULL pour retirer le coach de l'équipe
		await pool.query(
			'UPDATE users SET team_id = NULL WHERE id = $1 AND team_id = $2 AND role = 2',
			[coachId, teamId]
		);

		response.redirect('/pages/admin/teams.html?success=4');
	} catch (error) {
		console.error('Erreur removeCoachFromTeam :', error);
		response.redirect('/pages/admin/teams.html?error=2');
	}
}

// Lit le fichier HTML du modèle, remplace les marqueurs par les vraies données, et envoie le résultat au navigateur.
export async function renderAdminTeamsPage(request, response) {
	try {
		// Récupère les équipes et les coachs à jour depuis la base
		const { teams, coaches } = await loadTeamsPageData();

		// Lit le fichier HTML du modèle depuis le disque
		let html = await fs.readFile(ADMIN_TEAMS_TEMPLATE, 'utf8');

		// Remplace le commentaire HTML <!-- ADMIN_TEAMS_MESSAGE --> par le message d'action (ou rien)
		html = html.replace('<!-- ADMIN_TEAMS_MESSAGE -->', renderFlashMessage(request.query));

		// Remplace le commentaire HTML <!-- ADMIN_TEAMS_LIST --> par les cartes des équipes
		html = html.replace('<!-- ADMIN_TEAMS_LIST -->', buildTeamCards(teams, coaches));

		// Envoie le HTML final au navigateur
		response.type('html').send(html);
	} catch (error) {
		console.error('Erreur renderAdminTeamsPage :', error);
		response.status(500).send('Erreur serveur');
	}
}
