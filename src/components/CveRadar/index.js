import React, {useEffect, useState} from 'react';
import {
  isCveId,
  fetchRecentCves,
  fetchByCveId,
  fetchByKeyword,
  getSeverity,
  getDescription,
  getGithubRefs,
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
        <a
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
            <a
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

export default function CveRadar() {
  const [query, setQuery] = useState('');
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

  async function handleSearch(e) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    setMode('search');
    setState({status: 'loading', results: []});
    try {
      const results = isCveId(trimmed)
        ? await fetchByCveId(trimmed)
        : await fetchByKeyword(trimmed);
      setState({status: 'ready', results});
    } catch {
      setState({status: 'error', results: []});
    }
  }

  function backToRadar() {
    setMode('radar');
    setQuery('');
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
          <a
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
          <p className={styles.emptyStateTitle}>No results for &ldquo;{query}&rdquo;.</p>
          <p className={styles.emptyStateBody}>
            Try a CVE ID (e.g. CVE-2024-24919), a product name, or a researcher's name/handle.
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
