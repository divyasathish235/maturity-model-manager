export interface User {
  id?: number;
  username: string;
  password: string;
  email: string;
  role: UserRole;
  created_at?: string;
  updated_at?: string;
}

export enum UserRole {
  ADMIN = 'admin',
  TEAM_OWNER = 'team_owner',
  TEAM_MEMBER = 'team_member'
}

export interface UserDTO {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}