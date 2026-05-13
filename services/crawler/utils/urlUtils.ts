export function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    // Remove hash and trailing slash to prevent treating example.com/ and example.com/# as different pages
    return u.origin + u.pathname.replace(/\/$/, '') + u.search;
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
