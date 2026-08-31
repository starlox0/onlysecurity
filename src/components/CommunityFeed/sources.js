import {detectPublication, estimateReadingMinutes} from './publications';

const RSS2JSON_API_KEY = 'mnyhvyd3fr8eddefeq8wv4avbtzqqpmf3os2ujzq';

function stripHtml(html) {
  if (typeof window === 'undefined' || !html) return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
}

function extractImageFromHtml(html) {
  if (!html) return null;
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

function excerptFromHtml(html, max = 140) {
  const text = stripHtml(html);
  if (text.length <= max) return text;
  return text.slice(0, max).replace(/\s+\S*$/, '') + '\u2026';
}

async function fetchViaRss2Json(feedUrl, count) {
  const encoded = encodeURIComponent(feedUrl);
  const keyParam = RSS2JSON_API_KEY ? `&api_key=${RSS2JSON_API_KEY}` : '';
  const res = await fetch(
    `https://api.rss2json.com/v1/api.json?rss_url=${encoded}&count=${count}${keyParam}`,
  );
  if (!res.ok) throw new Error(`rss2json responded ${res.status}`);
  const data = await res.json();
  if (data.status !== 'ok') throw new Error(data.message || 'feed error');
  return data.items || [];
}

// --- Medium (via rss2json, as before) ------------------------------------

function mapMediumItem(item) {
  const rawContent = item.content || item.description || '';
  return {
    source: 'medium',
    title: item.title,
    link: item.link,
    author: item.author,
    date: item.pubDate,
    image: item.thumbnail || extractImageFromHtml(rawContent),
    excerpt: excerptFromHtml(rawContent),
    readingMinutes: estimateReadingMinutes(rawContent),
    publication: detectPublication(item.link),
    categories: item.categories || [],
    reactions: null,
    comments: null,
  };
}

export async function fetchMediumTag(tag, count) {
  const items = await fetchViaRss2Json(`https://medium.com/feed/tag/${tag}`, count);
  return items.map(mapMediumItem);
}

export async function fetchMediumAuthor(handle, count) {
  const items = await fetchViaRss2Json(`https://medium.com/feed/@${handle}`, count);
  return items.map(mapMediumItem);
}

// --- dev.to ----------------------------------------------------------------
// dev.to's public REST API is unauthenticated and CORS-enabled for any
// origin (confirmed in Forem's own docs) — no proxy needed. It also
// genuinely returns real engagement numbers (reactions, comments), unlike
// Medium's RSS, which has neither.

export async function fetchDevToTag(tag, count = 15) {
  const res = await fetch(
    `https://dev.to/api/articles?tag=${encodeURIComponent(tag)}&per_page=${count}`,
  );
  if (!res.ok) throw new Error(`dev.to responded ${res.status}`);
  const items = await res.json();
  return items.map((item) => ({
    source: 'devto',
    title: item.title,
    link: item.url,
    author: item.user?.name || item.user?.username || null,
    date: item.published_at || item.published_timestamp,
    image: item.cover_image || item.social_image || null,
    excerpt: item.description || '',
    readingMinutes: item.reading_time_minutes || null,
    publication: null,
    categories: item.tag_list || [],
    reactions:
      typeof item.public_reactions_count === 'number'
        ? item.public_reactions_count
        : (item.positive_reactions_count ?? null),
    comments: typeof item.comments_count === 'number' ? item.comments_count : null,
  }));
}

// --- Google Project Zero ----------------------------------------------------
// Project Zero's site migrated from googleprojectzero.blogspot.com to a
// custom static site at projectzero.google. Their new site's exact feed
// URL couldn't be verified directly, so this uses the legacy Blogger feed
// path — Blogger typically keeps serving it for compatibility even after a
// custom-domain migration. If that assumption is wrong, this fails
// gracefully like any other source (see the error state in index.js),
// it won't break the rest of the feed.

const PROJECT_ZERO_FEED = 'https://googleprojectzero.blogspot.com/feeds/posts/default?alt=rss';

export async function fetchProjectZero(count = 10) {
  const items = await fetchViaRss2Json(PROJECT_ZERO_FEED, count);
  return items.map((item) => {
    const rawContent = item.content || item.description || '';
    return {
      source: 'projectzero',
      title: item.title,
      link: item.link,
      author: item.author || 'Project Zero',
      date: item.pubDate,
      image: extractImageFromHtml(rawContent),
      excerpt: excerptFromHtml(rawContent),
      readingMinutes: estimateReadingMinutes(rawContent),
      publication: {name: 'Project Zero', followers: null},
      categories: item.categories || [],
      reactions: null,
      comments: null,
    };
  });
}
