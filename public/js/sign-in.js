// sign-in.js - Affiche un message d'erreur si les identifiants sont incorrects
const error = new URLSearchParams(window.location.search).get('error');
if (error === '1') alert('Email ou mot de passe incorrect.');
