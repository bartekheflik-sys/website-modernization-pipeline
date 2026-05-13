import { NextResponse } from 'next/server';
import { QAEngineService } from '../../../../../../services/qa-engine';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { projectId } = await request.json();

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    // Check if both old and new data exist
    const { count: originalCount } = await supabaseAdmin
      .from('pages')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId);

    const { count: modernizedCount } = await supabaseAdmin
      .from('modernized_pages')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId);

    if (!originalCount || !modernizedCount) {
      return NextResponse.json({ 
        error: `Incomplete data: Original(${originalCount || 0}), Modernized(${modernizedCount || 0}). Both sites must be crawled first.` 
      }, { status: 400 });
    }

    const qaService = new QAEngineService();
    const report = await qaService.runQA(projectId);

    const response = NextResponse.json(report, { status: 200 });
    response.headers.set('Access-Control-Allow-Origin', '*');
    return response;
  } catch (error: any) {
    console.error('Error in /api/qa/run:', error);
    const response = NextResponse.json({ error: error.message }, { status: 500 });
    response.headers.set('Access-Control-Allow-Origin', '*');
    return response;
  }
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return response;
}
