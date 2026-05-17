import { AIAnalysisOutput } from '../schemas/analysis.schema';
import { buildGlobalInstructions } from '../builders/global-instructions.builder';
import { buildDesignSystem } from '../builders/design-system.builder';
import { buildPagePlan } from '../builders/page-plan.builder';
import { buildSectionSpecs } from '../builders/section-specs.builder';
import { buildConversionRules } from '../builders/conversion-rules.builder';
import { buildMotionSystem } from '../builders/motion-system.builder';
import { buildBusinessContext, buildContentRules, buildResponsivenessRules, buildAssetGuidance } from '../builders/content-rules.builder';
import { validateAnalysisInput, validatePromptOutput, countSections, GeneratedPromptOutput } from '../validators/prompt.validator';

export function generateLovablePrompt(analysis: AIAnalysisOutput, assets: any[] = []): GeneratedPromptOutput {
  // STEP 1: Validate that we have quality input data
  validateAnalysisInput(analysis);

  // STRICT GLOBAL ENFORCEMENT: Override motion level to HIGH to ensure dynamic layouts are generated
  analysis.design_direction.motion_level = 'high';
  if (analysis.lovable_prompt_data) {
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
    buildContentRules(analysis),
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
   - You MUST NOT use generic stock images, AI generations, or Unsplash placeholder URLs (like unsplash.com/photos) for products, menus, or logos!
   - You MUST reference them exactly as local files in the root folder. Match them dynamically based on the business type:
     * Logo: Reference exactly as './logo.png' (or logo.jpg) - MUST be used in navbar and footer.
     * Pizza / Primary Dishes: Reference exactly as './pizza.jpg'
     * Pasta / Side Dishes: Reference exactly as './pasta.jpg'
     * Baguettes / Casseroles: Reference exactly as './bagietki.jpg' or './zapiekanki.jpg'
     * Appetizers / Salads: Reference exactly as './przystawki_i_salatki.jpg'
     * Desserts / Beverages: Reference exactly as './desery_i_napoje.jpg'
     * Interior Restaurant / Atmosphere: Reference exactly as './interior_restaurant.jpg'
     * General Product / Tech / Dental / Services: Match dynamically with the filenames listed in Section I (e.g. './iphone_13.jpg', './dental_implant.jpg').

2. CINEMATIC HIGH-MOTION FRAMEWORK (FRAMER MOTION):
   - You MUST build a highly-dynamic, premium web experience with fluid animations using Framer Motion. 
   - DO NOT make a basic scroll template. Make the site feel alive and premium!
   - IMPLEMENT THE FOLLOWING MOTION FEATURES:
     * Parallax Hero Scroll: The hero background scaling smoothly on scroll with vertical offset.
     * Stacked Specialties Deck: Sticky specialty sections or cards that stack on top of each other dynamically on scroll.
     * Horizontal Scroll Showcase: Map vertical scroll progress on desktop to horizontal translate of featured cards or product highlights.
     * Continuous Tagline Marquees: Seamless, infinite running marquees behind sections at low opacity.
     * Staggered Spring Entrances: Spring physics (stiffness 120, damping 14) for all menu items and buttons.
   - Legibility Lock: Keep all paragraphs and body copy text 100% static for perfect reading comfort.

3. STRICT NAVIGATION & BOOKMARKS NAMES (NO CREATIVE RENAMING ALLOWED):
   - You MUST use the exact detected original Polish names for the main navigation menu items/bookmarks verbatim!
   - DO NOT translate, change, split, or rename these items under any circumstances (e.g. do NOT rename "Oferta" to "Specjalności" or "Dostawa", and do NOT rename "Kontakt" to "Napisz do nas").
   - You MUST render exactly these names as the primary navigation bar links/routes:
     ${analysis.content_analysis.pages_detected.map(p => `* ${p}`).join('\n     ')}

4. WCAG AA ACCESSIBILITY & HIGH CONTRAST TEXT (NO BLENDING):
   - You MUST ensure absolute legibility of all written copy. Text color MUST NOT blend into the background color!
   - For dark themes (like dark glassmorphism): Use pure white (#FFFFFF), slate-100, or high-brightness text for all headers and body copy. Never use mid-tone greys, dark slate, or low-contrast text on dark backgrounds.
   - For buttons and callouts: Ensure text placed on top of colored gradients or bright background accents has a highly contrasting color (e.g., pure black or dark navy text on yellow/cyan/green buttons, and pure white text on dark blue/purple gradients).

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

