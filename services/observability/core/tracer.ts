import { SupabaseClient } from '@supabase/supabase-js';

export interface TraceEvent {
  projectId: string;
  stepName: string;
  status: 'started' | 'success' | 'failed' | 'retrying';
  durationMs?: number;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata?: Record<string, any>;
  error?: string;
}

export class ExecutionTracer {
  private static timers: Map<string, number> = new Map();

  constructor(private supabase: SupabaseClient) {}

  /**
   * Starts a timer for a specific execution step.
   */
  startTrace(projectId: string, stepName: string): string {
    const traceId = `${projectId}_${stepName}_${Date.now()}`;
    ExecutionTracer.timers.set(traceId, Date.now());
    return traceId;
  }

  /**
   * Ends a trace and logs the execution metrics to the database.
   */
  async endTrace(traceId: string, event: Omit<TraceEvent, 'durationMs'>): Promise<void> {
    const startTime = ExecutionTracer.timers.get(traceId);
    const durationMs = startTime ? Date.now() - startTime : 0;
    ExecutionTracer.timers.delete(traceId);

    const fullEvent: TraceEvent = {
      ...event,
      durationMs
    };

    // Fire and forget log to observability table
    this.supabase.from('pipeline_traces').insert({
      project_id: fullEvent.projectId,
      step_name: fullEvent.stepName,
      status: fullEvent.status,
      duration_ms: durationMs,
      prompt_tokens: fullEvent.tokenUsage?.promptTokens || 0,
      completion_tokens: fullEvent.tokenUsage?.completionTokens || 0,
      error_message: fullEvent.error,
      metadata: fullEvent.metadata,
      created_at: new Date().toISOString()
    }).then(({ error }: { error: any }) => {
      if (error) {
        console.error(`[Observability] Failed to log trace ${traceId}: ${error.message}`);
      }
    });

    console.log(`[Tracer] [${event.projectId}] ${event.stepName} -> ${event.status} (${durationMs}ms)`);
  }

  /**
   * Logs a discrete event without a duration (e.g., a specific error or retry occurrence).
   */
  async logEvent(event: TraceEvent): Promise<void> {
    await this.supabase.from('pipeline_traces').insert({
      project_id: event.projectId,
      step_name: event.stepName,
      status: event.status,
      prompt_tokens: event.tokenUsage?.promptTokens || 0,
      completion_tokens: event.tokenUsage?.completionTokens || 0,
      error_message: event.error,
      metadata: event.metadata,
      created_at: new Date().toISOString()
    });
  }
}
