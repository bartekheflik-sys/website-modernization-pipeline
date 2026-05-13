import { GoogleGenerativeAI } from "@google/generative-ai";
import { PageMatcher } from "./matchers/page-matcher";
import { createClient } from "@supabase/supabase-js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export class QAEngineService {
  /**
   * Runs a full QA comparison between the original site and the modernized version.
   */
  async runQA(projectId: string) {
    console.log(`[QA Engine] Starting Quality Audit for Project: ${projectId}`);

    // 1. Fetch Original Site Data (Step 2 output)
    const { data: originalPages } = await supabase
      .from('pages')
      .select('*')
      .eq('project_id', projectId);

    // 2. Fetch Modernized Site Data
    const { data: modernizedPages } = await supabase
      .from('modernized_pages')
      .select('*')
      .eq('project_id', projectId);

    // 3. Structural Comparison
    const matches = PageMatcher.matchPages(
      originalPages?.map((p: any) => p.url) || [],
      modernizedPages?.map((p: any) => p.url) || []
    );
    console.log(`[QA Engine] Found ${matches.length} page matches for comparison.`);

    // 4. AI Analysis via Gemini
    console.log(`[QA Engine] Sending ${originalPages?.length} original and ${modernizedPages?.length} modernized pages to AI...`);
    const report = await this.generateAIReport(projectId, originalPages || [], matches);
    console.log(`[QA Engine] AI Audit Complete. Score: ${report.overall_score}`);

    // 5. Save Report to Database
    console.log(`[QA Engine] Saving report to database...`);
    const { data: savedReport, error } = await supabase
      .from('website_qa_reports')
      .insert({
        project_id: projectId,
        qa_report_json: report,
        overall_score: report.overall_score
      })
      .select()
      .single();

    if (error) {
      console.error(`[QA Engine] DB Error:`, error);
      throw error;
    }

    // 6. Generate Repair Prompt if score is low
    if (report.overall_score < 90) {
      console.log(`[QA Engine] Low score detection. Generating repair prompt...`);
      await this.generateRepairPrompt(projectId, savedReport.id, report);
    }

    console.log(`[QA Engine] Audit Finished Successfully.`);
    return savedReport;
  }

  private async generateAIReport(projectId: string, originalData: any[], matches: any[]) {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash"
    });

    const prompt = `
      You are a Senior Web QA Auditor & Systems Architect.
      Compare the ORIGINAL website data with the Modernized Structure.
      
      ORIGINAL PAGES (Business Intent & Content Source):
      ${JSON.stringify(originalData.map(p => ({ url: p.url, title: p.title, content: p.markdown_content?.substring(0, 500) })))}

      MODERNIZED MAPPING (Generated Results):
      ${JSON.stringify(matches)}

      TASK:
      Perform a BUSINESS-INTELLIGENCE QA audit.
      1. Detect missing critical business pages or services.
      2. Identify conversion gaps (missing CTAs, forms).
      3. Evaluate trust elements (testimonials, FAQs, social proof).
      4. Compare content hierarchy and messaging preservation.

      SCORING CRITERIA (0-100):
      - content_preservation: Did we keep the important business info?
      - ux_quality: Is the new flow intuitive?
      - conversion_quality: Are CTAs placed for maximum lead gen?
      - trust_quality: Are trust indicators present?
      - navigation_quality: Is the menu logical and complete?
      - mobile_readiness: Does the structure look mobile-optimized?
      - modernization_quality: How much of an upgrade is this over the old site?

      STRICT OUTPUT FORMAT (JSON ONLY):
      {
        "overall_score": number,
        "scores": {
          "content_preservation": number,
          "ux_quality": number,
          "conversion_quality": number,
          "trust_quality": number,
          "navigation_quality": number,
          "mobile_readiness": number,
          "modernization_quality": number
        },
        "page_coverage": object,
        "missing_pages": string[],
        "missing_sections": string[],
        "missing_content": string[],
        "navigation_issues": string[],
        "conversion_issues": string[],
        "ux_issues": string[],
        "trust_issues": string[],
        "mobile_issues": string[],
        "repair_priority": "low" | "medium" | "high",
        "repair_actions": string[]
      }
    `;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("AI did not return valid JSON");
      
      const rawData = JSON.parse(jsonMatch[0]);
      
      // Step 15: Deterministic Validation
      const { QAReportSchema } = require('./validators/qa-report.schema');
      return QAReportSchema.parse(rawData);
    } catch (err) {
      console.error(`[QA Engine] AI Audit Error:`, err);
      throw new Error("Failed to generate deterministic QA report");
    }
  }

  private async generateRepairPrompt(projectId: string, reportId: string, report: any) {
    const repairPrompt = `
      FIX-ONLY REQUEST:
      The following issues were detected in the modernization:
      ${report.repair_actions.join('\n')}

      INSTRUCTIONS:
      - Add the missing sections identified.
      - Do NOT rewrite the entire site.
      - Only apply specific fixes for the issues listed.
    `;

    await supabase
      .from('repair_prompts')
      .insert({
        project_id: projectId,
        qa_report_id: reportId,
        repair_prompt: repairPrompt,
        severity: report.repair_priority
      });
  }
}
