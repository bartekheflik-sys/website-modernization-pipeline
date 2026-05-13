import { z } from 'zod';

export const QAReportSchema = z.object({
  overall_score: z.number().min(0).max(100),
  
  // Dimensional Scoring (Step 11)
  scores: z.object({
    content_preservation: z.number().min(0).max(100),
    ux_quality: z.number().min(0).max(100),
    conversion_quality: z.number().min(0).max(100),
    trust_quality: z.number().min(0).max(100),
    navigation_quality: z.number().min(0).max(100),
    mobile_readiness: z.number().min(0).max(100),
    modernization_quality: z.number().min(0).max(100)
  }),

  // Detailed Analysis (Step 8)
  page_coverage: z.record(z.string(), z.any()),
  missing_pages: z.array(z.string()),
  missing_sections: z.array(z.string()),
  missing_content: z.array(z.string()),
  navigation_issues: z.array(z.string()),
  conversion_issues: z.array(z.string()),
  ux_issues: z.array(z.string()),
  trust_issues: z.array(z.string()),
  mobile_issues: z.array(z.string()),

  // Repair Loop (Step 9/12)
  repair_priority: z.enum(['low', 'medium', 'high']),
  repair_actions: z.array(z.string())
});

export type QAReport = z.infer<typeof QAReportSchema>;
