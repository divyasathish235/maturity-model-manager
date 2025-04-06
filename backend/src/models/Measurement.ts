import { MaturityModel } from './MaturityModel';
import { MeasurementCategory } from './MeasurementCategory';
import { MeasurementEvaluation } from './MeasurementEvaluation';

export enum EvidenceType {
  URL = 'URL',
  DOCUMENT = 'Document',
  IMAGE = 'Image',
  TEXT = 'Text'
}

export interface Measurement {
  id?: number;
  name: string;
  maturity_model_id: number;
  category_id: number;
  description?: string;
  evidence_type: EvidenceType;
  sample_evidence?: string;
  created_at?: string;
  updated_at?: string;
  
  // Relationships (not stored in DB)
  maturityModel?: MaturityModel;
  category?: MeasurementCategory;
  evaluations?: MeasurementEvaluation[];
}

export interface MeasurementDTO {
  id: number;
  name: string;
  maturity_model: {
    id: number;
    name: string;
  };
  category: {
    id: number;
    name: string;
  };
  description: string;
  evidence_type: EvidenceType;
  sample_evidence: string;
  created_at: string;
  updated_at: string;
}