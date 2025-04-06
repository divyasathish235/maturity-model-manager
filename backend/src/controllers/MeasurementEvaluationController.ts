import { Request, Response } from 'express';
import { DatabaseService } from '../services/DatabaseService';
import { EvaluationStatus } from '../models';

export class MeasurementEvaluationController {
  /**
   * Get evaluations for a campaign and service
   * @param req Express request
   * @param res Express response
   */
  static async getEvaluationsByCampaignAndService(req: Request, res: Response): Promise<void> {
    try {
      const { campaignId, serviceId } = req.params;
      
      // Check if campaign exists
      const campaign = await DatabaseService.get<{id: number, name: string}>(
        'SELECT id, name FROM campaigns WHERE id = ?',
        [campaignId]
      );
      
      if (!campaign) {
        res.status(404).json({ message: 'Campaign not found' });
        return;
      }
      
      // Check if service exists
      const service = await DatabaseService.get<{id: number, name: string}>(
        'SELECT id, name FROM services WHERE id = ?',
        [serviceId]
      );
      
      if (!service) {
        res.status(404).json({ message: 'Service not found' });
        return;
      }
      
      // Check if service is a participant in the campaign
      const participant = await DatabaseService.get(
        'SELECT id FROM campaign_participants WHERE campaign_id = ? AND service_id = ?',
        [campaignId, serviceId]
      );
      
      if (!participant) {
        res.status(404).json({ message: 'Service is not a participant in this campaign' });
        return;
      }
      
      const sql = `
        SELECT me.id, me.status, me.evidence_location, me.notes, me.evaluated_by, me.evaluated_at, me.created_at, me.updated_at,
               m.id as measurement_id, m.name as measurement_name, m.description as measurement_description, 
               m.evidence_type, m.sample_evidence,
               mc.id as category_id, mc.name as category_name,
               u.username as evaluator_username
        FROM measurement_evaluations me
        JOIN measurements m ON me.measurement_id = m.id
        JOIN measurement_categories mc ON m.category_id = mc.id
        LEFT JOIN users u ON me.evaluated_by = u.id
        WHERE me.campaign_id = ? AND me.service_id = ?
        ORDER BY mc.name, m.name
      `;
      
      const evaluations = await DatabaseService.query(sql, [campaignId, serviceId]);
      
      res.json({
        campaign: {
          id: campaign.id,
          name: campaign.name
        },
        service: {
          id: service.id,
          name: service.name
        },
        evaluations
      });
    } catch (error) {
      console.error('Error getting evaluations:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Update an evaluation
   * @param req Express request
   * @param res Express response
   */
  static async updateEvaluation(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, evidence_location, notes, evaluated_by } = req.body;
      const userId = req.user?.id; // From auth middleware
      
      if (!status) {
        res.status(400).json({ message: 'Status is required' });
        return;
      }
      
      // Validate status
      const validStatuses = Object.values(EvaluationStatus);
      if (!validStatuses.includes(status)) {
        res.status(400).json({ 
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
        });
        return;
      }
      
      // Check if evaluation exists
      const evaluation = await DatabaseService.get<{
        id: number;
        campaign_id: number;
        service_id: number;
        measurement_id: number;
        status: string;
      }>(
        'SELECT id, campaign_id, service_id, measurement_id, status FROM measurement_evaluations WHERE id = ?',
        [id]
      );
      
      if (!evaluation) {
        res.status(404).json({ message: 'Evaluation not found' });
        return;
      }
      
      // Check if campaign is active
      const campaign = await DatabaseService.get<{status: string}>(
        'SELECT status FROM campaigns WHERE id = ?',
        [evaluation.campaign_id]
      );
      
      if (!campaign) {
        res.status(404).json({ message: 'Campaign not found' });
        return;
      }
      
      if (campaign.status !== 'active') {
        res.status(400).json({ message: `Cannot update evaluations for a ${campaign.status} campaign` });
        return;
      }
      
      // Start a transaction
      await DatabaseService.beginTransaction();
      
      try {
        // Record history
        await DatabaseService.run(
          `INSERT INTO evaluation_history (evaluation_id, previous_status, new_status, changed_by, notes) 
           VALUES (?, ?, ?, ?, ?)`,
          [id, evaluation.status, status, userId || evaluated_by, notes || null]
        );
        
        // Update evaluation
        const updates: string[] = [];
        const params: any[] = [];
        
        updates.push('status = ?');
        params.push(status);
        
        if (evidence_location !== undefined) {
          updates.push('evidence_location = ?');
          params.push(evidence_location || null);
        }
        
        if (notes !== undefined) {
          updates.push('notes = ?');
          params.push(notes || null);
        }
        
        // Only set evaluated_by and evaluated_at if status is changing to Implemented or Evidence Rejected
        if (status === EvaluationStatus.IMPLEMENTED || status === EvaluationStatus.EVIDENCE_REJECTED) {
          updates.push('evaluated_by = ?');
          params.push(userId || evaluated_by);
          
          updates.push('evaluated_at = CURRENT_TIMESTAMP');
        }
        
        updates.push('updated_at = CURRENT_TIMESTAMP');
        params.push(id);
        
        await DatabaseService.run(
          `UPDATE measurement_evaluations SET ${updates.join(', ')} WHERE id = ?`,
          params
        );
        
        // Commit transaction
        await DatabaseService.commitTransaction();
        
        // Get updated evaluation
        const updatedEvaluation = await DatabaseService.get(
          `SELECT me.id, me.status, me.evidence_location, me.notes, me.evaluated_by, me.evaluated_at, me.created_at, me.updated_at,
                  m.id as measurement_id, m.name as measurement_name, m.description as measurement_description, 
                  m.evidence_type, m.sample_evidence,
                  mc.id as category_id, mc.name as category_name,
                  u.username as evaluator_username
           FROM measurement_evaluations me
           JOIN measurements m ON me.measurement_id = m.id
           JOIN measurement_categories mc ON m.category_id = mc.id
           LEFT JOIN users u ON me.evaluated_by = u.id
           WHERE me.id = ?`,
          [id]
        );
        
        res.json(updatedEvaluation);
      } catch (error) {
        // Rollback transaction on error
        await DatabaseService.rollbackTransaction();
        throw error;
      }
    } catch (error) {
      console.error('Error updating evaluation:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Get evaluation history
   * @param req Express request
   * @param res Express response
   */
  static async getEvaluationHistory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Check if evaluation exists
      const evaluation = await DatabaseService.get(
        'SELECT id FROM measurement_evaluations WHERE id = ?',
        [id]
      );
      
      if (!evaluation) {
        res.status(404).json({ message: 'Evaluation not found' });
        return;
      }
      
      const sql = `
        SELECT eh.id, eh.previous_status, eh.new_status, eh.notes, eh.created_at,
               u.id as changed_by_id, u.username as changed_by_username
        FROM evaluation_history eh
        LEFT JOIN users u ON eh.changed_by = u.id
        WHERE eh.evaluation_id = ?
        ORDER BY eh.created_at DESC
      `;
      
      const history = await DatabaseService.query(sql, [id]);
      
      res.json(history);
    } catch (error) {
      console.error('Error getting evaluation history:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Bulk update evaluations
   * @param req Express request
   * @param res Express response
   */
  static async bulkUpdateEvaluations(req: Request, res: Response): Promise<void> {
    try {
      const { campaignId, serviceId } = req.params;
      const { status, categoryId, userId } = req.body;
      
      if (!status) {
        res.status(400).json({ message: 'Status is required' });
        return;
      }
      
      // Validate status
      const validStatuses = Object.values(EvaluationStatus);
      if (!validStatuses.includes(status)) {
        res.status(400).json({ 
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
        });
        return;
      }
      
      // Check if campaign exists and is active
      const campaign = await DatabaseService.get<{status: string}>(
        'SELECT status FROM campaigns WHERE id = ?',
        [campaignId]
      );
      
      if (!campaign) {
        res.status(404).json({ message: 'Campaign not found' });
        return;
      }
      
      if (campaign.status !== 'active') {
        res.status(400).json({ message: `Cannot update evaluations for a ${campaign.status} campaign` });
        return;
      }
      
      // Check if service is a participant
      const participant = await DatabaseService.get(
        'SELECT id FROM campaign_participants WHERE campaign_id = ? AND service_id = ?',
        [campaignId, serviceId]
      );
      
      if (!participant) {
        res.status(404).json({ message: 'Service is not a participant in this campaign' });
        return;
      }
      
      // Start a transaction
      await DatabaseService.beginTransaction();
      
      try {
        // Build query to get evaluations to update
        let evaluationsSql = `
          SELECT me.id, me.status
          FROM measurement_evaluations me
          JOIN measurements m ON me.measurement_id = m.id
          WHERE me.campaign_id = ? AND me.service_id = ?
        `;
        
        const params: any[] = [campaignId, serviceId];
        
        if (categoryId) {
          evaluationsSql += ' AND m.category_id = ?';
          params.push(categoryId);
        }
        
        const evaluations = await DatabaseService.query<{id: number, status: string}>(evaluationsSql, params);
        
        if (evaluations.length === 0) {
          res.status(404).json({ message: 'No evaluations found' });
          return;
        }
        
        // Update each evaluation
        for (const evaluation of evaluations) {
          // Record history
          await DatabaseService.run(
            `INSERT INTO evaluation_history (evaluation_id, previous_status, new_status, changed_by, notes) 
             VALUES (?, ?, ?, ?, ?)`,
            [evaluation.id, evaluation.status, status, userId, 'Bulk update']
          );
          
          // Update evaluation
          const updateSql = status === EvaluationStatus.IMPLEMENTED || status === EvaluationStatus.EVIDENCE_REJECTED
            ? `UPDATE measurement_evaluations 
               SET status = ?, evaluated_by = ?, evaluated_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
               WHERE id = ?`
            : `UPDATE measurement_evaluations 
               SET status = ?, updated_at = CURRENT_TIMESTAMP 
               WHERE id = ?`;
          
          const updateParams = status === EvaluationStatus.IMPLEMENTED || status === EvaluationStatus.EVIDENCE_REJECTED
            ? [status, userId, evaluation.id]
            : [status, evaluation.id];
          
          await DatabaseService.run(updateSql, updateParams);
        }
        
        // Commit transaction
        await DatabaseService.commitTransaction();
        
        res.json({ 
          message: `Updated ${evaluations.length} evaluations to status: ${status}`,
          count: evaluations.length
        });
      } catch (error) {
        // Rollback transaction on error
        await DatabaseService.rollbackTransaction();
        throw error;
      }
    } catch (error) {
      console.error('Error bulk updating evaluations:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}