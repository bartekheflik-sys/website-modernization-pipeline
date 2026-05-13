export type ProjectStatus = 'pending' | 'crawling' | 'analyzing' | 'generating_prompt' | 'completed' | 'failed';
export type StepStatus = 'idle' | 'running' | 'success' | 'failed' | 'retrying';

export interface Project {
  id: string;
  url: string;
  status: ProjectStatus;
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
