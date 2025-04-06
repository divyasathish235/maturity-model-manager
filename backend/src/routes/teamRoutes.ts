import express from 'express';
import { TeamController } from '../controllers/TeamController';
import { authenticate, isAdmin, isTeamOwner } from '../middleware/authMiddleware';

const router = express.Router();

// Public routes - none

// Protected routes
router.get('/', authenticate, TeamController.getAllTeams);
router.get('/:id', authenticate, TeamController.getTeamById);

// Admin and Team Owner routes
router.post('/', authenticate, isTeamOwner, TeamController.createTeam);
router.put('/:id', authenticate, isTeamOwner, TeamController.updateTeam);
router.delete('/:id', authenticate, isAdmin, TeamController.deleteTeam);

export default router;