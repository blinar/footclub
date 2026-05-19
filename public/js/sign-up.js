// sign-up.js - Affiche un message d'erreur si l'email est déjà utilisé
const error = new URLSearchParams(window.location.search).get('error');
if (error === '1') alert('Un compte existe déjà avec cette adresse email.');
