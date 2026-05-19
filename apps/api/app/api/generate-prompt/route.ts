import { NextResponse } from 'next/server';
import { generatePromptForProject } from 'prompt-engine/prompt-engine.service';
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

    // Verify project exists
    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .select('id, status, pipeline_state')
      .eq('id', projectId)
      .single();

    if (error || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const currentState = project.pipeline_state || project.status || 'pending';
    if (!PipelineStateMachine.canTransition(currentState as any, 'prompt_generating')) {
      return NextResponse.json(
        { error: `Cannot run prompt generation. Current state: ${currentState}. Run /api/analyze first.` },
        { status: 400 }
      );
    }

    // Log Start
    await transitionProjectState(projectId, 'prompt_generating');
    await logPipelineStep(projectId, 'prompt_generation', 'running', 'Assembling deterministic Lovable prompt from AI intelligence.');

    const result = await generatePromptForProject(projectId);

    if (result.status === 'failed') {
      await logPipelineError(projectId, 'validator', result.error || 'Prompt validation failed');
      await logPipelineStep(projectId, 'prompt_generation', 'failed', result.error);
      await transitionProjectState(projectId, 'failed', { failedStep: 'prompt_generation', reason: result.error });
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Log Success
    await logPipelineStep(projectId, 'prompt_generation', 'success', `Successfully generated prompt with ${result.result?.metadata.pages.length} pages.`);
    await transitionProjectState(projectId, 'prompt_completed');
    await transitionProjectState(projectId, 'completed');

    const response = NextResponse.json(result, { status: 200 });
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    return response;
  } catch (error: any) {
    console.error('Error in /api/generate-prompt:', error);
    const msg = error?.message || 'Internal Server Error';
    
    if (projectId) {
      await logPipelineError(projectId, 'storage', msg);
      await logPipelineStep(projectId, 'prompt_generation', 'failed', msg);
      await transitionProjectState(projectId, 'failed', { failedStep: 'prompt_generation', reason: msg });
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
