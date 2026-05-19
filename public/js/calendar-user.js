// calendar-user.js - Récupère et affiche les événements du calendrier utilisateur

// Attend que la page HTML soit entièrement chargée avant d'exécuter le code
document.addEventListener('DOMContentLoaded', () => {
  // Récupère la zone de la page où les cartes seront affichées
  const container = document.getElementById('calendar-events');
  // Récupère tous les boutons de filtre (Tous / Match / Entraînement)
  const pills = Array.from(document.querySelectorAll('.filter-pill'));
  if (!container) return;
  // Liste des événements reçus du serveur, vide au départ
  let events = [];

  // Applique un filtre : met à jour les boutons actifs et rafraîchit les cartes affichées
  const setFilter = filterValue => {
    pills.forEach(pill => pill.classList.toggle('is-active', pill.dataset.filter === filterValue));
    render(filterValue === 'all' ? events : events.filter(eventData => String(eventData.type) === filterValue));
  };

  // Rend chaque bouton de filtre cliquable (clic souris) et activable au clavier (Entrée/Espace)
  pills.forEach(pill => {
    pill.addEventListener('click', () => setFilter(pill.dataset.filter));
    pill.addEventListener('keydown', keyboardEvent => { if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') { keyboardEvent.preventDefault(); setFilter(pill.dataset.filter); } });
  });

  // Génère le HTML d'une carte événement sans boutons d'action
  const card = eventData => {
    // Convertit la date stockée en base en objet Date pour pouvoir la formater
    const date = new Date(eventData.start_date);
    const day = date.toLocaleDateString('fr-FR', { day: '2-digit' });
    const month = date.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '');
    const time = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    // Heure de fin
    const endTime = new Date(eventData.end_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    // Date et heure de convocation
    const convocationDate = new Date(eventData.convocation_date);
    const convDate = convocationDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }).replace('.', '');
    const convTime = convocationDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    // Titre affiché : titre manuel, "vs Adversaire" pour un match, ou "Entraînement" par défaut
    const title = eventData.title || (eventData.type == 2 ? `vs ${eventData.opponent || ''}` : 'Entraînement');
    // Un événement est "passé" si sa date de début est antérieure à maintenant
    const past = date < new Date();
    const typeClass = `calendar-card--${eventData.type == 2 ? 'match' : 'training'}${past ? ' calendar-card--past' : ''}`;
    const typeLabel = eventData.type == 2 ? 'Match' : 'Entraînement';
    return `<article class="calendar-card ${typeClass}"><div class="calendar-card__top"><div><span class="calendar-card__label">${typeLabel}</span>${past ? ' <span class="status-pill status-pill--grey">Passé</span>' : ''}<h3 class="calendar-card__title">${title}</h3>${eventData.type == 2 && eventData.opponent ? `<p class="calendar-card__opponent">Adversaire : ${eventData.opponent}</p>` : ''}</div><div class="calendar-card__date"><div class="calendar-card__day">${day}</div><div class="calendar-card__month">${month}</div></div></div><div class="calendar-card__divider"></div><div class="calendar-card__meta"><div class="calendar-card__meta-item"><span class="material-symbols-outlined">alarm</span><span>Convocation : ${convDate}, ${convTime}</span></div><div class="calendar-card__meta-item"><span class="material-symbols-outlined">schedule</span><span>Début : ${time}</span></div><div class="calendar-card__meta-item"><span class="material-symbols-outlined">timer</span><span>Fin : ${endTime}</span></div><div class="calendar-card__meta-item"><span class="material-symbols-outlined">stadium</span><span>${eventData.location || ''}</span></div></div></article>`;
  };

  // Remplace le contenu de la zone par les cartes générées, ou un message si liste vide
  const render = list => container.innerHTML = list.length ? list.map(card).join('') : '<p>Aucun événement.</p>';

  // Envoie une requête au serveur pour récupérer les événements de l'équipe
  fetch('/user/events')
    // Convertit la réponse du serveur en objet JavaScript lisible
    .then(response => response.json())
    .then(data => {
      // Stocke les événements dans la liste locale pour pouvoir les filtrer
      events = data.events || [];
      // Nom de saison et équipe viennent de la DB, évite les titres hardcodés dans le HTML
      if (data.season_name) document.querySelector('.page-head h2').textContent = `Saison : ${data.season_name}`;
      if (data.team_name) document.querySelector('.page-head p').textContent = `Planning et calendrier pour l'équipe : ${data.team_name}`;
      // Lit le filtre dans l'URL (?type=1 ou ?type=2) pour l'appliquer au chargement
      const typeParam = new URLSearchParams(location.search).get('type');
      setFilter(typeParam === '1' || typeParam === '2' ? typeParam : 'all');
    })
    // En cas d'erreur réseau, affiche un message à la place des cartes
    .catch(() => container.innerHTML = '<p>Erreur chargement.</p>');
});
