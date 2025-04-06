import express from 'express';
import { MeasurementEvaluationController } from '../controllers/MeasurementEvaluationController';
import { authenticate, isAdmin } from '../middleware/authMiddleware';

const router = express.Router();

// Public routes - none

// Protected routes
router.get('/campaign/:campaignId/service/:serviceId', authenticate, MeasurementEvaluationController.getEvaluationsByCampaignAndService);
router.get('/:id/history', authenticate, MeasurementEvaluationController.getEvaluationHistory);

// Admin only routes for updating evaluations
router.put('/:id', authenticate, isAdmin, MeasurementEvaluationController.updateEvaluation);
router.post('/campaign/:campaignId/service/:serviceId/bulk', authenticate, isAdmin, MeasurementEvaluationController.bulkUpdateEvaluations);

export default router;