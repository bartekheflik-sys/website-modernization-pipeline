import { supabaseAdmin } from './supabase';

export type PipelineStep = 'crawl' | 'analysis' | 'prompt_generation';
export type PipelineStatus = 'running' | 'success' | 'failed' | 'idle';

export async function logPipelineStep(
  projectId: string,
  step: PipelineStep,
  status: PipelineStatus,
  message?: string
) {
  console.log(`[Pipeline Log] Project: ${projectId}, Step: ${step}, Status: ${status}, Message: ${message || 'N/A'}`);
  
  const { error } = await supabaseAdmin
    .from('pipeline_logs')
    .insert([{
      project_id: projectId,
      step,
      status,
      message
    }]);

  if (error) {
    console.error(`[Pipeline Logger Error] Failed to insert log:`, error.message);
  }
}

export async function logPipelineError(
  projectId: string,
  source: 'crawler' | 'gemini' | 'validator' | 'storage',
  errorMessage: string,
  retryCount: number = 0
) {
  console.error(`[Pipeline Error] Project: ${projectId}, Source: ${source}, Error: ${errorMessage}`);

  const { error } = await supabaseAdmin
    .from('pipeline_errors')
    .insert([{
      project_id: projectId,
      source,
      error_message: errorMessage,
      retry_count: retryCount
    }]);

  if (error) {
    console.error(`[Pipeline Error Logger] Failed to insert error:`, error.message);
  }
}

export async function updateProjectStatus(projectId: string, status: string) {
  const { error } = await supabaseAdmin
    .from('projects')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', projectId);

  if (error) {
    console.error(`[Project Status Update Error] Project: ${projectId}, Status: ${status}, Error:`, error.message);
  }
}
