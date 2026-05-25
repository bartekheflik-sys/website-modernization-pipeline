import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../../../apps/api/.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../../../../apps/api/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function fetchProjectPages(projectId: string) {
  const { data, error } = await supabase
    .from('pages')
    .select('url, title, markdown_content, raw_json')
    .eq('project_id', projectId);

  if (error) {
    throw new Error(`Failed to fetch pages for project ${projectId}: ${error.message}`);
  }
  return data;
}

export async function saveAnalysisResult(projectId: string, analysis: any) {
  const { error } = await supabase
    .from('analysis_results')
    .insert([
      {
        project_id: projectId,
        analysis_json: analysis
      }
    ]);

  if (error) {
    throw new Error(`Failed to save analysis for project ${projectId}: ${error.message}`);
  }
}

export async function updateProjectStatus(projectId: string, status: string) {
  await supabase
    .from('projects')
    .update({ status })
    .eq('id', projectId);
}
