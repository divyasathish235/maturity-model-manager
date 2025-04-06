import express from 'express';
import { CampaignController } from '../controllers/CampaignController';
import { authenticate, isAdmin, isTeamOwner } from '../middleware/authMiddleware';

const router = express.Router();

// Public routes - none

// Protected routes
router.get('/', authenticate, CampaignController.getAllCampaigns);
router.get('/:id', authenticate, CampaignController.getCampaignById);
router.get('/:id/summary', authenticate, CampaignController.getCampaignSummary);

// Admin and Team Owner routes
router.post('/', authenticate, isTeamOwner, CampaignController.createCampaign);
router.put('/:id', authenticate, isTeamOwner, CampaignController.updateCampaign);
router.post('/:id/participants', authenticate, isTeamOwner, CampaignController.addParticipant);
router.delete('/:id/participants/:serviceId', authenticate, isTeamOwner, CampaignController.removeParticipant);

// Admin only routes
router.delete('/:id', authenticate, isAdmin, CampaignController.deleteCampaign);

export default router;