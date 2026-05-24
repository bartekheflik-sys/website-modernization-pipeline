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

function buildMustIncludeElements(analysis: AIAnalysisOutput): string {
  const elements = analysis.lovable_prompt_data?.must_include_elements || [];
  if (elements.length === 0) return '';
  return `
==================================================
J. MANDATORY SPECIFIC ELEMENTS TO INCLUDE
==================================================
The following specific functional or content elements MUST be built into the website exactly as described:
${elements.map((el, i) => `${i + 1}. ${el}`).join('\n\n')}
`.trim();
}

export function generateLovablePrompt(analysis: AIAnalysisOutput, assets: any[] = [], pages: any[] = []): GeneratedPromptOutput {
  // STEP 1: Validate that we have quality input data
  validateAnalysisInput(analysis);

  // Merge any extracted navigation links from crawled pages into the pages_to_generate list
  if (analysis.lovable_prompt_data && Array.isArray(pages)) {
    const extractedNavLinks: string[] = [];
    pages.forEach(p => {
      const raw = p.raw_json;
      if (raw && Array.isArray(raw.navigationLinks)) {
        raw.navigationLinks.forEach((item: any) => {
          if (item.label) {
            if (!extractedNavLinks.some(existing => existing.toLowerCase() === item.label.toLowerCase())) {
              extractedNavLinks.push(item.label);
            }
          }
        });
      }
    });

    const allPages = [...analysis.lovable_prompt_data.pages_to_generate];
    extractedNavLinks.forEach(label => {
      const navNorm = label.toLowerCase()
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
      const alreadyRepresented = allPages.some(page => {
        const pageNorm = page.toLowerCase()
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
        return pageNorm.includes(navNorm) || navNorm.includes(pageNorm);
      });
      if (!alreadyRepresented) {
        allPages.push(label);
      }
    });
    analysis.lovable_prompt_data.pages_to_generate = allPages;
  }

  // DYNAMIC DESIGN INJECTION: Map the chosen Design DNA to exact style guidelines
  if (analysis.lovable_prompt_data) {
    const dnaId = analysis.lovable_prompt_data.design_dna_id || 'unknown';
    const dna = getDesignDNA(dnaId, analysis.website_type);
    analysis.design_direction.motion_level = 'high';
    analysis.lovable_prompt_data.design_style = `${dna.name}: ${dna.design_style} Base Colors: ${dna.color_direction} Typography: ${dna.typography_direction}`;
    analysis.lovable_prompt_data.animation_style = dna.animation_style;
  }

  // STEP 2: Build each section of the prompt deterministically
  const sections = [
    buildBusinessContext(analysis),
    buildGlobalInstructions(analysis, assets),
    buildDesignSystem(analysis),
    buildPagePlan(analysis, pages),
    buildSectionSpecs(analysis),
    buildConversionRules(analysis),
    buildMotionSystem(analysis),
    buildResponsivenessRules(),
    buildContentRules(analysis, pages),
    buildAssetGuidance(analysis, assets),
    buildMustIncludeElements(analysis),
  ].filter(Boolean);

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

3. STRICT NAVIGATION ARCHITECTURE & BANNED ELEMENTS (CRITICAL!):
   - You MUST use the EXACT detected original page names for the main header navigation menu verbatim!
   - DO NOT invent, translate, split, or rename these items under any circumstances.
   - DO NOT put blog categories, tags, or random sections into the main top navigation!
   - BANNED INVENTED PAGES: You MUST NOT invent or hallucinate page names that do NOT exist in the detected pages list above.
   - Typical examples of hallucinated pages (do NOT add these unless they are in the detected list): 'Login', 'Logowanie', 'Rejestracja', 'Admin', 'Dashboard', 'Cart', 'Zamów', 'Recenzje'.
   - NOTE: If 'Galeria', 'Pomiary', or any other page name is listed in the detected pages above, you MUST include it — it is real.
   - You MUST render EXACTLY these names as the primary navigation bar links/routes (and absolutely nothing else):
     ${analysis.content_analysis.pages_detected.filter(p => !p.includes(' - ')).map(p => `* ${p.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`).join('\n     ')}
   - REAL ROUTING REQUIRED: Each navigation item MUST be a real React Router \`<Link to="/path">\` that navigates to a dedicated separate page (unless it is a landing_page). Do NOT use empty \`href="#"\`, dead buttons, or scrolling anchor links for multi-page sites!
   - FULL PAGE CONTENT: For EVERY navigation link, you MUST build a full, separate React component/route that displays the VERBATIM original content for that page. Do NOT leave subpages empty.
   - TYPE GUARDRAIL (${analysis.website_type}): ${
     analysis.website_type === 'blog' ? "Do NOT add an online store, product catalog, or booking system." :
     analysis.website_type === 'portfolio' ? "Do NOT add a blog, a product shop, or a restaurant menu." :
     analysis.website_type === 'restaurant' ? "Do NOT add a portfolio section, a blog feed, or software pricing tiers." :
     analysis.website_type === 'landing_page' ? "This is a SINGLE-PAGE SITE. Do NOT split into multiple routes. Use anchor links only." :
     analysis.website_type === 'saas' ? "Do NOT add a restaurant menu, physical location map, or art gallery." :
     "Maintain fidelity to the original site structure."
   }

4. WCAG AA ACCESSIBILITY & HIGH CONTRAST TEXT (NO BLENDING):
   - You MUST ensure absolute legibility of all written copy. Text color MUST NOT blend into the background color!
   - DYNAMIC IMAGE BACKGROUND PROTECTION: You MUST protect text readability! Use a dark gradient overlay on background images (e.g., \`bg-black/60\`). 
   - SOLID NAVBAR: You MUST apply a solid or heavy glassmorphic backdrop (e.g., \`bg-background/95 backdrop-blur-md\`) to the Navbar. DO NOT leave the navbar completely transparent over images, as text will blend into the background and fail WCAG contrast!
   - TEXT SHADOWS: Apply strong text shadows (\`drop-shadow-lg\`) to Hero titles.
   - For dark themes (like dark glassmorphism): Use pure white (#FFFFFF) or high-brightness text for all headers and body copy. Never use mid-tone greys.
   - For buttons and callouts: Ensure text placed on top of colored gradients or bright background accents has a highly contrasting color (e.g., pure black or dark navy text on yellow/cyan/green buttons, and pure white text on dark blue/purple gradients).

5. HERO BACKGROUND vs CONTENT IMAGES — STRICT SEPARATION:
   - HERO BACKGROUND ONLY: You MUST use the imagegen tool (flux.dev, 1920x1080) to generate a stunning, atmospheric, high-resolution background image for the hero section ONLY. The image must match the business/industry type. Save it to src/assets/hero-bg.jpg and import as an ES6 module. 
   - HERO GRADIENT OVERLAY: You MUST apply a dark overlay (\`bg-black/50\`) over the hero image so the white text on top is 100% readable!
   - CRITICAL HERO FALLBACK: You MUST apply a rich CSS gradient fallback on the hero container (e.g., \`bg-gradient-to-br from-[hsl(var(--primary)/0.2)] to-background\`).
   - NEVER USE UNSPLASH URLS: Do NOT use any Unsplash links or external image CDNs for any section.
   - ALL OTHER SECTIONS (Products, Menu, Gallery, Services, Team, etc.): You MUST use ONLY the authentic original crawled photos from the Asset Manifest provided at the end of this prompt. Never use AI-generated images or stock photos for these sections.
   - AI CONTENT BAN: You MUST NOT use AI-generated or Unsplash images for specific content items like Products, Menu Items, Blog Posts, or Galleries. Content items MUST use the authentic crawled photos from the manifest.

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

