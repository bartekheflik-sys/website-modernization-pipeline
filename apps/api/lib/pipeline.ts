import { supabaseAdmin } from './supabase';
import { PipelineStateMachine, PipelineState } from 'pipeline-state-machine';
import { ExecutionTracer } from 'observability';

export type PipelineStep = 'crawl' | 'analysis' | 'prompt_generation';
export type PipelineStatus = 'running' | 'success' | 'failed' | 'idle';

const tracer = new ExecutionTracer(supabaseAdmin);

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

/**
 * Transition the project state deterministically using the Pipeline State Machine.
 * Validates, records history, and handles trace telemetry.
 */
export async function transitionProjectState(
  projectId: string,
  targetState: PipelineState,
  options?: { reason?: string; failedStep?: string }
): Promise<void> {
  // 1. Fetch current status
  const { data: project, error: fetchError } = await supabaseAdmin
    .from('projects')
    .select('status, pipeline_state, retry_count')
    .eq('id', projectId)
    .single();

  if (fetchError || !project) {
    throw new Error(`[Pipeline] Failed to fetch project ${projectId} for transition to ${targetState}`);
  }

  // Fallback to legacy status if pipeline_state isn't populated yet
  const currentState = (project.pipeline_state || project.status || 'pending') as PipelineState;

  // 2. Validate Transition
  try {
    PipelineStateMachine.validateTransition(currentState, targetState);
  } catch (err: any) {
    console.error(err.message);
    throw err;
  }

  // 3. Persist State Transition with previous history
  const updatePayload: Record<string, any> = {
    pipeline_state: targetState,
    previous_state: currentState,
    status: targetState, // Keep backward compatibility with legacy status field
    last_transition_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (targetState === 'failed') {
    updatePayload.failed_step = options?.failedStep || 'unknown';
    updatePayload.failure_reason = options?.reason || 'unspecified error';
    updatePayload.retry_count = (project.retry_count || 0) + 1;
  }

  const { error: updateError } = await supabaseAdmin
    .from('projects')
    .update(updatePayload)
    .eq('id', projectId);

  if (updateError) {
    console.error(`[State Machine Error] Project: ${projectId}, Transition to ${targetState} failed:`, updateError.message);
    throw new Error(`[State Machine Error] Database update failed: ${updateError.message}`);
  }

  // 4. Log Observability Traces
  await tracer.logEvent({
    projectId,
    stepName: `transition_to_${targetState}`,
    status: targetState === 'failed' ? 'failed' : 'success',
    metadata: {
      fromState: currentState,
      toState: targetState,
      reason: options?.reason
    }
  });

  console.log(`[State Machine] Transition Successful: ${currentState} -> ${targetState}`);
}

// Deprecated in favor of transitionProjectState
export async function updateProjectStatus(projectId: string, status: string) {
  // Graceful fallback for legacy dependencies
  const stateMap: Record<string, PipelineState> = {
    'analyzing': 'analysis_running',
    'analysis_complete': 'analysis_completed',
    'failed': 'failed',
    'crawling': 'crawling',
    'crawled': 'assets_processing'
  };

  const state = stateMap[status] || (status as PipelineState);
  await transitionProjectState(projectId, state);
}
