import { MaturityModel } from './MaturityModel';

export enum MaturityLevel {
  LEVEL_0 = 0,
  LEVEL_1 = 1,
  LEVEL_2 = 2,
  LEVEL_3 = 3,
  LEVEL_4 = 4
}

export interface MaturityLevelRule {
  id?: number;
  maturity_model_id: number;
  level: MaturityLevel;
  min_percentage: number;
  max_percentage: number;
  created_at?: string;
  updated_at?: string;
  
  // Relationships (not stored in DB)
  maturityModel?: MaturityModel;
}

export interface MaturityLevelRuleDTO {
  id: number;
  maturity_model: {
    id: number;
    name: string;
  };
  level: MaturityLevel;
  min_percentage: number;
  max_percentage: number;
  created_at: string;
  updated_at: string;
}