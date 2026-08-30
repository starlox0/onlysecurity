import React, {useMemo, useState} from 'react';
import platforms from './platforms';
import styles from './styles.module.css';

const CATEGORY_ORDER = [
  'Government and public-interest programs',
  'Web3 and smart-contract platforms',
  'AI and LLM security platforms',
  'Vulnerability acquisition and brokered disclosure',
  'Ecosystem-specific platforms',
  'General crowdsourced platforms',
];

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function firstLetterBucket(name) {
  const ch = name.trim().charAt(0).toUpperCase();
  return /[A-Z]/.test(ch) ? ch : '#';
}

function byName(a, b) {
  return a.name.localeCompare(b.name, undefined, {sensitivity: 'base'});
}

function PlatformRow({platform}) {
  return (
    <div className={styles.row}>
      <div className={styles.rowMain}>
        <a href={platform.url} target="_blank" rel="noopener noreferrer" className={styles.name}>
          {platform.name}
        </a>
        {platform.region && <span className={styles.region}>{platform.region}</span>}
      </div>
      <div className={styles.rowMeta}>
        {platform.programTypes && <span className={styles.pill}>{platform.programTypes}</span>}
        {platform.hasLeaderboard === 'Yes' && (
          <span className={styles.pill} data-variant="leaderboard">
            Leaderboard
          </span>
        )}
        {platform.leaderboardUrl && (
          <a href={platform.leaderboardUrl} target="_blank" rel="noopener noreferrer" className={styles.metaLink}>
            Leaderboard ↗
          </a>
        )}
        {platform.publicProgramsUrl && (
          <a
            href={platform.publicProgramsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.metaLink}>
            Public programs ↗
          </a>
        )}
        {platform.twitter && (
          <a href={platform.twitter} target="_blank" rel="noopener noreferrer" className={styles.metaLink}>
            X/Twitter ↗
          </a>
        )}
      </div>
    </div>
  );
}

export default function BugBountyPlatforms() {
  const [view, setView] = useState('category'); // 'category' | 'alphabetical'
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return platforms;
    return platforms.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.region && p.region.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)),
    );
  }, [query]);

  const byCategory = useMemo(() => {
    const map = new Map(CATEGORY_ORDER.map((c) => [c, []]));
    filtered.forEach((p) => {
      if (!map.has(p.category)) map.set(p.category, []);
      map.get(p.category).push(p);
    });
    for (const list of map.values()) list.sort(byName);
    return [...map.entries()].filter(([, list]) => list.length > 0);
  }, [filtered]);

  const byLetter = useMemo(() => {
    const map = new Map();
    filtered.forEach((p) => {
      const letter = firstLetterBucket(p.name);
      if (!map.has(letter)) map.set(letter, []);
      map.get(letter).push(p);
    });
    for (const list of map.values()) list.sort(byName);
    return map;
  }, [filtered]);

  const availableLetters = new Set(byLetter.keys());

  return (
    <div>
      <div className={styles.controls}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by name, region, or category..."
          className={styles.searchInput}
          aria-label="Filter platforms"
        />
        <div className={styles.viewToggle} role="tablist" aria-label="View mode">
          <button
            type="button"
            role="tab"
            aria-selected={view === 'category'}
            className={view === 'category' ? styles.viewButtonActive : styles.viewButton}
            onClick={() => setView('category')}>
            By category
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === 'alphabetical'}
            className={view === 'alphabetical' ? styles.viewButtonActive : styles.viewButton}
            onClick={() => setView('alphabetical')}>
            A–Z
          </button>
        </div>
      </div>

      <p className={styles.resultCount}>
        {filtered.length} platform{filtered.length === 1 ? '' : 's'}
        {query && ` matching "${query}"`}
      </p>

      {view === 'alphabetical' && (
        <div className={styles.jumpBar} aria-label="Jump to letter">
          {ALPHABET.map((letter) => (
            <a
              key={letter}
              href={`#letter-${letter}`}
              className={availableLetters.has(letter) ? styles.jumpLink : styles.jumpLinkDisabled}
              aria-disabled={!availableLetters.has(letter)}
              tabIndex={availableLetters.has(letter) ? 0 : -1}>
              {letter}
            </a>
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <div className={styles.emptyState}>
          <p className={styles.emptyStateTitle}>No platforms match "{query}".</p>
        </div>
      )}

      {view === 'category' &&
        byCategory.map(([category, list]) => (
          <section key={category} className={styles.section}>
            <h2 className={styles.sectionTitle}>
              {category} <span className={styles.sectionCount}>({list.length})</span>
            </h2>
            <div className={styles.list}>
              {list.map((p) => (
                <PlatformRow key={p.name} platform={p} />
              ))}
            </div>
          </section>
        ))}

      {view === 'alphabetical' &&
        [...byLetter.keys()]
          .sort()
          .map((letter) => (
            <section key={letter} id={`letter-${letter}`} className={styles.section}>
              <h2 className={styles.sectionTitle}>{letter}</h2>
              <div className={styles.list}>
                {byLetter.get(letter).map((p) => (
                  <PlatformRow key={p.name} platform={p} />
                ))}
              </div>
            </section>
          ))}
    </div>
  );
}
