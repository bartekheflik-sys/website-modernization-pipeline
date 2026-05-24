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

⚙️ LOVABLE DESIGN SYSTEM SETUP (DO THIS FIRST — BEFORE WRITING ANY COMPONENT):
You MUST define the entire visual identity as CSS custom properties in index.css and register them in tailwind.config.ts BEFORE writing any component. Every color, gradient, shadow, and animation must be a named token. Never use hardcoded hex values, rgba() literals, or inline style overrides in components.

STEP 1 — Define tokens in index.css:
:root {
  /* Brand colors — derived from: ${design_direction.color_direction} */
  --primary: [choose HSL values for main brand action color];
  --primary-glow: [lighter variant of primary, for glows];
  --background: [deep dark or near-white HSL for page background];
  --surface: [subtle contrast from background, for cards/panels];
  --border: [low-opacity separator HSL];
  --foreground: [main text — must be high contrast against --background];
  --muted-foreground: [60-70% opacity text for captions/metadata];

  /* Gradients */
  --gradient-hero: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)));
  --gradient-subtle: linear-gradient(180deg, hsl(var(--background)), hsl(var(--surface)));

  /* Glassmorphism */
  --glass-bg: hsl(var(--surface) / 0.4);
  --glass-border: hsl(var(--foreground) / 0.08);
  --glass-blur: blur(16px);

  /* Shadows */
  --shadow-card: 0 2px 12px hsl(var(--primary) / 0.07);
  --shadow-card-hover: 0 8px 32px hsl(var(--primary) / 0.18);
  --shadow-nav: 0 1px 16px hsl(var(--background) / 0.12);

  /* Transitions */
  --transition-smooth: all 0.2s ease-out;
  --transition-spring: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

STEP 2 — Register tokens in tailwind.config.ts so they are available as Tailwind classes (e.g. bg-background, text-foreground, border-border, shadow-card).

STEP 3 — NEVER write ad-hoc Tailwind classes like text-white, bg-black, or text-gray-100 in component className props. Always use the semantic tokens: text-foreground, bg-background, bg-surface, border-border, etc.

STRICT MEDIA HANDLING & THUMBNAIL CONSTRAINTS (MANDATORY FOR ALL BUSINESS TYPES):
- LOGO: ${primaryLogo ? `You MUST display this EXACT URL for the brand logo inside the Navbar: ${primaryLogo}. Use an \`<img />\` tag. DO NOT use a text placeholder or generic Lucide icon for the brand name. This is a strict requirement.` : 'There is no graphic logo image on the legacy website. You MUST generate a brand-new custom logo emblem using elegant, custom SVG shapes, and pair it with premium brand typography.'}
- THUMBNAIL PRESERVATION RULE FOR LEGACY ASSETS: All original media assets (like product photos, menu photos, case studies, or gallery pictures from the legacy crawled website) are highly compressed and low-resolution. To keep them crisp and professional, you MUST NOT stretch them, scale them up, or use them in large full-width elements, massive hero layouts, or full-width cards! Instead, keep them strictly as elegant, small thumbnails (max-width: 100px - 150px) such as rounded avatar circles, small square thumbnails on lists, or decorative floating badges next to detailed typography—exactly as they were in the original layout! This ensures they look extremely sharp and high-quality, rather than blurred or pixelated.
- HIGH-RESOLUTION THEMATIC BACKGROUNDS: Since legacy assets must not be scaled up, use the imagegen tool to generate a beautiful, atmospheric background image matching the business/industry type (e.g., cozy rustic restaurant kitchen with stone oven glow for a pizzeria, abstract dark gradients for SaaS, warm medical workspace for a clinic). Apply a glassmorphic overlay using the --glass-bg and --glass-blur tokens over the generated image to guarantee premium contrast.

MODERNITY LEVEL:
Build a state-of-the-art modern website, NOT a template. The output must feel premium, high-end, and polished. Every section must have intentional spacing, clear visual hierarchy, and professional typography.

==================================================
🌟 CRITICAL: VISUAL EXPERIENCE & STORYTELLING 🌟
==================================================
(INDUSTRY-ADAPTED: ${analysis.industry})
- YOU MUST NOT BUILD A BORING, FLAT TEMPLATE. You MUST build an IMMERSIVE, NARRATIVE-DRIVEN JOURNEY tailored specifically for a ${analysis.industry} business!

THE CORE PRINCIPLES OF MODERN CINEMATIC UI (MANDATORY EXECUTION):

1. MOTION SHOULD EXPLAIN, NOT DECORATE
Bad motion: random floating, every element fades/slides, animations competing everywhere.
Premium motion: guides attention, reveals hierarchy, transitions state, supports storytelling.
Examples to implement:
- text fades as next section enters
- cards tilt slightly on hover
- objects react to scroll depth
- background moves slower than foreground
- scene transitions feel continuous
Think: camera movement, choreography, pacing. Not: “add animation to everything.”

2. DEPTH IS THE SECRET
The best modern sites feel like layered space.
You MUST use: blurred backgrounds, translucent surfaces, gradient fog, shadow depth, perspective transforms, scale differences, parallax layers, and z-axis movement.
This creates immersion, premium feel, and “3D without actual 3D”.

