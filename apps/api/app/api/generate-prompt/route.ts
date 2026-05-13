import { NextResponse } from 'next/server';
import { generatePromptForProject } from 'prompt-engine/prompt-engine.service';
import { supabaseAdmin } from '@/lib/supabase';
import { logPipelineStep, logPipelineError, updateProjectStatus } from '@/lib/pipeline';

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
      .select('id, status')
      .eq('id', projectId)
      .single();

    if (error || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.status === 'generating_prompt') {
      return NextResponse.json({ error: 'Prompt generation already in progress' }, { status: 409 });
    }

    if (project.status !== 'analysis_complete' && project.status !== 'completed') {
      return NextResponse.json(
        { error: `Project analysis not complete. Current status: ${project.status}. Run /api/analyze first.` },
        { status: 400 }
      );
    }

    // Log Start
    await updateProjectStatus(projectId, 'generating_prompt');
    await logPipelineStep(projectId, 'prompt_generation', 'running', 'Assembling deterministic Lovable prompt from AI intelligence.');

    const result = await generatePromptForProject(projectId);

    if (result.status === 'failed') {
      await logPipelineError(projectId, 'validator', result.error || 'Prompt validation failed');
      await logPipelineStep(projectId, 'prompt_generation', 'failed', result.error);
      await updateProjectStatus(projectId, 'failed');
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Log Success
    await logPipelineStep(projectId, 'prompt_generation', 'success', `Successfully generated prompt with ${result.result?.metadata.pages.length} pages.`);
    await updateProjectStatus(projectId, 'completed');

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
      await updateProjectStatus(projectId, 'failed');
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
