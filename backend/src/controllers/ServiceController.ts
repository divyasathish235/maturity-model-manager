import { Request, Response } from 'express';
import { DatabaseService } from '../services/DatabaseService';
import { Service, ServiceType } from '../models';

export class ServiceController {
  /**
   * Get all services
   * @param req Express request
   * @param res Express response
   */
  static async getAllServices(req: Request, res: Response): Promise<void> {
    try {
      const teamId = req.query.team_id;
      
      let sql = `
        SELECT s.id, s.name, s.description, s.service_type, s.resource_location, s.created_at, s.updated_at,
               u.id as owner_id, u.username as owner_username,
               t.id as team_id, t.name as team_name
        FROM services s
        LEFT JOIN users u ON s.owner_id = u.id
        LEFT JOIN teams t ON s.team_id = t.id
      `;
      
      const params: any[] = [];
      
      if (teamId) {
        sql += ' WHERE s.team_id = ?';
        params.push(teamId);
      }
      
      sql += ' ORDER BY s.name';
      
      const services = await DatabaseService.query(sql, params);
      
      res.json(services);
    } catch (error) {
      console.error('Error getting services:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Get service by ID
   * @param req Express request
   * @param res Express response
   */
  static async getServiceById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const sql = `
        SELECT s.id, s.name, s.description, s.service_type, s.resource_location, s.created_at, s.updated_at,
               u.id as owner_id, u.username as owner_username,
               t.id as team_id, t.name as team_name
        FROM services s
        LEFT JOIN users u ON s.owner_id = u.id
        LEFT JOIN teams t ON s.team_id = t.id
        WHERE s.id = ?
      `;
      
      const service = await DatabaseService.get(sql, [id]);
      
      if (!service) {
        res.status(404).json({ message: 'Service not found' });
        return;
      }
      
      res.json(service);
    } catch (error) {
      console.error('Error getting service:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Create a new service
   * @param req Express request
   * @param res Express response
   */
  static async createService(req: Request, res: Response): Promise<void> {
    try {
      const { name, owner_id, team_id, description, service_type, resource_location } = req.body;
      
      if (!name || !owner_id || !team_id || !service_type) {
        res.status(400).json({ message: 'Name, owner_id, team_id, and service_type are required' });
        return;
      }
      
      // Validate service type
      const validServiceTypes = Object.values(ServiceType);
      if (!validServiceTypes.includes(service_type)) {
        res.status(400).json({ 
          message: `Invalid service type. Must be one of: ${validServiceTypes.join(', ')}` 
        });
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
      
      // Check if team exists
      const team = await DatabaseService.get(
        'SELECT id FROM teams WHERE id = ?',
        [team_id]
      );
      
      if (!team) {
        res.status(404).json({ message: 'Team not found' });
        return;
      }
      
      const serviceId = await DatabaseService.run(
        `INSERT INTO services (name, owner_id, team_id, description, service_type, resource_location) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [name, owner_id, team_id, description || '', service_type, resource_location || '']
      );
      
      const newService = await DatabaseService.get(
        `SELECT s.id, s.name, s.description, s.service_type, s.resource_location, s.created_at, s.updated_at,
                u.id as owner_id, u.username as owner_username,
                t.id as team_id, t.name as team_name
         FROM services s
         LEFT JOIN users u ON s.owner_id = u.id
         LEFT JOIN teams t ON s.team_id = t.id
         WHERE s.id = ?`,
        [serviceId]
      );
      
      res.status(201).json(newService);
    } catch (error) {
      console.error('Error creating service:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Update a service
   * @param req Express request
   * @param res Express response
   */
  static async updateService(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, owner_id, team_id, description, service_type, resource_location } = req.body;
      
      // Check if service exists
      const service = await DatabaseService.get(
        'SELECT id FROM services WHERE id = ?',
        [id]
      );
      
      if (!service) {
        res.status(404).json({ message: 'Service not found' });
        return;
      }
      
      // Validate service type if provided
      if (service_type) {
        const validServiceTypes = Object.values(ServiceType);
        if (!validServiceTypes.includes(service_type)) {
          res.status(400).json({ 
            message: `Invalid service type. Must be one of: ${validServiceTypes.join(', ')}` 
          });
          return;
        }
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
      
      // Check if new team exists if provided
      if (team_id) {
        const team = await DatabaseService.get(
          'SELECT id FROM teams WHERE id = ?',
          [team_id]
        );
        
        if (!team) {
          res.status(404).json({ message: 'Team not found' });
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
      
      if (team_id) {
        updates.push('team_id = ?');
        params.push(team_id);
      }
      
      if (description !== undefined) {
        updates.push('description = ?');
        params.push(description);
      }
      
      if (service_type) {
        updates.push('service_type = ?');
        params.push(service_type);
      }
      
      if (resource_location !== undefined) {
        updates.push('resource_location = ?');
        params.push(resource_location);
      }
      
      if (updates.length === 0) {
        res.status(400).json({ message: 'No valid fields to update' });
        return;
      }
      
      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(id);
      
      await DatabaseService.run(
        `UPDATE services SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
      
      const updatedService = await DatabaseService.get(
        `SELECT s.id, s.name, s.description, s.service_type, s.resource_location, s.created_at, s.updated_at,
                u.id as owner_id, u.username as owner_username,
                t.id as team_id, t.name as team_name
         FROM services s
         LEFT JOIN users u ON s.owner_id = u.id
         LEFT JOIN teams t ON s.team_id = t.id
         WHERE s.id = ?`,
        [id]
      );
      
      res.json(updatedService);
    } catch (error) {
      console.error('Error updating service:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Delete a service
   * @param req Express request
   * @param res Express response
   */
  static async deleteService(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Check if service exists
      const service = await DatabaseService.get(
        'SELECT id FROM services WHERE id = ?',
        [id]
      );
      
      if (!service) {
        res.status(404).json({ message: 'Service not found' });
        return;
      }
      
      // Check if service is part of any campaign
      const campaignParticipants = await DatabaseService.query(
        'SELECT id FROM campaign_participants WHERE service_id = ?',
        [id]
      );
      
      if (campaignParticipants.length > 0) {
        res.status(400).json({ 
          message: 'Cannot delete service that is part of a campaign. Please remove from campaigns first.' 
        });
        return;
      }
      
      await DatabaseService.run(
        'DELETE FROM services WHERE id = ?',
        [id]
      );
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting service:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}