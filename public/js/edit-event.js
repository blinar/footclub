// edit-event.js - Pré-remplit le formulaire de modification avec les données de l'événement existant

// Attend que la page HTML soit entièrement chargée avant d'exécuter le code
document.addEventListener('DOMContentLoaded', () => {
  // Récupère l'identifiant de l'événement depuis l'URL
  const eventId = new URLSearchParams(window.location.search).get('id');
  const form = document.querySelector('form');

  // Si l'URL ne contient pas d'id ou que le formulaire est absent, on ne fait rien
  if (!eventId || !form) return;

  // Adapte l'action du formulaire pour mettre à jour le bon événement
  form.action = `/coach/events/${eventId}/update`;

  // Charge les données de l'événement depuis l'API et remplit chaque champ du formulaire
  fetch(`/coach/events/${eventId}`)
    // Convertit la réponse du serveur en objet JavaScript lisible
    .then(response => response.json())
    .then(eventData => {
      if (eventData.error) return; // L'événement n'existe pas ou n'appartient pas à ce coach

      document.getElementById('type').value = eventData.type || '';
      document.getElementById('title').value = eventData.title || '';

      // On tronque à 16 caractères pour correspondre au format attendu par datetime-local (YYYY-MM-DDTHH:MM)
      document.getElementById('start_date').value = eventData.start_date?.slice(0, 16) || '';
      document.getElementById('end_date').value = eventData.end_date?.slice(0, 16) || '';
      document.getElementById('convocation_date').value = eventData.convocation_date?.slice(0, 16) || '';

      document.getElementById('location').value = eventData.location || '';
      document.getElementById('opponent').value = eventData.opponent || '';
    });
});