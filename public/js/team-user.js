// team-user.js - Charge l'équipe du joueur en lecture seule (aucune action possible)

// Attend que la page HTML soit entièrement chargée avant d'exécuter le code
document.addEventListener('DOMContentLoaded', () => {
	// Récupère le titre de l'équipe affiché en haut de la page
	const teamTitle = document.getElementById('team-title');
	// Récupère le sous-titre affiché sous le nom de l'équipe
	const teamSubtitle = document.getElementById('team-subtitle');
	// Récupère le tableau qui liste les membres de l'équipe
	const teamSection = document.getElementById('team-section');
	// Récupère le message affiché si le joueur n'a pas d'équipe
	const noTeamSection = document.getElementById('no-team-section');
	// Récupère le corps du tableau où les lignes seront ajoutées
	const teamMembers = document.getElementById('team-members');

	// Échappe le texte avant de l'afficher dans le tableau
	function escapeHtml(value) {
		return String(value)
			.replaceAll('&', '&amp;')
			.replaceAll('<', '&lt;')
			.replaceAll('>', '&gt;')
			.replaceAll('"', '&quot;')
			.replaceAll("'", '&#39;');
	}

	// Demande au serveur le nom et les membres de l'équipe du joueur connecté
	fetch('/user/team')
		// Convertit la réponse du serveur en objet JavaScript lisible
		.then((response) => response.json())
		.then((data) => {
			// Si le joueur n'a pas d'équipe, on affiche le message d'absence d'équipe
			if (!data.team_name) {
				// Rend visible la section "pas d'équipe"
				noTeamSection.style.display = 'block';
				// On arrête là, rien d'autre à afficher
				return;
			}

			// Affiche le nom de l'équipe dans le titre de la page
			teamTitle.textContent = data.team_name;
			// Affiche un sous-titre fixe sous le nom de l'équipe
			teamSubtitle.textContent = 'Membres de votre équipe.';
			// Rend visible le tableau des membres
			teamSection.style.display = 'block';

			// Pour chaque membre, crée une ligne dans le tableau HTML
			data.members.forEach((member) => {
				// Crée un élément ligne de tableau dans la mémoire du navigateur
				const row = document.createElement('tr');
				// Détermine le libellé du rôle selon le numéro de rôle
				const roleLabel = member.role === 2 ? 'Entraîneur' : 'Joueur';
				// Ajoute une couleur différente pour les entraîneurs
				const rolePillClass = member.role === 2 ? 'status-pill--primary' : '';

				// Remplit la ligne avec le nom, l'email et le rôle du membre
				row.innerHTML = `
					<td><strong>${escapeHtml(member.full_name)}</strong></td>
					<td>${escapeHtml(member.email)}</td>
					<td><span class="status-pill ${rolePillClass}">${roleLabel}</span></td>
				`;

				// Ajoute la ligne au bas du tableau
				teamMembers.appendChild(row);
			});
		})
		// En cas d'erreur réseau, affiche un message dans la console
		.catch((error) => {
			console.error('Erreur chargement équipe :', error);
		});
});
