export interface CompressOptions {
  maxTokens?: number;
  priorityPages?: string[];
}

export interface CompressedContext {
  unifiedMarkdown: string;
  originalTokens: number;
  compressedTokens: number;
  compressionRatio: number;
  pagesProcessed: number;
}

export class ContextCompressor {
  // Simple heuristic token estimator: ~4 chars per token for English/Markdown
  static estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  static compress(pages: { url: string; title: string; content?: string; markdown_content?: string }[], options: CompressOptions = {}): CompressedContext {
    const maxTokens = options.maxTokens || 800000; // Gemini 1.5 Flash default limit buffer
    let totalOriginalTokens = 0;
    let totalCompressedTokens = 0;
    
    // Priorities
    const highPriorityKeywords = ['services', 'menu', 'pricing', 'about', 'contact', 'home'];
    const boilerplateRegexes = [
      /cookie policy|privacy policy|terms of service/i,
      /all rights reserved|© \d{4}/i,
    ];

    // Track seen footers and navigation blocks to deduplicate
    const seenBlocks = new Set<string>();

    let unifiedMarkdown = '';

    // Sort pages: high priority first
    const sortedPages = [...pages].sort((a, b) => {
      const aPrio = highPriorityKeywords.some(kw => a.url.toLowerCase().includes(kw)) ? 1 : 0;
      const bPrio = highPriorityKeywords.some(kw => b.url.toLowerCase().includes(kw)) ? 1 : 0;
      return bPrio - aPrio;
    });

    for (const page of sortedPages) {
      const rawContent = (page as any).content || (page as any).markdown_content || '';
      const originalTokens = this.estimateTokens(rawContent);
      totalOriginalTokens += originalTokens;

      // 1. Strip boilerplate
      let cleanedContent = rawContent;
      boilerplateRegexes.forEach(regex => {
        // Strip out paragraphs or blocks matching boilerplate
        cleanedContent = cleanedContent.replace(new RegExp(`^.*${regex.source}.*$`, 'gim'), '');
      });

      // 2. Navigation/Footer deduplication (Simple block hashing approach)
      const blocks = cleanedContent.split('\n\n');
      const uniqueBlocks = blocks.filter((block: string) => {
        // Only deduplicate large repetitive lists (like navigation links at bottom)
        if (block.includes('* [') && block.split('\n').length > 5) {
          const blockHash = this.hashBlock(block);
          if (seenBlocks.has(blockHash)) return false;
          seenBlocks.add(blockHash);
        }
        return true;
      });

      cleanedContent = uniqueBlocks.join('\n\n').trim();

      // 3. Size limits
      let compressedTokens = this.estimateTokens(cleanedContent);
      
      // If adding this page exceeds context budget, we either chunk or skip if low priority
      if (totalCompressedTokens + compressedTokens > maxTokens) {
        if (totalCompressedTokens >= maxTokens) break; // Budget completely full
        
        // Truncate to fit remaining budget
        const remainingChars = (maxTokens - totalCompressedTokens) * 4;
        cleanedContent = cleanedContent.substring(0, remainingChars) + '\n\n...[CONTENT TRUNCATED FOR CONTEXT BUDGET]...';
        compressedTokens = this.estimateTokens(cleanedContent);
      }

      unifiedMarkdown += `==================================================\n`;
      unifiedMarkdown += `PAGE: ${page.title || 'Untitled Page'}\n`;
      unifiedMarkdown += `URL: ${page.url}\n`;
      unifiedMarkdown += `==================================================\n\n`;
      unifiedMarkdown += cleanedContent;
      unifiedMarkdown += `\n\n`;

      totalCompressedTokens += compressedTokens;
    }

    return {
      unifiedMarkdown,
      originalTokens: totalOriginalTokens,
      compressedTokens: totalCompressedTokens,
      compressionRatio: totalOriginalTokens > 0 ? (totalOriginalTokens - totalCompressedTokens) / totalOriginalTokens : 0,
      pagesProcessed: sortedPages.length
    };
  }

  private static hashBlock(block: string): string {
    // Simple string hash
    let hash = 0;
    for (let i = 0; i < block.length; i++) {
      const char = block.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString();
  }
}
