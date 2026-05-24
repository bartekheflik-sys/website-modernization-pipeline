import { AIAnalysisOutput } from '../schemas/analysis.schema';
import { buildGlobalInstructions } from '../builders/global-instructions.builder';
import { buildDesignSystem } from '../builders/design-system.builder';
import { buildPagePlan } from '../builders/page-plan.builder';
import { buildSectionSpecs } from '../builders/section-specs.builder';
import { buildConversionRules } from '../builders/conversion-rules.builder';
import { buildMotionSystem } from '../builders/motion-system.builder';
import { buildBusinessContext, buildContentRules, buildResponsivenessRules, buildAssetGuidance } from '../builders/content-rules.builder';
import { validateAnalysisInput, validatePromptOutput, countSections, GeneratedPromptOutput } from '../validators/prompt.validator';

import { getDesignDNA } from '../builders/design-dna.library';

export function generateLovablePrompt(analysis: AIAnalysisOutput, assets: any[] = [], pages: any[] = []): GeneratedPromptOutput {
  // STEP 1: Validate that we have quality input data
  validateAnalysisInput(analysis);

  // DYNAMIC DESIGN INJECTION: Map the chosen Design DNA to exact style guidelines
  if (analysis.lovable_prompt_data && analysis.lovable_prompt_data.design_dna_id) {
    const dna = getDesignDNA(analysis.lovable_prompt_data.design_dna_id);
    analysis.design_direction.motion_level = 'high';
    analysis.lovable_prompt_data.design_style = `${dna.name}: ${dna.design_style} Base Colors: ${dna.color_direction} Typography: ${dna.typography_direction}`;
    analysis.lovable_prompt_data.animation_style = dna.animation_style;
  } else if (analysis.lovable_prompt_data) {
    // Fallback if AI fails to pick
    analysis.design_direction.motion_level = 'high';
    analysis.lovable_prompt_data.design_style = 'Premium high-end modern cinematic showcase, dark glassmorphism, responsive visual breathing room';
    analysis.lovable_prompt_data.animation_style = 'Physics-based spring motion, scroll-linked parallax, horizontal showcases, sticky stacked decks, running marquees';
  }

  // STEP 2: Build each section of the prompt deterministically
  const sections = [
    buildBusinessContext(analysis),
    buildGlobalInstructions(analysis, assets),
    buildDesignSystem(analysis),
    buildPagePlan(analysis),
    buildSectionSpecs(analysis),
    buildConversionRules(analysis),
    buildMotionSystem(analysis),
    buildResponsivenessRules(),
    buildContentRules(analysis, pages),
    buildAssetGuidance(analysis, assets),
  ];

  // STEP 3: Assemble full prompt with explicit top-level Lovable Integration Guardrails
  const fullPrompt = `
==================================================
ROLE & MISSION
==================================================
You are an Expert Frontend Engineer and UI/UX Architect. 
Your mission is to modernize a legacy business website into a high-performance, premium, and accessible web application. 
Follow the instructions below with surgical precision. Prioritize business authenticity and visual excellence.

==================================================
⚠️ CRITICAL LOVABLE INTEGRATION GUARDRAILS (HIGHEST PRIORITY)
==================================================

1. STRICT LOCAL IMAGE INTEGRATION (NO GENERATED PLACEHOLDERS):
   - The user has uploaded all authentic, super-resolution, beautifully-sharpened original business photos directly into your workspace files.
   - You MUST NOT use generic stock images, AI generations, or Unsplash placeholder URLs for actual content, products, menus, or galleries!
   - EXACT MANIFEST MATCHING: You MUST reference local files exactly by the filenames listed in the "Website Asset Manifest" provided at the end of this prompt. Do NOT guess filenames.
   - SEMANTIC MAPPING: If a menu section is about "Pizza", find the filename in the manifest that matches Pizza (e.g. './Pizza.jpg'). If it's about "Zapiekanki", map it to the exact Zapiekanki photo (e.g. './Zapiekanki.jpg').
   - NO LAZY GALLERY LOOPS: When rendering image galleries, grids, or product lists, you MUST NOT duplicate the same image multiple times (e.g., do not use \`Array(9).fill('./photo.jpg')\`). You MUST use distinct, unique photos from the Asset Manifest for every single gallery item and product card.

2. CINEMATIC HIGH-MOTION FRAMEWORK (MANDATORY FRAMER MOTION):
   - CRITICAL: You MUST use the "framer-motion" library. Import it and wrap your UI elements in <motion.div>.
   - You MUST build a highly-dynamic, premium web experience with fluid animations. If a page has no motion, you have failed.
   - DO NOT make a basic scroll template. Make the site feel alive and premium!
   - IMPLEMENT THE FOLLOWING MOTION FEATURES:
     * Parallax Hero Scroll: The hero background scaling smoothly on scroll with vertical offset.
     * Stacked Specialties Deck: Sticky specialty sections or cards that stack on top of each other dynamically on scroll.
     * Horizontal Scroll Showcase: Map vertical scroll progress on desktop to horizontal translate of featured cards or product highlights.
     * Continuous Tagline Marquees: Seamless, infinite running marquees behind sections at low opacity.
     * Staggered Spring Entrances: Spring physics (stiffness 120, damping 14) for all menu items and cards as they enter the viewport using \`whileInView\`.
   - Legibility Lock: Keep all paragraphs and body copy text 100% static for perfect reading comfort.

3. STRICT NAVIGATION ARCHITECTURE & BANNED ELEMENTS:
   - You MUST use the exact detected original page names for the main navigation menu items verbatim!
   - DO NOT translate, change, split, or rename these items under any circumstances.
   - BANNED ELEMENTS: You MUST NOT add any extra pages, sections, user authentication, login flows, or bookmarks! The site MUST strictly contain only the authentic crawled pages. Banned examples: 'Login', 'Logowanie', 'Rejestracja', 'Admin', 'Dashboard', 'Cart', 'Zamów'.
   - You MUST render exactly these names as the primary navigation bar links/routes:
     ${analysis.content_analysis.pages_detected.filter(p => !p.includes(' - ')).map(p => `* ${p.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`).join('\n     ')}

4. WCAG AA ACCESSIBILITY & HIGH CONTRAST TEXT (NO BLENDING):
   - You MUST ensure absolute legibility of all written copy. Text color MUST NOT blend into the background color!
   - DYNAMIC IMAGE BACKGROUND PROTECTION: When placing text (like Navigation links, Hero titles, or overlay text) on top of photographs or varying backgrounds, you MUST protect the text readability! Use a dark gradient overlay on the image (e.g., \`bg-gradient-to-b from-black/80 via-black/20 to-transparent\` at the top for navbars), apply strong text shadows (e.g., \`drop-shadow-lg\` or custom text-shadow), or use a glassmorphic/dark backdrop for the navbar.
   - For dark themes (like dark glassmorphism): Use pure white (#FFFFFF), slate-100, or high-brightness text for all headers and body copy. Never use mid-tone greys, dark slate, or low-contrast text on dark backgrounds.
   - For buttons and callouts: Ensure text placed on top of colored gradients or bright background accents has a highly contrasting color (e.g., pure black or dark navy text on yellow/cyan/green buttons, and pure white text on dark blue/purple gradients).

5. ORIGINAL PHOTO RESOLUTION, RENDER SCALE & AI BACKGROUNDS:
   - IMAGES AND PRODUCTS: You MUST preserve the original visual quality of all crawled images. NEVER stretch or scale up images beyond their native dimensions, as this causes severe pixelation. 
   - GRID & MASONRY CLAMPING: CSS Grids and Flexbox columns often forcefully stretch images to fill large desktop screens. You MUST prevent this! Apply strict max-width constraints (e.g. \`max-w-[400px]\`, \`w-fit\`, or \`mx-auto\`) to image containers. A low-resolution photo must NEVER be blown up to fill a massive grid cell!
   - SCALING: Render images either in their original size or smaller using clean CSS properties like \`object-fit: contain\` or \`object-scale-down\` to prevent aspect-ratio distortion and upscaling.
   - AI BACKGROUNDS ALLOWANCE & FALLBACK: You MUST use premium, high-resolution Unsplash image URLs for full-width section backgrounds (like the Hero background). CRITICAL: Because Unsplash links can sometimes break, you MUST ALWAYS implement a rich CSS gradient fallback on the parent container (e.g., \`bg-gradient-to-br from-primary/10 via-background to-primary/5\`) so that if the image fails to load, the section does not look like empty, broken white space!
   - AI CONTENT BAN: You MUST NOT use AI-generated or external placeholder images for specific content items like Products, Menu Items, or Galleries. Content items MUST use the authentic crawled photos.

6. MANDATORY GDPR COMPLIANCE — COOKIES BANNER & PRIVACY POLICY:
   Every website you generate MUST include the following two components. These are non-negotiable legal requirements:

   A. COOKIE CONSENT BANNER:
   - Implement a sticky bottom-of-screen cookie consent banner that appears on first visit (use localStorage to remember consent).
   - The banner MUST include:
     * A short, friendly message: e.g. "We use cookies to improve your experience. By continuing, you agree to our Privacy Policy."
     * A "Accept All" primary button (bg-primary text-primary-foreground).
     * A "Reject Non-Essential" secondary button (outlined/ghost style).
     * A clickable "Privacy Policy" link that navigates to /privacy-policy.
   - The banner must be styled with the site's design tokens (glassmorphism bg-[hsl(var(--surface)/0.9)] backdrop-blur border-t border-[hsl(var(--glass-border))]).
   - It must be dismissible and MUST NOT reappear after the user has accepted/rejected (persist decision in localStorage key: "cookie_consent").
   - It must be fully responsive and accessible (keyboard focusable, ARIA role="dialog").

   B. PRIVACY POLICY PAGE (/privacy-policy):
   - Add a dedicated \`/privacy-policy\` route.
   - The page must include a clean, well-formatted legal text covering: (1) what data is collected, (2) how cookies are used, (3) third-party services (Google Analytics, etc.), (4) user rights under GDPR, (5) contact details for data queries.
   - Use the business name and contact info from the crawled data to fill in the legal text.
   - Style it as a clean, readable long-form content page: max-width 800px centered, large line-height, clear H2 section headings.
   - Add a "← Back to Home" link at the top.
   - The Privacy Policy link in the Footer MUST link to /privacy-policy.
   - The Cookie Banner's "Privacy Policy" link MUST also link to /privacy-policy.

==================================================
LOVABLE WEBSITE GENERATION PROMPT
==================================================

${sections.join('\n\n')}

==================================================
END OF PROMPT
==================================================
`.trim();

  // STEP 4: Build raw output object
  const raw = {
    lovable_prompt: fullPrompt,
    metadata: {
      pages: analysis.lovable_prompt_data.pages_to_generate,
      sections_count: countSections(analysis),
      motion_level: analysis.design_direction.motion_level,
      design_style: analysis.lovable_prompt_data.design_style,
      industry: analysis.industry,
      generated_at: new Date().toISOString()
    }
  };

  // STEP 5: Runtime validate the output before returning
  return validatePromptOutput(raw);
}

