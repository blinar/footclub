// coach.routes.js - Routes des entraîneurs
// requireAuth vérifie que le token est valide, requireCoach que le rôle est 2
import express from 'express';
import { getTeamName, getMyTeam, getAvailableUsers, addMemberToTeam, removeMemberFromTeam, addEvent, getEvents, getEvent, updateEvent, deleteEvent } from '../controllers/coach.controller.js';
import { requireAuth, requireCoach } from '../middleware/auth.middleware.js';

const router = express.Router();

// Protégées : requireAuth + requireCoach sur toutes les routes
router.get('/team-name', requireAuth, requireCoach, getTeamName);
router.get('/events', requireAuth, requireCoach, getEvents);
router.get('/events/:id', requireAuth, requireCoach, getEvent);
router.get('/team', requireAuth, requireCoach, getMyTeam);
router.get('/users', requireAuth, requireCoach, getAvailableUsers);
router.post('/team', requireAuth, requireCoach, addMemberToTeam);
router.post('/team/remove', requireAuth, requireCoach, removeMemberFromTeam);
router.post('/events', requireAuth, requireCoach, addEvent);
router.post('/events/:id/update', requireAuth, requireCoach, updateEvent);
router.post('/events/:id/delete', requireAuth, requireCoach, deleteEvent);

export default router;
