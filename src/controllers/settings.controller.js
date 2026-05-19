// settings.controller.js - Rendu des pages paramètres (admin, coach, utilisateur)
import fs from 'fs/promises';
import path from 'path';

// Retourne un middleware Express qui rend la page settings correspondante avec le bon état CSS
export const renderSettingsPage = (htmlPath) => async (request, response) => {
	try {
		let html = await fs.readFile(path.resolve(htmlPath), 'utf8');

		let stateClass = 'settings-state-default';
		if (request.query.error === '1') stateClass = 'settings-state-error-1';
		if (request.query.error === '2') stateClass = 'settings-state-error-2';
		// error=3 : nouveau mot de passe et confirmation ne correspondent pas (envoyé par auth.controller.js)
		if (request.query.error === '3') stateClass = 'settings-state-error-3';
		if (request.query.success === '1') stateClass = 'settings-state-success';

		html = html.replace('settings-state-default', stateClass);
		response.type('html').send(html);
	} catch (error) {
		console.error(`Erreur settings ${htmlPath} :`, error);
		response.status(500).send('Erreur serveur');
	}
};
