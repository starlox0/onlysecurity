const HACKERNEWS_FEED = 'https://feeds.feedburner.com/TheHackersNews';
const RSS2JSON_API_KEY = 'mnyhvyd3fr8eddefeq8wv4avbtzqqpmf3os2ujzq';

const CACHE_KEY = 'os-threatwire-feed-v1';
const CACHE_TTL_MS = 15 * 60 * 1000;

const LAST_SEEN_KEY = 'os-threatwire-last-seen-v1';

function stripHtml(html) {
  if (typeof window === 'undefined' || !html) return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
}

function excerptFromHtml(html, max = 180) {
  const text = stripHtml(html);
  if (text.length <= max) return text;
  return text.slice(0, max).replace(/\s+\S*$/, '') + '\u2026';
}

// Tag heuristics run against the title (occasionally the excerpt too) —
// good enough to sort a news list into scannable buckets without needing
// a real classifier. First match wins, checked in roughly "most specific
// first" order so e.g. a ransomware breach reads as Ransomware, not the
// more generic Data Breach.
const TAG_RULES = [
  {tag: 'Ransomware', tone: 'danger', test: /ransomware/i},
  {tag: 'Zero-Day', tone: 'danger', test: /zero-day|zero day|0-day/i},
  {
    tag: 'Data Breach',
    tone: 'danger',
    test: /breach|leaked|exposed|stolen data|data of|records exposed/i,
  },
  {
    tag: 'Nation-State',
    tone: 'amber',
    test: /nation-state|nexus|APT|state-sponsored|China-linked|Russia-aligned|Iranian|North Korea/i,
  },
  {
    tag: 'Vulnerability',
    tone: 'amber',
    test: /vulnerability|flaw|CVE-|RCE|patch(es)?|exploit/i,
  },
  {
    tag: 'Malware',
    tone: 'neutral',
    test: /malware|trojan|backdoor|\bRAT\b|botnet|worm|spyware|infostealer/i,
  },
  {tag: 'Phishing', tone: 'neutral', test: /phishing|clickfix|social engineering/i},
];

export function getTag(item) {
  const haystack = `${item.title} ${item.excerpt || ''}`;
  for (const rule of TAG_RULES) {
    if (rule.test.test(haystack)) return {tag: rule.tag, tone: rule.tone};
  }
  return {tag: 'News', tone: 'neutral'};
}

const CVE_PATTERN = /CVE-\d{4}-\d{4,}/gi;

// Pulls any CVE IDs mentioned in the piece so a reader can jump straight to
// NVD (or this site's own CVE Radar) instead of re-searching for it.
export function getMentionedCves(item, max = 4) {
  const haystack = `${item.title} ${item.excerpt || ''}`;
  const found = haystack.match(CVE_PATTERN) || [];
  const unique = [...new Set(found.map((id) => id.toUpperCase()))];
  return unique.slice(0, max);
}

function readCache() {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    const {timestamp, data} = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_TTL_MS) return null;
    return data;
  } catch {
    return null;
  }
}

function writeCache(data) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({timestamp: Date.now(), data}));
  } catch {
    // ignore quota errors
  }
}

// Fetches and normalizes the feed. Shared by the Threat Wire page and the
// site-wide notification bell — sessionStorage caching means whichever
// mounts first pays the one network call, the other just reads the cache.
export async function fetchThreatWire(count = 30) {
  const cached = readCache();
  if (cached) return cached;

  const encoded = encodeURIComponent(HACKERNEWS_FEED);
  const keyParam = RSS2JSON_API_KEY ? `&api_key=${RSS2JSON_API_KEY}` : '';
  const res = await fetch(
    `https://api.rss2json.com/v1/api.json?rss_url=${encoded}&count=${count}${keyParam}`,
  );
  if (!res.ok) throw new Error(`rss2json responded ${res.status}`);
  const data = await res.json();
  if (data.status !== 'ok') throw new Error(data.message || 'feed error');

  const items = (data.items || []).map((item) => {
    const rawContent = item.content || item.description || '';
    const excerpt = excerptFromHtml(rawContent);
    const normalized = {
      title: item.title,
      link: item.link,
      guid: item.guid || item.link,
      date: item.pubDate,
      image: item.thumbnail || item.enclosure?.link || null,
      excerpt,
    };
    const {tag, tone} = getTag(normalized);
    return {...normalized, tag, tone, cves: getMentionedCves(normalized)};
  });

  writeCache(items);
  return items;
}

// --- Read-state (shared between the page and the notification bell) ------
// "Seen" is tracked by the newest article's publish timestamp the reader
// has been shown, not by an ID list — simpler, and self-correcting even if
// the feed's item set shifts around.

export function getLastSeenTimestamp() {
  try {
    const raw = localStorage.getItem(LAST_SEEN_KEY);
    return raw ? Number(raw) : 0;
  } catch {
    return 0;
  }
}

export function markSeenUpTo(timestampMs) {
  try {
    const current = getLastSeenTimestamp();
    if (timestampMs > current) {
      localStorage.setItem(LAST_SEEN_KEY, String(timestampMs));
    }
  } catch {
    // ignore write errors (private browsing, quota, etc.)
  }
}

export function markAllSeen(items) {
  const newest = items.reduce((max, item) => Math.max(max, new Date(item.date).getTime()), 0);
  if (newest > 0) markSeenUpTo(newest);
}

export function countUnseen(items) {
  const lastSeen = getLastSeenTimestamp();
  return items.filter((item) => new Date(item.date).getTime() > lastSeen).length;
}

// --- Relative time ---------------------------------------------------------

export function formatRelativeTime(dateInput, now = new Date()) {
  const date = new Date(dateInput);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString(undefined, {year: 'numeric', month: 'short', day: 'numeric'});
}
