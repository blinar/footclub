// user.routes.js - Routes utilisateurs
import express from 'express';
import { getEvents } from '../controllers/coach.controller.js';
import { getUserTeam } from '../controllers/user.controller.js';
import { requireAuth, requireAppAccess } from '../middleware/auth.middleware.js';

const router = express.Router();

// Les utilisateurs connectés récupèrent les événements de leur équipe
router.get('/events', requireAuth, requireAppAccess, getEvents);

// Les utilisateurs connectés voient les membres de leur équipe (lecture seule)
router.get('/team', requireAuth, requireAppAccess, getUserTeam);

export default router;
