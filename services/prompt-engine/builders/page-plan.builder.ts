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

export function buildPagePlan(analysis: AIAnalysisOutput, crawledPages: any[] = []): string {
  const { lovable_prompt_data, content_analysis } = analysis;
  const detectedPages = content_analysis.pages_detected || [];

  const allPages = lovable_prompt_data.pages_to_generate;

  // Filter AI-suggested pages to only those with a plausible match in the original site
  const filteredPages = allPages.filter(page => hasDetectedMatch(page, detectedPages));

  // Fallback: if filtering removes everything (bad detection), use the full list
  const pages = filteredPages.length >= 2 ? filteredPages : allPages;

  const sections = lovable_prompt_data.sections_per_page;

  // Use the AI-detected website_type for deterministic layouts and subpages
  const type = (analysis.website_type || 'corporate').toLowerCase();
  
  const hasBlog = type === 'blog' || type === 'personal';
  const hasMenu = type === 'restaurant';
  const hasProducts = type === 'ecommerce';
  const hasPortfolio = type === 'portfolio';
  const hasServices = type === 'corporate' || type === 'saas' || type === 'agency';
  const hasLandingPage = type === 'landing_page';
  const hasSaaS = type === 'saas';
  const hasNews = type === 'news';
  const hasEducational = type === 'educational';

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

    // Inject type-aware home page sections
    let homeTypeSection = '';
    if (isHome) {
      if (hasBlog) {
        homeTypeSection = `\n   [MANDATORY — LATEST POSTS PREVIEW]: Render a "Najnowsze posty" / "Latest Posts" blog feed section on the home page.\n` +
          `   HARDCODED DATA ARRAY REQUIRED: You MUST create a hardcoded \`blogPosts\` array using the titles and slugs from the BLOG POST IMAGE MANIFEST so the cards map to real posts.\n` +
          `   Show the 3 most recent blog post cards in a responsive grid (1-col mobile, 2-col tablet, 3-col desktop).\n` +
          `   Each card MUST contain: title (H3), publish date, 2-sentence excerpt, featuredImage thumbnail (max 200px width, rounded, object-fit cover), and a "Czytaj dalej →" / "Read More →" link.\n` +
          `   ⛔ Card images MUST use the exact featuredImage URL from the BLOG POST IMAGE MANIFEST — NOT the author profile photo.\n` +
          `   ⛔ Each "Czytaj dalej" link MUST be a React Router <Link to={\`/blog/\${post.slug}\`}> — NEVER an external link, NEVER href="#".\n` +
          `   Cards must have hover lift animation (translateY -4px, shadow-card-hover) and smooth transition (0.25s ease-out).`;
      } else if (hasPortfolio) {
        homeTypeSection = `\n   [MANDATORY — FEATURED WORK]: A stunning masonry grid or horizontal scroll showcase of the 4 best portfolio pieces. Use original project thumbnails. Hover states must reveal the project title. Add a "View All Projects" CTA linking to /portfolio.`;
      } else if (hasSaaS) {
        homeTypeSection = `\n   [MANDATORY — PRODUCT DASHBOARD TEASER]: Use a beautiful mockup/dashboard image (or CSS-drawn skeleton if none exists). Followed by a 3-column features grid, and a subtle social proof banner (e.g. "Trusted by 1,000+ teams").`;
      } else if (hasNews) {
        homeTypeSection = `\n   [MANDATORY — BREAKING NEWS HERO]: A dense editorial grid. Left: 1 massive breaking news story. Right: 3 stacked trending stories. All MUST link to /article/:slug.`;
      } else if (hasLandingPage) {
        homeTypeSection = `\n   [MANDATORY — SINGLE PAGE FLOW]: This is a landing page. All sections must stack sequentially. The header nav MUST use anchor links (href="#section-id") to smoothly scroll down the page, NOT route to separate pages.`;
      }
    }

    const sectionList = pageSections.map((s, i) => `   ${i + 1}. ${s}`).join('\n');

    return `
--- PAGE: ${page.toUpperCase()} ---
PURPOSE: ${isHome ? 'Primary landing page. Communicate value proposition above the fold and drive primary conversion action.' : `Detail page for ${page}. Answer specific user intent and provide clear next steps.`}
LAYOUT: ${isHome && hasLandingPage ? 'Single long-scroll page with anchor navigation' : isHome ? 'Full-width hero → Service grid → Trust signals → CTA banner → Footer' : 'Compact page hero → Content sections → Internal CTA → Contact block → Footer'}
REQUIRED SECTIONS (IN ORDER):
${nonHomeHeroSection}${sectionList || '   1. Content\n   2. CTA'}${homeTypeSection}
CTA PLACEMENT: ${isHome ? 'Primary CTA in hero (above fold) + after services section + final CTA banner before footer' : 'Subtle CTA at top + primary CTA at bottom of content'}
CONVERSION INTENT: ${conversionGoal}
VISUAL HIERARCHY: H1 (most prominent) → H2 (section titles) → body (comfortable reading) → CTAs (high-contrast, unmissable)`.trim();
  });

  // Dynamic Detail Subpages Blocks
  const blogDetailBlock = hasBlog ? `

⚠️⚠️⚠️ MANDATORY BLOG POST DETAIL PAGE — DO NOT SKIP ⚠️⚠️⚠️
--- PAGE: BLOG POST DETAIL (/blog/:slug) ---
CRITICAL ROUTING REQUIREMENTS:
- You MUST implement a dynamic detail route: \`/blog/:slug\` (React Router) or \`/blog/[slug]\` (Next.js).
- INTERNAL SUBPAGE ONLY (NO EXTERNAL LINKS): The blog posts MUST open as internal subpages on the website.
- HARDCODED DATA ARRAY REQUIRED: To make the "Czytaj dalej" link work, you MUST create a hardcoded \`blogPosts\` array in your code containing the titles, slugs, and featuredImage URLs extracted from the BLOG POST IMAGE MANIFEST. 
- BUTTON CLICKABILITY: The "Czytaj dalej" (Read more) button on every blog card MUST be fully functional! Wrap it properly using the React Router \`<Link to={\`/blog/\${post.slug}\`}>\`. Do NOT use empty \`href="#"\` or dead \`<button>\`.
- STRICT ROUTING GUARDRAIL: Do NOT link the "Czytaj dalej" button to unrelated pages. It MUST link strictly to the dynamic route using the post's unique slug.

REQUIRED SECTIONS (IN ORDER):
   1. [BACK NAVIGATION] — "← Back to Blog" link top-left, styled subtly with hover underline
   2. [ARTICLE HEADER] — Large H1 title, category tag pill, publish date, estimated read time badge
   3. [HERO IMAGE] — Full-width article banner image (max-height: 480px, object-fit: cover, rounded-lg). MUST use the featuredImage from the BLOG POST IMAGE MANIFEST for this post.
   4. [ARTICLE BODY] — You MUST use the EXACT, verbatim original text for the blog posts provided in the 'VERBATIM ORIGINAL CONTENT TO PRESERVE' section. Render the original text as rich paragraphs with H2/H3 subheadings. Include ALL the inline images from the original post body in the same order.
   5. [TAGS] — Clickable tag chips that link back to the blog listing filtered by category
   6. [RELATED POSTS] — 2-3 related article cards, clickable to their own detail pages
   7. [CTA] — Subtle business-relevant call-to-action (e.g. "Book a repair consultation")

DATA & CONTENT RULES FOR BLOG POSTS:
- NO FAKE TOPICS: You MUST NOT invent random or generic blog post topics!
- DERIVE TOPICS FROM IMAGES & TEXT: You MUST derive the blog post titles and topics STRICTLY from the original crawled pages.
- ⛔ STRICT PHOTO GUARDRAIL — ZERO TOLERANCE FOR WRONG IMAGES:
  * Every blog card MUST display the EXACT "featuredImage" URL from the BLOG POST IMAGE MANIFEST.
  * You MUST NOT use the author profile photo (e.g. th300.jpg, profile-img, avatar) for any blog card or article hero.
  * Match each blog post's image using the "title" and "featuredImage" fields from the BLOG POST IMAGE MANIFEST.
` : '';

  const menuDetailBlock = hasMenu ? `

⚠️⚠️⚠️ MANDATORY RESTAURANT MENU DETAIL PAGE — DO NOT SKIP ⚠️⚠️⚠️
--- PAGE: MENU ITEM DETAIL (/menu/:id) ---
CRITICAL ROUTING REQUIREMENTS:
- You MUST implement a dynamic detail route: /menu/:id (React Router) or /menu/[id] (Next.js).
- INTERNAL SUBPAGE ONLY: The dishes/menu items MUST open as internal subpages. Do NOT use empty anchors or dead triggers.
- BUTTON CLICKABILITY: Every food card or dish thumbnail in your menu grid MUST be fully clickable, wrapping it in a functional React Router <Link to="/menu/item-id"> component to view item ingredients and customize choices.
- Store menu items as a typed array of objects (id, name, description, ingredients, price, image, category, allergens, calories, customOptions).

REQUIRED SECTIONS (IN ORDER):
   1. [BACK NAVIGATION] — "← Back to Menu" navigation link, styled with elegant hover slide-out transition
   2. [FOOD SHOWCASE] — Dynamic split layout: Left: Large premium photo of the dish with HSL gradient border and soft shadow. Right: Large H1 dish name, high-contrast price badge, calories indicator, and dietary flags (e.g. Vegan, Gluten-Free, Chef Special).
   3. [INGREDIENTS & CUSTOMIZATION] — Detailed list of original ingredients. Provide fully interactive checkboxes for customizable items (e.g., "Extra toppings", "Double cheese", "Gluten-free option").
   4. [ALLERGENS & NUTRITION] — Structured, highly legible table of allergens (e.g., gluten, lactose, celery) and macronutrient values to ensure food safety compliance.
   5. [CTA] — "Order Online / Add to Order" trigger or direct "Call to Order" quick-dial trigger.
` : '';

  const productDetailBlock = hasProducts ? `

⚠️⚠️⚠️ MANDATORY PRODUCT DETAIL PAGE — DO NOT SKIP ⚠️⚠️⚠️
--- PAGE: PRODUCT DETAIL (/products/:id) ---
CRITICAL ROUTING REQUIREMENTS:
- You MUST implement a dynamic detail route: /products/:id or /catalog/:id (React Router) or /products/[id] (Next.js).
- EVERY item card in the shop/catalog showcase grid MUST be fully functional and wrap the card/button in a dynamic <Link to="/products/item-id"> to navigate internally.
- Store product entries as a typed array of objects (id, name, description, price, category, image, features, specifications, stock, ratings).

REQUIRED SECTIONS (IN ORDER):
   1. [BACK NAVIGATION] — "← Back to Catalog" link with subtle micro-arrow animation on hover
   2. [PRODUCT IMAGE & MAIN SPECS] — Interactive split layout: Left: Product gallery containing high-quality original images with drag-to-slide or thumbnail picker. Right: Large product H1 title, ratings badge, price callout, real-time stock indicator, and primary CTA button.
   3. [SPECIFICATION HIGHLIGHTS] — Beautifully typeset, high-contrast table presenting all technical specifications (dimensions, weight, warranty, power requirements) derived from the crawled text.
   4. [KEY FEATURES SHOWCASE] — Staggered reveal list of features with custom SVGs and spring animations.
   5. [RELATED PRODUCTS Showcase] — 3 recommended products, fully clickable to navigate to their respective subpages.
` : '';

  const portfolioDetailBlock = hasPortfolio ? `

⚠️⚠️⚠️ MANDATORY PORTFOLIO/PROJECT DETAIL PAGE — DO NOT SKIP ⚠️⚠️⚠️
--- PAGE: PROJECT DETAIL (/portfolio/:slug) ---
CRITICAL ROUTING REQUIREMENTS:
- You MUST implement a dynamic detail route: /portfolio/:slug or /projects/:slug.
- All portfolio cards, case study entries, and gallery items MUST be fully clickable, linking directly to /portfolio/:slug using React Router Link components.
- Store projects as a typed array of objects (slug, title, client, date, category, tags, coverImage, images, description, challenge, solution, result).

REQUIRED SECTIONS (IN ORDER):
   1. [BACK NAVIGATION] — "← Back to Portfolio" link top-left
   2. [PROJECT HERO] — Full-screen panoramic banner image with dark overlay, large H1 project title, client metadata, project year, and category pills.
   3. [CASE STUDY BODY] — Clean, beautifully spaced 2-column details block explaining "The Challenge" and "The Solution" using verbatim legacy content.
   4. [PROJECT GALLERY] — Responsive masonry showcase grid of the project's sub-images.
   5. [RESULTS & METRICS] — Premium statistical callouts (e.g. "98% Efficiency", "+150% Growth") with spring animations on scroll view.
   6. [CTA] — High-contrast CTA section (e.g. "Work with Us on Your Project" button linking to contact form).
` : '';

  const serviceDetailBlock = hasServices ? `

⚠️⚠️⚠️ MANDATORY SERVICE DETAIL PAGE — DO NOT SKIP ⚠️⚠️⚠️
--- PAGE: SERVICE DETAIL (/services/:slug) ---
CRITICAL ROUTING REQUIREMENTS:
- You MUST implement a dynamic detail route: /services/:slug or /services/:id.
- Every service card, summary list, or service grid item MUST be fully clickable, linking directly to /services/:slug.
- Store services as a typed array of objects (slug, name, description, icon, fullContent, pricingPackages, processSteps, faqs).

REQUIRED SECTIONS (IN ORDER):
   1. [BACK NAVIGATION] — "← Back to Services" navigation link
   2. [SERVICE INTRO HERO] — Centered premium hero with service title H1, clear value proposition, and quick booking CTA.
   3. [INTERACTIVE TIMELINE PROCESS] — Vertical animated timeline detailing the step-by-step service delivery process (e.g. Step 1: Diagnose, Step 2: Repair, Step 3: Calibrate).
   4. [PRICING & FAQ ACCORDION] — Transparent package cards and elegant interactive FAQs.
   5. [CTA] — Premium interactive service-booking form block with smooth fade-in.
` : '';

  const saasDetailBlock = hasSaaS ? `

⚠️⚠️⚠️ MANDATORY SAAS PAGES — DO NOT SKIP ⚠️⚠️⚠️
--- PAGE: PRICING (/pricing) ---
REQUIRED SECTIONS:
   1. [PRICING CARDS] — 3-tier pricing table (Basic, Pro, Enterprise) with highlighted middle tier. Include feature checklists and monthly/annual toggles.
   2. [FAQ] — Accordion of frequently asked questions.

--- PAGE: FEATURES (/features) ---
REQUIRED SECTIONS:
   1. [FEATURE SHOWCASE] — Alternating left/right text and image blocks explaining core platform capabilities.
` : '';

  const newsDetailBlock = hasNews ? `

⚠️⚠️⚠️ MANDATORY NEWS ARTICLE DETAIL PAGE — DO NOT SKIP ⚠️⚠️⚠️
--- PAGE: ARTICLE DETAIL (/article/:slug) ---
CRITICAL ROUTING REQUIREMENTS:
- Internal subpages only for all news/articles.
- Display author, publish date, read time, and category tags at the top.
- Right sidebar with "Trending Articles" or "Most Read".
` : '';

  const educationalDetailBlock = hasEducational ? `

⚠️⚠️⚠️ MANDATORY EDUCATIONAL DETAIL PAGE — DO NOT SKIP ⚠️⚠️⚠️
--- PAGE: COURSE DETAIL (/course/:slug) ---
CRITICAL ROUTING REQUIREMENTS:
- Internal subpages for courses/programs.
- Sections: Course Overview, Curriculum (Accordion), Instructor Bio, Enrollment CTA.
` : '';

  return `
==================================================
B. PAGE-BY-PAGE GENERATION PLAN
==================================================

NOTE: Pages below are derived strictly from the original site's detected structure and extracted navigation links.
Any page not found in the original crawl has been excluded to preserve structural fidelity.
${hasLandingPage ? '\n⚠️ THIS IS A LANDING PAGE: Build a SINGLE scrolling page. Do NOT split into multiple routes. Use #anchor links in the navbar.\n' : ''}

TOTAL PAGES: ${pages.length}
PAGES: ${pages.join(' | ')}

${pageBlocks.join('\n\n')}
${blogDetailBlock}
${menuDetailBlock}
${productDetailBlock}
${portfolioDetailBlock}
${serviceDetailBlock}
${saasDetailBlock}
${newsDetailBlock}
${educationalDetailBlock}
`.trim();
}
