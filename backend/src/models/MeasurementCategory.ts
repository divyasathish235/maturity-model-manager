import { Measurement } from './Measurement';

export enum MeasurementCategoryName {
  SERVICE_RELIABILITY = 'Service Reliability',
  PERFORMANCE_AND_SCALABILITY = 'Performance and Scalability',
  CHANGE_MANAGEMENT = 'Change Management',
  SECURITY_AND_COMPLIANCE = 'Security and Compliance',
  OBSERVABILITY_AND_MONITORING = 'Observability and Monitoring',
  DOCUMENTATION_MANAGEMENT = 'Documentation Management'
}

export interface MeasurementCategory {
  id?: number;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  
  // Relationships (not stored in DB)
  measurements?: Measurement[];
}

export interface MeasurementCategoryDTO {
  id: number;
  name: string;
  description: string;
  measurements_count: number;
  created_at: string;
  updated_at: string;
}