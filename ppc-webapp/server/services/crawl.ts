// ════════════════════════════════════════════════════════════════
// Website Crawl Service — Fetch & extract text content from a URL
// ════════════════════════════════════════════════════════════════

export interface CrawlResult {
  url: string;
  title: string;
  metaDescription: string;
  headings: string[];
  bodyText: string;
  links: string[];
  linkUrls: string[];
  success: boolean;
  error?: string;
}

/**
 * Fetch a URL and extract structured text content.
 * Strips HTML tags and returns title, meta, headings, and body text.
 */
export async function crawlWebsite(url: string): Promise<CrawlResult> {
  const empty: CrawlResult = {
    url,
    title: "",
    metaDescription: "",
    headings: [],
    bodyText: "",
    links: [],
    linkUrls: [],
    success: false,
  };

  try {
    // Normalise URL
    let normalised = url.trim();
    if (!normalised.startsWith("http://") && !normalised.startsWith("https://")) {
      normalised = "https://" + normalised;
    }

    const response = await fetch(normalised, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; OrionBot/1.0; +https://orion.app)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return { ...empty, error: `HTTP ${response.status}: ${response.statusText}` };
    }

    const html = await response.text();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? decodeEntities(titleMatch[1].trim()) : "";

    // Extract meta description
    const metaMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["'][^>]*>/i)
      || html.match(/<meta[^>]*content=["']([\s\S]*?)["'][^>]*name=["']description["'][^>]*>/i);
    const metaDescription = metaMatch ? decodeEntities(metaMatch[1].trim()) : "";

    // Extract headings (h1-h3)
    const headingRegex = /<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi;
    const headings: string[] = [];
    let hMatch;
    while ((hMatch = headingRegex.exec(html)) !== null) {
      const text = stripTags(hMatch[1]).trim();
      if (text && text.length < 200) headings.push(text);
    }

    // Extract links (text + URLs)
    const linkRegex = /<a[^>]*href=["']([\s\S]*?)["'][^>]*>([\s\S]*?)<\/a>/gi;
    const links: string[] = [];
    const linkUrls: string[] = [];
    let linkMatch;
    while ((linkMatch = linkRegex.exec(html)) !== null) {
      const href = linkMatch[1].trim();
      const text = stripTags(linkMatch[2]).trim();
      if (text && text.length > 2 && text.length < 100) links.push(text);
      if (href && !href.startsWith("#") && !href.startsWith("mailto:") && !href.startsWith("javascript:") && !href.startsWith("tel:")) {
        try {
          const resolved = new URL(href, normalised).href;
          linkUrls.push(resolved);
        } catch { /* skip invalid URLs */ }
      }
    }

    // Extract body text — remove scripts, styles, nav, footer, then strip tags
    let body = html;
    body = body.replace(/<script[\s\S]*?<\/script>/gi, "");
    body = body.replace(/<style[\s\S]*?<\/style>/gi, "");
    body = body.replace(/<nav[\s\S]*?<\/nav>/gi, "");
    body = body.replace(/<footer[\s\S]*?<\/footer>/gi, "");
    body = body.replace(/<header[\s\S]*?<\/header>/gi, "");
    body = body.replace(/<noscript[\s\S]*?<\/noscript>/gi, "");
    body = body.replace(/<svg[\s\S]*?<\/svg>/gi, "");

    const bodyText = stripTags(body)
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 15000); // Cap at 15k chars for LLM context

    return {
      url: normalised,
      title,
      metaDescription,
      headings: headings.slice(0, 30),
      bodyText,
      links: [...new Set(links)].slice(0, 50),
      linkUrls: [...new Set(linkUrls)].slice(0, 200),
      success: true,
    };
  } catch (err: any) {
    const message = err?.name === "TimeoutError"
      ? "Request timed out after 15 seconds"
      : err?.message || "Unknown crawl error";
    return { ...empty, error: message };
  }
}

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ");
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}
