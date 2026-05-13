/**
 * Page Matching Engine
 * Implements intelligent page matching between old and new websites.
 */

export interface PageMatch {
  oldPath: string;
  newPath: string;
  score: number; // 0-1
  isPerfectMatch: boolean;
}

export class PageMatcher {
  /**
   * Matches pages between two crawls using fuzzy logic and similarity scoring.
   */
  static matchPages(oldPaths: string[], newPaths: string[]): PageMatch[] {
    const matches: PageMatch[] = [];

    for (const oldPath of oldPaths) {
      const normalizedOld = this.normalizePath(oldPath);
      let bestMatch: PageMatch | null = null;

      for (const newPath of newPaths) {
        const normalizedNew = this.normalizePath(newPath);
        
        // 1. Exact Match
        if (normalizedOld === normalizedNew) {
          bestMatch = { oldPath, newPath, score: 1.0, isPerfectMatch: true };
          break;
        }

        // 2. Fuzzy Matching (Fuzzy mapping like /about-us -> /about)
        const score = this.calculateSimilarity(normalizedOld, normalizedNew);
        if (!bestMatch || score > bestMatch.score) {
          bestMatch = { oldPath, newPath, score, isPerfectMatch: false };
        }
      }

      if (bestMatch && bestMatch.score > 0.4) {
        matches.push(bestMatch);
      }
    }

    return matches;
  }

  private static normalizePath(url: string): string {
    try {
      // Extract path from full URL or relative path
      const path = url.includes('://') 
        ? new URL(url).pathname 
        : url;
        
      return path
        .toLowerCase()
        .replace(/\/$/, '') // Remove trailing slash
        .replace(/^\//, '') // Remove leading slash
        .split(/[?#]/)[0];  // Remove query params/hash
    } catch (e) {
      return url.toLowerCase();
    }
  }

  private static calculateSimilarity(s1: string, s2: string): number {
    // Simple common-prefix/substring logic for V1
    if (s1.includes(s2) || s2.includes(s1)) return 0.8;
    
    // Check for common aliases
    const aliases: Record<string, string[]> = {
      'about': ['about-us', 'company', 'our-story', 'cegunkrol'],
      'contact': ['contact-us', 'reach-out', 'get-in-touch', 'elerhetosegek'],
      'services': ['solutions', 'what-we-do', 'products', 'termekek'],
    };

    for (const [key, list] of Object.entries(aliases)) {
      if ((s1 === key || list.includes(s1)) && (s2 === key || list.includes(s2))) {
        return 0.9;
      }
    }

    return 0;
  }
}
