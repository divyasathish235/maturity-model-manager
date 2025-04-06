import { User } from './User';
import { Service } from './Service';

export interface Team {
  id?: number;
  name: string;
  owner_id: number;
  description?: string;
  created_at?: string;
  updated_at?: string;
  
  // Relationships (not stored in DB)
  owner?: User;
  services?: Service[];
}

export interface TeamDTO {
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