import express from 'express';
import { ServiceController } from '../controllers/ServiceController';
import { authenticate, isAdmin, isTeamOwner } from '../middleware/authMiddleware';

const router = express.Router();

// Public routes - none

// Protected routes
router.get('/', authenticate, ServiceController.getAllServices);
router.get('/:id', authenticate, ServiceController.getServiceById);

// Admin and Team Owner routes
router.post('/', authenticate, isTeamOwner, ServiceController.createService);
router.put('/:id', authenticate, isTeamOwner, ServiceController.updateService);
router.delete('/:id', authenticate, isAdmin, ServiceController.deleteService);

export default router;