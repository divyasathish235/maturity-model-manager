import { Request, Response } from 'express';
import { DatabaseService } from '../services/DatabaseService';
import { Campaign, CampaignStatus } from '../models';

export class CampaignController {
  /**
   * Get all campaigns
   * @param req Express request
   * @param res Express response
   */
  static async getAllCampaigns(req: Request, res: Response): Promise<void> {
    try {
      const sql = `
        SELECT c.id, c.name, c.start_date, c.end_date, c.status, c.created_at, c.updated_at,
               u.id as created_by_id, u.username as created_by_username,
               mm.id as maturity_model_id, mm.name as maturity_model_name,
               COUNT(DISTINCT cp.service_id) as participants_count
        FROM campaigns c
        LEFT JOIN users u ON c.created_by = u.id
        LEFT JOIN maturity_models mm ON c.maturity_model_id = mm.id
        LEFT JOIN campaign_participants cp ON c.id = cp.campaign_id
        GROUP BY c.id
        ORDER BY c.created_at DESC
      `;
      
      const campaigns = await DatabaseService.query(sql);
      
      res.json(campaigns);
    } catch (error) {
      console.error('Error getting campaigns:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Get campaign by ID
   * @param req Express request
   * @param res Express response
   */
  static async getCampaignById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const sql = `
        SELECT c.id, c.name, c.start_date, c.end_date, c.status, c.created_at, c.updated_at,
               u.id as created_by_id, u.username as created_by_username,
               mm.id as maturity_model_id, mm.name as maturity_model_name
        FROM campaigns c
        LEFT JOIN users u ON c.created_by = u.id
        LEFT JOIN maturity_models mm ON c.maturity_model_id = mm.id
        WHERE c.id = ?
      `;
      
      const campaign = await DatabaseService.get(sql, [id]);
      
      if (!campaign) {
        res.status(404).json({ message: 'Campaign not found' });
        return;
      }
      
      // Get participants for this campaign
      const participantsSql = `
        SELECT cp.id, s.id as service_id, s.name as service_name, s.service_type,
               t.id as team_id, t.name as team_name
        FROM campaign_participants cp
        JOIN services s ON cp.service_id = s.id
        JOIN teams t ON s.team_id = t.id
        WHERE cp.campaign_id = ?
        ORDER BY t.name, s.name
      `;
      
      const participants = await DatabaseService.query(participantsSql, [id]);
      
      // Get evaluation summary
      const evaluationSummarySql = `
        SELECT 
          status,
          COUNT(*) as count
        FROM measurement_evaluations
        WHERE campaign_id = ?
        GROUP BY status
      `;
      
      const evaluationSummary = await DatabaseService.query(evaluationSummarySql, [id]);
      
      res.json({
        ...campaign,
        participants,
        evaluationSummary
      });
    } catch (error) {
      console.error('Error getting campaign:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Create a new campaign
   * @param req Express request
   * @param res Express response
   */
  static async createCampaign(req: Request, res: Response): Promise<void> {
    try {
      const { name, maturity_model_id, start_date, end_date, created_by } = req.body;
      
      if (!name || !maturity_model_id || !created_by) {
        res.status(400).json({ message: 'Name, maturity_model_id, and created_by are required' });
        return;
      }
      
      // Check if maturity model exists
      const maturityModel = await DatabaseService.get(
        'SELECT id FROM maturity_models WHERE id = ?',
        [maturity_model_id]
      );
      
      if (!maturityModel) {
        res.status(404).json({ message: 'Maturity model not found' });
        return;
      }
      
      // Check if creator exists
      const creator = await DatabaseService.get(
        'SELECT id FROM users WHERE id = ?',
        [created_by]
      );
      
      if (!creator) {
        res.status(404).json({ message: 'Creator not found' });
        return;
      }
      
      const campaignId = await DatabaseService.run(
        `INSERT INTO campaigns (name, maturity_model_id, start_date, end_date, status, created_by) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [name, maturity_model_id, start_date || null, end_date || null, CampaignStatus.DRAFT, created_by]
      );
      
      const newCampaign = await DatabaseService.get<any>(
        `SELECT c.id, c.name, c.start_date, c.end_date, c.status, c.created_at, c.updated_at,
                u.id as created_by_id, u.username as created_by_username,
                mm.id as maturity_model_id, mm.name as maturity_model_name
         FROM campaigns c
         LEFT JOIN users u ON c.created_by = u.id
         LEFT JOIN maturity_models mm ON c.maturity_model_id = mm.id
         WHERE c.id = ?`,
        [campaignId]
      );
      
      res.status(201).json({
        ...(newCampaign || {}),
        participants: [],
        evaluationSummary: []
      });
    } catch (error) {
      console.error('Error creating campaign:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Update a campaign
   * @param req Express request
   * @param res Express response
   */
  static async updateCampaign(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, start_date, end_date, status } = req.body;
      
      // Check if campaign exists
      const campaign = await DatabaseService.get<{id: number, status: string}>(
        'SELECT id, status FROM campaigns WHERE id = ?',
        [id]
      );
      
      if (!campaign) {
        res.status(404).json({ message: 'Campaign not found' });
        return;
      }
      
      // Validate status if provided
      if (status) {
        const validStatuses = Object.values(CampaignStatus);
        if (!validStatuses.includes(status)) {
          res.status(400).json({ 
            message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
          });
          return;
        }
        
        // Check if status transition is valid
        if (campaign.status === CampaignStatus.COMPLETED && status !== CampaignStatus.COMPLETED) {
          res.status(400).json({ message: 'Cannot change status of a completed campaign' });
          return;
        }
        
        if (campaign.status === CampaignStatus.CANCELLED && status !== CampaignStatus.CANCELLED) {
          res.status(400).json({ message: 'Cannot change status of a cancelled campaign' });
          return;
        }
      }
      
      const updates: string[] = [];
      const params: any[] = [];
      
      if (name) {
        updates.push('name = ?');
        params.push(name);
      }
      
      if (start_date !== undefined) {
        updates.push('start_date = ?');
        params.push(start_date || null);
      }
      
      if (end_date !== undefined) {
        updates.push('end_date = ?');
        params.push(end_date || null);
      }
      
      if (status) {
        updates.push('status = ?');
        params.push(status);
      }
      
      if (updates.length === 0) {
        res.status(400).json({ message: 'No valid fields to update' });
        return;
      }
      
      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(id);
      
      await DatabaseService.run(
        `UPDATE campaigns SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
      
      const updatedCampaign = await DatabaseService.get(
        `SELECT c.id, c.name, c.start_date, c.end_date, c.status, c.created_at, c.updated_at,
                u.id as created_by_id, u.username as created_by_username,
                mm.id as maturity_model_id, mm.name as maturity_model_name
         FROM campaigns c
         LEFT JOIN users u ON c.created_by = u.id
         LEFT JOIN maturity_models mm ON c.maturity_model_id = mm.id
         WHERE c.id = ?`,
        [id]
      );
      
      res.json(updatedCampaign);
    } catch (error) {
      console.error('Error updating campaign:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Delete a campaign
   * @param req Express request
   * @param res Express response
   */
  static async deleteCampaign(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Check if campaign exists
      const campaign = await DatabaseService.get(
        'SELECT id FROM campaigns WHERE id = ?',
        [id]
      );
      
      if (!campaign) {
        res.status(404).json({ message: 'Campaign not found' });
        return;
      }
      
      // Start a transaction
      await DatabaseService.beginTransaction();
      
      try {
        // Delete measurement evaluations
        await DatabaseService.run(
          'DELETE FROM measurement_evaluations WHERE campaign_id = ?',
          [id]
        );
        
        // Delete campaign participants
        await DatabaseService.run(
          'DELETE FROM campaign_participants WHERE campaign_id = ?',
          [id]
        );
        
        // Delete campaign
        await DatabaseService.run(
          'DELETE FROM campaigns WHERE id = ?',
          [id]
        );
        
        // Commit transaction
        await DatabaseService.commitTransaction();
        
        res.status(204).send();
      } catch (error) {
        // Rollback transaction on error
        await DatabaseService.rollbackTransaction();
        throw error;
      }
    } catch (error) {
      console.error('Error deleting campaign:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Add a participant to a campaign
   * @param req Express request
   * @param res Express response
   */
  static async addParticipant(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { service_id } = req.body;
      
      if (!service_id) {
        res.status(400).json({ message: 'Service ID is required' });
        return;
      }
      
      // Check if campaign exists
      const campaign = await DatabaseService.get<{id: number, maturity_model_id: number, status: string}>(
        'SELECT id, maturity_model_id, status FROM campaigns WHERE id = ?',
        [id]
      );
      
      if (!campaign) {
        res.status(404).json({ message: 'Campaign not found' });
        return;
      }
      
      // Check if campaign is in a valid state
      if (campaign.status === CampaignStatus.COMPLETED || campaign.status === CampaignStatus.CANCELLED) {
        res.status(400).json({ message: `Cannot add participants to a ${campaign.status} campaign` });
        return;
      }
      
      // Check if service exists
      const service = await DatabaseService.get(
        'SELECT id FROM services WHERE id = ?',
        [service_id]
      );
      
      if (!service) {
        res.status(404).json({ message: 'Service not found' });
        return;
      }
      
      // Check if service is already a participant
      const existingParticipant = await DatabaseService.get(
        'SELECT id FROM campaign_participants WHERE campaign_id = ? AND service_id = ?',
        [id, service_id]
      );
      
      if (existingParticipant) {
        res.status(409).json({ message: 'Service is already a participant in this campaign' });
        return;
      }
      
      // Start a transaction
      await DatabaseService.beginTransaction();
      
      try {
        // Add participant
        const participantId = await DatabaseService.run(
          'INSERT INTO campaign_participants (campaign_id, service_id) VALUES (?, ?)',
          [id, service_id]
        );
        
        // Get measurements for this maturity model
        const measurements = await DatabaseService.query<{id: number}>(
          'SELECT id FROM measurements WHERE maturity_model_id = ?',
          [campaign.maturity_model_id]
        );
        
        // Create measurement evaluations for each measurement
        for (const measurement of measurements) {
          await DatabaseService.run(
            `INSERT INTO measurement_evaluations 
             (campaign_id, service_id, measurement_id, status) 
             VALUES (?, ?, ?, 'Not Implemented')`,
            [id, service_id, measurement.id]
          );
        }
        
        // Commit transaction
        await DatabaseService.commitTransaction();
        
        // Get the new participant
        const participant = await DatabaseService.get(
          `SELECT cp.id, s.id as service_id, s.name as service_name, s.service_type,
                  t.id as team_id, t.name as team_name
           FROM campaign_participants cp
           JOIN services s ON cp.service_id = s.id
           JOIN teams t ON s.team_id = t.id
           WHERE cp.id = ?`,
          [participantId]
        );
        
        res.status(201).json(participant);
      } catch (error) {
        // Rollback transaction on error
        await DatabaseService.rollbackTransaction();
        throw error;
      }
    } catch (error) {
      console.error('Error adding participant:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Remove a participant from a campaign
   * @param req Express request
   * @param res Express response
   */
  static async removeParticipant(req: Request, res: Response): Promise<void> {
    try {
      const { id, serviceId } = req.params;
      
      // Check if campaign exists
      const campaign = await DatabaseService.get<{id: number, status: string}>(
        'SELECT id, status FROM campaigns WHERE id = ?',
        [id]
      );
      
      if (!campaign) {
        res.status(404).json({ message: 'Campaign not found' });
        return;
      }
      
      // Check if campaign is in a valid state
      if (campaign.status === CampaignStatus.COMPLETED || campaign.status === CampaignStatus.CANCELLED) {
        res.status(400).json({ message: `Cannot remove participants from a ${campaign.status} campaign` });
        return;
      }
      
      // Check if participant exists
      const participant = await DatabaseService.get(
        'SELECT id FROM campaign_participants WHERE campaign_id = ? AND service_id = ?',
        [id, serviceId]
      );
      
      if (!participant) {
        res.status(404).json({ message: 'Participant not found' });
        return;
      }
      
      // Start a transaction
      await DatabaseService.beginTransaction();
      
      try {
        // Delete measurement evaluations
        await DatabaseService.run(
          'DELETE FROM measurement_evaluations WHERE campaign_id = ? AND service_id = ?',
          [id, serviceId]
        );
        
        // Delete participant
        await DatabaseService.run(
          'DELETE FROM campaign_participants WHERE campaign_id = ? AND service_id = ?',
          [id, serviceId]
        );
        
        // Commit transaction
        await DatabaseService.commitTransaction();
        
        res.status(204).send();
      } catch (error) {
        // Rollback transaction on error
        await DatabaseService.rollbackTransaction();
        throw error;
      }
    } catch (error) {
      console.error('Error removing participant:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Get campaign summary
   * @param req Express request
   * @param res Express response
   */
  static async getCampaignSummary(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Check if campaign exists
      const campaign = await DatabaseService.get(
        'SELECT id FROM campaigns WHERE id = ?',
        [id]
      );
      
      if (!campaign) {
        res.status(404).json({ message: 'Campaign not found' });
        return;
      }
      
      // Get service summaries
      const serviceSummarySql = `
        SELECT 
          s.id as service_id,
          s.name as service_name,
          t.id as team_id,
          t.name as team_name,
          COUNT(CASE WHEN me.status = 'Implemented' THEN 1 END) as implemented_count,
          COUNT(me.id) as total_count,
          ROUND(COUNT(CASE WHEN me.status = 'Implemented' THEN 1 END) * 100.0 / COUNT(me.id), 2) as implementation_percentage
        FROM campaign_participants cp
        JOIN services s ON cp.service_id = s.id
        JOIN teams t ON s.team_id = t.id
        LEFT JOIN measurement_evaluations me ON cp.campaign_id = me.campaign_id AND cp.service_id = me.service_id
        WHERE cp.campaign_id = ?
        GROUP BY s.id
        ORDER BY implementation_percentage DESC, s.name
      `;
      
      const serviceSummaries = await DatabaseService.query(serviceSummarySql, [id]);
      
      // Get team summaries
      const teamSummarySql = `
        SELECT 
          t.id as team_id,
          t.name as team_name,
          COUNT(DISTINCT s.id) as services_count,
          SUM(CASE WHEN me.status = 'Implemented' THEN 1 ELSE 0 END) as implemented_count,
          COUNT(me.id) as total_count,
          ROUND(SUM(CASE WHEN me.status = 'Implemented' THEN 1 ELSE 0 END) * 100.0 / COUNT(me.id), 2) as implementation_percentage
        FROM campaign_participants cp
        JOIN services s ON cp.service_id = s.id
        JOIN teams t ON s.team_id = t.id
        LEFT JOIN measurement_evaluations me ON cp.campaign_id = me.campaign_id AND cp.service_id = me.service_id
        WHERE cp.campaign_id = ?
        GROUP BY t.id
        ORDER BY implementation_percentage DESC, t.name
      `;
      
      const teamSummaries = await DatabaseService.query(teamSummarySql, [id]);
      
      // Get category summaries
      const categorySummarySql = `
        SELECT 
          mc.id as category_id,
          mc.name as category_name,
          COUNT(CASE WHEN me.status = 'Implemented' THEN 1 END) as implemented_count,
          COUNT(me.id) as total_count,
          ROUND(COUNT(CASE WHEN me.status = 'Implemented' THEN 1 END) * 100.0 / COUNT(me.id), 2) as implementation_percentage
        FROM measurement_evaluations me
        JOIN measurements m ON me.measurement_id = m.id
        JOIN measurement_categories mc ON m.category_id = mc.id
        WHERE me.campaign_id = ?
        GROUP BY mc.id
        ORDER BY implementation_percentage DESC, mc.name
      `;
      
      const categorySummaries = await DatabaseService.query(categorySummarySql, [id]);
      
      res.json({
        serviceSummaries,
        teamSummaries,
        categorySummaries
      });
    } catch (error) {
      console.error('Error getting campaign summary:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}