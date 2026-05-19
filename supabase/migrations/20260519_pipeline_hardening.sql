-- Add pipeline state machine fields to projects table
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS pipeline_state text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS previous_state text,
ADD COLUMN IF NOT EXISTS retry_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_transition_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS failed_step text,
ADD COLUMN IF NOT EXISTS failure_reason text;

-- Create constraint to ensure valid states (can be bypassed by admin if needed, but safe at DB level)
ALTER TABLE projects 
ADD CONSTRAINT valid_pipeline_state 
CHECK (pipeline_state IN (
  'pending',
  'crawling',
  'assets_processing',
  'analysis_running',
  'analysis_completed',
  'prompt_generating',
  'prompt_completed',
  'lovable_generating',
  'lovable_completed',
  'qa_running',
  'qa_completed',
  'repair_required',
  'repair_generating',
  'repair_completed',
  'completed',
  'failed'
));
