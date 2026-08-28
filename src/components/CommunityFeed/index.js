import React, {useEffect, useState} from 'react';
import styles from './styles.module.css';

// --- Configuration -------------------------------------------------------
// Free, no-signup usage of rss2json shares a public rate-limit pool across
// everyone who doesn't set a key, which can make this feed unreliable under
// load. Get a free key at https://rss2json.com/ (no cost, just an email)
// and paste it here for a private quota — the feed works without one, just
// less reliably.
const RSS2JSON_API_KEY = 'mnyhvyd3fr8eddefeq8wv4avbtzqqpmf3os2ujzq';

// Medium tag feeds are public and unauthenticated: https://medium.com/feed/tag/<tag>
// Add or remove tags here to change what shows up.
const SOURCE_TAGS = ['bug-bounty', 'penetration-testing', 'cybersecurity', 'infosec'];

const ITEMS_PER_TAG = 8;
const MAX_ITEMS = 9;
const CACHE_KEY = 'os-community-feed-v1';
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

function stripHtml(html) {
  if (typeof window === 'undefined') return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
}

function extractImage(item) {
  if (item.thumbnail) return item.thumbnail;
  const source = item.content || item.description || '';
  const match = source.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

function excerpt(html, max = 140) {
  const text = stripHtml(html);
  if (text.length <= max) return text;
  return text.slice(0, max).replace(/\s+\S*$/, '') + '\u2026';
}

async function fetchTag(tag) {
  const feedUrl = encodeURIComponent(`https://medium.com/feed/tag/${tag}`);
  const keyParam = RSS2JSON_API_KEY ? `&api_key=${RSS2JSON_API_KEY}` : '';
  const res = await fetch(
    `https://api.rss2json.com/v1/api.json?rss_url=${feedUrl}&count=${ITEMS_PER_TAG}${keyParam}`,
  );
  if (!res.ok) throw new Error(`rss2json responded ${res.status}`);
  const data = await res.json();
  if (data.status !== 'ok') throw new Error(data.message || 'feed error');
  return data.items || [];
}

export default function CommunityFeed() {
  const [state, setState] = useState({status: 'loading', posts: []});

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // Serve from a short-lived cache first so repeat visits (and repeat
      // tab-switches within one visit) don't burn extra API calls.
      try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
          const {timestamp, posts} = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_TTL_MS && posts.length > 0) {
            setState({status: 'ready', posts});
            return;
          }
        }
      } catch {
        // sessionStorage unavailable or corrupt cache — fall through to a fresh fetch.
      }

      try {
        const results = await Promise.allSettled(SOURCE_TAGS.map(fetchTag));
        const merged = results
          .filter((r) => r.status === 'fulfilled')
          .flatMap((r) => r.value);

        if (merged.length === 0) throw new Error('all feeds failed');

        const seen = new Set();
        const posts = merged
          .filter((item) => {
            if (seen.has(item.link)) return false;
            seen.add(item.link);
            return true;
          })
          .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
          .slice(0, MAX_ITEMS)
          .map((item) => ({
            title: item.title,
            link: item.link,
            author: item.author,
            date: item.pubDate,
            image: extractImage(item),
            excerpt: excerpt(item.description || item.content || ''),
          }));

        if (cancelled) return;
        setState({status: 'ready', posts});
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({timestamp: Date.now(), posts}));
        } catch {
          // ignore quota errors
        }
      } catch (err) {
        if (!cancelled) setState({status: 'error', posts: []});
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === 'loading') {
    return (
      <div className={styles.grid}>
        {Array.from({length: 6}).map((_, i) => (
          <div key={i} className={styles.skeletonCard} aria-hidden="true">
            <div className={styles.skeletonImage} />
            <div className={styles.skeletonLine} />
            <div className={styles.skeletonLineShort} />
          </div>
        ))}
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyStateTitle}>Couldn't load the live feed right now.</p>
        <p className={styles.emptyStateBody}>
          This pulls live from public Medium tags via a third-party proxy, which
          occasionally rate-limits or times out. Try refreshing, or browse the
          tags directly in the meantime.
        </p>
        <div className={styles.tagLinks}>
          {SOURCE_TAGS.map((tag) => (
            
              key={tag}
              href={`https://medium.com/tag/${tag}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.tagLink}>
              #{tag}
            </a>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {state.posts.map((post) => (
        
          key={post.link}
          href={post.link}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.card}>
          <div className={styles.imageWrap}>
            {post.image ? (
              <img src={post.image} alt="" loading="lazy" className={styles.image} />
            ) : (
              <div className={styles.imagePlaceholder} />
            )}
          </div>
          <div className={styles.body}>
            <h3 className={styles.title}>{post.title}</h3>
            <p className={styles.excerpt}>{post.excerpt}</p>
            <span className={styles.meta}>
              {post.author ? `${post.author} · ` : ''}Read on Medium →
            </span>
          </div>
        </a>
      ))}
    </div>
  );
}
