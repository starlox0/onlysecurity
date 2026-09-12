import React, {useMemo, useState} from 'react';
import {TOOLS, TOOL_CATEGORIES, getToolImage, getCategory} from './data';
import styles from './styles.module.css';

const ACCENTS = ['green', 'blue', 'amber', 'red'];

function accentFor(categoryId) {
  const index = TOOL_CATEGORIES.findIndex((c) => c.id === categoryId);
  return ACCENTS[index % ACCENTS.length];
}

function wordsOf(s) {
  return s.split(/\s+/).filter(Boolean);
}

// A query matches a category either as a short exact alias ("ad" → Active
// Directory) or, for longer phrases, as a substring in either direction
// ("network pentest" contains the "pentest" alias) — this is what lets
// searching "network pentest" surface the whole category, not just tools
// whose own description happens to contain that exact phrase. Short
// aliases/queries (3 chars or fewer) always require a whole-word match on
// the other side, so a 2-letter alias like "re" or "ir" can't falsely
// match as a substring inside an unrelated word like "wireless."
function categoryMatchesQuery(category, q) {
  const haystacks = [category.label.toLowerCase(), ...category.aliases.map((a) => a.toLowerCase())];
  const qWords = wordsOf(q);
  return haystacks.some((h) => {
    if (h === q) return true;
    if (h.length <= 3) return qWords.includes(h);
    if (q.length <= 3) return wordsOf(h).includes(q);
    return h.includes(q) || q.includes(h);
  });
}

function ToolCard({tool}) {
  const image = getToolImage(tool);
  const category = getCategory(tool.category);
  const accent = accentFor(tool.category);
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <a href={tool.url} target="_blank" rel="noopener noreferrer" className={styles.toolCard} data-accent={accent}>
      <div className={styles.toolCardTop}>
        {image && !imgFailed ? (
          <img
            src={image}
            alt=""
            loading="lazy"
            className={styles.toolLogo}
            onError={() => setImgFailed(true)}
          />
        ) : (
          <span className={styles.toolLogoFallback} aria-hidden="true">
            {category.icon}
          </span>
        )}
        <div>
          <p className={styles.toolName}>{tool.name}</p>
          <span className={styles.toolCategoryTag}>{category.label}</span>
        </div>
      </div>
      <p className={styles.toolDescription}>{tool.description}</p>
      <span className={styles.toolLink}>Visit site →</span>
    </a>
  );
}

export default function SecurityTools() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');

  const matchingCategoryIds = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return new Set(TOOL_CATEGORIES.filter((c) => categoryMatchesQuery(c, q)).map((c) => c.id));
  }, [query]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TOOLS.filter((tool) => {
      if (activeCategory !== 'ALL' && tool.category !== activeCategory) return false;
      if (!q) return true;
      if (matchingCategoryIds?.has(tool.category)) return true;
      return tool.name.toLowerCase().includes(q) || tool.description.toLowerCase().includes(q);
    });
  }, [query, activeCategory, matchingCategoryIds]);

  const grouped = useMemo(() => {
    const map = new Map(TOOL_CATEGORIES.map((c) => [c.id, []]));
    for (const tool of filtered) {
      if (!map.has(tool.category)) map.set(tool.category, []);
      map.get(tool.category).push(tool);
    }
    return TOOL_CATEGORIES.map((c) => [c, map.get(c.id) || []]).filter(([, list]) => list.length > 0);
  }, [filtered]);

  function selectCategory(id) {
    setActiveCategory((prev) => (prev === id ? 'ALL' : id));
  }

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder='Try "network pentest", "AD", "cloud", "mobile", or a tool name...'
        className={styles.searchInput}
        aria-label="Search security tools"
      />

      <div className={styles.categoryChips}>
        {TOOL_CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            className={styles.categoryChip}
            data-active={activeCategory === c.id}
            onClick={() => selectCategory(c.id)}>
            <span aria-hidden="true">{c.icon}</span> {c.label}
          </button>
        ))}
      </div>

      <p className={styles.resultCount}>
        {filtered.length} tool{filtered.length === 1 ? '' : 's'}
        {activeCategory !== 'ALL' && ` in ${getCategory(activeCategory).label}`}
        {query && ` matching "${query}"`}
      </p>

      {filtered.length === 0 && (
        <div className={styles.emptyState}>
          <p className={styles.emptyStateTitle}>No tools match that search.</p>
          <p className={styles.emptyStateBody}>Try a broader term, or clear the category filter.</p>
        </div>
      )}

      {grouped.map(([category, tools]) => (
        <section key={category.id} className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <span aria-hidden="true">{category.icon}</span> {category.label}{' '}
            <span className={styles.sectionCount}>({tools.length})</span>
          </h2>
          <div className={styles.toolGrid}>
            {tools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
