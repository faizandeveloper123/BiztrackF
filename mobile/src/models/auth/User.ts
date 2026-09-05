export interface User {
  id?: string; // Primary ID field
  userId?: string; // Alternative ID field from backend
  userName: string;
  userRole:
    | 'super_admin'
    | 'admin'
    | 'project_manager'
    | 'team_member'
    | 'client'
    | 'viewer';
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  tenantLogoUrl?: string;
  permissions?: string[];
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  userName: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  userRole?:
    | 'super_admin'
    | 'admin'
    | 'project_manager'
    | 'team_member'
    | 'client'
    | 'viewer';
}

export interface AuthResponse {
  success: boolean;
  user: User;
  token: string;
  message?: string;
}

export interface UserUpdate {
  userName?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  userRole?:
    | 'super_admin'
    | 'project_manager'
    | 'team_member'
    | 'client'
    | 'viewer';
  avatar?: string;
}

export interface UsersResponse {
  users: User[];
}
