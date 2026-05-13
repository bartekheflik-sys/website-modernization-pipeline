import * as cheerio from 'cheerio';
import TurndownService from 'turndown';

const turndownService = new TurndownService({ headingStyle: 'atx' });
turndownService.remove(['script', 'style', 'noscript', 'iframe', 'nav', 'footer', 'header']);

export interface ExtractedPageData {
  url: string;
  title: string;
  description: string;
  headings: string[];
  content: string; // Markdown content
  links: string[];
  images: Array<{ url: string; type: 'logo' | 'hero' | 'content' }>;
}

export function extractPageData(html: string, url: string): ExtractedPageData {
  const $ = cheerio.load(html);
  
  const title = $('title').text() || '';
  const description = $('meta[name="description"]').attr('content') || '';
  
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

  const images: ExtractedPageData['images'] = [];
  $('img[src]').each((_, el) => {
    let src = $(el).attr('src');
    if (src) {
      try {
        src = new URL(src, url).toString();
      } catch {}
      let type: 'logo' | 'hero' | 'content' = 'content';
      const classOrId = ($(el).attr('class') || '') + ' ' + ($(el).attr('id') || '') + ' ' + src;
      const lower = classOrId.toLowerCase();
      
      if (lower.includes('logo')) type = 'logo';
      else if (lower.includes('hero') || lower.includes('banner')) type = 'hero';
      
      images.push({ url: src, type });
    }
  });

  // Extract main content by removing boilerplate
  $('nav, footer, header, script, style, noscript, aside').remove();
  const mainHtml = $('main').length ? $('main').html() : $('body').html();
  const content = mainHtml ? turndownService.turndown(mainHtml) : '';

  return {
    url,
    title,
    description,
    headings,
    content,
    links: Array.from(new Set(links)), // Deduplicate
    images
  };
}
