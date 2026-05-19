// add-member.js - Charge les joueurs disponibles dans le select d'ajout de membre

// Attend que la page HTML soit entièrement chargée avant d'exécuter le code
document.addEventListener('DOMContentLoaded', () => {
  // Récupère le select dans lequel les joueurs disponibles seront listés
  const select = document.getElementById('userId');
  if (!select) return;

  // Demande au serveur la liste des joueurs sans équipe assignée
  fetch('/coach/users')
    // Convertit la réponse du serveur en tableau JavaScript lisible
    .then(response => response.json())
    .then(users => {
      // Vide le select avant de le remplir avec les données reçues
      select.innerHTML = '';
      if (users.length === 0) {
        select.innerHTML = '<option value="">Aucun joueur disponible</option>';
        return;
      }
      // Pour chaque joueur disponible, crée une option et l'ajoute au select
      users.forEach(user => {
        // Crée un élément <option> HTML dans la mémoire du navigateur
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = `${user.full_name} (${user.email})`;
        // Ajoute l'option dans la liste déroulante visible sur la page
        select.appendChild(option);
      });
    })
    .catch(() => {
      select.innerHTML = '<option value="">Erreur chargement</option>';
    });
});
