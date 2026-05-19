// team.js - Charge l'équipe du coach et gère la suppression avec confirmation navigateur

// Attend que la page HTML soit entièrement chargée avant d'exécuter le code
document.addEventListener('DOMContentLoaded', () => {
	// Récupère les éléments de la page dont on a besoin pour afficher l'équipe
	const teamTitle = document.getElementById('team-title');
	const teamSubtitle = document.getElementById('team-subtitle');
	const teamSection = document.getElementById('team-section');
	const noTeamSection = document.getElementById('no-team-section');
	const addMemberBtn = document.getElementById('add-member-btn');
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

	// Affiche un petit message si la page revient avec une erreur
	const error = new URLSearchParams(window.location.search).get('error');
	if (error === '1') {
		alert('Erreur : veuillez sélectionner un membre');
	}
	if (error === '2') {
		alert('Erreur : ce membre a déjà une équipe');
	}

	// Demande au serveur le nom de l'équipe du coach connecté
	fetch('/coach/team-name')
		// Convertit la réponse du serveur en objet JavaScript lisible
		.then((response) => response.json())
		.then((data) => {
			if (!data.team_name) {
				noTeamSection.style.display = 'block';
				return;
			}

			teamTitle.textContent = data.team_name;
			teamSubtitle.textContent = 'Gérez les membres de votre équipe.';
			teamSection.style.display = 'block';
			addMemberBtn.style.display = 'flex';

			// Demande au serveur la liste des membres de l'équipe
			fetch('/coach/team')
				// Convertit la réponse du serveur en tableau JavaScript lisible
				.then((response) => response.json())
				.then((members) => {
					// Pour chaque membre, crée une ligne dans le tableau HTML
					members.forEach((member) => {
						// Crée un élément <tr> (ligne de tableau) dans la mémoire du navigateur
						const row = document.createElement('tr');
						const roleLabel = member.role === 2 ? 'Entraîneur' : 'Joueur';
						const rolePillClass = member.role === 2 ? 'status-pill--primary' : '';

						row.innerHTML = `
							<td><strong>${escapeHtml(member.full_name)}</strong></td>
							<td>${escapeHtml(member.email)}</td>
							<td><span class="status-pill ${rolePillClass}">${roleLabel}</span></td>
							<td style="text-align: right;">
								<form action="/coach/team/remove" method="POST" style="display:inline;" class="remove-form">
									<input type="hidden" name="userId" value="${member.id}">
									<button type="submit" class="icon-button remove-btn" title="Retirer" style="background:none;border:none;cursor:pointer;padding:8px;">
										<span class="material-symbols-outlined">delete</span>
									</button>
								</form>
							</td>
						`;

						teamMembers.appendChild(row);

						// Demande une confirmation avant la suppression
						const removeForm = row.querySelector('.remove-form');
						removeForm.addEventListener('submit', (event) => {
							if (!confirm('Voulez-vous vraiment supprimer ce membre de l\'équipe ?')) {
								event.preventDefault();
							}
						});
					});
				})
				.catch((error) => {
					console.error('Erreur chargement équipe :', error);
				});
		})
		.catch((error) => {
			console.error('Erreur chargement nom équipe :', error);
		});
});
