// User types
export enum UserRole {
  ADMIN = 'admin',
  TEAM_OWNER = 'team_owner',
  TEAM_MEMBER = 'team_member'
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

// Team types
export interface Team {
  id: number;
  name: string;
  owner: {
    id: number;
    username: string;
  };
  description: string;
  services_count: number;
  created_at: string;
  updated_at: string;
}

// Service types
export enum ServiceType {
  API_SERVICE = 'API Service',
  UI_APPLICATION = 'UI Application',
  WORKFLOW = 'Workflow',
  APPLICATION_MODULE = 'Application Module'
}

export interface Service {
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

// Maturity Model types
export interface MaturityModel {
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

// Measurement Category types
export enum MeasurementCategoryName {
  SERVICE_RELIABILITY = 'Service Reliability',
  PERFORMANCE_AND_SCALABILITY = 'Performance and Scalability',
  CHANGE_MANAGEMENT = 'Change Management',
  SECURITY_AND_COMPLIANCE = 'Security and Compliance',
  OBSERVABILITY_AND_MONITORING = 'Observability and Monitoring',
  DOCUMENTATION_MANAGEMENT = 'Documentation Management'
}

export interface MeasurementCategory {
  id: number;
  name: string;
  description: string;
  measurements_count: number;
  created_at: string;
  updated_at: string;
}

// Measurement types
export enum EvidenceType {
  URL = 'URL',
  DOCUMENT = 'Document',
  IMAGE = 'Image',
  TEXT = 'Text'
}

export interface Measurement {
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

// Maturity Level types
export enum MaturityLevel {
  LEVEL_0 = 0,
  LEVEL_1 = 1,
  LEVEL_2 = 2,
  LEVEL_3 = 3,
  LEVEL_4 = 4
}

export interface MaturityLevelRule {
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

// Campaign types
export enum CampaignStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface Campaign {
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

// Measurement Evaluation types
export enum EvaluationStatus {
  NOT_IMPLEMENTED = 'Not Implemented',
  EVIDENCE_SUBMITTED = 'Evidence Submitted',
  VALIDATING_EVIDENCE = 'Validating Evidence',
  EVIDENCE_REJECTED = 'Evidence Rejected',
  IMPLEMENTED = 'Implemented'
}

export interface MeasurementEvaluation {
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

// Authentication types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email: string;
  role?: UserRole;
}