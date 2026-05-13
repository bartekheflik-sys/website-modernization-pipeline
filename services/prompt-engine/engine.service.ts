import { fetchProjectPages, saveAnalysisResult, updateProjectStatus } from './storage/supabase';
import { runAIAnalysis } from './core/analyzer';

export async function analyzeWebsiteData(projectId: string) {
  try {
    console.log(`[Prompt Engine] Starting analysis for Project: ${projectId}`);
    await updateProjectStatus(projectId, 'analyzing');

    const pages = await fetchProjectPages(projectId);
    
    if (!pages || pages.length === 0) {
      throw new Error(`No crawled pages found for project ${projectId}. Run crawler first.`);
    }

    console.log(`[Prompt Engine] Processing ${pages.length} pages via AI...`);
    const analysisResult = await runAIAnalysis(pages);

    console.log(`[Prompt Engine] Analysis complete. Saving to database...`);
    await saveAnalysisResult(projectId, analysisResult);
    
    await updateProjectStatus(projectId, 'analysis_complete');
    
    return { status: 'completed', analysis: analysisResult };
  } catch (error) {
    console.error('[Prompt Engine] Fatal Error:', error);
    await updateProjectStatus(projectId, 'analysis_failed');
    return { status: 'failed', error: error instanceof Error ? error.message : String(error) };
  }
}
