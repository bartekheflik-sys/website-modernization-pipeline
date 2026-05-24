import { AIAnalysisOutput } from '../schemas/analysis.schema';

/**
 * Normalizes a page name for fuzzy matching.
 * Strips punctuation, lowercases, and collapses whitespace.
 */
function normalize(s: string): string {
  return s.toLowerCase()
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

/**
 * Checks if a generated page name has a plausible match in the detected pages list.
 * Uses token overlap: if any significant word in the page name appears in any detected page, it's a match.
 */
function hasDetectedMatch(pageName: string, detectedPages: string[]): boolean {
  const pageTokens = normalize(pageName).split(' ').filter(t => t.length > 2);
  const detectedNorm = detectedPages.map(d => normalize(d));

  // English → Polish common mappings
  const aliasMap: Record<string, string[]> = {
    home: ['strona', 'homepage', 'glowna', 'main'],
    menu: ['menu'],
    contact: ['kontakt', 'contact'],
    gallery: ['galeria', 'gallery'],
    catering: ['oferta', 'catering'],
    order: ['order', 'zamow', 'delivery'],
    about: ['about', 'historia', 'story'],
  };

  // Check direct token overlap first
  for (const token of pageTokens) {
    if (detectedNorm.some(d => d.includes(token))) return true;
    // Check alias map
    for (const [key, aliases] of Object.entries(aliasMap)) {
      if (token.includes(key) || key.includes(token)) {
        if (aliases.some(alias => detectedNorm.some(d => d.includes(alias)))) return true;
      }
    }
  }

  return false;
}

export function buildPagePlan(analysis: AIAnalysisOutput): string {
  const { lovable_prompt_data, content_analysis } = analysis;
  const detectedPages = content_analysis.pages_detected || [];

  // Filter AI-suggested pages to only those with a plausible match in the original site
  const allPages = lovable_prompt_data.pages_to_generate;
  const filteredPages = allPages.filter(page => hasDetectedMatch(page, detectedPages));

  // Fallback: if filtering removes everything (bad detection), use original list
  const pages = filteredPages.length >= 2 ? filteredPages : allPages;

  const sections = lovable_prompt_data.sections_per_page;

  // Detect if a blog page exists
  const hasBlog = pages.some(p =>
    normalize(p).includes('blog') ||
    normalize(p).includes('article') ||
    normalize(p).includes('news') ||
    normalize(p).includes('post') ||
    normalize(p).includes('aktual') ||
    normalize(p).includes('wpis')
  ) || detectedPages.some(p =>
    normalize(p).includes('blog') ||
    normalize(p).includes('article') ||
    normalize(p).includes('news')
  );

  const pageBlocks = pages.map((page, index) => {
    const pageSections = sections[page] || [];
    const isHome = index === 0;

    // Strip AI-invented percentage metrics from conversion goals (e.g. "by 40%", "by 20%")
    const rawGoal = lovable_prompt_data.conversion_goals[index % lovable_prompt_data.conversion_goals.length] || 'Drive contact form submissions';
    const conversionGoal = rawGoal.replace(/\s+by\s+\d+%/gi, '').replace(/\s{2,}/g, ' ').trim();

    // For non-home pages, prepend a dedicated Page Header hero so content sections
    // (like "Location Map & Address" or "Food Photography Showcase") never become the hero.
    const nonHomeHeroSection = !isHome
      ? `   0. [PAGE HEADER] — Full-width compact hero introducing the ${page} page (H1: page title, subheadline: one-line purpose, optional CTA)\n`
      : '';

    const sectionList = pageSections.map((s, i) => `   ${i + 1}. ${s}`).join('\n');

    return `
--- PAGE: ${page.toUpperCase()} ---
PURPOSE: ${isHome ? 'Primary landing page. Communicate value proposition above the fold and drive primary conversion action.' : `Detail page for ${page}. Answer specific user intent and provide clear next steps.`}
LAYOUT: ${isHome ? 'Full-width hero → Service grid → Trust signals → CTA banner → Footer' : 'Compact page hero → Content sections → Internal CTA → Contact block → Footer'}
REQUIRED SECTIONS (IN ORDER):
${nonHomeHeroSection}${sectionList || '   1. Content\n   2. CTA'}
CTA PLACEMENT: ${isHome ? 'Primary CTA in hero (above fold) + after services section + final CTA banner before footer' : 'Subtle CTA at top + primary CTA at bottom of content'}
CONVERSION INTENT: ${conversionGoal}
VISUAL HIERARCHY: H1 (most prominent) → H2 (section titles) → body (comfortable reading) → CTAs (high-contrast, unmissable)`.trim();
  });

  // Build the mandatory blog post detail page block if blog is detected
  const blogDetailBlock = hasBlog ? `

⚠️⚠️⚠️ MANDATORY BLOG POST DETAIL PAGE — DO NOT SKIP ⚠️⚠️⚠️
--- PAGE: BLOG POST DETAIL (/blog/:slug) ---
CRITICAL ROUTING REQUIREMENTS:
- You MUST implement a dynamic detail route: /blog/:slug (React Router) or /blog/[slug] (Next.js).
- INTERNAL SUBPAGE ONLY (NO EXTERNAL LINKS): The blog posts MUST open as internal subpages on the website. You MUST NOT use external links (like https://...) or `target="_blank"`.
- BUTTON CLICKABILITY: The "Czytaj dalej" (Read more) button on every blog card MUST be fully functional! Wrap the button (or the entire card) properly using the React Router <Link to="/blog/post-slug"> component. Do NOT use an empty href="#" or a dead <button>.
- A blog listing page with cards or "Czytaj dalej" buttons that do NOT navigate to the internal article subpage is considered a CRITICAL BUILD FAILURE.
- Store blog posts as a typed array of objects (id, slug, title, category, date, readTime, image, content, tags).

REQUIRED SECTIONS (IN ORDER):
   1. [BACK NAVIGATION] — "← Back to Blog" link top-left, styled subtly with hover underline
   2. [ARTICLE HEADER] — Large H1 title, category tag pill, publish date, estimated read time badge
   3. [HERO IMAGE] — Full-width article banner image (max-height: 480px, object-fit: cover, rounded-lg)
   4. [ARTICLE BODY] — Full article content as rich paragraphs with H2/H3 subheadings. Each post must have UNIQUE, substantive content (minimum 3 paragraphs) matching the business topic.
   5. [TAGS] — Clickable tag chips that link back to the blog listing filtered by that category
   6. [RELATED POSTS] — 2–3 related article cards at the bottom, also clickable to their own detail pages
   7. [CTA] — Subtle business-relevant call-to-action (e.g. "Book a repair consultation" for a Hi-Fi repair shop)

ANIMATION: Article body reveals with staggered paragraph fade-ins on scroll (Framer Motion whileInView, opacity 0→1, y: 20→0, staggerChildren: 0.08).`.trim()
  : '';

  return `
==================================================
B. PAGE-BY-PAGE GENERATION PLAN
==================================================

NOTE: Pages below are derived strictly from the original site's detected structure.
Any page not found in the original crawl has been excluded to preserve structural fidelity.

TOTAL PAGES: ${pages.length}
PAGES: ${pages.join(' | ')}

${pageBlocks.join('\n\n')}
${blogDetailBlock}
`.trim();
}
