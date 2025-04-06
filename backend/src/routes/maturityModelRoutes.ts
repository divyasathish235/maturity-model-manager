import express from 'express';
import { MaturityModelController } from '../controllers/MaturityModelController';
import { authenticate, isAdmin } from '../middleware/authMiddleware';

const router = express.Router();

// Public routes - none

// Protected routes
router.get('/', authenticate, MaturityModelController.getAllMaturityModels);
router.get('/:id', authenticate, MaturityModelController.getMaturityModelById);

// Admin only routes
router.post('/', authenticate, isAdmin, MaturityModelController.createMaturityModel);
router.put('/:id', authenticate, isAdmin, MaturityModelController.updateMaturityModel);
router.delete('/:id', authenticate, isAdmin, MaturityModelController.deleteMaturityModel);
router.post('/:id/measurements', authenticate, isAdmin, MaturityModelController.addMeasurement);
router.put('/:id/rules', authenticate, isAdmin, MaturityModelController.updateMaturityLevelRules);

export default router;