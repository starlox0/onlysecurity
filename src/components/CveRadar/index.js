import React, {useEffect, useState} from 'react';
import {
  isCveId,
  fetchRecentCves,
  fetchByCveId,
  fetchFiltered,
  getSeverity,
  getDescription,
  getGithubRefs,
  VULN_TYPES,
  SEVERITIES,
  recentYears,
} from './nvd';
import styles from './styles.module.css';

function SeverityBadge({severity, score}) {
  return (
    <span className={styles.severityBadge} data-severity={severity}>
      {severity}
      {score != null ? ` ${score}` : ''}
    </span>
  );
}

function CveCard({cve}) {
  const {score, severity} = getSeverity(cve);
  const description = getDescription(cve);
  const githubRefs = getGithubRefs(cve);
  const published = new Date(cve.published);

  return (
    <div className={styles.card}>
      <div className={styles.cardHead}>
        
          href={`https://nvd.nist.gov/vuln/detail/${cve.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.cveId}>
          {cve.id}
        </a>
        <SeverityBadge severity={severity} score={score} />
      </div>
      <p className={styles.date}>
        Published {published.toLocaleDateString(undefined, {year: 'numeric', month: 'short', day: 'numeric'})}
      </p>
      <p className={styles.description}>{description}</p>
      {githubRefs.length > 0 && (
        <div className={styles.githubRefs}>
          {githubRefs.map((ref) => (
            
              key={ref.url}
              href={ref.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.githubRef}>
              ↗ github.com{new URL(ref.url).pathname}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

const YEARS = recentYears();

export default function CveRadar() {
  const [query, setQuery] = useState('');
  const [year, setYear] = useState('RECENT');
  const [severity, setSeverity] = useState('ANY');
  const [cweId, setCweId] = useState('ANY');
  const [mode, setMode] = useState('radar'); // 'radar' | 'search'
  const [state, setState] = useState({status: 'loading', results: []});

  async function loadRadar() {
    setState({status: 'loading', results: []});
    try {
      const results = await fetchRecentCves();
      setState({status: 'ready', results});
    } catch {
      setState({status: 'error', results: []});
    }
  }

  useEffect(() => {
    loadRadar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasActiveFilters = year !== 'RECENT' || severity !== 'ANY' || cweId !== 'ANY';

  async function handleSearch(e) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed && !hasActiveFilters) return; // nothing to actually search for

    setMode('search');
    setState({status: 'loading', results: []});
    try {
      // An exact CVE ID lookup ignores the other filters — a single record
      // has one fixed severity/type/year, filtering it further makes no sense.
      const results =
        trimmed && isCveId(trimmed)
          ? await fetchByCveId(trimmed)
          : await fetchFiltered({keyword: trimmed, year, severity, cweId});
      setState({status: 'ready', results});
    } catch {
      setState({status: 'error', results: []});
    }
  }

  function backToRadar() {
    setMode('radar');
    setQuery('');
    setYear('RECENT');
    setSeverity('ANY');
    setCweId('ANY');
    loadRadar();
  }

  return (
    <div>
      <form className={styles.searchBar} onSubmit={handleSearch}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="CVE-2024-24919, a product name, or a GitHub username..."
          className={styles.searchInput}
          aria-label="Search CVEs by ID, keyword, or GitHub username"
        />
        <button type="submit" className={styles.searchButton}>
          Search
        </button>
        {mode === 'search' && (
          <button type="button" className={styles.backButton} onClick={backToRadar}>
            ← Back to radar
          </button>
        )}
      </form>

      <div className={styles.filterRow}>
        <label className={styles.filterField}>
          <span className={styles.filterLabel}>Year</span>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className={styles.filterSelect}
            aria-label="Filter by year">
            <option value="RECENT">Last 14 days</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.filterField}>
          <span className={styles.filterLabel}>Severity</span>
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            className={styles.filterSelect}
            aria-label="Filter by severity">
            <option value="ANY">Any severity</option>
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.filterField}>
          <span className={styles.filterLabel}>Vulnerability type</span>
          <select
            value={cweId}
            onChange={(e) => setCweId(e.target.value)}
            className={styles.filterSelect}
            aria-label="Filter by vulnerability type">
            <option value="ANY">Any type</option>
            {VULN_TYPES.map((t) => (
              <option key={t.cweId} value={t.cweId}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        {hasActiveFilters && (
          <button
            type="button"
            className={styles.clearFiltersButton}
            onClick={() => {
              setYear('RECENT');
              setSeverity('ANY');
              setCweId('ANY');
            }}>
            Clear filters
          </button>
        )}
      </div>

      {state.status === 'loading' && (
        <div className={styles.grid}>
          {Array.from({length: 4}).map((_, i) => (
            <div key={i} className={styles.skeletonCard} aria-hidden="true" />
          ))}
        </div>
      )}

      {state.status === 'error' && (
        <div className={styles.emptyState}>
          <p className={styles.emptyStateTitle}>Couldn't reach the NVD API right now.</p>
          <p className={styles.emptyStateBody}>
            This pulls live from the National Vulnerability Database, which can rate-limit or
            time out under load. Try again in a moment, or search directly on NVD.
          </p>
          
            className={styles.emptyStateLink}
            href={
              mode === 'search' && query
                ? `https://nvd.nist.gov/vuln/search/results?query=${encodeURIComponent(query)}`
                : 'https://nvd.nist.gov/vuln/search'
            }
            target="_blank"
            rel="noopener noreferrer">
            Search on nvd.nist.gov →
          </a>
        </div>
      )}

      {state.status === 'ready' && state.results.length === 0 && (
        <div className={styles.emptyState}>
          <p className={styles.emptyStateTitle}>No results found.</p>
          <p className={styles.emptyStateBody}>
            Try a CVE ID (e.g. CVE-2024-24919), a product name, a researcher's name/handle, or
            loosen the year/severity/type filters.
          </p>
        </div>
      )}

      {state.status === 'ready' && state.results.length > 0 && (
        <div className={styles.grid}>
          {state.results.map((cve) => (
            <CveCard key={cve.id} cve={cve} />
          ))}
        </div>
      )}
    </div>
  );
}
