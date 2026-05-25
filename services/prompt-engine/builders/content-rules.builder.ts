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

export function buildContentRules(analysis: AIAnalysisOutput, pages: any[] = []): string {
  const { content_analysis } = analysis;

  return `
==================================================
H. CONTENT PRESERVATION & STRUCTURE RULES
==================================================

PAGES FOUND IN ORIGINAL SITE:
${content_analysis.pages_detected.map(p => `- ${p}`).join('\n')}

STRICT NAVIGATION LOCK (HIGHEST PRIORITY):
- The navigation structure MUST be an EXACT 1:1 match of the original site's detected pages above.
- Do NOT add new pages like 'About Us', 'Online Order', or 'Reviews' unless they were detected in the original site.
- You MAY add NEW SECTIONS within existing pages, but do NOT create new top-level routes.

DETECTED GAPS (add as SECTIONS within existing pages, NOT as new top-level pages):
${content_analysis.missing_pages.map(p => `- Consider adding "${p}" as a section within the most relevant existing page`).join('\n')}

WEAK CONTENT AREAS TO STRENGTHEN:
${content_analysis.weak_content_areas.map(w => `- ${w}`).join('\n')}

NAVIGATION ISSUES TO FIX:
${content_analysis.navigation_issues.map(n => `- ${n}`).join('\n')}

CONTENT RULES (CRITICAL — STRICT ZERO-HALLUCINATION ENFORCEMENT):
- ⛔ STRICT ZERO-HALLUCINATION POLICY: Under no circumstances are you allowed to invent, simulate, or fabricate any facts, details, or assets. You MUST render ONLY authentic data found in the original crawled content.
- 100% VERBATIM TEXT CONTENT: You MUST use the EXACT text content from the original crawled pages provided in the 'VERBATIM ORIGINAL CONTENT' section below for EVERY page. DO NOT invent, summarize, or hallucinate new text! If the original page has a paragraph, your generated page MUST have that exact same paragraph.
- STRICT PHOTO MATCHING FOR ALL SECTIONS: Every single photo placed on the website MUST contextually match the text it is next to. If a section is about a specific service or product (e.g. "Marantz 2230" or "Wzmacniacze"), you MUST use the exact matching photo from the manifest. DO NOT randomly assign photos to unrelated topics!
- NO FAKE PRODUCTS OR SERVICES: Do NOT invent products, prices, services, or food menu items. Render ONLY the authentic products/services found in the original crawled content.
- NO FAKE CONTACT DETAILS: Do NOT fabricate phone numbers, physical addresses, email addresses, opening hours, or social media links. If these details are not provided in the legacy content, you MUST omit the corresponding UI fields entirely or render a clearly-labeled, empty configuration placeholder (e.g., "[Configure Phone Number]"). Never use realistic-looking mock data (such as "+48 123 456 789" or "test@example.com").
- NO FAKE ROLES OR TEAM MEMBERS: Do NOT invent fictional team members, bios, board members, or executive roles. If there is no team page/data in the legacy content, you MUST NOT generate a simulated "Our Team" section.
- NO FAKE TESTIMONIALS & STATS: Do NOT write fictional client reviews, simulated customer ratings, fake customer names, or invented success metrics (e.g., "10,000+ Happy Customers" or "5 Stars on Google").
- NO NEW TOP-LEVEL PAGES: Strictly respect the original navigation structure.
- NO E-COMMERCE CTAS: Do NOT add generic CTAs like "Zamów", "Buy Now", or "Add to Cart" unless the original site explicitly had an online ordering system. Do NOT add shopping carts.
- HIGH CONTRAST HEADINGS: You MUST use pure white (#FFFFFF) text for all headings and links that are placed on dark backgrounds or dark navbars. Do not use dark brown or black text on dark backgrounds!
- Every page must have a clear purpose statement in the hero.
- All body text must be max 3 sentences per paragraph (scannable).

VERBATIM ORIGINAL CONTENT TO PRESERVE (USE EXACTLY THIS TEXT FOR PAGES):
${(() => {
  const MAX_TOTAL_CHARS = 600000; // Overall Lovable prompt limit buffer
  let currentTotal = 0;
  
  return pages.map(p => {
    const fullText = p.markdown_content || p.raw_json?.content || '';
    
    // Increased limit to 80,000 chars — long technical/blog articles must NOT be truncated mid-sentence
    const CONTENT_LIMIT = 80000;
    
    // Determine how many characters we can afford to include
    const allowedLength = Math.min(CONTENT_LIMIT, MAX_TOTAL_CHARS - currentTotal);
    
    if (allowedLength <= 0) {
      console.warn(`[Content Rules] Warning: Context limit reached. Skipping verbatim content for ${p.url || p.title}.`);
      return ''; 
    }

    if (fullText.length > allowedLength) {
      console.warn(`[Content Rules] Warning: Page ${p.url || p.title} content truncated from ${fullText.length} to ${allowedLength} characters.`);
    }
    
    const text = fullText.substring(0, allowedLength);
    currentTotal += text.length;
    
    return `PAGE [${p.url || p.title}]:\n${text}`;
  }).filter(Boolean).join('\n\n');
})()}
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

export function buildAssetGuidance(analysis: AIAnalysisOutput, assets: any[] = []): string {
  const logos = assets.filter(a => a.asset_type === 'logo');
  const criticalAssets = assets.filter(a => a.business_critical && a.asset_type !== 'logo');
  const decorativeAssets = assets.filter(a => !a.business_critical);

  // Helper to match the local drag-and-drop descriptive name
  const getDescriptiveName = (asset: any): string => {
    const urlLower = (asset.asset_url || '').toLowerCase();
    const altLower = (asset.alt_text || '').toLowerCase();
    const ext = asset.asset_url.split('.').pop()?.split('?')[0] || 'jpg';

    if (urlLower.includes('logo') || altLower.includes('logo')) {
      return `logo.${ext}`;
    }
    if (urlLower.includes('/pizza') || altLower.includes('pizza') && !urlLower.includes('portofinopizza.pl')) {
      return `pizza.${ext}`;
    }
    if (urlLower.includes('/pasta') || urlLower.includes('/makaron') || altLower.includes('pasta') || altLower.includes('makaron')) {
      return `pasta.${ext}`;
    }
    if (urlLower.includes('/przystawki') || urlLower.includes('/salat') || altLower.includes('przystawki') || altLower.includes('sałat')) {
      return `przystawki_i_salatki.${ext}`;
    }
    if (urlLower.includes('/bagiet') || altLower.includes('bagiet')) {
      return `bagietki.${ext}`;
    }
    if (urlLower.includes('/dania') || urlLower.includes('/zapiekank') || altLower.includes('zapiekank')) {
      return `zapiekanki.${ext}`;
    }
    if (urlLower.includes('/deser') || urlLower.includes('/napoj') || altLower.includes('deser') || altLower.includes('napój') || urlLower.includes('napoje')) {
      return `desery_i_napoje.${ext}`;
    }
    if (urlLower.includes('banner') || urlLower.includes('homepage') || urlLower.includes('hero') || urlLower.includes('layout')) {
      return `hero_visual.${ext}`;
    }
    if (urlLower.includes('restauracja') || urlLower.includes('interior') || altLower.includes('restauracja') || altLower.includes('interior')) {
      return `interior_restaurant.${ext}`;
    }
    const rawName = asset.asset_url.split('/').pop()?.split('?')[0] || 'asset';
    return rawName.toLowerCase();
  };

  // Determine primary logo
  const primaryLogo = logos.length > 0 ? logos[0].asset_url : (analysis.lovable_prompt_data.media_assets?.logo_url || '');

  return `
==================================================
I. ASSET INTELLIGENCE & USAGE RULES
==================================================

DESIGN STYLE: ${analysis.lovable_prompt_data.design_style}
ANIMATION STYLE: ${analysis.lovable_prompt_data.animation_style}

PRIMARY BRAND ASSETS (NON-NEGOTIABLE):
- LOGO (VECTORIZE): ${primaryLogo ? primaryLogo : 'Generate high-end typographic logo.'}
${logos.length > 0 ? `  - Instruction: This is the authentic brand logo. Use it in Nav and Footer. If it is a bitmap (PNG/JPG), vectorize it to SVG.` : ''}

AUTHENTIC BUSINESS MEDIA (PRESERVE & ENHANCE):
- These assets are REAL business assets. Preserve them at all costs.
- Do NOT replace them with stock imagery or AI generations.
${criticalAssets.map(a => {
    let instruction = 'Preserve authenticity.';
    if (a.asset_type === 'product') instruction = 'Enhance quality, maintain dish authenticity. Render strictly as a small, crisp list/card thumbnail (max-width 120px) next to the text category.';
    if (a.asset_type === 'team') instruction = 'Preserve real faces, sharpen and clean up artifacts.';
    if (a.asset_type === 'interior') instruction = 'Show real atmosphere, optimize lighting/contrast.';

    const localName = getDescriptiveName(a);
    return `- ${a.asset_type.toUpperCase()} (Locally uploaded as '${localName}'): ${a.asset_url}
  - Context: ${a.alt_text || 'Business asset'}
  - Strategy: ${instruction}`;
  }).join('\n')}

DECORATIVE & REPLACEMENT ASSETS (AI-ENHANCE OR REPLACE):
- The following assets are peripheral. You may REPLACE them with high-fidelity stock or AI-generated versions that match the brand aesthetic:
${decorativeAssets.slice(0, 8).map(a => `- ${a.asset_type.toUpperCase()}: ${a.asset_url}`).join('\n')}

STRICT AUTHENTICITY GUARDRAIL:
- NEVER generate fake people for "Team" sections.
- NEVER generate fake food for "Menu" sections.
- NEVER generate fake projects for "Portfolio" sections.
- Use only the provided asset URLs for these categories.
`.trim();
}
