import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIAnalysisOutput, AIAnalysisSchema } from '../schemas/analysis.schema';

// This expects GEMINI_API_KEY in your .env.local
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function runAIAnalysis(pagesData: any[], attempts = 3): Promise<AIAnalysisOutput> {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
    }
  });

  const formattedPages = pagesData.map(p => ({
    url: p.url,
    title: p.title,
    headings: p.raw_json?.headings || [],
    images: p.raw_json?.images || [],
    links: p.raw_json?.links || [],
    content: p.markdown_content || "",
    metadata: p.raw_json?.metadata || {}
  }));

  const systemPrompt = `
You are a world-class AI Systems Architect. Analyze the website data and generate a 'Lovable-ready design intelligence package'.

STRICT RULES:
1. Return ONLY a valid JSON object.
2. NO conversational text.
3. Every field must be grounded in the provided crawl data.

REQUIRED JSON STRUCTURE:
{
  "business_summary": "string",
  "industry": "string",
  "target_audience": "string",
  "business_model": "string",
  "core_services": ["string"],
  "value_proposition": "string",
  
  "content_analysis": {
    "pages_detected": ["string"],
    "missing_pages": ["string"],
    "weak_content_areas": ["string"],
    "navigation_issues": ["string"]
  },

  "design_direction": {
    "brand_style": "string",
    "ui_direction": "string",
    "color_direction": "string",
    "typography_direction": "string",
    "motion_level": "low | medium | high"
  },

  "ux_analysis": {
    "conversion_score": 0-10,
    "cta_quality": "string",
    "missing_elements": ["string"],
    "user_journey_issues": ["string"]
  },

  "lovable_prompt_data": {
    "pages_to_generate": ["string"],
    "sections_per_page": { "PageName": ["string"] },
    "design_style": "string",
    "animation_style": "string",
    "conversion_goals": ["string"],
    "must_include_elements": ["string"]
  }
}
`;

  const prompt = `${systemPrompt}\n\nDATA TO ANALYZE:\n${JSON.stringify(formattedPages)}`;

  for (let i = 0; i < attempts; i++) {
    try {
      console.log(`[Analyzer] Attempt ${i + 1}/${attempts}: Sending ${formattedPages.length} pages to Gemini...`);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const rawAnalysis = JSON.parse(text);
      
      // CRITICAL SAFETY CHECK: Runtime Zod Validation
      const validatedAnalysis = AIAnalysisSchema.parse(rawAnalysis);
      
      console.log(`[Analyzer] Successfully validated AI response.`);
      return validatedAnalysis;

    } catch (error) {
      console.error(`[Analyzer] Attempt ${i + 1} failed:`, error instanceof Error ? error.message : String(error));
      if (i === attempts - 1) throw error; // Re-throw on last attempt
      console.log(`[Analyzer] Retrying in 2 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  throw new Error("AI Analysis failed after multiple attempts.");
}
