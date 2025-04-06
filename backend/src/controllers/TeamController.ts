import { Request, Response } from 'express';
import { DatabaseService } from '../services/DatabaseService';
import { Team } from '../models';

export class TeamController {
  /**
   * Get all teams
   * @param req Express request
   * @param res Express response
   */
  static async getAllTeams(req: Request, res: Response): Promise<void> {
    try {
      const sql = `
        SELECT t.id, t.name, t.description, t.created_at, t.updated_at,
               u.id as owner_id, u.username as owner_username,
               COUNT(s.id) as services_count
        FROM teams t
        LEFT JOIN users u ON t.owner_id = u.id
        LEFT JOIN services s ON t.id = s.team_id
        GROUP BY t.id
        ORDER BY t.name
      `;
      
      const teams = await DatabaseService.query(sql);
      
      res.json(teams);
    } catch (error) {
      console.error('Error getting teams:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Get team by ID
   * @param req Express request
   * @param res Express response
   */
  static async getTeamById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const sql = `
        SELECT t.id, t.name, t.description, t.created_at, t.updated_at,
               u.id as owner_id, u.username as owner_username
        FROM teams t
        LEFT JOIN users u ON t.owner_id = u.id
        WHERE t.id = ?
      `;
      
      const team = await DatabaseService.get(sql, [id]);
      
      if (!team) {
        res.status(404).json({ message: 'Team not found' });
        return;
      }
      
      // Get services for this team
      const servicesSql = `
        SELECT id, name, service_type
        FROM services
        WHERE team_id = ?
      `;
      
      const services = await DatabaseService.query(servicesSql, [id]);
      
      res.json({
        ...team,
        services
      });
    } catch (error) {
      console.error('Error getting team:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Create a new team
   * @param req Express request
   * @param res Express response
   */
  static async createTeam(req: Request, res: Response): Promise<void> {
    try {
      const { name, owner_id, description } = req.body;
      
      if (!name || !owner_id) {
        res.status(400).json({ message: 'Name and owner_id are required' });
        return;
      }
      
      // Check if team with this name already exists
      const existingTeam = await DatabaseService.get(
        'SELECT id FROM teams WHERE name = ?',
        [name]
      );
      
      if (existingTeam) {
        res.status(409).json({ message: 'Team with this name already exists' });
        return;
      }
      
      // Check if owner exists
      const owner = await DatabaseService.get(
        'SELECT id FROM users WHERE id = ?',
        [owner_id]
      );
      
      if (!owner) {
        res.status(404).json({ message: 'Owner not found' });
        return;
      }
      
      const teamId = await DatabaseService.run(
        'INSERT INTO teams (name, owner_id, description) VALUES (?, ?, ?)',
        [name, owner_id, description || '']
      );
      
      const newTeam = await DatabaseService.get(
        `SELECT t.id, t.name, t.description, t.created_at, t.updated_at,
                u.id as owner_id, u.username as owner_username
         FROM teams t
         LEFT JOIN users u ON t.owner_id = u.id
         WHERE t.id = ?`,
        [teamId]
      );
      
      res.status(201).json(newTeam);
    } catch (error) {
      console.error('Error creating team:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Update a team
   * @param req Express request
   * @param res Express response
   */
  static async updateTeam(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, owner_id, description } = req.body;
      
      // Check if team exists
      const team = await DatabaseService.get(
        'SELECT id FROM teams WHERE id = ?',
        [id]
      );
      
      if (!team) {
        res.status(404).json({ message: 'Team not found' });
        return;
      }
      
      // Check if new owner exists if provided
      if (owner_id) {
        const owner = await DatabaseService.get(
          'SELECT id FROM users WHERE id = ?',
          [owner_id]
        );
        
        if (!owner) {
          res.status(404).json({ message: 'Owner not found' });
          return;
        }
      }
      
      // Check if new name is unique if provided
      if (name) {
        const existingTeam = await DatabaseService.get(
          'SELECT id FROM teams WHERE name = ? AND id != ?',
          [name, id]
        );
        
        if (existingTeam) {
          res.status(409).json({ message: 'Team with this name already exists' });
          return;
        }
      }
      
      const updates: string[] = [];
      const params: any[] = [];
      
      if (name) {
        updates.push('name = ?');
        params.push(name);
      }
      
      if (owner_id) {
        updates.push('owner_id = ?');
        params.push(owner_id);
      }
      
      if (description !== undefined) {
        updates.push('description = ?');
        params.push(description);
      }
      
      if (updates.length === 0) {
        res.status(400).json({ message: 'No valid fields to update' });
        return;
      }
      
      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(id);
      
      await DatabaseService.run(
        `UPDATE teams SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
      
      const updatedTeam = await DatabaseService.get(
        `SELECT t.id, t.name, t.description, t.created_at, t.updated_at,
                u.id as owner_id, u.username as owner_username
         FROM teams t
         LEFT JOIN users u ON t.owner_id = u.id
         WHERE t.id = ?`,
        [id]
      );
      
      res.json(updatedTeam);
    } catch (error) {
      console.error('Error updating team:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Delete a team
   * @param req Express request
   * @param res Express response
   */
  static async deleteTeam(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Check if team exists
      const team = await DatabaseService.get(
        'SELECT id FROM teams WHERE id = ?',
        [id]
      );
      
      if (!team) {
        res.status(404).json({ message: 'Team not found' });
        return;
      }
      
      // Check if team has services
      const services = await DatabaseService.query(
        'SELECT id FROM services WHERE team_id = ?',
        [id]
      );
      
      if (services.length > 0) {
        res.status(400).json({ 
          message: 'Cannot delete team with associated services. Please delete or reassign services first.' 
        });
        return;
      }
      
      await DatabaseService.run(
        'DELETE FROM teams WHERE id = ?',
        [id]
      );
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting team:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}