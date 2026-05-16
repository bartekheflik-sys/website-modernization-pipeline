import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIAnalysisSchema, AIAnalysisOutput } from '../schemas/analysis.schema';

export async function runAIAnalysis(pages: any[]): Promise<AIAnalysisOutput> {
  const key = process.env.GEMINI_API_KEY || '';
  console.log(`[Analyzer] DEBUG: Using API Key starting with: ${key.substring(0, 8)}...`);
  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: "application/json",
    }
  });

  const formattedPages = pages.map(p => ({
    url: p.url,
    title: p.title,
    headings: (p.raw_json?.headings || []).slice(0, 5), // Reduced from 10
    content: (p.content || "").slice(0, 1000), // Reduced from 1500
    images: (p.raw_json?.images || [])
      .slice(0, 8) // Reduced from 15
      .map((img: any) => ({
        url: img.url || "",
        alt: img.alt || ""
      }))
  }));

  console.log(`[Analyzer] Sending ${formattedPages.length} pages to Gemini (Strict JSON Mode)...`);

  const systemPrompt = `
You are an expert Website Analyzer. Transform raw crawl data into a structured modernization plan.
Output MUST be a single valid JSON object following the schema below.
Do not include any explanations or markdown blocks.

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
    "must_include_elements": ["string"],
    "media_assets": {
      "logo_url": "string",
      "product_images": ["string"],
      "team_images": ["string"],
      "brand_images": ["string"],
      "location_images": ["string"]
    }
  }
}
`;

  const prompt = `${systemPrompt}\n\nDATA TO ANALYZE:\n${JSON.stringify(formattedPages)}`;

  const attempts = 3;
  for (let i = 0; i < attempts; i++) {
    try {
      console.log(`[Analyzer] Attempt ${i + 1}/${attempts}: Generating Structured Analysis...`);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();
      
      // JSON mode should return clean JSON, but we'll keep a fallback trimmer
      if (text.includes('```json')) text = text.split('```json')[1].split('```')[0].trim();
      else if (text.includes('```')) text = text.split('```')[1].split('```')[0].trim();

      const json = JSON.parse(text);
      const validated = AIAnalysisSchema.parse(json);
      
      // Global Media Asset Normalization with Proxy for Quality
      if (validated.lovable_prompt_data.media_assets) {
        const ma = validated.lovable_prompt_data.media_assets;
        const baseUrl = pages[0]?.url || ""; 
        
        const normalizeUrl = (url: string) => {
          if (!url) return "";
          let absoluteUrl = url;
          if (!url.startsWith('http')) {
            try { absoluteUrl = new URL(url, baseUrl).toString(); } catch { return url; }
          }
          return `https://images.weserv.nl/?url=${encodeURIComponent(absoluteUrl)}&sharp=5`;
        };

        if (ma.logo_url) ma.logo_url = normalizeUrl(ma.logo_url);
        ma.product_images = (ma.product_images || []).map(normalizeUrl);
        ma.brand_images = (ma.brand_images || []).map(normalizeUrl);
        ma.location_images = (ma.location_images || []).map(normalizeUrl);
        ma.team_images = (ma.team_images || []).map(normalizeUrl);
      }

      console.log(`[Analyzer] Successfully validated AI response.`);
      return validated;
    } catch (error: any) {
      console.error(`[Analyzer] Attempt ${i + 1} failed:`, error.message);
      if (i === attempts - 1) throw error;
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  throw new Error('Analysis failed after all attempts');
}