3. SPACING IS WHAT MAKES MOTION FEEL EXPENSIVE
Most people ruin immersive UI because everything is too close together, sections are cramped, and typography lacks breathing room.
Premium sites often use: huge vertical spacing, oversized headings, minimal text blocks, isolated focal points. The animation then has room to breathe.

4. STORYTELLING > SECTIONS
Average websites: Hero, Features, Pricing, FAQ.
Cinematic websites: Scene 1, Reveal, Transition, Emotional shift, Depth moment, Interactive section, Climax, CTA.
You’re building an experience, not a page. Section-to-section transitions MUST feel like turning the page of an ultra-premium magazine.

MOTION SYSTEM (Level: ${motionLevel.toUpperCase()}):
${motionDescriptions[motionLevel]}

SPACING PHILOSOPHY:
Use generous padding and breathing room. Minimum 80px vertical padding per section on desktop. Content should never feel cramped or text-heavy without visual relief. Use the 8px base grid: spacers 8 / 16 / 24 / 32 / 48 / 64 / 80 / 96 / 128px.

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
- All images must have descriptive alt attributes
- Color contrast must meet WCAG AA standards — use foreground/background token pairings
- Focus states must be visible for keyboard navigation

QUALITY GATE & ZERO-HALLUCINATION GUARD:
- ⛔ STRICT ZERO-HALLUCINATION RULE: Under no circumstances are you allowed to invent, simulate, or fabricate any facts, details, or assets. You MUST render ONLY the authentic products, services, bios, prices, phone numbers, addresses, and content found in the original crawled pages.
- If specific details (e.g. phone or address) are not provided in the legacy content, you MUST omit those fields or use a clearly-labeled empty placeholder (e.g., "[Configure Contact Details]"), never a realistic mock value.
- Every section must be production-ready. No placeholder content.
- NAVIGATION DEPTH: Mirror the original site's depth. If it was a deep multi-page site, do not flatten it into a single-page layout unless specifically instructed.
- BREADCRUMBS & BACK NAVIGATION: Every sub-page (non-home) must include clear back-navigation (Breadcrumbs or a "Back to [Parent]" arrow/link) near the top of the page.
${buildLanguageInstruction(analysis)}
`.trim();
}

/**
 * Generates conditional language switching instructions based on the site's detected native language.
 * English-only sites: no switcher at all.
 * Non-English sites: native language + English switcher placed next to the logo.
 */
function buildLanguageInstruction(analysis: AIAnalysisOutput): string {
  const lang = (analysis.detected_language || 'en').toLowerCase().trim();

  if (lang === 'en') {
    return `LANGUAGE:
- This website is English-only. Do NOT add any language switcher UI.
- The entire website MUST be rendered in English only. Do not include any translation logic, i18n hooks, or language toggle components.`;
  }

  // Map ISO 639-1 codes to full language names for the prompt
  const languageNames: Record<string, string> = {
    pl: 'Polish',
    de: 'German',
    fr: 'French',
    es: 'Spanish',
    it: 'Italian',
    nl: 'Dutch',
    pt: 'Portuguese',
    cs: 'Czech',
    sk: 'Slovak',
    hu: 'Hungarian',
    ro: 'Romanian',
    sv: 'Swedish',
    da: 'Danish',
    fi: 'Finnish',
    no: 'Norwegian',
    uk: 'Ukrainian',
    ru: 'Russian',
    tr: 'Turkish',
    el: 'Greek',
    hr: 'Croatian',
  };
  const nativeName = languageNames[lang] || lang.toUpperCase();

  return `MANDATORY DUAL-LANGUAGE SYSTEM (${nativeName.toUpperCase()} + ENGLISH):
- This site's native language is ${nativeName}. You MUST support exactly TWO languages: (1) ${nativeName} and (2) English.
- SWITCHER PLACEMENT — CRITICAL: The language switcher MUST be positioned INSIDE the navbar, immediately to the right of the brand logo, before the navigation links. Treat it as part of the "logo area" unit: [Logo] [EN | ${nativeName.slice(0,2).toUpperCase()}] ... [Nav Links].
- SWITCHER STYLE: Render it as a compact inline toggle (e.g. a pill with "PL / EN" or "EN | PL") styled with the site's design tokens — glassmorphic background, border, and accent color on the active language. Do NOT use a full dropdown unless there are 3+ languages.
- FUNCTIONALITY: Use a React state variable (e.g. \`const [lang, setLang] = useState<'${lang}' | 'en'>('${lang}')\`) stored in React Context so ALL components react to it. Toggle with a single click — no page reload, no route change.
- ALL CONTENT MUST BE TRANSLATED: Every string on every page (nav items, hero titles, section headings, body copy, button labels, form placeholders, footer text) MUST exist in BOTH ${nativeName} AND English. Use an inline translation dictionary or i18n hook — not hardcoded per-component.
- DEFAULT LANGUAGE: The site MUST load in ${nativeName} by default (the native language of the original site). English is the secondary option.`;
}
