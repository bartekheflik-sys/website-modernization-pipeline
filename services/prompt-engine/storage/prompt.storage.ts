import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import { GeneratedPromptOutput } from '../validators/prompt.validator';

dotenv.config({ path: path.resolve(__dirname, '../../../../apps/api/.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function fetchAnalysisResult(projectId: string) {
  const { data, error } = await supabase
    .from('analysis_results')
    .select('analysis_json')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    throw new Error(`No analysis found for project ${projectId}. Run /api/analyze first.`);
  }

  return data.analysis_json;
}

export async function fetchProjectAssets(projectId: string) {
  const { data, error } = await supabase
    .from('website_assets')
    .select('*')
    .eq('project_id', projectId);

  if (error) {
    console.error(`[Prompt Engine] Error fetching assets:`, error.message);
    return [];
  }

  return data || [];
}

export async function fetchProjectPages(projectId: string) {
  const { data, error } = await supabase
    .from('pages')
    .select('url, title, markdown_content, raw_json')
    .eq('project_id', projectId);

  if (error) {
    console.error(`[Prompt Engine] Error fetching crawled pages:`, error.message);
    return [];
  }

  return data || [];
}

export async function saveGeneratedPrompt(projectId: string, output: GeneratedPromptOutput): Promise<void> {
  const { error } = await supabase
    .from('generated_prompts')
    .insert([{
      project_id: projectId,
      prompt: output.lovable_prompt,
      metadata: output.metadata
    }]);

  if (error) {
    throw new Error(`Failed to save generated prompt for project ${projectId}: ${error.message}`);
  }
}
