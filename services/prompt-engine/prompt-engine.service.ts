import { fetchAnalysisResult, saveGeneratedPrompt, fetchProjectAssets } from './storage/prompt.storage';
import { generateLovablePrompt } from './formatters/prompt.assembler';
import { GeneratedPromptOutput } from './validators/prompt.validator';

export async function generatePromptForProject(projectId: string): Promise<{ status: string; result?: GeneratedPromptOutput; error?: string }> {
  try {
    console.log(`[Prompt Engine] Generating Lovable prompt for Project: ${projectId}`);

    // STEP 1: Fetch validated Step 3 analysis from Supabase
    const analysisJson = await fetchAnalysisResult(projectId);
    const assets = await fetchProjectAssets(projectId);
    console.log(`[Prompt Engine] Step 3 analysis and ${assets.length} assets fetched successfully.`);

    // STEP 2: Generate the full deterministic Lovable prompt
    const promptOutput = generateLovablePrompt(analysisJson, assets);
    console.log(`[Prompt Engine] Prompt generated: ${promptOutput.metadata.pages.length} pages, ${promptOutput.metadata.sections_count} sections.`);

    // STEP 3: Persist to Supabase generated_prompts table
    await saveGeneratedPrompt(projectId, promptOutput);
    console.log(`[Prompt Engine] Prompt saved to Supabase.`);

    return { status: 'completed', result: promptOutput };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[Prompt Engine] Fatal Error:`, msg);
    return { status: 'failed', error: msg };
  }
}
