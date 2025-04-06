import { Campaign } from './Campaign';
import { Service } from './Service';

export interface CampaignParticipant {
  id?: number;
  campaign_id: number;
  service_id: number;
  created_at?: string;
  updated_at?: string;
  
  // Relationships (not stored in DB)
  campaign?: Campaign;
  service?: Service;
}

export interface CampaignParticipantDTO {
  id: number;
  campaign: {
    id: number;
    name: string;
  };
  service: {
    id: number;
    name: string;
    team: {
      id: number;
      name: string;
    }
  };
  created_at: string;
  updated_at: string;
}