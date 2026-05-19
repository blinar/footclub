// add-event.js - Active/désactive le champ adversaire selon le type d'événement

// Attend que la page HTML soit entièrement chargée avant d'exécuter le code
document.addEventListener('DOMContentLoaded', () => {
  const typeSelect = document.getElementById('type'); // select type
  const opponentInput = document.getElementById('opponent'); // champ adversaire
  if (!typeSelect || !opponentInput) return; // si éléments manquants, on quitte

  // Met à jour l'état du champ adversaire selon le type sélectionné dans le formulaire
  const updateOpponentField = () => {
    const isTraining = typeSelect.value === '1';
    opponentInput.disabled = isTraining; // désactive le champ si entraînement
    if (isTraining) opponentInput.value = ''; // vide le champ pour éviter faux contenus
    opponentInput.style.opacity = isTraining ? 0.55 : 1; // visuel simple
  };

  // Écoute le changement de type et met à jour le champ adversaire en conséquence
  typeSelect.addEventListener('change', updateOpponentField);
  // Lance aussi au chargement pour refléter la valeur déjà sélectionnée dans le formulaire
  updateOpponentField();
});