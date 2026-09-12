import React, {useMemo, useState} from 'react';
import {BB_SECTIONS, getBBToolImage, countBBTools} from './bugBountyToolkit';
import styles from './styles.module.css';

function BBToolRow({tool}) {
  const image = getBBToolImage(tool);
  const [failed, setFailed] = useState(false);

  return (
    <a href={tool.url} target="_blank" rel="noopener noreferrer" className={styles.bbRow}>
      {image && !failed ? (
        <img src={image} alt="" loading="lazy" className={styles.bbRowLogo} onError={() => setFailed(true)} />
      ) : (
        <span className={styles.bbRowLogoFallback} aria-hidden="true">
          🔧
        </span>
      )}
      <span className={styles.bbRowBody}>
        <span className={styles.bbRowName}>{tool.name}</span>
        <span className={styles.bbRowDescription}>{tool.description}</span>
      </span>
    </a>
  );
}

export default function BugBountyToolkit() {
  const [activeSection, setActiveSection] = useState(BB_SECTIONS[0].id);
  const [activeSubcategory, setActiveSubcategory] = useState('ALL');
  const [query, setQuery] = useState('');

  const section = BB_SECTIONS.find((s) => s.id === activeSection);

  const searching = query.trim().length > 0;

  const searchResults = useMemo(() => {
    if (!searching) return null;
    const q = query.trim().toLowerCase();
    const results = [];
    for (const sec of BB_SECTIONS) {
      for (const sub of sec.subcategories) {
        for (const tool of sub.tools) {
          if (
            tool.name.toLowerCase().includes(q) ||
            tool.description.toLowerCase().includes(q) ||
            sub.label.toLowerCase().includes(q)
          ) {
            results.push(tool);
          }
        }
      }
    }
    return results;
  }, [query, searching]);

  function selectSection(id) {
    setActiveSection(id);
    setActiveSubcategory('ALL');
  }

  const visibleSubcategories = section.subcategories;
  const visibleTools = useMemo(() => {
    if (activeSubcategory === 'ALL') {
      return visibleSubcategories.flatMap((sub) => sub.tools.map((t) => ({...t, subLabel: sub.label})));
    }
    const sub = visibleSubcategories.find((s) => s.id === activeSubcategory);
    return sub ? sub.tools.map((t) => ({...t, subLabel: sub.label})) : [];
  }, [visibleSubcategories, activeSubcategory]);

  return (
    <div>
      <p className={styles.bbIntro}>
        {countBBTools()} tools, transcribed in full from{' '}
        <a href="https://github.com/vavkamil/awesome-bugbounty-tools" target="_blank" rel="noopener noreferrer">
          vavkamil/awesome-bugbounty-tools
        </a>
        , organized under that project's own section structure.
      </p>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search all bug bounty tools by name, description, or subcategory..."
        className={styles.searchInput}
        aria-label="Search bug bounty tools"
      />

      {!searching && (
        <>
          <div className={styles.bbSectionTabs} role="tablist" aria-label="Bug bounty tool sections">
            {BB_SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={activeSection === s.id}
                className={styles.bbSectionTab}
                data-active={activeSection === s.id}
                onClick={() => selectSection(s.id)}>
                {s.label}
              </button>
            ))}
          </div>

          <div className={styles.categoryChips}>
            <button
              type="button"
              className={styles.categoryChip}
              data-active={activeSubcategory === 'ALL'}
              onClick={() => setActiveSubcategory('ALL')}>
              All in {section.label}
            </button>
            {section.subcategories.map((sub) => (
              <button
                key={sub.id}
                type="button"
                className={styles.categoryChip}
                data-active={activeSubcategory === sub.id}
                onClick={() => setActiveSubcategory(sub.id)}>
                {sub.label} <span className={styles.bbChipCount}>({sub.tools.length})</span>
              </button>
            ))}
          </div>
        </>
      )}

      <p className={styles.resultCount}>
        {searching
          ? `${searchResults.length} tool${searchResults.length === 1 ? '' : 's'} matching "${query}"`
          : `${visibleTools.length} tool${visibleTools.length === 1 ? '' : 's'}${activeSubcategory !== 'ALL' ? ` in ${section.subcategories.find((s) => s.id === activeSubcategory)?.label}` : ` in ${section.label}`}`}
      </p>

      {searching && searchResults.length === 0 && (
        <div className={styles.emptyState}>
          <p className={styles.emptyStateTitle}>No tools match that search.</p>
        </div>
      )}

      <div className={styles.bbList}>
        {(searching ? searchResults : visibleTools).map((tool, i) => (
          <BBToolRow key={`${tool.name}-${i}`} tool={tool} />
        ))}
      </div>
    </div>
  );
}
