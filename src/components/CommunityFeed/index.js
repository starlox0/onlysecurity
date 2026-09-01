import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {fetchMediumTag, fetchMediumAuthor, fetchDevToTag, fetchProjectZero} from './sources';
import PostCard from './PostCard';
import styles from './styles.module.css';

// Each source keeps its own tag list, since tag naming conventions differ
// (Medium tags are hyphenated multi-word, dev.to tags are single words).
const DEFAULT_MEDIUM_TAGS = ['bug-bounty', 'penetration-testing', 'cybersecurity', 'infosec'];
const DEFAULT_DEVTO_TAGS = ['security', 'cybersecurity', 'hacking', 'infosec'];
const MAX_TAGS = 8; // cap simultaneous requests per source — each tag is one network call

const ITEMS_PER_TAG = 15; // pull a deep pool upfront so "See more" needs no extra calls
const INITIAL_VISIBLE = 9;
const LOAD_MORE_STEP = 9;

const MEDIUM_TAGS_KEY = 'os-community-tags-v1';
const DEVTO_TAGS_KEY = 'os-community-devto-tags-v1';
const SOURCES_KEY = 'os-community-sources-v1';
const SAVED_STORAGE_KEY = 'os-community-saved-v1';
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

const DEFAULT_SOURCES = {medium: true, devto: true, projectzero: true};

