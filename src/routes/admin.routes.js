import express from 'express';
import {
	addCoachToTeam,
	createTeam,
	deleteTeam,
	removeCoachFromTeam,
} from '../controllers/admin.teams.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

// Appliqué à toutes les routes d'un coup pour ne pas risquer d'oublier de protéger une route
// requireAuth vérifie le token, requireAdmin vérifie que le rôle est 1
router.use(requireAuth, requireAdmin);

// POST /admin/teams → crée une nouvelle équipe avec le nom du formulaire
router.post('/teams', createTeam);

// POST /admin/teams/:id/coach → associe un entraîneur disponible à une équipe
router.post('/teams/:id/coach', addCoachToTeam);

// POST /admin/teams/:id/coach/remove → retire un entraîneur d'une équipe
router.post('/teams/:id/coach/remove', removeCoachFromTeam);

// POST /admin/teams/:id/delete → supprime une équipe et détache tous ses entraîneurs
router.post('/teams/:id/delete', deleteTeam);

export default router;
