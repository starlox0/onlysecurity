import React, {useMemo, useState} from 'react';
import resources from './resources';
import styles from './styles.module.css';

const CATEGORY_ORDER = [
  'CTF Platforms',
  'Web Application Security',
  'Cloud Security',
  'Android Security',
  'Reverse Engineering & Binary Exploitation',
  'Blue Team / Defensive Security',
  'Open Source Frameworks',
];

const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'All Levels'];

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function firstLetterBucket(name) {
  const ch = name.trim().charAt(0).toUpperCase();
  return /[A-Z]/.test(ch) ? ch : '#';
}

function byName(a, b) {
  return a.name.localeCompare(b.name, undefined, {sensitivity: 'base'});
}

function ResourceRow({resource}) {
  return (
    <a href={resource.url} target="_blank" rel="noopener noreferrer" className={styles.row}>
      <div className={styles.rowHead}>
        <span className={styles.name}>{resource.name}</span>
        <span className={styles.levelBadge} data-level={resource.level}>
          {resource.level}
        </span>
      </div>
      <span className={styles.description}>{resource.description}</span>
    </a>
  );
}

export default function SecurityResources() {
  const [view, setView] = useState('category'); // 'category' | 'alphabetical'
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState('ANY');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return resources.filter((r) => {
      const matchesLevel = level === 'ANY' || r.level === level;
      const matchesQuery =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q);
      return matchesLevel && matchesQuery;
    });
  }, [query, level]);

  const byCategory = useMemo(() => {
    const map = new Map(CATEGORY_ORDER.map((c) => [c, []]));
    filtered.forEach((r) => {
      if (!map.has(r.category)) map.set(r.category, []);
      map.get(r.category).push(r);
    });
    for (const list of map.values()) list.sort(byName);
    return [...map.entries()].filter(([, list]) => list.length > 0);
  }, [filtered]);

  const byLetter = useMemo(() => {
    const map = new Map();
    filtered.forEach((r) => {
      const letter = firstLetterBucket(r.name);
      if (!map.has(letter)) map.set(letter, []);
      map.get(letter).push(r);
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
          placeholder="Filter by name, description, or category..."
          className={styles.searchInput}
          aria-label="Filter resources"
        />
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className={styles.levelSelect}
          aria-label="Filter by difficulty level">
          <option value="ANY">Any level</option>
          {LEVELS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
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
        {filtered.length} resource{filtered.length === 1 ? '' : 's'}
        {level !== 'ANY' && ` · ${level}`}
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
          <p className={styles.emptyStateTitle}>No resources match "{query}".</p>
        </div>
      )}

      {view === 'category' &&
        byCategory.map(([category, list]) => (
          <section key={category} className={styles.section}>
            <h2 className={styles.sectionTitle}>
              {category} <span className={styles.sectionCount}>({list.length})</span>
            </h2>
            <div className={styles.list}>
              {list.map((r) => (
                <ResourceRow key={r.name} resource={r} />
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
                {byLetter.get(letter).map((r) => (
                  <ResourceRow key={r.name} resource={r} />
                ))}
              </div>
            </section>
          ))}
    </div>
  );
}
