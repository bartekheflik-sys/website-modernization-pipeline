import { SupabaseClient } from '@supabase/supabase-js';

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type JobType = 'image_enhancement' | 'logo_vectorization' | 'background_removal' | 'webp_conversion' | 'ai_background_generation';

export interface AssetJobPayload {
  assetId: string;
  projectId: string;
  url: string;
  metadata?: Record<string, any>;
}

export class AssetQueue {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Enqueues a new asset processing job.
   */
  async enqueue(type: JobType, payload: AssetJobPayload): Promise<string> {
    const { data, error } = await this.supabase
      .from('asset_jobs')
      .insert({
        job_type: type,
        payload,
        status: 'pending',
        retry_count: 0,
        created_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (error) throw new Error(`[AssetQueue] Failed to enqueue job: ${error.message}`);
    return data.id;
  }

  /**
   * Worker loop to pull the next available job with row-level locking (pseudo-lock via status update)
   */
  async claimNextJob(workerId: string): Promise<any | null> {
    // Note: In a true production environment, a stored procedure with SKIP LOCKED is preferred.
    // For this lightweight implementation, we use a simple update with strict conditions.
    const { data, error } = await this.supabase
      .from('asset_jobs')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (error || !data) return null;

    // Attempt to claim
    const { data: claimed, error: claimError } = await this.supabase
      .from('asset_jobs')
      .update({
        status: 'processing',
        worker_id: workerId,
        started_at: new Date().toISOString()
      })
      .eq('id', data.id)
      .eq('status', 'pending')
      .select()
      .single();

    if (claimError || !claimed) return null; // Another worker got it

    return claimed;
  }

  /**
   * Marks a job as completed
   */
  async completeJob(jobId: string, resultData: Record<string, any>): Promise<void> {
    await this.supabase
      .from('asset_jobs')
      .update({
        status: 'completed',
        result_data: resultData,
        completed_at: new Date().toISOString()
      })
      .eq('id', jobId);
  }

  /**
   * Marks a job as failed, auto-retrying if under max retries
   */
  async failJob(jobId: string, errorMsg: string, currentRetries: number): Promise<void> {
    const MAX_RETRIES = 3;
    const nextStatus = currentRetries >= MAX_RETRIES ? 'failed' : 'pending';
    
    await this.supabase
      .from('asset_jobs')
      .update({
        status: nextStatus,
        error_message: errorMsg,
        retry_count: currentRetries + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);
  }
}
