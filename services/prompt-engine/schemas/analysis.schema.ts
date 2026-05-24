import { z } from 'zod';

export const AIAnalysisSchema = z.object({
  business_summary: z.string(),
  industry: z.string(),
  target_audience: z.string(),
  business_model: z.string(),
  core_services: z.array(z.string()),
  value_proposition: z.string(),
  /** ISO 639-1 language code of the crawled site's primary language, e.g. "en", "pl", "de" */
  detected_language: z.string().optional().default('en'),
  
  website_type: z.enum([
    'blog',
    'landing_page',
    'portfolio',
    'restaurant',
    'ecommerce',
    'corporate',
    'saas',
    'news',
    'educational',
    'personal'
  ]).optional().default('corporate'),

  content_analysis: z.object({
    pages_detected: z.array(z.string()),
    missing_pages: z.array(z.string()),
    weak_content_areas: z.array(z.string()),
    navigation_issues: z.array(z.string()),
    raw_content_map: z.record(z.string(), z.string()).optional()
  }),

  design_direction: z.object({
    brand_style: z.string(),
    ui_direction: z.string(),
    color_direction: z.string(),
    typography_direction: z.string(),
    motion_level: z.enum(['low', 'medium', 'high'])
  }),

  ux_analysis: z.object({
    conversion_score: z.number().min(0).max(10),
    cta_quality: z.string(),
    missing_elements: z.array(z.string()),
    user_journey_issues: z.array(z.string())
  }),

  lovable_prompt_data: z.object({
    pages_to_generate: z.array(z.string()),
    sections_per_page: z.record(z.string(), z.array(z.string())),
    design_dna_id: z.string(),
    design_style: z.string(),
    animation_style: z.string(),
    conversion_goals: z.array(z.string()),
    must_include_elements: z.array(z.string()),
    media_assets: z.object({
      logo_url: z.string().optional(),
      product_images: z.array(z.string()).optional(),
      team_images: z.array(z.string()).optional(),
      brand_images: z.array(z.string()).optional(),
      location_images: z.array(z.string()).optional()
    }).optional()
  })
});

export type AIAnalysisOutput = z.infer<typeof AIAnalysisSchema>;
