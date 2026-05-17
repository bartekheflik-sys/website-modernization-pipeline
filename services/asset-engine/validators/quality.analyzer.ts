export interface QualityReport {
  score: number;
  issues: string[];
  recommended_action: 'preserve' | 'enhance' | 'vectorize' | 'replace' | 'generate';
}

export class QualityAnalyzer {
  analyze(asset: any): QualityReport {
    const issues: string[] = [];
    let score = 100;

    const width = asset.dimensions?.width || 0;
    const height = asset.dimensions?.height || 0;
    const type = asset.asset_type;
    const isCritical = asset.business_critical;

    // 1. Resolution Check
    if (width < 200 || height < 200) {
      score -= 40;
      issues.push('Very low resolution');
    } else if (width < 800 || height < 600) {
      score -= 20;
      issues.push('Medium-low resolution');
    }

    // 2. Aspect Ratio Check (for heroes)
    if (type === 'hero' && width / height < 1.5) {
      score -= 10;
      issues.push('Sub-optimal aspect ratio for hero');
    }

    // 3. SVG preference for icons/logos
    if ((type === 'logo' || type === 'icon') && asset.file_type !== 'svg') {
      score -= 15;
      issues.push('Non-vector format for brand asset');
    }

    // 4. Stock photo check (lower score to encourage replacement if generic)
    if (type === 'stock') {
      score -= 10;
      issues.push('Generic stock imagery');
    }

    // Decision Logic
    let recommended_action: QualityReport['recommended_action'] = 'preserve';

    if (type === 'logo' && asset.file_type !== 'svg') {
      recommended_action = 'vectorize';
    } else if (score < 50) {
      if (isCritical) {
        recommended_action = 'enhance';
      } else {
        recommended_action = 'replace';
      }
    } else if (score < 80 && !isCritical) {
      recommended_action = 'generate';
    }

    return {
      score: Math.max(0, score),
      issues,
      recommended_action
    };
  }
}
