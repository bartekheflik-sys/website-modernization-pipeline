import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env from root or API so the service can run independently
dotenv.config({ path: path.resolve(__dirname, '../../../../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../../../../apps/api/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function saveCrawledPage(projectId: string, data: any, table: string = 'pages') {
  const { error } = await supabase
    .from(table)
    .insert([
      {
        project_id: projectId,
        url: data.url,
        title: data.title,
        markdown_content: data.content,
        raw_json: data
      }
    ]);
  
  if (error) {
    console.error(`[Storage] Failed to save page ${data.url}:`, error.message);
    return;
  }

  // Also save assets if any
  if (data.assets && data.assets.length > 0) {
    await saveAssets(projectId, data.url, data.assets);
  }
}

async function saveAssets(projectId: string, pageUrl: string, assets: any[]) {
  const formattedAssets = assets.map(asset => ({
    project_id: projectId,
    asset_url: asset.url,
    source_page: pageUrl,
    asset_type: asset.type,
    dimensions: asset.dimensions || null,
    file_type: asset.file_type,
    alt_text: asset.alt,
    metadata: {
      dom_context: asset.dom_context
    }
  }));

  const { error } = await supabase
    .from('website_assets')
    .upsert(formattedAssets, { onConflict: 'project_id,asset_url' });

  if (error) {
    console.error(`[Storage] Failed to save assets for ${pageUrl}:`, error.message);
  }
}

export async function updateProjectStatus(projectId: string, status: string) {
  const stateMap: Record<string, string> = {
    'analyzing_assets': 'assets_processing',
    'assets_processing': 'assets_processing',
    'crawling': 'crawling',
    'crawled': 'assets_processing',
    'qa_ready': 'qa_completed',
    'failed': 'failed'
  };
  const pipelineState = stateMap[status] || status;

  await supabase
    .from('projects')
    .update({ 
      status, 
      pipeline_state: pipelineState,
      updated_at: new Date().toISOString() 
    })
    .eq('id', projectId);
}

export async function logPipelineStep(projectId: string, step: string, status: string, message?: string) {
  await supabase
    .from('pipeline_logs')
    .insert([{
      project_id: projectId,
      step,
      status,
      message
    }]);
}

export async function logPipelineError(projectId: string, source: string, errorMessage: string) {
  await supabase
    .from('pipeline_errors')
    .insert([{
      project_id: projectId,
      source,
      error_message: errorMessage
    }]);
}
