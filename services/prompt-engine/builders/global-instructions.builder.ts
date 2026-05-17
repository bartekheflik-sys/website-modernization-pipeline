import { AIAnalysisOutput } from '../schemas/analysis.schema';

export function buildGlobalInstructions(analysis: AIAnalysisOutput, assets: any[] = []): string {
  const { design_direction, ux_analysis } = analysis;
  const motionLevel = design_direction.motion_level;

  // Extract primary logo from classified assets or AI-detected media
  const logoAsset = assets.find((a: any) => a.category === 'logo' || a.category === 'Logo');
  const primaryLogo = logoAsset?.url 
    || analysis.lovable_prompt_data?.media_assets?.logo_url 
    || null;

  const motionDescriptions = {
    low: 'Use minimal, functional animations only. Subtle fade-ins for content loading. No scroll-triggered effects. Clean, fast static transitions.',
    medium: 'Use tasteful scroll-triggered fade-ins, smooth section transitions (300–500ms ease-out), gentle hover scale effects (1.02), and micro-interactions on buttons. No flashy or disruptive effects.',
    high: 'Use rich motion design: parallax hero sections, staggered list animations, smooth page transitions, morphing shapes, animated counters, advanced hover effects (lift + glow), and fluid scroll-triggered reveals.'
  };

  return `
==================================================
A. GLOBAL WEBSITE INSTRUCTIONS
==================================================

DESIGN LANGUAGE:
${design_direction.ui_direction}

BRAND STYLE: ${design_direction.brand_style}

STRICT MEDIA HANDLING & THUMBNAIL CONSTRAINTS (MANDATORY FOR ALL BUSINESS TYPES):
- LOGO: ${primaryLogo ? `Use this EXACT URL for the logo: ${primaryLogo}. DO NOT use a placeholder or a generic icon. It is mandatory for the navigation and footer.` : 'Locate and use the original brand logo from the site data. If not found, use a high-end minimalist text-logo, but prioritize real assets.'}
- THUMBNAIL PRESERVATION RULE FOR LEGACY ASSETS: All original media assets (like product photos, menu photos, case studies, or gallery pictures from the legacy crawled website) are highly compressed and low-resolution. To keep them crisp and professional, you MUST NOT stretch them, scale them up, or use them in large full-width elements, massive hero layouts, or full-width cards! Instead, keep them strictly as elegant, small thumbnails (max-width: 100px - 150px) such as rounded avatar circles, small square thumbnails on lists, or decorative floating badges next to detailed typography—exactly as they were in the original layout! This ensures they look extremely sharp and high-quality, rather than blurred or pixelated.
- HIGH-RESOLUTION THEMATIC BACKGROUNDS: Since legacy assets must not be scaled up, you MUST generate beautiful, high-resolution, atmospheric background images or structural abstract visual backgrounds directly in the UI matching the industry type (e.g., abstract gradients for SaaS, premium medical graphics for a dentist, cozy rustic restaurant kitchen/oven atmosphere for a restaurant, corporate architecture for law firms). Apply a soft dark glassmorphic overlay ('backdrop-filter: blur(8px)') over these backgrounds to guarantee premium contrast and readable typography.

MODERNITY LEVEL:
Build a state-of-the-art modern website, NOT a template. The output must feel premium, high-end, and polished. Every section must have intentional spacing, clear visual hierarchy, and professional typography.

MOTION SYSTEM (Level: ${motionLevel.toUpperCase()}):
${motionDescriptions[motionLevel]}

SPACING PHILOSOPHY:
Use generous padding and breathing room. Minimum 80px vertical padding per section on desktop. Content should never feel cramped or text-heavy without visual relief.

RESPONSIVENESS REQUIREMENTS:
- Mobile-first development approach
- Full mobile breakpoint: 100% viewport width, single column layout
- Tablet (768px–1024px): 2-column grid where applicable
- Desktop (1280px+): Full multi-column layouts as designed
- Navigation must collapse to hamburger menu on mobile
- All CTAs must remain visible and tappable on mobile (min 44px touch target)
- No horizontal overflow at any breakpoint

ACCESSIBILITY:
- Semantic HTML5 elements (nav, main, section, article, footer)
- All images must have alt attributes
- Color contrast must meet WCAG AA standards
- Focus states must be visible for keyboard navigation

QUALITY GATE:
Every section must be production-ready. No placeholder content. No "Lorem ipsum". Use industry-appropriate copy derived from the business context below.

STRUCTURAL FIDELITY & NAVIGATION:
- BREADCRUMBS & BACK NAVIGATION: Every sub-page (non-home) must include clear back-navigation (Breadcrumbs or a "Back to [Parent]" arrow/link) near the top of the page.
- LANGUAGE CONSISTENCY: Maintain the exact multi-language structure if detected in the original (e.g. including a Language Switcher in the nav if /en/ or /hu/ paths were present).
- NAVIGATION DEPTH: Mirror the original site's depth. If it was a deep multi-page site, do not flatten it into a single-page layout unless specifically instructed.
`.trim();
}
