export type ProjectStatus = 
  | 'pending'
  | 'crawling'
  | 'analyzing'
  | 'generating'
  | 'qa'
  | 'completed'
  | 'failed';

export interface Project {
  id: string;
  url: string;
  status: ProjectStatus;
  created_at: string;
}

export interface Page {
  id: string;
  project_id: string;
  url: string;
  title: string | null;
  markdown: string | null;
}

export interface Asset {
  id: string;
  project_id: string;
  type: string;
  url: string;
  local_path: string | null;
}

export interface Prompt {
  id: string;
  project_id: string;
  prompt: string;
  type: string;
}

export interface QAReport {
  id: string;
  project_id: string;
  issues: Record<string, unknown> | null;
  score: number | null;
}
