import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { supabase } from '../../crawler/storage/supabase';

export type AssetCategory =
  | 'logo' | 'product' | 'menu' | 'hero' | 'team'
  | 'interior' | 'portfolio' | 'background' | 'icon'
  | 'stock' | 'testimonial' | 'gallery';

export interface ClassificationResult {
  category: AssetCategory;
  business_critical: boolean;
  reasoning: string;
}

export class ClassificationEngine {
  private genAI: GoogleGenerativeAI;

  constructor() {
    const key = process.env.GEMINI_API_KEY || '';
    this.genAI = new GoogleGenerativeAI(key);
  }

  async classifyAssetsBatch(assets: any[]): Promise<any[]> {
    if (assets.length === 0) return [];

    const model = this.genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: ({
          type: SchemaType.OBJECT,
          properties: {
            classifications: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  id: { type: SchemaType.NUMBER },
                  category: { type: SchemaType.STRING },
                  business_critical: { type: SchemaType.BOOLEAN },
                  reasoning: { type: SchemaType.STRING }
                },
                required: ["id", "category", "business_critical", "reasoning"]
              }
            }
          },
          required: ["classifications"]
        } as any)
      }
    });

    const assetList = assets.map((a, i) => ({
      id: i,
      url: a.asset_url,
      type: a.asset_type,
      alt: a.alt_text,
      context: a.metadata?.dom_context,
      dims: a.dimensions
    }));

    const prompt = `
      Classify the following ${assets.length} website assets.
      Categories: logo, product, menu, hero, team, interior, portfolio, background, icon, stock, testimonial, gallery.

      ASSETS:
      ${JSON.stringify(assetList, null, 2)}

      Return a JSON array of objects, one for each asset in the SAME ORDER:
      {
        "classifications": [
          {
            "id": number,
            "category": "string",
            "business_critical": boolean,
            "reasoning": "string"
          }
        ]
      }

      CRITICAL RULE: 
      Business-critical is true for logos, products, menus, team photos, and unique business photos.
    `;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();
      const raw = JSON.parse(text);
      return raw.classifications || [];
    } catch (error) {
      console.error(`[Classification] Batch Error:`, error);
      return assets.map((_, i) => ({
        id: i,
        category: 'stock',
        business_critical: false,
        reasoning: 'Batch processing fallback'
      }));
    }
  }

  async processProjectAssets(projectId: string) {
    const { data: assets, error } = await supabase
      .from('website_assets')
      .select('*')
      .eq('project_id', projectId);

    if (error || !assets || assets.length === 0) return;

    console.log(`[Classification] Batching ${assets.length} assets for Project: ${projectId}`);

    // Process in batches of 20 to be safe with prompt size and quota
    const batchSize = 20;
    for (let i = 0; i < assets.length; i += batchSize) {
      const currentBatch = assets.slice(i, i + batchSize);
      const results = await this.classifyAssetsBatch(currentBatch);

      for (let j = 0; j < currentBatch.length; j++) {
        const asset = currentBatch[j];
        const classification = results[j] || { category: 'stock', business_critical: false, reasoning: 'missing' };

        await supabase
          .from('website_assets')
          .update({
            asset_type: classification.category,
            business_critical: classification.business_critical,
            metadata: {
              ...asset.metadata,
              classification_reasoning: classification.reasoning
            }
          })
          .eq('id', asset.id);
      }

      // Delay between batches to stay under 5 RPM
      if (i + batchSize < assets.length) {
        console.log(`[Classification] Waiting 15s to respect RPM quota...`);
        await new Promise(r => setTimeout(r, 15000));
      }
    }
  }
}
