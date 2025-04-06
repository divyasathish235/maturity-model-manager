import express from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticate, isAdmin } from '../middleware/authMiddleware';

const router = express.Router();

// Public routes
router.post('/login', AuthController.login);
router.post('/register', AuthController.register);

// Protected routes
router.get('/profile', authenticate, AuthController.getProfile);
router.put('/profile', authenticate, AuthController.updateProfile);

export default router;