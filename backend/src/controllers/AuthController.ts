import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { UserService } from '../services/UserService';
import { User, UserRole } from '../models';

export class AuthController {
  /**
   * Login a user
   * @param req Express request
   * @param res Express response
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        res.status(400).json({ message: 'Username and password are required' });
        return;
      }
      
      const result = await AuthService.authenticate(username, password);
      
      if (!result) {
        res.status(401).json({ message: 'Invalid credentials' });
        return;
      }
      
      res.json(result);
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Register a new user
   * @param req Express request
   * @param res Express response
   */
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { username, password, email, role } = req.body;
      
      if (!username || !password || !email) {
        res.status(400).json({ message: 'Username, password, and email are required' });
        return;
      }
      
      // Check if user already exists
      const existingUser = await UserService.getUserByUsername(username);
      
      if (existingUser) {
        res.status(409).json({ message: 'Username already exists' });
        return;
      }
      
      // Only admins can create admin users
      if (role === UserRole.ADMIN && (!req.user || req.user.role !== UserRole.ADMIN)) {
        res.status(403).json({ message: 'Only admins can create admin users' });
        return;
      }
      
      // Create user
      const user: User = {
        username,
        password,
        email,
        role: role || UserRole.TEAM_MEMBER
      };
      
      const userId = await UserService.createUser(user);
      
      // Get created user
      const createdUser = await UserService.getUserById(userId);
      
      if (!createdUser) {
        res.status(500).json({ message: 'Failed to create user' });
        return;
      }
      
      res.status(201).json(createdUser);
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Get current user profile
   * @param req Express request
   * @param res Express response
   */
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }
      
      const user = await UserService.getUserById(req.user.id);
      
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      
      res.json(user);
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Update current user profile
   * @param req Express request
   * @param res Express response
   */
  static async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }
      
      const { username, email, password } = req.body;
      
      // Only allow updating username, email, and password
      const updates: Partial<User> = {};
      
      if (username) updates.username = username;
      if (email) updates.email = email;
      if (password) updates.password = password;
      
      if (Object.keys(updates).length === 0) {
        res.status(400).json({ message: 'No valid fields to update' });
        return;
      }
      
      const success = await UserService.updateUser(req.user.id, updates);
      
      if (!success) {
        res.status(500).json({ message: 'Failed to update profile' });
        return;
      }
      
      const updatedUser = await UserService.getUserById(req.user.id);
      
      res.json(updatedUser);
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}