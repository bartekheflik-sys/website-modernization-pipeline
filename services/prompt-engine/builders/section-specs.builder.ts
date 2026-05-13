import { AIAnalysisOutput } from '../schemas/analysis.schema';

export function buildSectionSpecs(analysis: AIAnalysisOutput): string {
  const { lovable_prompt_data, design_direction } = analysis;
  const motionLevel = design_direction.motion_level;

  const animationByLevel = {
    low: 'No animation. Static display.',
    medium: 'Fade-in on scroll (opacity 0→1, translateY 20px→0, 400ms ease-out).',
    high: 'Staggered entrance with spring easing. Children animate in sequence with 80ms delay.'
  };
  const sectionAnimations = animationByLevel[motionLevel];
  const heroAnimation = motionLevel === 'high'
    ? 'Text animates in with spring; image fades in 200ms later.'
    : motionLevel === 'medium' ? 'Gentle fade-in over 600ms.' : 'Static.';

  const pages = lovable_prompt_data.pages_to_generate;
  const sectionsMap = lovable_prompt_data.sections_per_page;
  const valuePropositionSnippet = analysis.value_proposition.slice(0, 80);

  // Build page-specific section specs grounded in Step 3 data
  const pageSectionBlocks = pages.map(page => {
    const pageSections = sectionsMap[page] || [];
    if (pageSections.length === 0) return '';

    const sectionSpecs = pageSections.map((sectionTitle, i) => {
      const isHero = i === 0;
      const isLastSection = i === pageSections.length - 1;
      const titleLower = sectionTitle.toLowerCase();
      const isContact = titleLower.includes('contact') || titleLower.includes('cta') || isLastSection;
      const isServices = titleLower.includes('service') || titleLower.includes('product') || titleLower.includes('feature') || titleLower.includes('solution');

      let layout = '- LAYOUT: Single column, full-width content block';
      let animation = `- ANIMATION: ${sectionAnimations}`;
      let extra = '';

      if (isHero) {
        layout = '- LAYOUT: Split (text left, visual right) on desktop | Stacked on mobile';
        animation = `- ANIMATION: ${heroAnimation}`;
        extra = `- HEADLINE: Benefit-driven — derived from: "${valuePropositionSnippet}..."\n   - CTA BUTTON: High-contrast primary color, action verb (e.g. "Get a Quote", "Contact Us")`;
      } else if (isServices) {
        layout = '- LAYOUT: 3-column card grid (desktop) | 2-column (tablet) | 1-column (mobile)';
        extra = '- EACH CARD: Icon + Title + 2-sentence description + "Learn More" link\n   - HOVER: translateY(-4px) + shadow deepens (200ms ease-out)';
      } else if (isContact) {
        layout = '- LAYOUT: Centered column, max-width 600px, high-contrast background section';
        extra = '- FORM FIELDS: Name, Email, Message, Submit\n   - SUCCESS: Inline success message on submit (no redirect)';
      }

      return `   SECTION ${i + 1}: ${sectionTitle}
   - PURPOSE: ${isHero ? 'Immediate value communication above the fold' : isContact ? 'Convert interest into a lead or inquiry' : 'Inform and build trust toward conversion'}
   ${layout}
   - VISUAL PRIORITY: ${isHero ? 'H1 → Subheadline → CTA → Trust signal' : 'H2 → Body text → Supporting visual or icon'}
   ${animation}${extra ? `\n   ${extra}` : ''}`;
    }).join('\n\n');

    return `=== ${page.toUpperCase()} — SECTION BREAKDOWN ===\n${sectionSpecs}`;
  }).filter(Boolean);

  return `
==================================================
C. SECTION-LEVEL SPECIFICATION
==================================================

UNIVERSAL SECTION RULES:
- Every section must have clear visual separation (padding, background shift, or divider)
- H2 section titles: centered for full-width, left-aligned for content sections
- Each section has ONE purpose — no multi-purpose sections
- Default animation: ${sectionAnimations}

STANDARD SECTION TEMPLATES:

HERO (every page):
- Split layout desktop | Stacked mobile
- Content order: H1 → Subheadline → Primary CTA → Trust signal
- Headline must be benefit-driven, NOT feature-driven
- CTA: Large, high-contrast, action verb

SERVICES/PRODUCTS GRID:
- 3-col desktop | 2-col tablet | 1-col mobile
- Icon + Title + 2-line description + "Learn More" per card
- Hover: translateY(-4px) + shadow

TRUST/ABOUT:
- 60/40 split: text left, visual right
- Include founding year, certifications, key stat
- Trust signals directly below hero

CONTACT/CTA:
- Centered, max-width 600px, brand-color background
- Form: Name + Email + Message + Submit
- Inline success message on submit

FOOTER:
- 4-col desktop | 2-col tablet | 1-col mobile
- Logo + tagline | Nav links | Contact details | Copyright
- Dark background, light text

PAGE-SPECIFIC SECTION SPECS:

${pageSectionBlocks.join('\n\n')}
`.trim();
}
