-- Create website_assets table
CREATE TABLE IF NOT EXISTS website_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    asset_url TEXT NOT NULL,
    source_page TEXT,
    asset_type TEXT, -- logo, product, menu, hero, team, etc.
    business_critical BOOLEAN DEFAULT false,
    quality_score INTEGER DEFAULT 0, -- 0-100
    dimensions JSONB, -- { width: number, height: number }
    file_type TEXT,
    alt_text TEXT,
    recommended_action TEXT, -- preserve, enhance, vectorize, replace, etc.
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(project_id, asset_url)
);

-- Create processed_assets table
CREATE TABLE IF NOT EXISTS processed_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_asset_id UUID REFERENCES website_assets(id) ON DELETE CASCADE,
    processed_url TEXT NOT NULL,
    processing_type TEXT, -- vectorized, upscaled, background_removed, ai_generated
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE website_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE processed_assets ENABLE ROW LEVEL SECURITY;

-- Policies for website_assets
CREATE POLICY "Users can view assets for their projects" ON website_assets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = website_assets.project_id
        )
    );

CREATE POLICY "Users can insert assets for their projects" ON website_assets
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = website_assets.project_id
        )
    );

-- Policies for processed_assets
CREATE POLICY "Users can view processed assets" ON processed_assets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM website_assets
            JOIN projects ON projects.id = website_assets.project_id
            WHERE website_assets.id = processed_assets.original_asset_id
        )
    );
