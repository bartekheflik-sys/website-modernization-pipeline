CREATE TABLE IF NOT EXISTS asset_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type text NOT NULL,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  worker_id text,
  retry_count integer DEFAULT 0,
  error_message text,
  result_data jsonb,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Index for fast polling of pending jobs
CREATE INDEX IF NOT EXISTS idx_asset_jobs_status_created 
ON asset_jobs (status, created_at) 
WHERE status = 'pending';
