import { AIAnalysisOutput } from '../schemas/analysis.schema';
import { z } from 'zod';

// Minimum prompt length: 8 pages × ~400 chars average = ~3200 minimum
const MIN_PROMPT_LENGTH = 3000;

export const GeneratedPromptSchema = z.object({
  lovable_prompt: z.string().min(MIN_PROMPT_LENGTH, `Prompt too short — minimum ${MIN_PROMPT_LENGTH} characters required for a valid multi-page website specification`),
  metadata: z.object({
    pages: z.array(z.string()).min(1, 'Must have at least one page'),
    sections_count: z.number().min(3, 'Must have at least 3 sections total'),
    motion_level: z.enum(['low', 'medium', 'high']),
    design_style: z.string().min(10, 'Design style description too short'),
    industry: z.string().min(2, 'Industry is required'),
    generated_at: z.string()
  })
});

export type GeneratedPromptOutput = z.infer<typeof GeneratedPromptSchema>;

export function validatePromptOutput(raw: unknown): GeneratedPromptOutput {
  return GeneratedPromptSchema.parse(raw);
}

export function validateAnalysisInput(analysis: AIAnalysisOutput): void {
  const errors: string[] = [];

  // Core business fields
  if (!analysis.business_summary || analysis.business_summary.length < 20) {
    errors.push('business_summary is missing or too short (min 20 chars)');
  }
  if (!analysis.industry || analysis.industry.length < 2) {
    errors.push('industry is missing');
  }
  if (!analysis.target_audience || analysis.target_audience.length < 10) {
    errors.push('target_audience is missing or too short');
  }
  if (!analysis.value_proposition || analysis.value_proposition.length < 10) {
    errors.push('value_proposition is missing or too short');
  }
  if (!analysis.core_services || analysis.core_services.length === 0) {
    errors.push('core_services array is empty');
  }

  // Content analysis fields
  if (!analysis.content_analysis?.pages_detected || analysis.content_analysis.pages_detected.length === 0) {
    errors.push('content_analysis.pages_detected is empty — was Step 3 run correctly?');
  }

  // Design direction fields
  if (!analysis.design_direction?.motion_level) {
    errors.push('design_direction.motion_level is missing');
  }
  if (!analysis.design_direction?.color_direction || analysis.design_direction.color_direction.length < 5) {
    errors.push('design_direction.color_direction is missing');
  }
  if (!analysis.design_direction?.ui_direction || analysis.design_direction.ui_direction.length < 10) {
    errors.push('design_direction.ui_direction is missing');
  }

  // UX analysis fields
  if (analysis.ux_analysis?.conversion_score === undefined || analysis.ux_analysis.conversion_score === null) {
    errors.push('ux_analysis.conversion_score is missing');
  }
  if (!analysis.ux_analysis?.missing_elements || analysis.ux_analysis.missing_elements.length === 0) {
    errors.push('ux_analysis.missing_elements is empty — conversion strategy cannot be built');
  }

  // Lovable prompt data
  if (!analysis.lovable_prompt_data?.pages_to_generate || analysis.lovable_prompt_data.pages_to_generate.length === 0) {
    errors.push('lovable_prompt_data.pages_to_generate is empty');
  }
  if (!analysis.lovable_prompt_data?.sections_per_page || Object.keys(analysis.lovable_prompt_data.sections_per_page).length === 0) {
    errors.push('lovable_prompt_data.sections_per_page is empty');
  }
  if (!analysis.lovable_prompt_data?.conversion_goals || analysis.lovable_prompt_data.conversion_goals.length === 0) {
    errors.push('lovable_prompt_data.conversion_goals is empty');
  }

  if (errors.length > 0) {
    throw new Error(`[Prompt Validator] Invalid Step 3 input (${errors.length} errors):\n${errors.map(e => `  - ${e}`).join('\n')}`);
  }
}

export function countSections(analysis: AIAnalysisOutput): number {
  return Object.values(analysis.lovable_prompt_data.sections_per_page)
    .reduce((total, sections) => total + sections.length, 0);
}
