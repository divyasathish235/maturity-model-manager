import { User } from './User';
import { MaturityModel } from './MaturityModel';
import { Service } from './Service';
import { MeasurementEvaluation } from './MeasurementEvaluation';

export enum CampaignStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface Campaign {
  id?: number;
  name: string;
  maturity_model_id: number;
  start_date?: string;
  end_date?: string;
  status: CampaignStatus;
  created_by: number;
  created_at?: string;
  updated_at?: string;
  
  // Relationships (not stored in DB)
  creator?: User;
  maturityModel?: MaturityModel;
  participants?: Service[];
  evaluations?: MeasurementEvaluation[];
}

export interface CampaignDTO {
  id: number;
  name: string;
  maturity_model: {
    id: number;
    name: string;
  };
  start_date: string | null;
  end_date: string | null;
  status: CampaignStatus;
  created_by: {
    id: number;
    username: string;
  };
  participants_count: number;
  created_at: string;
  updated_at: string;
}