import { AIAnalysisOutput } from '../schemas/analysis.schema';

export function buildBusinessContext(analysis: AIAnalysisOutput): string {
  return `
==================================================
BUSINESS CONTEXT (DO NOT INVENT — USE ONLY THIS DATA)
==================================================

BUSINESS SUMMARY:
${analysis.business_summary}

INDUSTRY: ${analysis.industry}

TARGET AUDIENCE:
${analysis.target_audience}

BUSINESS MODEL:
${analysis.business_model}

CORE SERVICES (generate pages/sections for ALL of these):
${analysis.core_services.map((s, i) => `${i + 1}. ${s}`).join('\n')}

VALUE PROPOSITION (use this as the hero headline direction):
${analysis.value_proposition}

CONTENT PRESERVATION RULES:
- Do NOT invent services, products, or team members not listed above
- Do NOT fabricate testimonials, case studies, or statistics
- Do NOT change the core business meaning or target audience
- Modernize the STRUCTURE and DESIGN — preserve the CONTENT and INTENT
- All copy must be professional, benefit-driven, and grounded in the business context above
`.trim();
}

export function buildContentRules(analysis: AIAnalysisOutput): string {
  const { content_analysis } = analysis;

  return `
==================================================
H. CONTENT PRESERVATION & STRUCTURE RULES
==================================================

PAGES FOUND IN ORIGINAL SITE:
${content_analysis.pages_detected.map(p => `- ${p}`).join('\n')}

MISSING PAGES TO ADD (build these new):
${content_analysis.missing_pages.map(p => `- ${p}`).join('\n')}

WEAK CONTENT AREAS TO STRENGTHEN:
${content_analysis.weak_content_areas.map(w => `- ${w}`).join('\n')}

NAVIGATION ISSUES TO FIX:
${content_analysis.navigation_issues.map(n => `- ${n}`).join('\n')}

CONTENT RULES:
- Rewrite existing content to be benefit-driven, not feature-driven
- Every page must have a clear purpose statement in the hero
- Replace all generic/weak headlines with action-oriented alternatives
- Add subtext below every H2 section title (1–2 lines explaining the section purpose)
- All body text must be max 3 sentences per paragraph (scannable)
`.trim();
}

export function buildResponsivenessRules(): string {
  return `
==================================================
G. RESPONSIVENESS RULES
==================================================

BREAKPOINTS:
- Mobile: 0–767px (single column, touch-optimized)
- Tablet: 768px–1023px (2-column grids where applicable)
- Desktop: 1024px–1279px (standard multi-column)
- Wide: 1280px+ (max-width container 1280px, centered)

MOBILE-FIRST RULES:
- Write CSS mobile-first (base styles = mobile, use min-width media queries to scale up)
- Navigation: Hamburger menu with slide-in drawer on mobile
- Hero: Stack text above image/visual on mobile
- Cards: Full-width on mobile, 2-column on tablet, 3-column on desktop
- Tables: Horizontal scroll or card-layout reflow on mobile
- Forms: Full-width inputs, large touch targets (min 48px height)
- Font sizes: Slightly smaller on mobile (H1: 2rem mobile, 3.5rem desktop)
- Padding: 24px horizontal on mobile, 48px on tablet, auto (max-width container) on desktop

NAVIGATION RESPONSIVENESS:
- Desktop: Horizontal nav bar with dropdown menus
- Mobile: Hamburger button → full-screen or slide-in side drawer
- Active page: Visually indicated with accent color
- Logo: Always visible, links to home

SECTION STACKING:
- 2-column splits → single column on mobile (text first, visual second)
- 3+ column grids → 1 column on mobile, 2 on tablet
- Sidebar layouts → sidebar moves below content on mobile

IMAGE RESPONSIVENESS:
- All images must use responsive srcset or object-fit: cover
- Hero image: min-height 400px mobile, 600px desktop
- No image should overflow its container at any breakpoint
`.trim();
}

export function buildAssetGuidance(analysis: AIAnalysisOutput): string {
  return `
==================================================
I. IMAGE & ASSET GUIDANCE
==================================================

DESIGN STYLE: ${analysis.lovable_prompt_data.design_style}
ANIMATION STYLE: ${analysis.lovable_prompt_data.animation_style}

HERO IMAGE:
- Use a high-quality, relevant stock photo matching the industry: ${analysis.industry}
- Must convey professionalism, trust, and the value proposition
- Apply a subtle overlay if text is placed over the image (40% dark or brand-color overlay)

IMAGE LAYOUT PATTERNS:
- Hero: Full-width background image OR split-layout (image right, text left)
- Service cards: Square thumbnail (aspect-ratio 1:1) or icon-based (no image needed)
- About section: Team photo or facility/product photo in rounded container
- Testimonials: Small circular avatar (if available) or initial avatar

VISUAL HIERARCHY FOR IMAGES:
- Images support the content — they never compete with text
- All images must have descriptive alt text (generate from context)
- Use consistent aspect ratios within each section (e.g. all service card thumbnails are 16:9)

MUST INCLUDE ELEMENTS:
${analysis.lovable_prompt_data.must_include_elements.map(e => `- ${e}`).join('\n')}
`.trim();
}
