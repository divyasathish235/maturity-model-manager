import { User } from './User';
import { MeasurementEvaluation, EvaluationStatus } from './MeasurementEvaluation';

export interface EvaluationHistory {
  id?: number;
  evaluation_id: number;
  previous_status: EvaluationStatus;
  new_status: EvaluationStatus;
  changed_by: number;
  notes?: string;
  created_at?: string;
  
  // Relationships (not stored in DB)
  evaluation?: MeasurementEvaluation;
  user?: User;
}

export interface EvaluationHistoryDTO {
  id: number;
  evaluation: {
    id: number;
    measurement: {
      id: number;
      name: string;
    };
    service: {
      id: number;
      name: string;
    };
  };
  previous_status: EvaluationStatus;
  new_status: EvaluationStatus;
  changed_by: {
    id: number;
    username: string;
  };
  notes: string | null;
  created_at: string;
}