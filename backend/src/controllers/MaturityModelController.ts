import { Request, Response } from 'express';
import { DatabaseService } from '../services/DatabaseService';
import { MaturityModel } from '../models';

export class MaturityModelController {
  /**
   * Get all maturity models
   * @param req Express request
   * @param res Express response
   */
  static async getAllMaturityModels(req: Request, res: Response): Promise<void> {
    try {
      const sql = `
        SELECT mm.id, mm.name, mm.description, mm.created_at, mm.updated_at,
               u.id as owner_id, u.username as owner_username,
               COUNT(m.id) as measurements_count
        FROM maturity_models mm
        LEFT JOIN users u ON mm.owner_id = u.id
        LEFT JOIN measurements m ON mm.id = m.maturity_model_id
        GROUP BY mm.id
        ORDER BY mm.name
      `;
      
      const maturityModels = await DatabaseService.query(sql);
      
      res.json(maturityModels);
    } catch (error) {
      console.error('Error getting maturity models:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Get maturity model by ID
   * @param req Express request
   * @param res Express response
   */
  static async getMaturityModelById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const sql = `
        SELECT mm.id, mm.name, mm.description, mm.created_at, mm.updated_at,
               u.id as owner_id, u.username as owner_username
        FROM maturity_models mm
        LEFT JOIN users u ON mm.owner_id = u.id
        WHERE mm.id = ?
      `;
      
      const maturityModel = await DatabaseService.get(sql, [id]);
      
      if (!maturityModel) {
        res.status(404).json({ message: 'Maturity model not found' });
        return;
      }
      
      // Get measurements for this maturity model
      const measurementsSql = `
        SELECT m.id, m.name, m.description, m.evidence_type, m.sample_evidence,
               mc.id as category_id, mc.name as category_name
        FROM measurements m
        LEFT JOIN measurement_categories mc ON m.category_id = mc.id
        WHERE m.maturity_model_id = ?
        ORDER BY mc.name, m.name
      `;
      
      const measurements = await DatabaseService.query(measurementsSql, [id]);
      
      // Get maturity level rules for this maturity model
      const rulesSql = `
        SELECT id, level, min_percentage, max_percentage
        FROM maturity_level_rules
        WHERE maturity_model_id = ?
        ORDER BY level
      `;
      
      const rules = await DatabaseService.query(rulesSql, [id]);
      
      res.json({
        ...maturityModel,
        measurements,
        rules
      });
    } catch (error) {
      console.error('Error getting maturity model:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Create a new maturity model
   * @param req Express request
   * @param res Express response
   */
  static async createMaturityModel(req: Request, res: Response): Promise<void> {
    try {
      const { name, owner_id, description } = req.body;
      
      if (!name || !owner_id) {
        res.status(400).json({ message: 'Name and owner_id are required' });
        return;
      }
      
      // Check if maturity model with this name already exists
      const existingModel = await DatabaseService.get(
        'SELECT id FROM maturity_models WHERE name = ?',
        [name]
      );
      
      if (existingModel) {
        res.status(409).json({ message: 'Maturity model with this name already exists' });
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
      
      // Start a transaction
      await DatabaseService.beginTransaction();
      
      try {
        // Create maturity model
        const modelId = await DatabaseService.run(
          'INSERT INTO maturity_models (name, owner_id, description) VALUES (?, ?, ?)',
          [name, owner_id, description || '']
        );
        
        // Create default maturity level rules
        const defaultRules = [
          { level: 0, min_percentage: 0, max_percentage: 24.99 },
          { level: 1, min_percentage: 25, max_percentage: 49.99 },
          { level: 2, min_percentage: 50, max_percentage: 74.99 },
          { level: 3, min_percentage: 75, max_percentage: 99.99 },
          { level: 4, min_percentage: 100, max_percentage: 100 }
        ];
        
        for (const rule of defaultRules) {
          await DatabaseService.run(
            'INSERT INTO maturity_level_rules (maturity_model_id, level, min_percentage, max_percentage) VALUES (?, ?, ?, ?)',
            [modelId, rule.level, rule.min_percentage, rule.max_percentage]
          );
        }
        
        // Commit transaction
        await DatabaseService.commitTransaction();
        
        const newModel = await DatabaseService.get<any>(
          `SELECT mm.id, mm.name, mm.description, mm.created_at, mm.updated_at,
                  u.id as owner_id, u.username as owner_username
           FROM maturity_models mm
           LEFT JOIN users u ON mm.owner_id = u.id
           WHERE mm.id = ?`,
          [modelId]
        );
        
        // Get the rules we just created
        const rules = await DatabaseService.query(
          'SELECT id, level, min_percentage, max_percentage FROM maturity_level_rules WHERE maturity_model_id = ? ORDER BY level',
          [modelId]
        );
        
        res.status(201).json({
          ...(newModel || {}),
          rules,
          measurements: []
        });
      } catch (error) {
        // Rollback transaction on error
        await DatabaseService.rollbackTransaction();
        throw error;
      }
    } catch (error) {
      console.error('Error creating maturity model:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Update a maturity model
   * @param req Express request
   * @param res Express response
   */
  static async updateMaturityModel(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, owner_id, description } = req.body;
      
      // Check if maturity model exists
      const model = await DatabaseService.get(
        'SELECT id FROM maturity_models WHERE id = ?',
        [id]
      );
      
      if (!model) {
        res.status(404).json({ message: 'Maturity model not found' });
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
        const existingModel = await DatabaseService.get(
          'SELECT id FROM maturity_models WHERE name = ? AND id != ?',
          [name, id]
        );
        
        if (existingModel) {
          res.status(409).json({ message: 'Maturity model with this name already exists' });
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
        `UPDATE maturity_models SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
      
      const updatedModel = await DatabaseService.get(
        `SELECT mm.id, mm.name, mm.description, mm.created_at, mm.updated_at,
                u.id as owner_id, u.username as owner_username
         FROM maturity_models mm
         LEFT JOIN users u ON mm.owner_id = u.id
         WHERE mm.id = ?`,
        [id]
      );
      
      res.json(updatedModel);
    } catch (error) {
      console.error('Error updating maturity model:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Delete a maturity model
   * @param req Express request
   * @param res Express response
   */
  static async deleteMaturityModel(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Check if maturity model exists
      const model = await DatabaseService.get(
        'SELECT id FROM maturity_models WHERE id = ?',
        [id]
      );
      
      if (!model) {
        res.status(404).json({ message: 'Maturity model not found' });
        return;
      }
      
      // Check if maturity model is used in any campaigns
      const campaigns = await DatabaseService.query(
        'SELECT id FROM campaigns WHERE maturity_model_id = ?',
        [id]
      );
      
      if (campaigns.length > 0) {
        res.status(400).json({ 
          message: 'Cannot delete maturity model that is used in campaigns. Please delete campaigns first.' 
        });
        return;
      }
      
      // Start a transaction
      await DatabaseService.beginTransaction();
      
      try {
        // Delete maturity level rules
        await DatabaseService.run(
          'DELETE FROM maturity_level_rules WHERE maturity_model_id = ?',
          [id]
        );
        
        // Delete measurements
        await DatabaseService.run(
          'DELETE FROM measurements WHERE maturity_model_id = ?',
          [id]
        );
        
        // Delete maturity model
        await DatabaseService.run(
          'DELETE FROM maturity_models WHERE id = ?',
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
      console.error('Error deleting maturity model:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Add a measurement to a maturity model
   * @param req Express request
   * @param res Express response
   */
  static async addMeasurement(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, category_id, description, evidence_type, sample_evidence } = req.body;
      
      if (!name || !category_id || !evidence_type) {
        res.status(400).json({ message: 'Name, category_id, and evidence_type are required' });
        return;
      }
      
      // Check if maturity model exists
      const model = await DatabaseService.get(
        'SELECT id FROM maturity_models WHERE id = ?',
        [id]
      );
      
      if (!model) {
        res.status(404).json({ message: 'Maturity model not found' });
        return;
      }
      
      // Check if category exists
      const category = await DatabaseService.get(
        'SELECT id FROM measurement_categories WHERE id = ?',
        [category_id]
      );
      
      if (!category) {
        res.status(404).json({ message: 'Measurement category not found' });
        return;
      }
      
      const measurementId = await DatabaseService.run(
        `INSERT INTO measurements (name, maturity_model_id, category_id, description, evidence_type, sample_evidence) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [name, id, category_id, description || '', evidence_type, sample_evidence || '']
      );
      
      const newMeasurement = await DatabaseService.get(
        `SELECT m.id, m.name, m.description, m.evidence_type, m.sample_evidence,
                mc.id as category_id, mc.name as category_name
         FROM measurements m
         LEFT JOIN measurement_categories mc ON m.category_id = mc.id
         WHERE m.id = ?`,
        [measurementId]
      );
      
      res.status(201).json(newMeasurement);
    } catch (error) {
      console.error('Error adding measurement:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Update maturity level rules
   * @param req Express request
   * @param res Express response
   */
  static async updateMaturityLevelRules(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { rules } = req.body;
      
      if (!Array.isArray(rules) || rules.length === 0) {
        res.status(400).json({ message: 'Rules array is required' });
        return;
      }
      
      // Check if maturity model exists
      const model = await DatabaseService.get(
        'SELECT id FROM maturity_models WHERE id = ?',
        [id]
      );
      
      if (!model) {
        res.status(404).json({ message: 'Maturity model not found' });
        return;
      }
      
      // Validate rules
      for (const rule of rules) {
        if (rule.level === undefined || rule.min_percentage === undefined || rule.max_percentage === undefined) {
          res.status(400).json({ message: 'Each rule must have level, min_percentage, and max_percentage' });
          return;
        }
        
        if (rule.min_percentage < 0 || rule.max_percentage > 100 || rule.min_percentage > rule.max_percentage) {
          res.status(400).json({ message: 'Invalid percentage range' });
          return;
        }
      }
      
      // Start a transaction
      await DatabaseService.beginTransaction();
      
      try {
        // Delete existing rules
        await DatabaseService.run(
          'DELETE FROM maturity_level_rules WHERE maturity_model_id = ?',
          [id]
        );
        
        // Insert new rules
        for (const rule of rules) {
          await DatabaseService.run(
            'INSERT INTO maturity_level_rules (maturity_model_id, level, min_percentage, max_percentage) VALUES (?, ?, ?, ?)',
            [id, rule.level, rule.min_percentage, rule.max_percentage]
          );
        }
        
        // Commit transaction
        await DatabaseService.commitTransaction();
        
        // Get updated rules
        const updatedRules = await DatabaseService.query(
          'SELECT id, level, min_percentage, max_percentage FROM maturity_level_rules WHERE maturity_model_id = ? ORDER BY level',
          [id]
        );
        
        res.json(updatedRules);
      } catch (error) {
        // Rollback transaction on error
        await DatabaseService.rollbackTransaction();
        throw error;
      }
    } catch (error) {
      console.error('Error updating maturity level rules:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}