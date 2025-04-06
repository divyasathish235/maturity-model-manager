import { User } from './User';
import { Campaign } from './Campaign';
import { Service } from './Service';
import { Measurement } from './Measurement';
import { EvaluationHistory } from './EvaluationHistory';

export enum EvaluationStatus {
  NOT_IMPLEMENTED = 'Not Implemented',
  EVIDENCE_SUBMITTED = 'Evidence Submitted',
  VALIDATING_EVIDENCE = 'Validating Evidence',
  EVIDENCE_REJECTED = 'Evidence Rejected',
  IMPLEMENTED = 'Implemented'
}

export interface MeasurementEvaluation {
  id?: number;
  campaign_id: number;
  service_id: number;
  measurement_id: number;
  status: EvaluationStatus;
  evidence_location?: string;
  notes?: string;
  evaluated_by?: number;
  evaluated_at?: string;
  created_at?: string;
  updated_at?: string;
  
  // Relationships (not stored in DB)
  campaign?: Campaign;
  service?: Service;
  measurement?: Measurement;
  evaluator?: User;
  history?: EvaluationHistory[];
}

export interface MeasurementEvaluationDTO {
  id: number;
  campaign: {
    id: number;
    name: string;
  };
  service: {
    id: number;
    name: string;
  };
  measurement: {
    id: number;
    name: string;
    category: {
      id: number;
      name: string;
    }
  };
  status: EvaluationStatus;
  evidence_location: string | null;
  notes: string | null;
  evaluator: {
    id: number;
    username: string;
  } | null;
  evaluated_at: string | null;
  created_at: string;
  updated_at: string;
  history: {
    id: number;
    previous_status: EvaluationStatus;
    new_status: EvaluationStatus;
    changed_at: string;
    changed_by: {
      id: number;
      username: string;
    };
  }[];
}