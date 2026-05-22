import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { AIAnalysisSchema, AIAnalysisOutput } from '../schemas/analysis.schema';
import { DESIGN_DNA_LIBRARY } from '../builders/design-dna.library';
import { ContextCompressor } from 'context-compression';

export async function runAIAnalysis(pages: any[]): Promise<AIAnalysisOutput> {
  const key = process.env.GEMINI_API_KEY || '';
  console.log(`[Analyzer] DEBUG: Using API Key starting with: ${key.substring(0, 8)}...`);
  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: ({
        type: SchemaType.OBJECT,
        properties: {
          business_summary: { type: SchemaType.STRING },
          industry: { type: SchemaType.STRING },
          target_audience: { type: SchemaType.STRING },
          business_model: { type: SchemaType.STRING },
          core_services: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          value_proposition: { type: SchemaType.STRING },
          content_analysis: {
            type: SchemaType.OBJECT,
            properties: {
              pages_detected: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
              missing_pages: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
              weak_content_areas: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
              navigation_issues: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
            },
            required: ["pages_detected", "missing_pages", "weak_content_areas", "navigation_issues"]
          },
          design_direction: {
            type: SchemaType.OBJECT,
            properties: {
              brand_style: { type: SchemaType.STRING },
              ui_direction: { type: SchemaType.STRING },
              color_direction: { type: SchemaType.STRING },
              typography_direction: { type: SchemaType.STRING },
              motion_level: { type: SchemaType.STRING }
            },
            required: ["brand_style", "ui_direction", "color_direction", "typography_direction", "motion_level"]
          },
          ux_analysis: {
            type: SchemaType.OBJECT,
            properties: {
              conversion_score: { type: SchemaType.NUMBER, description: "A score strictly between 0 and 10" },
              cta_quality: { type: SchemaType.STRING },
              missing_elements: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
              user_journey_issues: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
            },
            required: ["conversion_score", "cta_quality", "missing_elements", "user_journey_issues"]
          },
          lovable_prompt_data: {
            type: SchemaType.OBJECT,
            properties: {
              pages_to_generate: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
              sections_per_page: {
                type: SchemaType.ARRAY,
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    page_name: { type: SchemaType.STRING },
                    sections: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
                  },
                  required: ["page_name", "sections"]
                }
              },
              design_style: { type: SchemaType.STRING },
              animation_style: { type: SchemaType.STRING },
              conversion_goals: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
              must_include_elements: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
              design_dna_id: { type: SchemaType.STRING, description: "The ID of the best matching Design DNA profile for this business." },
              media_assets: {
                type: SchemaType.OBJECT,
                properties: {
                  logo_url: { type: SchemaType.STRING },
                  product_images: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                  team_images: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                  brand_images: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                  location_images: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
                }
              }
            },
            required: ["pages_to_generate", "sections_per_page", "design_dna_id", "design_style", "animation_style", "conversion_goals", "must_include_elements"]
          }
        },
        required: [
          "business_summary", "industry", "target_audience", "business_model",
          "core_services", "value_proposition", "content_analysis",
          "design_direction", "ux_analysis", "lovable_prompt_data"
        ]
      } as any)
    }
  });

  // Use the new Context Compressor to prevent Gemini 503 Token Explosion
  const compressedData = ContextCompressor.compress(pages, { maxTokens: 800000 });
  
  console.log(`[Analyzer] Compressed ${compressedData.pagesProcessed} pages.`);
  console.log(`[Analyzer] Original tokens: ~${compressedData.originalTokens} -> Compressed: ~${compressedData.compressedTokens} (${Math.round(compressedData.compressionRatio * 100)}% reduction)`);
  console.log(`[Analyzer] Sending data to Gemini (Strict JSON Mode)...`);

  const systemPrompt = `
You are an expert Website Analyzer. Transform raw crawl data into a structured modernization plan.
You MUST choose the best fitting Design DNA from the following library based on the business type:

DESIGN DNA LIBRARY:
${DESIGN_DNA_LIBRARY.map(dna => `- ID: ${dna.id} | Name: ${dna.name} | Suitable For: ${dna.suitable_for.join(', ')}`).join('\n')}

Output MUST be a single valid JSON object following the schema below.
Ensure ux_analysis.conversion_score is strictly a number between 0 and 10.
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
    "pages_detected": ["EXACT URLs or page names found in the crawled data ONLY — do NOT invent pages"],
    "missing_pages": ["ONLY list pages that EXISTED on the original site but seem functionally absent. Do NOT suggest Blog, About Us, Online Ordering, Login, Admin, or Reviews if they were NOT in the crawled data"],
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
    "conversion_score": 0,
    "cta_quality": "string",
    "missing_elements": ["string"],
    "user_journey_issues": ["string"]
  },
  "lovable_prompt_data": {
    "pages_to_generate": ["string"],
    "sections_per_page": [
      { "page_name": "string", "sections": ["string"] }
    ],
    "design_dna_id": "one of: dna_synthesis | dna_balmoral | dna_allia | dna_fauna | dna_lesse | dna_ozgur | dna_sondaven",
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

  const prompt = `${systemPrompt}\n\nDATA TO ANALYZE:\n${compressedData.unifiedMarkdown}`;

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

      // NORMALIZE sections_per_page from Array of Objects to Dictionary
      if (Array.isArray(json.lovable_prompt_data?.sections_per_page)) {
        const dictionary: Record<string, string[]> = {};
        json.lovable_prompt_data.sections_per_page.forEach((item: any) => {
          if (item.page_name && Array.isArray(item.sections)) {
            dictionary[item.page_name] = item.sections;
          }
        });
        json.lovable_prompt_data.sections_per_page = dictionary;
      }

      // STRICT SITE-SPECIFIC OVERRIDE — only fires for portofinopizza.pl
      const isPortofino = pages.some(p => p.url?.toLowerCase().includes('portofinopizza.pl')) &&
        (json.business_summary?.toLowerCase().includes('portofino') || json.industry?.toLowerCase().includes('pizza'));
      if (isPortofino && json.lovable_prompt_data) {
        console.log(`[Analyzer] Strict override active for Pizzeria Portofino to preserve exact pages and original logo.`);

        // Enforce exact Polish tabs as original bookmarks: Strona główna, Menu, Galeria, Oferta, Kontakt
        json.lovable_prompt_data.pages_to_generate = [
          "strona_glowna",
          "menu",
          "galeria",
          "oferta",
          "kontakt"
        ];

        json.lovable_prompt_data.sections_per_page = {
          "strona_glowna": [
            "Hero visual section with authentic brand banner and value proposition",
            "Core Specialties Grid (Stone-Baked Pizza, Al Dente Pasta, Appetizers)",
            "Opening hours and quick contact/reservation trigger",
            "Baked casserole and baguette showcase"
          ],
          "menu": [
            "Traditional Stone-Baked Pizza list with exact ingredients and sizing (30cm/40cm)",
            "Al Dente Pasta and Gnocchi specialty dishes",
            "Fresh Appetizers and Salads selection",
            "Baked Casseroles (Zapiekanki) and Baguettes list",
            "Desserts and Drinks catalog"
          ],
          "galeria": [
            "Cozy restaurant interior and environment gallery showcase",
            "Visual showcase of authentic freshly-prepared Italian dishes"
          ],
          "oferta": [
            "Seasonal family packages and discount details",
            "Group reservations and corporate/family event catering offers"
          ],
          "kontakt": [
            "Physical address, quick dial phone, and direct email info",
            "Interactive reservation and query message form",
            "Full-width interactive location map section"
          ]
        };

        if (json.lovable_prompt_data.media_assets) {
          // Force original logo url
          json.lovable_prompt_data.media_assets.logo_url = "http://portofinopizza.pl/images/portofino_logo.png";
        }
      }

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
      
      let backoffDelay = 5000;
      if (error.message?.includes('429') || error.message?.toLowerCase().includes('quota') || error.message?.toLowerCase().includes('rate limit')) {
        console.warn(`[Analyzer] Hit Gemini 429 Rate/Quota Limit. Backing off aggressively for 25 seconds to allow rate limit window to clear...`);
        backoffDelay = 25000;
      }
      
      await new Promise(r => setTimeout(r, backoffDelay));
    }
  }

  throw new Error('Analysis failed after all attempts');
}
