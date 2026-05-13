import { WebCrawler } from './core/crawler';
import { updateProjectStatus, logPipelineStep, logPipelineError } from './storage/supabase';

export async function crawlWebsite(projectId: string, url: string) {
  try {
    console.log(`[Crawler Service] Starting crawl for Project: ${projectId}, URL: ${url}`);
    
    // Update DB status to visually show the user it is crawling
    await updateProjectStatus(projectId, 'crawling');
    await logPipelineStep(projectId, 'crawl', 'running', `Starting deep crawl of ${url}`);
    
    const crawler = new WebCrawler({
      projectId,
      startUrl: url,
      maxPages: 30, // Default configurable limit for V1
      maxDepth: 3,
      concurrency: 3
    });

    const pagesCrawled = await crawler.start();
    
    console.log(`[Crawler Service] Finished crawling ${pagesCrawled} pages for Project: ${projectId}`);
    await logPipelineStep(projectId, 'crawl', 'success', `Crawl complete. Successfully extracted ${pagesCrawled} pages.`);
    await updateProjectStatus(projectId, 'crawled'); // Ready for analysis
    
    return { status: 'crawled', pagesCrawled };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[Crawler Service] Fatal Error:', msg);
    await logPipelineError(projectId, 'crawler', msg);
    await logPipelineStep(projectId, 'crawl', 'failed', msg);
    await updateProjectStatus(projectId, 'failed');
    return { status: 'failed', pagesCrawled: 0 };
  }
}
