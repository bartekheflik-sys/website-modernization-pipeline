import * as cheerio from 'cheerio';
import TurndownService from 'turndown';

const turndownService = new TurndownService({ headingStyle: 'atx' });
// IMPORTANT: Do NOT remove 'header' or 'footer' here — Blogger wraps article section
// headings and content inside <header> elements. Removing them strips real content.
// Page-level chrome (nav, sidebar, etc.) is already removed by cheerio above.
turndownService.remove(['script', 'style', 'noscript', 'iframe']);

export interface ExtractedAsset {
  url: string;
  type: 'image' | 'background' | 'logo' | 'icon';
  alt?: string;
  dimensions?: { width: number; height: number };
  dom_context?: string; // Parent element tag or classes
  file_type?: string;
}

export interface ExtractedPageData {
  url: string;
  title: string;
  description: string;
  headings: string[];
  content: string; // Markdown content
  links: string[];
  assets: ExtractedAsset[];
  /** The og:image URL, used as the featured/hero image for blog post cards */
  featuredImage?: string;
  /** Navigation links extracted from <nav> before stripping boilerplate */
  navigationLinks?: Array<{ label: string; href: string }>;
}

export function extractPageData(html: string, url: string): ExtractedPageData {
  const $ = cheerio.load(html);
  
  const title = $('title').text() || '';
  const description = $('meta[name="description"]').attr('content') || '';

  // Extract og:image as the featured image (used for blog post card thumbnails)
  const featuredImage = $('meta[property="og:image"]').first().attr('content') || undefined;

  // Extract navigation links from <nav> BEFORE it gets stripped
  // This preserves Blogger PageList tabs and standard nav menus
  const navigationLinks: Array<{ label: string; href: string }> = [];
  $('nav a[href], .PageList a[href], [data-widget-type="PageList"] a[href]').each((_, el) => {
    const href = $(el).attr('href');
    const label = $(el).text().trim();
    if (href && label && !href.startsWith('mailto:') && !href.startsWith('#')) {
      try {
        navigationLinks.push({ label, href: new URL(href, url).toString() });
      } catch {
        navigationLinks.push({ label, href });
      }
    }
  });
  
  const headings: string[] = [];
  $('h1, h2, h3').each((_, el) => {
    const text = $(el).text().trim();
    if (text) headings.push(text);
  });

  const links: string[] = [];
  $('a[href]').each((_, el) => {
    let href = $(el).attr('href');
    if (href && !href.startsWith('mailto:') && !href.startsWith('tel:') && !href.startsWith('#')) {
      try {
        const absoluteUrl = new URL(href, url).toString();
        links.push(absoluteUrl);
      } catch {
        links.push(href);
      }
    }
  });

  const assets: ExtractedAsset[] = [];

  // SIDEBAR / PROFILE IMAGE FILTER — skip images inside sidebar, profile, author widgets.
  // These are author avatars and UI chrome, NOT content images for blog posts.
  const isSidebarImage = (el: any): boolean => {
    const parents = $(el).parents();
    for (let i = 0; i < parents.length; i++) {
      const parent = $(parents[i]);
      const id = (parent.attr('id') || '').toLowerCase();
      const cls = (parent.attr('class') || '').toLowerCase();
      if (
        id === 'sidebar' ||
        cls.includes('sidebar') ||
        cls.includes('profile') ||
        cls.includes('profile-img') ||
        cls.includes('avatar') ||
        cls.includes('author') ||
        id.includes('profile') ||
        cls.includes('widget-profile') ||
        // Blogger-specific sidebar section IDs
        id === 'sidebar_right' ||
        id === 'sidebar_left'
      ) return true;
    }
    // Also skip images whose class is directly profile-related
    const imgCls = ($(el).attr('class') || '').toLowerCase();
    if (imgCls.includes('profile-img') || imgCls.includes('avatar-image')) return true;
    return false;
  };

  // Extract standard images (excluding sidebar/profile images)
  $('img[src]').each((_, el) => {
    if (isSidebarImage(el)) return; // skip author/avatar images
    let src = $(el).attr('src');
    if (src) {
      try { src = new URL(src, url).toString(); } catch {}
      
      const alt = $(el).attr('alt') || '';
      const parent = $(el).parent();
      const dom_context = `${parent.prop('tagName')} ${parent.attr('class') || ''}`.trim();
      
      assets.push({ 
        url: src, 
        type: 'image', 
        alt, 
        dom_context,
        file_type: src.split('.').pop()?.split('?')[0].toLowerCase()
      });
    }
  });

  // Extract background images from style attributes
  $('[style*="background-image"]').each((_, el) => {
    const style = $(el).attr('style');
    const match = style?.match(/url\(['"]?([^'"]+)['"]?\)/);
    if (match && match[1]) {
      let src = match[1];
      try { src = new URL(src, url).toString(); } catch {}
      
      assets.push({ 
        url: src, 
        type: 'background',
        dom_context: `${$(el).prop('tagName')} ${$(el).attr('class') || ''}`.trim(),
        file_type: src.split('.').pop()?.split('?')[0].toLowerCase()
      });
    }
  });

  // Extract icons (favicon, touch icons)
  $('link[rel*="icon"]').each((_, el) => {
    let src = $(el).attr('href');
    if (src) {
      try { src = new URL(src, url).toString(); } catch {}
      assets.push({ 
        url: src, 
        type: 'icon',
        file_type: src.split('.').pop()?.split('?')[0].toLowerCase()
      });
    }
  });

  // Extract main content by removing ONLY page chrome boilerplate.
  // CRITICAL: Do NOT remove <header> globally — article/post headers contain section titles.
  // Instead, remove specific page-level chrome selectors only.
  $('nav, footer, script, style, noscript').remove();
  $('aside, .sidebar, #sidebar, #sidebar_right, #sidebar_left').remove();
  // Remove Blogger-specific chrome that is NOT article content
  $('.navbar, #navbar, .blog-pager, .post-feeds, .feed-links, .comment-form, #comments').remove();
  $('.widget.Profile, .widget.BlogArchive, .widget.HTML, .widget.PageList').remove();

  // Try to extract only the post/article body first (most content-rich selector)
  // Blogger wraps post content in .post-body or .entry-content inside article/.post
  const postBodySelectors = [
    'article .post-body',
    'article .entry-content',
    '.post-body',
    '.entry-content',
    'article',
    'main',
    '.post',
    '[itemprop="articleBody"]'
  ];

  let mainHtml: string | null = null;
  for (const sel of postBodySelectors) {
    const el = $(sel);
    if (el.length && (el.text()?.trim().length ?? 0) > 100) {
      mainHtml = el.html();
      break;
    }
  }
  // Ultimate fallback: entire body
  if (!mainHtml) mainHtml = $('body').html();

  const content = mainHtml ? turndownService.turndown(mainHtml) : '';

  return {
    url,
    title,
    description,
    headings,
    content,
    links: Array.from(new Set(links)), // Deduplicate
    assets,
    featuredImage,
    navigationLinks: navigationLinks.length > 0 ? navigationLinks : undefined
  };
}
