import { NextResponse } from 'next/server';
import { AssetQueue } from 'asset-queue';
import { assetEngine } from 'asset-engine/asset-engine.service';
import { supabaseAdmin } from '@/lib/supabase';
import { logPipelineStep, logPipelineError, transitionProjectState } from '@/lib/pipeline';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const queue = new AssetQueue(supabaseAdmin);
  const workerId = 'nextjs-background-worker-' + Math.random().toString(36).substring(7);

  try {
    // 1. Claim next job
    const job = await queue.claimNextJob(workerId);

    if (!job) {
      return NextResponse.json({ status: 'idle', message: 'No pending asset jobs found in the queue.' }, { status: 200 });
    }

    const { projectId } = job.payload;
    console.log(`[Queue Worker] Claimed job ${job.id} for project ${projectId}`);

    await logPipelineStep(
      projectId,
      'crawl',
      'running',
      `[Queue Worker] Async processing started for job: ${job.id} (${job.job_type})`
    );

    // 2. Execute based on job type
    if (job.job_type === 'classify_assets') {
      try {
        // Run classification engine
        await assetEngine.processProjectAssets(projectId);

        // Mark job complete in the queue
        await queue.completeJob(job.id, { processed: true, completedAt: new Date().toISOString() });

        // Step 3: Transition project status to "crawled" (ready for analysis)
        // Note: For state machine, transition from assets_processing -> analysis_running is allowed next.
        // Let's update the project's status to "crawled" so the frontend dashboard knows it is ready to analyze.
        await supabaseAdmin
          .from('projects')
          .update({ 
            status: 'crawled', 
            pipeline_state: 'assets_processing',
            updated_at: new Date().toISOString() 
          })
          .eq('id', projectId);

        await logPipelineStep(
          projectId,
          'crawl',
          'success',
          `[Queue Worker] Async asset classification complete. Project ready for AI analysis.`
        );

      } catch (err: any) {
        console.error(`[Queue Worker] Job processing error for job ${job.id}:`, err);
        
        // Handle failure & retry logic
        await queue.failJob(job.id, err.message || 'Unknown processing error', job.retry_count);
        
        await logPipelineError(projectId, 'crawler', `Job ${job.id} failed: ${err.message}`);
        await logPipelineStep(
          projectId,
          'crawl',
          'failed',
          `[Queue Worker] Asset processing failed on attempt ${job.retry_count + 1}. Error: ${err.message}`
        );

        // If it was the final attempt, update project status to failed
        if (job.retry_count >= 2) {
          await transitionProjectState(projectId, 'failed', { failedStep: 'crawl', reason: `Asset processing failed: ${err.message}` });
        }
      }
    } else {
      // Unhandled job type
      await queue.completeJob(job.id, { status: 'skipped', reason: `Unhandled job type: ${job.job_type}` });
    }

    return NextResponse.json({
      status: 'success',
      jobId: job.id,
      jobType: job.job_type,
      projectId
    }, { status: 200 });

  } catch (error: any) {
    console.error('[Queue Worker] Global Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
