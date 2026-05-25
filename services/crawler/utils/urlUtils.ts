export function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    // Remove hash and trailing slash to prevent treating example.com/ and example.com/# as different pages
    const pathname = u.pathname.replace(/\/$/, '');
    
    // Clean search params to avoid duplicate mobile/desktop or tracking page variants
    const params = new URLSearchParams(u.search);
    params.delete('m');
    params.delete('utm_source');
    params.delete('utm_medium');
    params.delete('utm_campaign');
    params.delete('utm_term');
    params.delete('utm_content');
    params.delete('fbclid');
    
    const searchStr = params.toString();
    return u.origin + pathname + (searchStr ? `?${searchStr}` : '');
  } catch {
    return url;
  }
}

export function isSameDomain(base: string, target: string): boolean {
  try {
    const b = new URL(base);
    const t = new URL(target);
    return b.hostname === t.hostname || t.hostname.endsWith(`.${b.hostname}`);
  } catch {
    return false;
  }
}
