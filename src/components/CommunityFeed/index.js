import React, {useCallback, useEffect, useMemo, useState} from 'react';
import styles from './styles.module.css';

// --- Configuration -------------------------------------------------------
// Free, no-signup usage of rss2json shares a public rate-limit pool across
// everyone who doesn't set a key, which can make this feed unreliable under
// load. Get a free key at https://rss2json.com/ (no cost, just an email)
// and paste it here for a private quota — the feed works without one, just
// less reliably.
const RSS2JSON_API_KEY = 'mnyhvyd3fr8eddefeq8wv4avbtzqqpmf3os2ujzq';

// Medium tag feeds are public and unauthenticated: https://medium.com/feed/tag/<tag>
const DEFAULT_TAGS = ['bug-bounty', 'penetration-testing', 'cybersecurity', 'infosec'];
const MAX_TAGS = 8; // cap simultaneous requests — each tag is one network call

const ITEMS_PER_TAG = 15; // pull a deep pool upfront so "See more" needs no extra calls
const INITIAL_VISIBLE = 9;
const LOAD_MORE_STEP = 9;

const TAGS_STORAGE_KEY = 'os-community-tags-v1';
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

function loadSavedTags() {
  try {
    const raw = localStorage.getItem(TAGS_STORAGE_KEY);
    if (!raw) return DEFAULT_TAGS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_TAGS;
  } catch {
    return DEFAULT_TAGS;
  }
}

function sanitizeTag(input) {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

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
  const [tags, setTags] = useState(DEFAULT_TAGS);
  const [tagInput, setTagInput] = useState('');
  const [tagError, setTagError] = useState('');
  const [state, setState] = useState({status: 'loading', posts: []});
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  // Load any saved custom tags once, on mount, in the browser only.
  useEffect(() => {
    setTags(loadSavedTags());
  }, []);

  const cacheKey = useMemo(() => `os-community-feed-v2:${[...tags].sort().join(',')}`, [tags]);

  const load = useCallback(
    async (forceFresh = false) => {
      setState({status: 'loading', posts: []});
      setVisibleCount(INITIAL_VISIBLE);

      if (!forceFresh) {
        try {
          const cached = sessionStorage.getItem(cacheKey);
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
      }

      try {
        const results = await Promise.allSettled(tags.map(fetchTag));
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
          .map((item) => ({
            title: item.title,
            link: item.link,
            author: item.author,
            date: item.pubDate,
            image: extractImage(item),
            excerpt: excerpt(item.description || item.content || ''),
          }));

        setState({status: 'ready', posts});
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify({timestamp: Date.now(), posts}));
        } catch {
          // ignore quota errors
        }
      } catch (err) {
        setState({status: 'error', posts: []});
      }
    },
    [tags, cacheKey],
  );

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tags]);

  function handleAddTag(e) {
    e.preventDefault();
    const clean = sanitizeTag(tagInput);
    if (!clean) {
      setTagError('Enter a tag using letters, numbers, and hyphens.');
      return;
    }
    if (tags.includes(clean)) {
      setTagError('Already following that tag.');
      return;
    }
    if (tags.length >= MAX_TAGS) {
      setTagError(`You can follow up to ${MAX_TAGS} tags at once.`);
      return;
    }
    const next = [...tags, clean];
    setTags(next);
    try {
      localStorage.setItem(TAGS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore storage errors (private browsing, quota, etc.)
    }
    setTagInput('');
    setTagError('');
  }

  function handleRemoveTag(tag) {
    if (tags.length === 1) {
      setTagError('Keep at least one tag.');
      return;
    }
    const next = tags.filter((t) => t !== tag);
    setTags(next);
    try {
      localStorage.setItem(TAGS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
  }

  function handleResetTags() {
    setTags(DEFAULT_TAGS);
    try {
      localStorage.removeItem(TAGS_STORAGE_KEY);
    } catch {
      // ignore storage errors
    }
    setTagError('');
  }

  const isCustomized =
    tags.length !== DEFAULT_TAGS.length || tags.some((t) => !DEFAULT_TAGS.includes(t));

  return (
    <div>
      <form className={styles.tagBar} onSubmit={handleAddTag}>
        <div className={styles.tagChips}>
          {tags.map((tag) => (
            <span key={tag} className={styles.tagChip}>
              #{tag}
              <button
                type="button"
                className={styles.tagChipRemove}
                onClick={() => handleRemoveTag(tag)}
                aria-label={`Stop following ${tag}`}>
                ×
              </button>
            </span>
          ))}
        </div>
        <div className={styles.tagInputRow}>
          <input
            type="text"
            value={tagInput}
            onChange={(e) => {
              setTagInput(e.target.value);
              setTagError('');
            }}
            placeholder="add a tag, e.g. cloud-security"
            className={styles.tagInput}
            aria-label="Add a Medium tag to follow"
          />
          <button type="submit" className={styles.tagAddButton}>
            Add
          </button>
          {isCustomized && (
            <button type="button" className={styles.tagResetButton} onClick={handleResetTags}>
              Reset
            </button>
          )}
        </div>
        {tagError && <p className={styles.tagError}>{tagError}</p>}
      </form>

      {state.status === 'loading' && (
        <div className={styles.grid}>
          {Array.from({length: 6}).map((_, i) => (
            <div key={i} className={styles.skeletonCard} aria-hidden="true">
              <div className={styles.skeletonImage} />
              <div className={styles.skeletonLine} />
              <div className={styles.skeletonLineShort} />
            </div>
          ))}
        </div>
      )}

      {state.status === 'error' && (
        <div className={styles.emptyState}>
          <p className={styles.emptyStateTitle}>Couldn't load the live feed right now.</p>
          <p className={styles.emptyStateBody}>
            This pulls live from public Medium tags via a third-party proxy, which
            occasionally rate-limits or times out.
          </p>
          <button type="button" className={styles.retryButton} onClick={() => load(true)}>
            Try again
          </button>
        </div>
      )}

      {state.status === 'ready' && (
        <>
          <div className={styles.grid}>
            {state.posts.slice(0, visibleCount).map((post) => (
              <a
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

          {visibleCount < state.posts.length && (
            <div className={styles.loadMoreRow}>
              <button
                type="button"
                className={styles.loadMoreButton}
                onClick={() => setVisibleCount((c) => c + LOAD_MORE_STEP)}>
                See more ({state.posts.length - visibleCount} more)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
