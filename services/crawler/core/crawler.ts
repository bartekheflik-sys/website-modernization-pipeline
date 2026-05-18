import { chromium, Browser } from 'playwright';
import { normalizeUrl, isSameDomain } from '../utils/urlUtils';
import { extractPageData } from '../extractors/pageExtractor';
import { saveCrawledPage } from '../storage/supabase';

export interface CrawlerOptions {
  projectId: string;
  startUrl: string;
  maxPages?: number;
  maxDepth?: number;
  concurrency?: number;
  targetTable?: 'pages' | 'modernized_pages';
}

export class WebCrawler {
  private visited = new Set<string>();
  private queue: Array<{ url: string; depth: number }> = [];
  private options: Required<CrawlerOptions>;
  private activeCrawls = 0;
  private pagesCrawled = 0;
  private browser: Browser | null = null;

  constructor(options: CrawlerOptions) {
    this.options = {
      maxPages: 30, // Limit to prevent infinite crawls
      maxDepth: 3,  // Prevent crawling too deep
      concurrency: 3, // Parallel pages
      targetTable: 'pages',
      ...options
    };
  }

  public async start(): Promise<number> {
    const { startUrl } = this.options;
    const normalizedStart = normalizeUrl(startUrl);
    this.visited.add(normalizedStart);
    this.queue.push({ url: normalizedStart, depth: 0 });

    this.browser = await chromium.launch({ headless: true });

    try {
      await this.processQueue();
    } finally {
      await this.browser.close();
    }
    return this.pagesCrawled;
  }

  private async processQueue() {
    while ((this.queue.length > 0 || this.activeCrawls > 0) && this.pagesCrawled < this.options.maxPages) {
      if (this.queue.length === 0 || this.activeCrawls >= this.options.concurrency) {
        await new Promise(r => setTimeout(r, 100)); // wait for active crawls
        continue;
      }

      const item = this.queue.shift();
      if (!item) continue;

      this.activeCrawls++;
      this.pagesCrawled++;

      this.crawlPage(item.url, item.depth).finally(() => {
        this.activeCrawls--;
      });
    }

    // Wait for remaining active crawls to finish gracefully
    while (this.activeCrawls > 0) {
      await new Promise(r => setTimeout(r, 100));
    }
  }

  private async crawlPage(url: string, depth: number) {
    console.log(`[Crawler] Visiting: ${url} (Depth: ${depth})`);
    if (!this.browser) return;

    const page = await this.browser.newPage();

    try {
      // Basic rate limiting/politeness delay between requests
      await new Promise(r => setTimeout(r, 500));

      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      if (!response || !response.ok()) {
        console.warn(`[Crawler] Failed or Redirected ${url}: ${response?.status()}`);
        return;
      }

      const html = await page.content();
      const extractedData = extractPageData(html, url);

      // Enhance assets with dimensions using Playwright
      const assetsWithDimensions = await page.evaluate((assets) => {
        return assets.map(asset => {
          if (asset.type === 'image') {
            const img = document.querySelector(`img[src="${asset.url}"]`) as HTMLImageElement;
            if (img) {
              return {
                ...asset,
                dimensions: {
                  width: img.naturalWidth || img.width,
                  height: img.naturalHeight || img.height
                }
              };
            }
          }
          return asset;
        });
      }, extractedData.assets);

      extractedData.assets = assetsWithDimensions;

      // Save directly to Supabase via our storage adapter
      await saveCrawledPage(this.options.projectId, extractedData, this.options.targetTable);

      // Add discovered links to queue if within depth limit
      if (depth < this.options.maxDepth) {
        console.log(`[Crawler] Found ${extractedData.links.length} links on ${url}`);
        for (const link of extractedData.links) {
          const normalized = normalizeUrl(link);
          const sameDomain = isSameDomain(this.options.startUrl, normalized);
          const alreadyVisited = this.visited.has(normalized);

          if (sameDomain && !alreadyVisited) {
            this.visited.add(normalized); // Prevent duplicate queuing
            this.queue.push({ url: normalized, depth: depth + 1 });
          } else if (!sameDomain) {
            // console.log(`[Crawler] Skipping external link: ${normalized}`);
          }
        }
      }
    } catch (error) {
      console.error(`[Crawler] Error crawling ${url}:`, error instanceof Error ? error.message : error);
    } finally {
      await page.close();
    }
  }
}
