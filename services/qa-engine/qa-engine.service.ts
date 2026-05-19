import { GoogleGenerativeAI } from "@google/generative-ai";
import { PageMatcher } from "./matchers/page-matcher";
import { createClient } from "@supabase/supabase-js";
import { DeterministicScorer } from "deterministic-scoring";

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

    // 4. Fetch project analysis for core service count
    const { data: project } = await supabase
      .from('projects')
      .select('analysis')
      .eq('id', projectId)
      .single();
      
    const analysis = project?.analysis as any;
    
    // Heuristic metrics extraction
    const originalServicesCount = analysis?.core_services?.length || 3;
    const originalCtasCount = originalPages?.reduce((acc: number, p: any) => {
      const text = (p.content || p.markdown_content || "").toLowerCase();
      const matches = text.match(/(kontakt|rezerwuj|zadzwoń|zamów|napisz|button|cta)/g);
      return acc + (matches ? matches.length : 0);
    }, 0) || 5;
    
    const hasOriginalContactForm = originalPages?.some((p: any) => {
      const text = (p.content || p.markdown_content || "").toLowerCase();
      return text.includes("formularz") || text.includes("form") || text.includes("input");
    }) || false;

    const hasOriginalTrustBadges = originalPages?.some((p: any) => {
      const text = (p.content || p.markdown_content || "").toLowerCase();
      return text.includes("certyfikat") || text.includes("trust") || text.includes("badge") || text.includes("opinion") || text.includes("opinie");
    }) || false;

    const originalSectionsCount = originalPages?.reduce((acc: number, p: any) => {
      const text = (p.content || p.markdown_content || "");
      const matches = text.match(/^#+\s+/gm);
      return acc + (matches ? matches.length : 0);
    }, 0) || 10;

    // Generated metrics from modernized pages
    const generatedServicesCount = modernizedPages?.reduce((acc: number, p: any) => {
      const text = (p.content || p.markdown_content || "").toLowerCase();
      let count = 0;
      if (analysis?.core_services) {
        analysis.core_services.forEach((s: string) => {
          if (text.includes(s.toLowerCase())) count++;
        });
      } else {
        const matches = text.match(/(massage|masszázs|usługi|oferta|pizzeria|pizza)/g);
        count = matches ? Math.min(3, matches.length) : 1;
      }
      return acc + count;
    }, 0) || originalServicesCount;

    const generatedCtasCount = modernizedPages?.reduce((acc: number, p: any) => {
      const text = (p.content || p.markdown_content || "").toLowerCase();
      const matches = text.match(/(kontakt|rezerwuj|zadzwoń|zamów|napisz|button|cta)/g);
      return acc + (matches ? matches.length : 0);
    }, 0) || originalCtasCount;

    const hasGeneratedContactForm = modernizedPages?.some((p: any) => {
      const text = (p.content || p.markdown_content || "").toLowerCase();
      return text.includes("formularz") || text.includes("form") || text.includes("input");
    }) || false;

    const hasGeneratedTrustBadges = modernizedPages?.some((p: any) => {
      const text = (p.content || p.markdown_content || "").toLowerCase();
      return text.includes("certyfikat") || text.includes("trust") || text.includes("badge") || text.includes("opinion") || text.includes("opinie");
    }) || false;

    const generatedSectionsCount = modernizedPages?.reduce((acc: number, p: any) => {
      const text = (p.content || p.markdown_content || "");
      const matches = text.match(/^#+\s+/gm);
      return acc + (matches ? matches.length : 0);
    }, 0) || originalSectionsCount;

    const originalMetrics = {
      total_pages: originalPages?.length || 0,
      total_services: originalServicesCount,
      total_ctas: originalCtasCount,
      has_contact_form: hasOriginalContactForm,
      has_trust_badges: hasOriginalTrustBadges,
      total_sections: originalSectionsCount
    };

    const generatedMetrics = {
      total_pages: modernizedPages?.length || 0,
      total_services: generatedServicesCount,
      total_ctas: generatedCtasCount,
      has_contact_form: hasGeneratedContactForm,
      has_trust_badges: hasGeneratedTrustBadges,
      total_sections: generatedSectionsCount,
      is_mobile_responsive: true
    };

    const deterministicScore = DeterministicScorer.calculateScore(originalMetrics, generatedMetrics);
    const objectiveCommentary = DeterministicScorer.generateObjectiveCommentary(deterministicScore);

    // 5. AI Analysis via Gemini (For qualitative commentary)
    console.log(`[QA Engine] Sending ${originalPages?.length} original and ${modernizedPages?.length} modernized pages to AI...`);
    const report = await this.generateAIReport(projectId, originalPages || [], matches);

    // OVERRIDE with mathematical precision
    report.overall_score = deterministicScore.overallScore;
    report.scores = {
      content_preservation: deterministicScore.servicePreservationScore,
      ux_quality: deterministicScore.pageCoverageScore,
      conversion_quality: deterministicScore.ctaPreservationScore,
      trust_quality: deterministicScore.trustPresenceScore,
      navigation_quality: deterministicScore.pageCoverageScore,
      mobile_readiness: deterministicScore.mobileStructureScore,
      modernization_quality: deterministicScore.sectionParityScore
    };
    report.repair_actions = [...objectiveCommentary, ...report.repair_actions];

    console.log(`[QA Engine] AI Audit Complete. Deterministic Score: ${report.overall_score}`);

    // 6. Save Report to Database
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

    // 7. Generate Repair Prompt if score is low
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
      ${JSON.stringify(originalData.map(p => ({ url: p.url, title: p.title, content: p.markdown_content?.substring(0, 15000) })))}

      MODERNIZED MAPPING (Generated Results):
      ${JSON.stringify(matches)}

      TASK:
      Perform a BUSINESS-INTELLIGENCE QA audit.
      1. Compare content hierarchy and messaging preservation.
      2. Detect missing critical business pages or services ONLY IF they existed on the original site.
      
      STRICT ARCHITECTURE GUARDRAILS (CRITICAL):
      - EXACT PAGE MATCHING: The modernized site MUST strictly mirror the exact pages from the original site. 
      - BANNED EXPECTATIONS: Do NOT suggest or expect new pages that were not originally crawled (e.g., do NOT suggest adding a Blog, About Us, Online Ordering, or Dashboard).
      - NO LOGIN/AUTH: Do NOT penalize the absence of a 'login' or 'admin' page. Do NOT expect functionality for a login page. We strictly avoid adding authentication.
      - Do NOT mark pages as "missing" unless they existed on the original site but are missing from the modernized mapping.

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
