import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { crawlWebsite } from 'crawler-service';
import { logPipelineStep } from '@/lib/pipeline';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { data, error } = await supabaseAdmin
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const response = NextResponse.json(data);
    response.headers.set('Access-Control-Allow-Origin', '*');
    return response;
  } catch (error) {
    console.error('Error fetching projects:', error);
    const response = NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    response.headers.set('Access-Control-Allow-Origin', '*');
    return response;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    try {
      new URL(url);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid URL format provided' }, { status: 400 });
    }

    // Insert into Supabase
    const { data, error } = await supabaseAdmin
      .from('projects')
      .insert([
        { url, status: 'pending' }
      ])
      .select()
      .single();

    if (error) {
      console.error('[Supabase Insert Error]:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Log Pipeline Start
    await logPipelineStep(data.id, 'crawl', 'idle', 'Project initialized. Preparing for crawl...');

    // Automatically trigger the crawler service in the background!
    crawlWebsite(data.id, url).catch(console.error);

    const response = NextResponse.json(data, { status: 201 });
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    return response;
  } catch (error: any) {
    console.error('Error creating project:', error);
    const msg = error?.message || 'Internal Server Error';
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
