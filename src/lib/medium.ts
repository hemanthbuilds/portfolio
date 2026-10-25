/*
  Reads articles from a Medium account's RSS feed (https://medium.com/feed/@username).
  Runs on the server and is cached for a few hours, so new posts appear on the site on their own.
  If Medium can't be reached, it returns an empty list and the page shows its fallback.
*/

const REFRESH_SECONDS = 6 * 60 * 60; // re-check Medium for new posts every 6 hours
const EXCERPT_LENGTH = 180;

export type Article = {
  title: string;
  url: string;
  date: string; // ISO date
  tags: string[];
  image?: string;
  excerpt: string;
};

export async function getMediumArticles(username: string): Promise<Article[]> {
  try {
    const response = await fetch(`https://medium.com/feed/@${username}`, {
      next: { revalidate: REFRESH_SECONDS },
      headers: { "User-Agent": "Mozilla/5.0 (portfolio site)" },
    });
    if (!response.ok) throw new Error(`Medium feed responded ${response.status}`);
    return parseFeed(await response.text());
  } catch (error) {
    console.error("[medium]", error);
    return [];
  }
}

function parseFeed(xml: string): Article[] {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(([, item]) => {
    const content = field(item, "content:encoded");
    return {
      title: field(item, "title"),
      url: field(item, "link").split("?")[0], // drop Medium's tracking query
      date: new Date(field(item, "pubDate")).toISOString(),
      tags: [...item.matchAll(/<category>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/category>/g)].map(([, tag]) => tag),
      image: content.match(/<img[^>]+src="([^"]+)"/)?.[1],
      excerpt: excerpt(content),
    };
  });
}

// The text inside <name>…</name>, with or without a CDATA wrapper.
function field(item: string, name: string) {
  const match = item.match(new RegExp(`<${name}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${name}>`));
  return match?.[1].trim() ?? "";
}

// First bit of the article's body text: skip images, captions and headings, strip HTML.
function excerpt(html: string) {
  const text = html
    .replace(/<figure[\s\S]*?<\/figure>/g, " ")
    .replace(/<h[1-6][\s\S]*?<\/h[1-6]>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&rsquo;|&lsquo;/g, "'")
    .replace(/&quot;|&ldquo;|&rdquo;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= EXCERPT_LENGTH) return text;
  return `${text.slice(0, text.lastIndexOf(" ", EXCERPT_LENGTH))}…`;
}
