import { User } from './User';
import { Measurement } from './Measurement';
import { MaturityLevelRule } from './MaturityLevelRule';

export interface MaturityModel {
  id?: number;
  name: string;
  owner_id: number;
  description?: string;
  created_at?: string;
  updated_at?: string;
  
  // Relationships (not stored in DB)
  owner?: User;
  measurements?: Measurement[];
  maturityLevelRules?: MaturityLevelRule[];
}

export interface MaturityModelDTO {
  id: number;
  name: string;
  owner: {
    id: number;
    username: string;
  };
  description: string;
  measurements_count: number;
  created_at: string;
  updated_at: string;
}