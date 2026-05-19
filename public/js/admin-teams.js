// admin-teams.js - Gère les confirmations navigateur de la page admin des équipes

// Attend que la page HTML soit entièrement chargée avant d'exécuter le code
document.addEventListener('DOMContentLoaded', () => {
  // Intercepte toutes les soumissions de formulaires de la page avant leur envoi
  document.addEventListener('submit', (event) => {
    // Identifie quel formulaire a été soumis
    const form = event.target;

    // Cas 1 : Suppression d'une équipe
    if (form.matches('.delete-team-form')) {
      if (!confirm('Voulez-vous vraiment supprimer cette équipe ?')) {
        event.preventDefault();
      }
      return;
    }

    // Cas 2 : Retrait d'un coach d'une équipe
    if (form.matches('.remove-coach-form')) {
      if (!confirm('Voulez-vous vraiment retirer cet entraîneur de cette équipe ?')) {
        event.preventDefault();
      }
      return;
    }

    // Cas 3 : Déplacement d'un coach vers une autre équipe
    if (form.matches('.team-coach-form')) {
      const selectedOption = form.querySelector('select[name="coachId"] option:checked');
      const selectedTeamId = selectedOption?.dataset.teamId;
      const currentTeamId = form.dataset.teamId;

      // Vérifier si le coach choisi est déjà affecté à une autre équipe
      if (selectedTeamId && selectedTeamId !== currentTeamId) {
        if (!confirm('Ce coach est déjà affecté à une autre équipe. Voulez-vous le déplacer ?')) {
          event.preventDefault();
        }
      }
    }
  });

  // Disparition automatique du message flash après 5 secondes
  const flash = document.getElementById('admin-flash');
  if (flash) {
    // Attendre 5 secondes, puis retirer le message du DOM
    setTimeout(() => {
      flash.remove();
    }, 5000);
  }
});