function loadTags(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function loadSources() {
  try {
    const raw = localStorage.getItem(SOURCES_KEY);
    if (!raw) return DEFAULT_SOURCES;
    const parsed = JSON.parse(raw);
    return {...DEFAULT_SOURCES, ...parsed};
  } catch {
    return DEFAULT_SOURCES;
  }
}

function loadSavedPosts() {
  try {
    const raw = localStorage.getItem(SAVED_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function sanitizeTag(input) {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

// dev.to tags are single lowercase words/numbers only, no hyphens.
function sanitizeDevToTag(input) {
  return input.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Loose sanitizer for a directly-typed handle guess — Medium handles are
// lowercase alphanumeric plus - _ . with no spaces.
function sanitizeHandleGuess(input) {
  return input
    .trim()
    .replace(/^@/, '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9_.-]/g, '');
}

// Medium personal-profile URLs look like medium.com/@handle/slug — this
// extracts the handle so we can fetch that author's own feed directly.
// Posts published only under a publication's custom domain (no @handle in
// the URL) simply won't match, which is a real limitation, not a bug.
function extractMediumHandle(link) {
  if (!link) return null;
  const match = link.match(/medium\.com\/@([a-zA-Z0-9_.-]+)/);
  return match ? match[1] : null;
}

export default function CommunityFeed() {
  const [sources, setSources] = useState(DEFAULT_SOURCES);
  const [mediumTags, setMediumTags] = useState(DEFAULT_MEDIUM_TAGS);
  const [devToTags, setDevToTags] = useState(DEFAULT_DEVTO_TAGS);
  const [mediumTagInput, setMediumTagInput] = useState('');
  const [devToTagInput, setDevToTagInput] = useState('');
  const [tagError, setTagError] = useState('');
  const [state, setState] = useState({status: 'loading', posts: []});
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const [query, setQuery] = useState('');
  const [featuredFirst, setFeaturedFirst] = useState(false);
  const [reactionsFirst, setReactionsFirst] = useState(false);
  const [savedOnly, setSavedOnly] = useState(false);
  const [savedLinks, setSavedLinks] = useState([]);
  const [authorInput, setAuthorInput] = useState('');
  const [authorView, setAuthorView] = useState(null); // {name, handle, status, posts, guessed} | null
  const [sourceDebug, setSourceDebug] = useState([]); // [{label, status, count, error}]
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    setSources(loadSources());
    setMediumTags(loadTags(MEDIUM_TAGS_KEY, DEFAULT_MEDIUM_TAGS));
    setDevToTags(loadTags(DEVTO_TAGS_KEY, DEFAULT_DEVTO_TAGS));
    setSavedLinks(loadSavedPosts());
  }, []);

  const cacheKey = useMemo(() => {
    const sourceKey = Object.entries(sources)
      .filter(([, on]) => on)
      .map(([name]) => name)
      .sort()
      .join(',');
    return `os-community-feed-v4:${sourceKey}:${[...mediumTags].sort().join(',')}:${[...devToTags].sort().join(',')}`;
  }, [sources, mediumTags, devToTags]);

  const load = useCallback(
    async (forceFresh = false) => {
      setState({status: 'loading', posts: []});
      setVisibleCount(INITIAL_VISIBLE);

      if (!forceFresh) {
        try {
          const cached = sessionStorage.getItem(cacheKey);
          if (cached) {
            const {timestamp, posts, debug} = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_TTL_MS && posts.length > 0) {
              setState({status: 'ready', posts});
              setSourceDebug(debug || []);
              return;
            }
          }
        } catch {
          // sessionStorage unavailable or corrupt cache — fall through to a fresh fetch.
        }
      }

      // Each job carries a human-readable label so a failure or an
      // empty-but-successful result can actually be pinned to a specific
      // source+tag, instead of silently vanishing into a merged pool —
      // this is what "why are only 10 posts showing up" needs to answer.
      const jobs = [];
      if (sources.medium) {
        mediumTags.forEach((tag) =>
          jobs.push({label: `Medium #${tag}`, promise: fetchMediumTag(tag, ITEMS_PER_TAG)}),
        );
      }
      if (sources.devto) {
        devToTags.forEach((tag) =>
          jobs.push({label: `dev.to #${tag}`, promise: fetchDevToTag(tag, ITEMS_PER_TAG)}),
        );
      }
      if (sources.projectzero) {
        jobs.push({label: 'Project Zero', promise: fetchProjectZero(10)});
      }

      if (jobs.length === 0) {
        setState({status: 'ready', posts: []});
        setSourceDebug([]);
        return;
      }

      try {
        const results = await Promise.allSettled(jobs.map((j) => j.promise));
        const debug = results.map((r, i) => ({
          label: jobs[i].label,
          status: r.status === 'fulfilled' ? 'ok' : 'failed',
          count: r.status === 'fulfilled' ? r.value.length : 0,
          error: r.status === 'rejected' ? String(r.reason?.message || r.reason) : null,
        }));
        const merged = results
          .filter((r) => r.status === 'fulfilled')
          .flatMap((r) => r.value);

        setSourceDebug(debug); // set now so it's visible even if we're about to throw below

        if (merged.length === 0) throw new Error('all sources failed');

        const seen = new Set();
        const posts = merged
          .filter((post) => {
            if (seen.has(post.link)) return false;
            seen.add(post.link);
            return true;
          })
          .sort((a, b) => new Date(b.date) - new Date(a.date));

        setState({status: 'ready', posts});
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify({timestamp: Date.now(), posts, debug}));
        } catch {
          // ignore quota errors
        }
      } catch {
        setState({status: 'error', posts: []});
      }
    },
    [sources, mediumTags, devToTags, cacheKey],
  );

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sources, mediumTags, devToTags]);

  function toggleSource(name) {
    setSources((prev) => {
      const next = {...prev, [name]: !prev[name]};
      try {
        localStorage.setItem(SOURCES_KEY, JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }

  // Explicit author lookup (Medium only — dev.to and Project Zero don't
  // have the same per-author feed pattern this relies on). Only runs on
  // submit, never automatically while typing. Prefers a confirmed @handle
  // pulled from a post already in the loaded pool, but falls back to
  // treating the typed text itself as a handle guess and querying Medium
  // directly.
  async function handleAuthorSearch(e) {
    e.preventDefault();
    const raw = authorInput.trim();
    if (!raw) return;

    const mediumPosts = state.posts.filter((p) => p.source === 'medium');
    const candidate =
      mediumPosts.find((p) => p.author && p.author.toLowerCase() === raw.toLowerCase()) ||
      mediumPosts.find((p) => p.author && p.author.toLowerCase().includes(raw.toLowerCase()));

    const confirmedHandle = candidate ? extractMediumHandle(candidate.link) : null;

    if (candidate && !confirmedHandle) {
      setAuthorView({name: candidate.author, handle: null, status: 'unavailable', posts: []});
      return;
    }

    const handle = confirmedHandle || sanitizeHandleGuess(raw);
    const displayName = candidate ? candidate.author : raw;
    const guessed = !confirmedHandle;

    if (!handle) {
      setAuthorView({name: displayName, handle: null, status: 'unavailable', posts: []});
      return;
    }

    setAuthorView({name: displayName, handle, status: 'loading', posts: [], guessed});
    try {
      const posts = await fetchMediumAuthor(handle, 15);
      posts.sort((a, b) => new Date(b.date) - new Date(a.date));
      setAuthorView({
        name: displayName,
        handle,
        status: posts.length === 0 ? 'not-found' : 'ready',
        posts,
        guessed,
      });
    } catch {
      setAuthorView({name: displayName, handle, status: 'error', posts: [], guessed});
    }
  }

  function clearAuthorSearch() {
    setAuthorInput('');
    setAuthorView(null);
  }

  function handleAddMediumTag(e) {
    e.preventDefault();
    const clean = sanitizeTag(mediumTagInput);
    if (!clean) {
      setTagError('Enter a Medium tag using letters, numbers, and hyphens.');
      return;
    }
    if (mediumTags.includes(clean)) {
      setTagError('Already following that Medium tag.');
      return;
    }
    if (mediumTags.length >= MAX_TAGS) {
      setTagError(`You can follow up to ${MAX_TAGS} Medium tags at once.`);
      return;
    }
    const next = [...mediumTags, clean];
    setMediumTags(next);
    try {
      localStorage.setItem(MEDIUM_TAGS_KEY, JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
    setMediumTagInput('');
    setTagError('');
  }

  function handleRemoveMediumTag(tag) {
    if (mediumTags.length === 1) {
      setTagError('Keep at least one Medium tag.');
      return;
    }
    const next = mediumTags.filter((t) => t !== tag);
    setMediumTags(next);
    try {
      localStorage.setItem(MEDIUM_TAGS_KEY, JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
  }

  function handleResetMediumTags() {
    setMediumTags(DEFAULT_MEDIUM_TAGS);
    try {
      localStorage.removeItem(MEDIUM_TAGS_KEY);
    } catch {
      // ignore storage errors
    }
    setTagError('');
  }

  function handleAddDevToTag(e) {
    e.preventDefault();
    const clean = sanitizeDevToTag(devToTagInput);
    if (!clean) {
      setTagError('Enter a dev.to tag using letters and numbers only.');
      return;
    }
    if (devToTags.includes(clean)) {
      setTagError('Already following that dev.to tag.');
      return;
    }
    if (devToTags.length >= MAX_TAGS) {
      setTagError(`You can follow up to ${MAX_TAGS} dev.to tags at once.`);
      return;
    }
    const next = [...devToTags, clean];
    setDevToTags(next);
    try {
      localStorage.setItem(DEVTO_TAGS_KEY, JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
    setDevToTagInput('');
    setTagError('');
  }

  function handleRemoveDevToTag(tag) {
    if (devToTags.length === 1) {
      setTagError('Keep at least one dev.to tag.');
      return;
    }
    const next = devToTags.filter((t) => t !== tag);
    setDevToTags(next);
    try {
      localStorage.setItem(DEVTO_TAGS_KEY, JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
  }

  function handleResetDevToTags() {
    setDevToTags(DEFAULT_DEVTO_TAGS);
    try {
      localStorage.removeItem(DEVTO_TAGS_KEY);
    } catch {
      // ignore storage errors
    }
    setTagError('');
  }

  function toggleSaved(link) {
    setSavedLinks((prev) => {
      const next = prev.includes(link) ? prev.filter((l) => l !== link) : [...prev, link];
      try {
        localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }

  const isMediumCustomized =
    mediumTags.length !== DEFAULT_MEDIUM_TAGS.length ||
    mediumTags.some((t) => !DEFAULT_MEDIUM_TAGS.includes(t));
  const isDevToCustomized =
    devToTags.length !== DEFAULT_DEVTO_TAGS.length ||
    devToTags.some((t) => !DEFAULT_DEVTO_TAGS.includes(t));

  // Search matches title, excerpt, author, and category/tag text — covers
  // both "search a topic" (xss, methodology) and "search a tag" in one box.
  const visiblePosts = useMemo(() => {
    let posts = state.posts;

    if (savedOnly) {
      posts = posts.filter((p) => savedLinks.includes(p.link));
    }

    const q = query.trim().toLowerCase();
    if (q) {
      posts = posts.filter((p) => {
        const haystack = [p.title, p.excerpt, p.author, ...(p.categories || [])]
          .join(' ')
          .toLowerCase();
        return haystack.includes(q);
      });
    }

    if (featuredFirst) {
      posts = [...posts].sort((a, b) => {
        const aFeatured = a.publication ? 1 : 0;
        const bFeatured = b.publication ? 1 : 0;
        if (aFeatured !== bFeatured) return bFeatured - aFeatured;
        return new Date(b.date) - new Date(a.date);
      });
    }

    // Real interaction-based ranking — only dev.to provides an actual
    // public reaction count, so posts without one (Medium, Project Zero)
    // honestly sort to the bottom rather than being guessed at.
    if (reactionsFirst) {
      posts = [...posts].sort((a, b) => {
        const aReactions = typeof a.reactions === 'number' ? a.reactions : -1;
        const bReactions = typeof b.reactions === 'number' ? b.reactions : -1;
        if (aReactions !== bReactions) return bReactions - aReactions;
        return new Date(b.date) - new Date(a.date);
      });
    }

    return posts;
  }, [state.posts, query, featuredFirst, reactionsFirst, savedOnly, savedLinks]);

  return (
    <div>
      <div className={styles.sourceToggleRow}>
        <span className={styles.sourceToggleLabel}>Sources:</span>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={sources.medium}
            onChange={() => toggleSource('medium')}
          />
          Medium
        </label>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={sources.devto}
            onChange={() => toggleSource('devto')}
          />
          dev.to
        </label>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={sources.projectzero}
            onChange={() => toggleSource('projectzero')}
          />
          Google Project Zero
        </label>
      </div>

      {sources.medium && (
        <form className={styles.tagBar} onSubmit={handleAddMediumTag}>
          <div className={styles.tagChips}>
            <span className={styles.tagGroupLabel}>Medium:</span>
            {mediumTags.map((tag) => (
              <span key={tag} className={styles.tagChip}>
                #{tag}
                <button
                  type="button"
                  className={styles.tagChipRemove}
                  onClick={() => handleRemoveMediumTag(tag)}
                  aria-label={`Stop following Medium tag ${tag}`}>
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className={styles.tagInputRow}>
            <input
              type="text"
              value={mediumTagInput}
              onChange={(e) => {
                setMediumTagInput(e.target.value);
                setTagError('');
              }}
              placeholder="add a Medium tag, e.g. cloud-security"
              className={styles.tagInput}
              aria-label="Add a Medium tag to follow"
            />
            <button type="submit" className={styles.tagAddButton}>
              Add
            </button>
            {isMediumCustomized && (
              <button type="button" className={styles.tagResetButton} onClick={handleResetMediumTags}>
                Reset
              </button>
            )}
          </div>
        </form>
      )}

      {sources.devto && (
        <form className={styles.tagBar} onSubmit={handleAddDevToTag}>
          <div className={styles.tagChips}>
            <span className={styles.tagGroupLabel}>dev.to:</span>
            {devToTags.map((tag) => (
              <span key={tag} className={styles.tagChip}>
                #{tag}
                <button
                  type="button"
                  className={styles.tagChipRemove}
                  onClick={() => handleRemoveDevToTag(tag)}
                  aria-label={`Stop following dev.to tag ${tag}`}>
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className={styles.tagInputRow}>
            <input
              type="text"
              value={devToTagInput}
              onChange={(e) => {
                setDevToTagInput(e.target.value);
                setTagError('');
              }}
              placeholder="add a dev.to tag, e.g. pentesting"
              className={styles.tagInput}
              aria-label="Add a dev.to tag to follow"
            />
            <button type="submit" className={styles.tagAddButton}>
              Add
            </button>
            {isDevToCustomized && (
              <button type="button" className={styles.tagResetButton} onClick={handleResetDevToTags}>
                Reset
              </button>
            )}
          </div>
        </form>
      )}

      {tagError && <p className={styles.tagError}>{tagError}</p>}

      <div className={styles.searchRow}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search loaded posts — e.g. xss, methodology, a tag..."
          className={styles.searchInput}
          aria-label="Search loaded posts"
        />
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={featuredFirst}
            onChange={(e) => setFeaturedFirst(e.target.checked)}
          />
          Featured publications first
        </label>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={reactionsFirst}
            onChange={(e) => setReactionsFirst(e.target.checked)}
          />
          Most reactions first
        </label>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={savedOnly}
            onChange={(e) => setSavedOnly(e.target.checked)}
          />
          Saved only ({savedLinks.length})
        </label>

        <form className={styles.authorInline} onSubmit={handleAuthorSearch}>
          <input
            type="text"
            value={authorInput}
            onChange={(e) => setAuthorInput(e.target.value)}
            placeholder="Medium author or @handle"
            className={styles.authorInlineInput}
            aria-label="Look up a Medium author by name or handle"
          />
          <button type="submit" className={styles.authorInlineButton}>
            Look up
          </button>
          {authorView && (
            <button type="button" className={styles.authorInlineButton} onClick={clearAuthorSearch}>
              ×
            </button>
          )}
        </form>
      </div>

      {!authorView && state.status === 'ready' && (
        <div className={styles.debugRow}>
          <span className={styles.resultCount}>
            {visiblePosts.length} of {state.posts.length} loaded post{state.posts.length === 1 ? '' : 's'}
            {query && ` matching "${query}"`}
          </span>
          {sourceDebug.length > 0 && (
            <button
              type="button"
              className={styles.debugToggle}
              onClick={() => setShowDebug((v) => !v)}>
              {showDebug ? 'Hide' : 'Show'} source breakdown
            </button>
          )}
        </div>
      )}

      {showDebug && sourceDebug.length > 0 && (
        <div className={styles.debugPanel}>
          {sourceDebug.map((d) => (
            <div key={d.label} className={styles.debugLine}>
              <span className={styles.debugLabel}>{d.label}</span>
              {d.status === 'ok' ? (
                <span className={styles.debugOk}>{d.count} post{d.count === 1 ? '' : 's'}</span>
              ) : (
                <span className={styles.debugFail} title={d.error || ''}>
                  failed{d.error ? `: ${d.error}` : ''}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {authorView && (
        <div className={styles.authorPanel}>
          {authorView.status === 'unavailable' && (
            <p className={styles.authorNote}>
              {authorView.name ? (
                <>
                  Found posts by <strong>{authorView.name}</strong>, but can't look up more from
                  them — they only appear here via a publication, which doesn't expose a personal
                  feed link.
                </>
              ) : (
                "That doesn't look like a valid name or handle — try their exact @handle."
              )}
            </p>
          )}
          {authorView.status === 'loading' && (
            <p className={styles.authorNote}>Looking up @{authorView.handle}…</p>
          )}
          {authorView.status === 'not-found' && (
            <p className={styles.authorNote}>
              No public Medium account found at <strong>@{authorView.handle}</strong>. If you
              know their exact handle, try typing it directly (with or without the @).
            </p>
          )}
          {authorView.status === 'error' && (
            <p className={styles.authorNote}>
              Couldn't reach @{authorView.handle}'s feed right now — it may be rate-limited.
              Try again in a moment.
            </p>
          )}
          {authorView.status === 'ready' && (
            <>
              <div className={styles.authorHeader}>
                <h3 className={styles.authorHeading}>
                  Latest from {authorView.guessed ? `@${authorView.handle}` : authorView.name}{' '}
                  <span className={styles.authorCount}>({authorView.posts.length})</span>
                </h3>
                <button type="button" className={styles.tagResetButton} onClick={clearAuthorSearch}>
                  ← Back to browsing
                </button>
              </div>
              <div className={styles.grid}>
                {authorView.posts.map((post) => (
                  <PostCard
                    key={post.link}
                    post={post}
                    isSaved={savedLinks.includes(post.link)}
                    onToggleSave={() => toggleSaved(post.link)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {!authorView && state.status === 'loading' && (
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

      {!authorView && state.status === 'error' && (
        <div className={styles.emptyState}>
          <p className={styles.emptyStateTitle}>Couldn't load the live feed right now.</p>
          <p className={styles.emptyStateBody}>
            This pulls live from Medium, dev.to, and Project Zero via public feeds/APIs, which can
            occasionally rate-limit or time out.
          </p>
          {sourceDebug.length > 0 && (
            <div className={styles.debugPanel}>
              {sourceDebug.map((d) => (
                <div key={d.label} className={styles.debugLine}>
                  <span className={styles.debugLabel}>{d.label}</span>
                  {d.status === 'ok' ? (
                    <span className={styles.debugOk}>{d.count} post{d.count === 1 ? '' : 's'} (empty)</span>
                  ) : (
                    <span className={styles.debugFail} title={d.error || ''}>
                      failed{d.error ? `: ${d.error}` : ''}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
          <button type="button" className={styles.retryButton} onClick={() => load(true)}>
            Try again
          </button>
        </div>
      )}

      {!authorView && state.status === 'ready' && visiblePosts.length === 0 && (
        <div className={styles.emptyState}>
          <p className={styles.emptyStateTitle}>
            {savedOnly
              ? "You haven't saved anything yet."
              : Object.values(sources).every((v) => !v)
                ? 'No sources enabled — turn at least one back on above.'
                : `No loaded posts match "${query}".`}
          </p>
        </div>
      )}

      {!authorView && state.status === 'ready' && visiblePosts.length > 0 && (
        <>
          <div className={styles.grid}>
            {visiblePosts.slice(0, visibleCount).map((post) => (
              <PostCard
                key={post.link}
                post={post}
                isSaved={savedLinks.includes(post.link)}
                onToggleSave={() => toggleSaved(post.link)}
              />
            ))}
          </div>

          {visibleCount < visiblePosts.length && (
            <div className={styles.loadMoreRow}>
              <button
                type="button"
                className={styles.loadMoreButton}
                onClick={() => setVisibleCount((c) => c + LOAD_MORE_STEP)}>
                See more ({visiblePosts.length - visibleCount} more)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
