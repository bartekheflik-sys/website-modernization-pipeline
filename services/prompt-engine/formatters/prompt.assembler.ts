import { AIAnalysisOutput } from '../schemas/analysis.schema';
import { buildGlobalInstructions } from '../builders/global-instructions.builder';
import { buildDesignSystem } from '../builders/design-system.builder';
import { buildPagePlan } from '../builders/page-plan.builder';
import { buildSectionSpecs } from '../builders/section-specs.builder';
import { buildConversionRules } from '../builders/conversion-rules.builder';
import { buildMotionSystem } from '../builders/motion-system.builder';
import { buildBusinessContext, buildContentRules, buildResponsivenessRules, buildAssetGuidance } from '../builders/content-rules.builder';
import { validateAnalysisInput, validatePromptOutput, countSections, GeneratedPromptOutput } from '../validators/prompt.validator';

export function generateLovablePrompt(analysis: AIAnalysisOutput, assets: any[] = []): GeneratedPromptOutput {
  // STEP 1: Validate that we have quality input data
  validateAnalysisInput(analysis);

  // STEP 2: Build each section of the prompt deterministically
  const sections = [
    buildBusinessContext(analysis),
    buildGlobalInstructions(analysis, assets),
    buildDesignSystem(analysis),
    buildPagePlan(analysis),
    buildSectionSpecs(analysis),
    buildConversionRules(analysis),
    buildMotionSystem(analysis),
    buildResponsivenessRules(),
    buildContentRules(analysis),
    buildAssetGuidance(analysis, assets),
  ];

  // STEP 3: Assemble full prompt
  // STEP 3: Assemble full prompt
  const fullPrompt = `
==================================================
ROLE & MISSION
==================================================
You are an Expert Frontend Engineer and UI/UX Architect. 
Your mission is to modernize a legacy business website into a high-performance, premium, and accessible web application. 
Follow the instructions below with surgical precision. Prioritize business authenticity and visual excellence.

==================================================
LOVABLE WEBSITE GENERATION PROMPT
==================================================

${sections.join('\n\n')}

==================================================
END OF PROMPT
==================================================
`.trim();

  // STEP 4: Build raw output object
  const raw = {
    lovable_prompt: fullPrompt,
    metadata: {
      pages: analysis.lovable_prompt_data.pages_to_generate,
      sections_count: countSections(analysis),
      motion_level: analysis.design_direction.motion_level,
      design_style: analysis.lovable_prompt_data.design_style,
      industry: analysis.industry,
      generated_at: new Date().toISOString()
    }
  };

  // STEP 5: Runtime validate the output before returning
  return validatePromptOutput(raw);
}
