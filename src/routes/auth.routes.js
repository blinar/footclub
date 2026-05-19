import express from 'express';
import { login, register, logout, changePassword } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// Reçoit le formulaire de connexion
router.post('/login', login);

// Reçoit le formulaire d'inscription
router.post('/register', register);

// Supprime le cookie et redirige vers la connexion
router.post('/logout', logout);
router.get('/logout', logout);

// Reçoit le formulaire de changement de mot de passe
router.post('/change-password', requireAuth, changePassword);

export default router;
