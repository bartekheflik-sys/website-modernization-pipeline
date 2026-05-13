export type ProjectStatus = 'pending' | 'crawling' | 'crawled' | 'analyzing' | 'analysis_complete' | 'generating_prompt' | 'completed' | 'approved' | 'failed' | 'crawling_modernized' | 'qa_ready';
export type StepStatus = 'idle' | 'running' | 'success' | 'failed' | 'retrying';

export interface Project {
  id: string;
  url: string;
  status: ProjectStatus;
  modernized_url?: string;
  created_at: string;
  updated_at: string;
  pages_count: number;
}

export interface PipelineLog {
  id: string;
  project_id: string;
  step: string;
  status: StepStatus;
  message: string;
  created_at: string;
}

export interface PipelineError {
  id: string;
  project_id: string;
  source: string;
  error_message: string;
  retry_count: number;
  created_at: string;
}

export interface AnalysisResult {
  project_id: string;
  analysis_json: any;
  created_at: string;
}

export interface GeneratedPrompt {
  id: string;
  project_id: string;
  prompt: string;
  metadata: {
    pages: string[];
    sections_count: number;
    motion_level: string;
    design_style: string;
    industry: string;
    generated_at: string;
  };
  created_at: string;
}
