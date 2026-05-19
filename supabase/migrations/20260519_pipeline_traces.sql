CREATE TABLE IF NOT EXISTS pipeline_traces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  step_name text NOT NULL,
  status text NOT NULL,
  duration_ms integer,
  prompt_tokens integer DEFAULT 0,
  completion_tokens integer DEFAULT 0,
  error_message text,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Index for dashboard querying
CREATE INDEX IF NOT EXISTS idx_pipeline_traces_project 
ON pipeline_traces (project_id, created_at DESC);
