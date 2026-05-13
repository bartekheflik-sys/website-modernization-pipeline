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
  }
}

export async function updateProjectStatus(projectId: string, status: string) {
  await supabase
    .from('projects')
    .update({ status, updated_at: new Date().toISOString() })
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
