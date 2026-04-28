export type Role = 'student' | 'guide' | 'admin';
export type Department = 'cse' | 'it' | 'ai' | 'civil' | 'mech' | 'ece' | 'eee' | 'biomed';
export type DeptCategory = 'software' | 'core' | 'circuit';

export interface Profile {
  id: string; // UUID from auth.users
  role: Role;
  name: string;
  dept?: Department;
  team_id?: string;
  roll_number?: string;
  staff_id?: string;
  team_number?: string;
  team_members?: { name: string; roll_number: string }[];
  email?: string;
}

export interface Project {
  id: string;
  title: string;
  dept_category: DeptCategory;
  guide_id?: string;
  github_url?: string;
  simulation_links?: string[];
  created_at: string;
  problem_statement?: string;
  challenges_overcome?: string;
  overview?: string;
}

export interface Submission {
  id: string;
  project_id: string;
  file_url: string;
  version: number;
  milestone_title: string;
  guide_status: 'pending' | 'approved' | 'rejected';
  guide_comments?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  action: string;
  user_id: string;
  ip_address?: string;
  timestamp: string;
  details?: Record<string, any>;
}
