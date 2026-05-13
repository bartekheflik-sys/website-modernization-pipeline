import { AIAnalysisOutput } from '../schemas/analysis.schema';

export function buildPagePlan(analysis: AIAnalysisOutput): string {
  const { lovable_prompt_data } = analysis;
  const pages = lovable_prompt_data.pages_to_generate;
  const sections = lovable_prompt_data.sections_per_page;

  const pageBlocks = pages.map((page, index) => {
    const pageSections = sections[page] || [];
    const isHome = index === 0;
    const sectionList = pageSections.map((s, i) => `   ${i + 1}. ${s}`).join('\n');
    const conversionGoal = lovable_prompt_data.conversion_goals[index % lovable_prompt_data.conversion_goals.length] || 'Drive contact form submissions';

    return `
--- PAGE: ${page.toUpperCase()} ---
PURPOSE: ${isHome ? 'Primary landing page. Communicate value proposition above the fold and drive primary conversion action.' : `Detail page for ${page}. Answer specific user intent and provide clear next steps.`}
LAYOUT: ${isHome ? 'Full-width hero → Service grid → Trust signals → CTA banner → Footer' : 'Compact page hero → Content sections → Internal CTA → Contact block → Footer'}
REQUIRED SECTIONS (IN ORDER):
${sectionList || '   1. Hero\n   2. Content\n   3. CTA'}
CTA PLACEMENT: ${isHome ? 'Primary CTA in hero (above fold) + after services section + final CTA banner before footer' : 'Subtle CTA at top + primary CTA at bottom of content'}
CONVERSION INTENT: ${conversionGoal}
VISUAL HIERARCHY: H1 (most prominent) → H2 (section titles) → body (comfortable reading) → CTAs (high-contrast, unmissable)
`.trim();
  });

  return `
==================================================
B. PAGE-BY-PAGE GENERATION PLAN
==================================================

TOTAL PAGES: ${pages.length}
PAGES: ${pages.join(' | ')}

${pageBlocks.join('\n\n')}
`.trim();
}
