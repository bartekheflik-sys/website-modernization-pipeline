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

AVAILABLE MEDIA ASSETS (USE THESE ORIGINAL PHOTOS):
${lovable_prompt_data.media_assets?.product_images?.length ? `- PRODUCT PHOTOS: ${lovable_prompt_data.media_assets.product_images.join(', ')}` : ''}
${lovable_prompt_data.media_assets?.brand_images?.length ? `- BRAND/FACILITY PHOTOS: ${lovable_prompt_data.media_assets.brand_images.join(', ')}` : ''}
${lovable_prompt_data.media_assets?.location_images?.length ? `- LOCATION PHOTOS: ${lovable_prompt_data.media_assets.location_images.join(', ')}` : ''}
${lovable_prompt_data.media_assets?.logo_url ? `- BRAND LOGO: ${lovable_prompt_data.media_assets.logo_url}` : ''}
${!lovable_prompt_data.media_assets?.product_images?.length && !lovable_prompt_data.media_assets?.brand_images?.length ? '- Use high-quality industry-standard placeholder images for products ONLY IF no assets are listed above.' : ''}

UNIVERSAL SECTION RULES:
- Use original LOGO URL in Footer and Navigation.
- Prioritize using ORIGINAL PRODUCT PHOTOS from the list above in the Services and Product sections.
- If an image from the list matches a service/product by context, use it.

STANDARD SECTION TEMPLATES:

HERO (every page):
- Split layout desktop | Stacked mobile
- Content order: H1 → Subheadline → Primary CTA → Trust signal
- Headline must be benefit-driven, NOT feature-driven
- CTA: Large, high-contrast, action verb
${lovable_prompt_data.media_assets?.brand_images?.[0] ? `- IMAGE: Use "${lovable_prompt_data.media_assets.brand_images[0]}" for the hero visual.` : ''}

SERVICES/PRODUCTS GRID:
- 3-col desktop | 2-col tablet | 1-col mobile
- Icon + Title + 2-line description + "Learn More" per card
- Hover: translateY(-4px) + shadow
- MANDATORY IMAGE: Each card MUST use one of the original photos from the "AVAILABLE MEDIA ASSETS" list above.
- HARD FORBIDDEN: It is strictly forbidden to use generic stock photos or AI-generated placeholders if real industry-specific photos (products, facility, work examples) are listed above. If you use a placeholder when a real URL is available, the generation is considered a failure.

PAGE-SPECIFIC SECTION SPECS:

${pageSectionBlocks.join('\n\n')}
`.trim();
}
