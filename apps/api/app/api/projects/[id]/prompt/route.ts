import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // 1. Find the latest prompt ID
    const { data: latest, error: findError } = await supabaseAdmin
      .from('generated_prompts')
      .select('id')
      .eq('project_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (findError || !latest) {
      return NextResponse.json({ error: 'No prompt found to update' }, { status: 404 });
    }

    // 2. Update that specific prompt record
    const { data, error } = await supabaseAdmin
      .from('generated_prompts')
      .update({ prompt })
      .eq('id', latest.id)
      .select();

    if (error) {
      console.error('Supabase error saving prompt:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error in PATCH /api/projects/[id]/prompt:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return response;
}
