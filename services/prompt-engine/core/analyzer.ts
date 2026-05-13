import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIAnalysisSchema, AIAnalysisOutput } from '../schemas/analysis.schema';

export async function runAIAnalysis(pages: any[]): Promise<AIAnalysisOutput> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const formattedPages = pages.map(p => ({
    url: p.url,
    title: p.title,
    headings: (p.raw_json?.headings || []).slice(0, 10),
    content: (p.content || "").slice(0, 1500),
    images: (p.raw_json?.images || [])
      .map((img: any) => {
        let url = img.url || "";
        if (url && !url.startsWith('http')) {
          try {
            url = new URL(url, p.url).toString();
          } catch {}
        }
        return { ...img, url };
      })
      .filter((img: any) => {
        const url = (img.url || "").toLowerCase();
        // Just take any valid image that isn't a tiny icon/spacer
        return url && typeof url === 'string' && 
               !url.includes('.gif') && 
               !url.includes('spacer') && 
               !url.includes('pixel');
      })
      .slice(0, 40) 
  }));

  const totalImages = formattedPages.reduce((acc, p) => acc + p.images.length, 0);
  console.log(`[Analyzer] Sending ${formattedPages.length} pages and ${totalImages} filtered media assets to Gemini.`);

  const systemPrompt = `
You are an expert Website Analyzer. Your task is to transform raw crawl data into a structured modernization plan.
RULES:
1. Output ONLY valid JSON.
2. NO conversational text.
3. Every field must be grounded in the provided crawl data (especially the 'content' field for specific text/prices).
4. Identify key MEDIA ASSETS (Logos, Products, Team).
    - Preserve the EXACT navigation structure. Do NOT add new pages (e.g., Online Ordering) if they do not exist in the source.
    - lovable_prompt_data.must_include_elements MUST NOT include features that require backend logic (e.g., e-commerce, user accounts, ordering systems) unless explicitly detected in the source.
    - Detect multi-lingual support (e.g., /en/, /hu/, /pl/ etc.).
   - Detect navigation depth and "Back" navigation patterns (breadcrumbs, back arrows).
   - Ensure the modernization plan preserves this language and structural parity.
   - lovalbe_prompt_data.pages_to_generate MUST match content_analysis.pages_detected exactly. DO NOT add new pages.

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
      console.log(`[Analyzer] Attempt ${i + 1}/${attempts}: Sending ${formattedPages.length} pages to Gemini...`);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();
      
      // Clean up JSON if it contains markdown blocks
      if (text.includes('```json')) {
        text = text.split('```json')[1].split('```')[0].trim();
      } else if (text.includes('```')) {
        text = text.split('```')[1].split('```')[0].trim();
      }

      const json = JSON.parse(text);
      const validated = AIAnalysisSchema.parse(json);
      
      // Global Media Asset Normalization
      if (validated.lovable_prompt_data.media_assets) {
        const ma = validated.lovable_prompt_data.media_assets;
        const baseUrl = pages[0]?.url || ""; 
        
        if (ma.logo_url && !ma.logo_url.startsWith('http')) {
          try { ma.logo_url = new URL(ma.logo_url, baseUrl).toString(); } catch {}
        }
        
        const normalizeList = (list: string[] | undefined) => {
          if (!list) return [];
          return list.map((url: string) => {
            if (url && !url.startsWith('http')) {
              try { return new URL(url, baseUrl).toString(); } catch { return url; }
            }
            return url;
          });
        };

        ma.product_images = normalizeList(ma.product_images);
        ma.brand_images = normalizeList(ma.brand_images);
        ma.location_images = normalizeList(ma.location_images);
        ma.team_images = normalizeList(ma.team_images);
      }

      console.log(`[Analyzer] Successfully validated and normalized AI response.`);
      return validated;
    } catch (error: any) {
      console.error(`[Analyzer] Attempt ${i + 1} failed:`, error.message);
      if (i === attempts - 1) throw error;
    }
  }

  throw new Error('Analysis failed after all attempts');
}
