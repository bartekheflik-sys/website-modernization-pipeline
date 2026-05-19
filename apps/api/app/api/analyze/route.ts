import { NextResponse } from 'next/server';
import { analyzeWebsiteData } from 'prompt-engine';
import { supabaseAdmin } from '@/lib/supabase';
import { logPipelineStep, logPipelineError, transitionProjectState } from '@/lib/pipeline';
import { PipelineStateMachine } from 'pipeline-state-machine';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  let projectId: string | undefined;

  try {
    const body = await request.json();
    projectId = body.projectId;

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    // Verify project exists and check status for concurrency protection
    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .select('id, status, pipeline_state')
      .eq('id', projectId)
      .single();

    if (error || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const currentState = project.pipeline_state || project.status || 'pending';
    if (!PipelineStateMachine.canTransition(currentState as any, 'analysis_running')) {
      console.log(`[API Analyze] Rejection: Project state is ${currentState}`);
      return NextResponse.json(
        { error: `Cannot run analysis. Current state: ${currentState}` },
        { status: 400 }
      );
    }

    // Log Start
    await transitionProjectState(projectId, 'analysis_running');
    await logPipelineStep(projectId, 'analysis', 'running', 'Starting AI website analysis via Gemini 2.5 Flash.');

    const result = await analyzeWebsiteData(projectId);

    if (result.status === 'failed') {
      await logPipelineError(projectId, 'gemini', result.error || 'Unknown analysis error');
      await logPipelineStep(projectId, 'analysis', 'failed', result.error);
      await transitionProjectState(projectId, 'failed', { failedStep: 'analysis', reason: result.error });
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Log Success
    await logPipelineStep(projectId, 'analysis', 'success', 'Website intelligence successfully extracted and validated.');
    await transitionProjectState(projectId, 'analysis_completed');

    const response = NextResponse.json(result, { status: 200 });
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    return response;
  } catch (error: any) {
    console.error('Error in /api/analyze:', error);
    const msg = error?.message || 'Internal Server Error';
    
    if (projectId) {
      await logPipelineError(projectId, 'gemini', msg);
      await logPipelineStep(projectId, 'analysis', 'failed', msg);
      await transitionProjectState(projectId, 'failed', { failedStep: 'analysis', reason: msg });
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
