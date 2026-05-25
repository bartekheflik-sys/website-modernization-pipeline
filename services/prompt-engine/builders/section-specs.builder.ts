import { AIAnalysisOutput } from '../schemas/analysis.schema';

function normalize(s: string): string {
  return s.toLowerCase()
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\//g, ' ')
    .replace(/ł/g, 'l')
    .replace(/ó/g, 'o')
    .replace(/ś/g, 's')
    .replace(/ć/g, 'c')
    .replace(/ź/g, 'z')
    .replace(/ż/g, 'z')
    .replace(/ń/g, 'n')
    .replace(/ę/g, 'e')
    .replace(/ą/g, 'a')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasDetectedMatch(pageName: string, detectedPages: string[]): boolean {
  const pageTokens = normalize(pageName).split(' ').filter(t => t.length > 2);
  const detectedNorm = detectedPages.map(d => normalize(d));
  const aliasMap: Record<string, string[]> = {
    home: ['strona', 'homepage', 'glowna', 'main'],
    menu: ['menu'],
    contact: ['kontakt', 'contact'],
    gallery: ['galeria', 'gallery'],
    catering: ['oferta', 'catering'],
    order: ['order', 'zamow', 'delivery'],
    about: ['about', 'historia', 'story'],
  };
  for (const token of pageTokens) {
    if (detectedNorm.some(d => d.includes(token))) return true;
    for (const [key, aliases] of Object.entries(aliasMap)) {
      if (token.includes(key) || key.includes(token)) {
        if (aliases.some(alias => detectedNorm.some(d => d.includes(alias)))) return true;
      }
    }
  }
  return false;
}

export function buildSectionSpecs(analysis: AIAnalysisOutput): string {
  const { lovable_prompt_data, design_direction, content_analysis } = analysis;
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

  const allPages = lovable_prompt_data.pages_to_generate;
  const detectedPages = content_analysis.pages_detected || [];
  const filteredPages = allPages.filter(page => hasDetectedMatch(page, detectedPages));
  const pages = filteredPages.length >= 2 ? filteredPages : allPages;
  const sectionsMap = lovable_prompt_data.sections_per_page;
  const valuePropositionSnippet = analysis.value_proposition.slice(0, 80);

  // Build page-specific section specs grounded in Step 3 data
  const pageSectionBlocks = pages.map(page => {
    // Fuzzy sections lookup: exact match first, then normalized fallback
    const sectionsExact = sectionsMap[page];
    const sectionsNorm = !sectionsExact
      ? Object.entries(sectionsMap).find(([key]) => normalize(key) === normalize(page))?.[1]
      : undefined;
    const pageSections = sectionsExact || sectionsNorm || [];
    if (pageSections.length === 0) return '';

    const sectionSpecs = pageSections.map((sectionTitle, i) => {
      const isHero = i === 0;
      const isLastSection = i === pageSections.length - 1;
      const titleLower = sectionTitle.toLowerCase();
      const isContact = 
        /\bcontact\b/.test(titleLower) || 
        /\bform\b/.test(titleLower) || 
        /\binquiry\b/.test(titleLower) || 
        /\bcta\b/.test(titleLower) ||
        /\bnewsletter\b/.test(titleLower) ||
        /\bsign[\s-]up\b/.test(titleLower) ||
        /\bbooking\b/.test(titleLower) ||
        /\breservation\b/.test(titleLower) ||
        /\border confirmation\b/.test(titleLower) ||
        /\bpayment\b/.test(titleLower) ||
        /\bcheckout\b/.test(titleLower) ||
        /\bcart\b/.test(titleLower) ||
        /\bquote\b/.test(titleLower);
      const isServices = 
        titleLower.includes('service') || 
        titleLower.includes('product') || 
        titleLower.includes('feature') || 
        titleLower.includes('solution') ||
        titleLower.includes('offer') ||
        titleLower.includes('usługa') ||
        titleLower.includes('pricing') ||
        titleLower.includes('package') ||
        titleLower.includes('tier') ||
        titleLower.includes('plan') ||
        titleLower.includes('catalog') ||
        titleLower.includes('portfolio item') ||
        titleLower.includes('project');

      let layout = '- LAYOUT: Single column, full-width content block';
      let animation = `- ANIMATION: ${sectionAnimations}`;
      let extra = '';

      if (isHero) {
        layout = '- LAYOUT: Split (text left, visual right) on desktop | Stacked on mobile';
        animation = `- ANIMATION: ${heroAnimation}`;
        // Industry-aware CTA: never use generic "Get a Quote" for non-service businesses
        const industry = (analysis.industry || '').toLowerCase();
        const type = (analysis.website_type || 'corporate').toLowerCase();
        const isPl = (analysis.detected_language || '').toLowerCase() === 'pl';
        
        let heroCta = isPl ? 'Skontaktuj się z nami' : 'Contact Us';
        
        if (type === 'blog' || type === 'news' || type === 'personal') {
          heroCta = isPl ? 'Czytaj najnowsze posty' : 'Read Latest Posts';
        } else if (type === 'portfolio') {
          heroCta = isPl ? 'Zobacz moje projekty' : 'View My Work';
        } else if (type === 'ecommerce') {
          heroCta = isPl ? 'Kup teraz' : 'Shop Now';
        } else if (type === 'educational') {
          heroCta = isPl ? 'Dowiedz się więcej' : 'Learn More';
        } else if (type === 'landing_page') {
          heroCta = isPl ? 'Zacznij za darmo' : 'Get Started Free';
        } else if (type === 'saas') {
          heroCta = isPl ? 'Zamów demo' : 'Book a Demo';
        } else if (type === 'restaurant' || industry.includes('restaurant') || industry.includes('food') || industry.includes('pizza') || industry.includes('cafe') || industry.includes('bar')) {
          heroCta = isPl ? 'Zobacz menu' : 'View Menu';
        } else if (industry.includes('gym') || industry.includes('fitness') || industry.includes('sport') || industry.includes('wellness') || industry.includes('health')) {
          heroCta = isPl ? 'Zobacz ofertę' : 'See Our Offer';
        } else if (industry.includes('hotel') || industry.includes('hospitality') || industry.includes('accommodation')) {
          heroCta = isPl ? 'Zarezerwuj pobyt' : 'Book a Stay';
        } else if (industry.includes('real estate') || industry.includes('property')) {
          heroCta = isPl ? 'Przeglądaj ogłoszenia' : 'Browse Listings';
        } else if (industry.includes('law') || industry.includes('legal') || industry.includes('consult')) {
          heroCta = isPl ? 'Umów konsultację' : 'Book a Consultation';
        }
        extra = `- HEADLINE: Benefit-driven — derived from: "${valuePropositionSnippet}..."\n   - CTA BUTTON: High-contrast primary color, action verb: "${heroCta}"`;
      } else if (isServices) {
        layout = '- LAYOUT: 3-column card grid (desktop) | 2-column (tablet) | 1-column (mobile)';
        extra = '- EACH CARD: Icon + Title + 2-sentence description + "Learn More" link\n   - HOVER: -translate-y-1 shadow-[var(--shadow-card-hover)] transition-[var(--transition-smooth)]';
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
- NAVBAR LANGUAGE SWITCHER: If the site requires dual-language support, you MUST build a Language Switcher (e.g. EN | PL) inside the Navbar. Do NOT forget the language switcher.
- Prioritize using ORIGINAL PRODUCT PHOTOS from the list above in the Services and Product sections.
- If an image from the list matches a service/product by context, use it.
- THUMBNAIL PRESERVATION RULE FOR ALL LEGACY ASSETS: All original media assets (like product photos, menu photos, case studies, or gallery pictures from the legacy crawled website) are highly compressed and low-resolution. To keep them crisp and professional, you MUST NOT stretch them, scale them up, or use them in large full-width elements, massive hero layouts, or full-width cards! Instead, keep them strictly as elegant, small thumbnails (max-width: 100px - 150px) such as rounded avatar circles, small square thumbnails on lists, or decorative floating badges next to detailed typography—exactly as they were in the original layout! This ensures they look extremely sharp and high-quality, rather than blurred or pixelated.
- MANDATORY DATA VISUALIZATION: For any "ranking", "points", "scores", or "metrics" data, you MUST implement visually engaging data visualizations such as colorful progress bars, dynamic score badges (gold/silver/bronze), or color-coded tiers. Do NOT simply output raw numbers for points.

STANDARD SECTION TEMPLATES:

HERO (every page):
- Full-bleed background layer or Split layout desktop | Stacked mobile
- Content order: H1 → Subheadline → Primary CTA → Trust signal
- Headline must be benefit-driven, NOT feature-driven
- CTA: Large, high-contrast, action verb
- ATMOSPHERIC HERO BACKGROUND: Use the imagegen tool (flux.dev, 1920x1080) to generate a stunning atmospheric background image matching the business/industry context (e.g. cozy rustic kitchen with stone fire glow for a pizzeria, sleek dark abstract gradient for SaaS, warm bright medical workspace for a clinic). Save to src/assets/hero-bg.jpg and import as an ES6 module.
- CRITICAL HERO FALLBACK: You MUST apply a rich CSS gradient fallback on the hero container (e.g., \`bg-gradient-to-br from-primary/20 to-background\`) so the hero is NEVER blank if the image fails. 
- Overlay a glassmorphic container on top using the glass card variant tokens: bg-[hsl(var(--surface)/0.45)] backdrop-blur-[var(--glass-blur)] border-b border-[hsl(var(--glass-border))] — this ensures the foreground text remains text-foreground at full opacity and perfect contrast.
${lovable_prompt_data.media_assets?.brand_images?.[0] ? `- BRAND GRAPHIC: If available, you may feature "${lovable_prompt_data.media_assets.brand_images[0]}" in a small, elegant, decorative circular frame (max-width: 180px) next to the text, but DO NOT use it as the main background, as it will look pixelated.` : ''}

SERVICES/PRODUCTS GRID:
- 3-col desktop | 2-col tablet | 1-col mobile
- Icon + Title + 2-line description + "Learn More" per card
- Hover: -translate-y-1 shadow-[var(--shadow-card-hover)] transition-[var(--transition-smooth)]
- MANDATORY ORIGINAL THUMBNAIL: Each card MUST display its original matching photo as a small, elegant, crisp thumbnail (max-width: 120px) alongside the text layout. DO NOT blow these images up to span the full width of the card.
- HARD FORBIDDEN: It is strictly forbidden to use generic stock photos or AI-generated placeholders if real industry-specific photos (products, facility, work examples) are listed above. If you use a placeholder when a real URL is available, the generation is considered a failure.

PAGE-SPECIFIC SECTION SPECS:

${pageSectionBlocks.join('\n\n')}
`.trim();
}
