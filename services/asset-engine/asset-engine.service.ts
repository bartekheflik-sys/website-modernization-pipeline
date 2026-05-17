import { ClassificationEngine } from './classifiers/classification.engine';
import { QualityAnalyzer } from './validators/quality.analyzer';
import { supabase, logPipelineStep } from '../crawler/storage/supabase';

export class AssetEngineService {
  private classifier: ClassificationEngine;
  private analyzer: QualityAnalyzer;

  constructor() {
    this.classifier = new ClassificationEngine();
    this.analyzer = new QualityAnalyzer();
  }

  async processProjectAssets(projectId: string) {
    console.log(`[Asset Engine] Processing assets for Project: ${projectId}`);
    await logPipelineStep(projectId, 'asset_intelligence', 'running', 'Classifying and analyzing website assets');

    try {
      // 1. Classification
      await this.classifier.processProjectAssets(projectId);

      // 2. Quality Analysis & Recommendations
      const { data: assets, error } = await supabase
        .from('website_assets')
        .select('*')
        .eq('project_id', projectId);

      if (error || !assets) throw new Error('Failed to fetch assets for analysis');

      for (const asset of assets) {
        const report = this.analyzer.analyze(asset);
        
        await supabase
          .from('website_assets')
          .update({
            quality_score: report.score,
            recommended_action: report.recommended_action,
            metadata: {
              ...asset.metadata,
              quality_issues: report.issues
            }
          })
          .eq('id', asset.id);
      }

      console.log(`[Asset Engine] Asset intelligence complete for Project: ${projectId}`);
      await logPipelineStep(projectId, 'asset_intelligence', 'success', 'Asset classification and quality analysis complete.');
      
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('[Asset Engine] Error:', msg);
      await logPipelineStep(projectId, 'asset_intelligence', 'failed', msg);
    }
  }
}

export const assetEngine = new AssetEngineService();
