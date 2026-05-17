import * as cheerio from 'cheerio';
import TurndownService from 'turndown';

const turndownService = new TurndownService({ headingStyle: 'atx' });
turndownService.remove(['script', 'style', 'noscript', 'iframe', 'nav', 'footer', 'header']);

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

  const assets: ExtractedAsset[] = [];

  // Extract standard images
  $('img[src]').each((_, el) => {
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
    assets
  };
}
