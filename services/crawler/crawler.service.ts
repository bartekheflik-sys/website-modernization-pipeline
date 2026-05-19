import { AssetQueue } from 'asset-queue';
import { WebCrawler } from './core/crawler';
import { supabase, updateProjectStatus, logPipelineStep, logPipelineError } from './storage/supabase';

export async function crawlWebsite(projectId: string, url: string, isModernized: boolean = false) {
  try {
    const targetTable = isModernized ? 'modernized_pages' : 'pages';
    console.log(`[Crawler Service] Starting deep crawl for Project: ${projectId}, URL: ${url}, Target: ${targetTable}`);
    
    // Update DB status to visually show the user it is crawling
    await updateProjectStatus(projectId, 'crawling');
    await logPipelineStep(projectId, isModernized ? 'qa_crawl' : 'crawl', 'running', `Starting deep crawl of ${url}`);
    
    const crawler = new WebCrawler({
      projectId,
      startUrl: url,
      maxPages: 30, // Default configurable limit for V1
      maxDepth: 3,
      concurrency: 3,
      targetTable
    });

    const pagesCrawled = await crawler.start();
    
    console.log(`[Crawler Service] Finished crawling ${pagesCrawled} pages for Project: ${projectId}`);
    await logPipelineStep(projectId, isModernized ? 'qa_crawl' : 'crawl', 'success', `Crawl complete. Successfully extracted ${pagesCrawled} pages.`);
    
    // START STAGE 6.5: Asset Intelligence (Asynchronous via Job Queue)
    if (!isModernized) {
      await updateProjectStatus(projectId, 'assets_processing');
      await logPipelineStep(projectId, 'crawl', 'running', `Enqueuing asset intelligence job for project: ${projectId}`);
      
      const queue = new AssetQueue(supabase);
      const jobId = await queue.enqueue('classify_assets', { projectId });
      console.log(`[Crawler Service] Asset classification job enqueued successfully. Job ID: ${jobId}`);
      
      // Fire-and-forget background trigger to start processing immediately without blocking
      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/api/asset-queue/process';
      fetch(apiUrl, { method: 'POST' }).catch(err => console.error('[Queue Trigger Error]:', err));
    } else {
      await updateProjectStatus(projectId, 'qa_ready'); // Modernized pages are immediately ready for QA comparison
    }
    
    return { status: isModernized ? 'qa_ready' : 'assets_processing', pagesCrawled };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[Crawler Service] Fatal Error:', msg);
    await logPipelineError(projectId, 'crawler', msg);
    await logPipelineStep(projectId, 'crawl', 'failed', msg);
    await updateProjectStatus(projectId, 'failed');
    return { status: 'failed', pagesCrawled: 0 };
  }
}
