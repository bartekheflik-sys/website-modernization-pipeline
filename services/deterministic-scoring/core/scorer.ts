export interface OriginalMetrics {
  total_pages: number;
  total_services: number;
  total_ctas: number;
  has_contact_form: boolean;
  has_trust_badges: boolean;
  total_sections: number;
}

export interface GeneratedMetrics {
  total_pages: number;
  total_services: number;
  total_ctas: number;
  has_contact_form: boolean;
  has_trust_badges: boolean;
  total_sections: number;
  is_mobile_responsive: boolean;
}

export interface DeterministicScore {
  pageCoverageScore: number;
  servicePreservationScore: number;
  ctaPreservationScore: number;
  formPresenceScore: number;
  trustPresenceScore: number;
  sectionParityScore: number;
  mobileStructureScore: number;
  overallScore: number;
}

export class DeterministicScorer {
  /**
   * Calculates a hard math-based score rather than relying on AI subjective estimation.
   */
  static calculateScore(original: OriginalMetrics, generated: GeneratedMetrics): DeterministicScore {
    
    // 1. Page Coverage % (Max 100%)
    const pageCoverageScore = original.total_pages > 0 
      ? Math.min(100, Math.round((generated.total_pages / original.total_pages) * 100))
      : 100;

    // 2. Service Preservation %
    const servicePreservationScore = original.total_services > 0
      ? Math.min(100, Math.round((generated.total_services / original.total_services) * 100))
      : 100;

    // 3. CTA Preservation %
    const ctaPreservationScore = original.total_ctas > 0
      ? Math.min(100, Math.round((generated.total_ctas / original.total_ctas) * 100))
      : 100;

    // 4. Form Presence (Boolean -> 0 or 100)
    const formPresenceScore = (!original.has_contact_form || generated.has_contact_form) ? 100 : 0;

    // 5. Trust Presence (Boolean -> 0 or 100)
    const trustPresenceScore = (!original.has_trust_badges || generated.has_trust_badges) ? 100 : 0;

    // 6. Section Parity %
    const sectionParityScore = original.total_sections > 0
      ? Math.min(100, Math.round((generated.total_sections / original.total_sections) * 100))
      : 100;

    // 7. Mobile Structure Completeness (100 if true, 0 if false)
    const mobileStructureScore = generated.is_mobile_responsive ? 100 : 0;

    // Calculate weighted overall score
    const overallScore = Math.round(
      (pageCoverageScore * 0.20) +
      (servicePreservationScore * 0.25) +
      (ctaPreservationScore * 0.15) +
      (formPresenceScore * 0.10) +
      (trustPresenceScore * 0.05) +
      (sectionParityScore * 0.15) +
      (mobileStructureScore * 0.10)
    );

    return {
      pageCoverageScore,
      servicePreservationScore,
      ctaPreservationScore,
      formPresenceScore,
      trustPresenceScore,
      sectionParityScore,
      mobileStructureScore,
      overallScore
    };
  }

  /**
   * Generates automated objective commentary based on mathematical score deficits.
   */
  static generateObjectiveCommentary(scores: DeterministicScore): string[] {
    const comments: string[] = [];
    
    if (scores.pageCoverageScore < 100) {
      comments.push(`[CRITICAL DEVIATION] Page coverage is ${scores.pageCoverageScore}%. Original routes were dropped.`);
    }
    if (scores.servicePreservationScore < 100) {
      comments.push(`[BUSINESS RISK] Service preservation is ${scores.servicePreservationScore}%. Core offerings are missing from the generated site.`);
    }
    if (scores.formPresenceScore === 0) {
      comments.push(`[CONVERSION LOSS] Original site had a contact form, but it is missing in the new build.`);
    }
    
    return comments;
  }
}
