-- Migration SQL for Website Modernization Platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  modernized_url TEXT
);

-- Modernized Pages table (Step 6)
CREATE TABLE modernized_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  markdown_content TEXT,
  raw_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pages table
CREATE TABLE pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  markdown_content TEXT,
  raw_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Assets table
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  url TEXT NOT NULL,
  local_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prompts table
CREATE TABLE prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- QA Reports table
CREATE TABLE qa_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  issues JSONB,
  score NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Analysis Results table
CREATE TABLE analysis_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  analysis_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Generated Prompts table (Step 4 output)
CREATE TABLE generated_prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  metadata JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pipeline Logs (Step 5)
CREATE TABLE pipeline_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  step TEXT NOT NULL, -- 'crawl', 'analysis', 'prompt_generation'
  status TEXT NOT NULL, -- 'running', 'success', 'failed'
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pipeline Errors (Step 5)
CREATE TABLE pipeline_errors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  source TEXT NOT NULL, -- 'crawler', 'gemini', 'validator', 'storage'
  error_message TEXT NOT NULL,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE generated_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to generated_prompts" ON generated_prompts FOR SELECT USING (true);
CREATE POLICY "Allow service role insert on generated_prompts" ON generated_prompts FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access to pipeline_logs" ON pipeline_logs FOR SELECT USING (true);
CREATE POLICY "Allow service role insert on pipeline_logs" ON pipeline_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access to pipeline_errors" ON pipeline_errors FOR SELECT USING (true);
CREATE POLICY "Allow service role insert on pipeline_errors" ON pipeline_errors FOR INSERT WITH CHECK (true);

-- Set up Row Level Security (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE qa_reports ENABLE ROW LEVEL SECURITY;

-- Allow read access for authenticated users/anon (for dashboard)
CREATE POLICY "Allow public read access to projects" ON projects FOR SELECT USING (true);
CREATE POLICY "Allow public read access to pages" ON pages FOR SELECT USING (true);
CREATE POLICY "Allow public read access to assets" ON assets FOR SELECT USING (true);
CREATE POLICY "Allow public read access to prompts" ON prompts FOR SELECT USING (true);
CREATE POLICY "Allow public read access to qa_reports" ON qa_reports FOR SELECT USING (true);

-- Website QA Reports (Step 6)
CREATE TABLE IF NOT EXISTS website_qa_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    old_site_crawl_id UUID,
    new_site_crawl_id UUID,
    qa_report_json JSONB NOT NULL,
    overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Repair Prompts (Step 6)
CREATE TABLE IF NOT EXISTS repair_prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    qa_report_id UUID REFERENCES website_qa_reports(id) ON DELETE CASCADE,
    repair_prompt TEXT NOT NULL,
    severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status TEXT DEFAULT 'pending', -- pending, applied, rejected
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE website_qa_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE repair_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to website_qa_reports" ON website_qa_reports FOR SELECT USING (true);
CREATE POLICY "Allow service role all on website_qa_reports" ON website_qa_reports USING (true);

CREATE POLICY "Allow public read access to repair_prompts" ON repair_prompts FOR SELECT USING (true);
CREATE POLICY "Allow service role all on repair_prompts" ON repair_prompts USING (true);
