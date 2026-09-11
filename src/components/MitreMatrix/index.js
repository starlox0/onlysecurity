import React, {useEffect, useMemo, useState} from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {fetchAttackMatrix, groupByTactic, searchTechniques, getTechniqueById} from './matrix';
import {hasMapping} from './mappings';
import MitreDetailPanel from './MitreDetailPanel';
import TechniqueModal from '../AttackAtlas/TechniqueModal';
import styles from './styles.module.css';

function TechniqueRow({technique, onSelect, depth = 0}) {
  const [expanded, setExpanded] = useState(false);
  const hasSubs = technique.subtechniques && technique.subtechniques.length > 0;
  const mapped = hasMapping(technique.id);

  return (
    <>
      <div
        className={styles.techRow}
        data-depth={depth}
        data-mapped={mapped}
        onClick={() => onSelect(technique.id)}
        title={technique.name}>
        {hasSubs && (
          <button
            type="button"
            className={styles.expandToggle}
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((v) => !v);
            }}
            aria-label={expanded ? 'Collapse sub-techniques' : 'Expand sub-techniques'}>
            {expanded ? '▾' : '▸'}
          </button>
        )}
        <span className={styles.techName}>{technique.name}</span>
        {mapped && <span className={styles.mappedDot} title="Covered on this site" />}
      </div>
      {hasSubs && expanded && (
        <div className={styles.subList}>
          {technique.subtechniques.map((sub) => (
            <div
              key={sub.id}
              className={styles.techRow}
              data-depth={1}
              data-mapped={hasMapping(sub.id)}
              onClick={() => onSelect(sub.id)}
              title={sub.name}>
              <span className={styles.techName}>{sub.name}</span>
              {hasMapping(sub.id) && <span className={styles.mappedDot} title="Covered on this site" />}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default function MitreMatrix() {
  const dataUrl = useBaseUrl('/data/attack-matrix.json');
  const [state, setState] = useState({status: 'loading', data: null});
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [openInternalId, setOpenInternalId] = useState(null);

  useEffect(() => {
    fetchAttackMatrix(dataUrl)
      .then((data) => setState({status: 'ready', data}))
      .catch(() => setState({status: 'error', data: null}));
  }, [dataUrl]);

  const techniques = state.data?.techniques || [];
  const tactics = state.data?.tactics || [];

  const byTactic = useMemo(() => groupByTactic(techniques), [techniques]);
  const searchResults = useMemo(() => searchTechniques(techniques, query), [techniques, query]);

  const selectedTechnique = selectedId ? getTechniqueById(techniques, selectedId) : null;

  function selectTechnique(id) {
    setSelectedId(id);
  }

  function openInternal(id) {
    setSelectedId(null);
    setOpenInternalId(id);
  }

  const mappedCount = useMemo(() => techniques.filter((t) => hasMapping(t.id)).length, [techniques]);

  return (
    <div>
      {state.status === 'ready' && (
        <div className={styles.statsRow}>
          <span>{techniques.length.toLocaleString()} techniques across {tactics.length} tactics</span>
          <span className={styles.mappedCountNote}>
            <span className={styles.mappedDot} /> {mappedCount} link to write-ups on this site
          </span>
        </div>
      )}

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search techniques by name, ID, or keyword..."
        className={styles.searchInput}
        aria-label="Search ATT&CK techniques"
      />

      {state.status === 'loading' && <p className={styles.loadingNote}>Loading the ATT&amp;CK matrix…</p>}

      {state.status === 'error' && (
        <div className={styles.emptyState}>
          <p className={styles.emptyStateTitle}>Couldn't load the ATT&amp;CK matrix.</p>
          <p className={styles.emptyStateBody}>
            Try refreshing, or browse the matrix directly at{' '}
            <a href="https://attack.mitre.org/matrices/enterprise/" target="_blank" rel="noopener noreferrer">
              attack.mitre.org
            </a>
            .
          </p>
        </div>
      )}

      {state.status === 'ready' && searchResults && (
        <div className={styles.searchResults}>
          {searchResults.length === 0 ? (
            <p className={styles.emptyStateBody}>No techniques match "{query}".</p>
          ) : (
            searchResults.slice(0, 60).map((t) => (
              <div
                key={t.id}
                className={styles.searchResultRow}
                data-mapped={hasMapping(t.id)}
                onClick={() => selectTechnique(t.id)}>
                <span className={styles.searchResultId}>{t.id}</span>
                <span className={styles.searchResultName}>{t.name}</span>
                {hasMapping(t.id) && <span className={styles.mappedDot} title="Covered on this site" />}
              </div>
            ))
          )}
        </div>
      )}

      {state.status === 'ready' && !searchResults && (
        <div className={styles.matrixScroll}>
          <div className={styles.matrix}>
            {tactics.map((tactic) => {
              const list = byTactic.get(tactic.shortname) || [];
              return (
                <div key={tactic.shortname} className={styles.column}>
                  <div className={styles.columnHeader}>
                    <span className={styles.columnTitle}>{tactic.name}</span>
                    <span className={styles.columnCount}>{list.length}</span>
                  </div>
                  <div className={styles.columnBody}>
                    {list.map((t) => (
                      <TechniqueRow key={t.id} technique={t} onSelect={selectTechnique} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <MitreDetailPanel
        technique={selectedTechnique}
        onClose={() => setSelectedId(null)}
        onOpenInternal={openInternal}
      />
      <TechniqueModal techniqueId={openInternalId} onClose={() => setOpenInternalId(null)} />
    </div>
  );
}
