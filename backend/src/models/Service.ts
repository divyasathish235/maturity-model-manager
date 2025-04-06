import { User } from './User';
import { Team } from './Team';
import { MeasurementEvaluation } from './MeasurementEvaluation';

export enum ServiceType {
  API_SERVICE = 'API Service',
  UI_APPLICATION = 'UI Application',
  WORKFLOW = 'Workflow',
  APPLICATION_MODULE = 'Application Module'
}

export interface Service {
  id?: number;
  name: string;
  owner_id: number;
  team_id: number;
  description?: string;
  service_type: ServiceType;
  resource_location?: string;
  created_at?: string;
  updated_at?: string;
  
  // Relationships (not stored in DB)
  owner?: User;
  team?: Team;
  evaluations?: MeasurementEvaluation[];
}

export interface ServiceDTO {
  id: number;
  name: string;
  owner: {
    id: number;
    username: string;
  };
  team: {
    id: number;
    name: string;
  };
  description: string;
  service_type: ServiceType;
  resource_location: string;
  created_at: string;
  updated_at: string;
}