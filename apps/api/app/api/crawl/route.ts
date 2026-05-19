import { NextResponse } from 'next/server';
import { crawlWebsite } from 'crawler-service';
import { supabaseAdmin } from '@/lib/supabase';
import { logPipelineStep, logPipelineError, transitionProjectState } from '@/lib/pipeline';
import { PipelineStateMachine } from 'pipeline-state-machine';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  let projectId: string | undefined;
  
  try {
    const body = await request.json();
    projectId = body.projectId;
    const { url, isModernized } = body;

    if (!projectId || !url) {
      return NextResponse.json({ error: 'projectId and url are required' }, { status: 400 });
    }

    // Double check project exists and check status
    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .select('id, status, pipeline_state')
      .eq('id', projectId)
      .single();

    if (error || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const currentState = project.pipeline_state || project.status || 'pending';
    if (!PipelineStateMachine.canTransition(currentState as any, 'crawling')) {
      return NextResponse.json({ error: `Cannot start crawl. Current state: ${currentState}` }, { status: 409 });
    }

    // Log Trigger
    await transitionProjectState(projectId, 'crawling');
    await logPipelineStep(projectId, 'crawl', 'running', `Crawl triggered manually for ${url}`);

    // Since crawling takes a long time, we run it async in the background.
    crawlWebsite(projectId, url, isModernized).catch(async (err) => {
      console.error('[Crawl Trigger Error]:', err);
      if (projectId) {
        await logPipelineError(projectId, 'crawler', err instanceof Error ? err.message : String(err));
        await logPipelineStep(projectId, 'crawl', 'failed', 'Background crawler failed to start.');
      }
    });

    const response = NextResponse.json({ status: 'started' }, { status: 202 });
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    return response;
  } catch (error: any) {
    console.error('Error in /api/crawl:', error);
    const msg = error?.message || 'Internal Server Error';
    if (projectId) {
      await logPipelineError(projectId, 'crawler', msg);
      await logPipelineStep(projectId, 'crawl', 'failed', msg);
    }
    const response = NextResponse.json({ error: msg }, { status: 500 });
    response.headers.set('Access-Control-Allow-Origin', '*');
    return response;
  }
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return response;
}
