import React, {useEffect, useState} from 'react';
import {
  isCveId,
  fetchKevCatalog,
  getRecent,
  filterCatalog,
  getByExactCveId,
  getUrgency,
  getDueStatus,
  isRansomware,
  getReferenceLinks,
  getCatalogStats,
} from './kev';
import {fetchGithubExploits} from '../CveRadar/github';
import KevScope from './KevScope';
import sharedStyles from '../CveRadar/styles.module.css';
import styles from './styles.module.css';

const DUE_STATUS_OPTIONS = [
  {value: 'OVERDUE', label: 'Overdue'},
  {value: 'DUE_SOON', label: 'Due within 7 days'},
  {value: 'ON_TRACK', label: 'On track'},
];

const DEFAULT_RECENT_DAYS = 14;

function UrgencyBadge({urgency}) {
  return (
    <span className={sharedStyles.severityBadge} data-severity={urgency}>
      {urgency}
    </span>
  );
}

function DueBadge({entry}) {
  const {status, daysUntilDue} = getDueStatus(entry);
  if (status === 'NONE') return null;

  let text;
  if (status === 'OVERDUE') text = `Overdue by ${Math.abs(daysUntilDue)}d`;
  else if (status === 'DUE_SOON') text = daysUntilDue === 0 ? 'Due today' : `Due in ${daysUntilDue}d`;
  else text = `Due ${entry.dueDate}`;

  return (
    <span className={styles.dueBadge} data-status={status}>
      {text}
    </span>
  );
}

function KevCard({entry}) {
  const urgency = getUrgency(entry);
  const ransomware = isRansomware(entry);
  const refs = getReferenceLinks(entry);
  const added = new Date(`${entry.dateAdded}T00:00:00Z`);

  return (
    <div className={sharedStyles.card}>
      <div className={sharedStyles.cardHead}>
        <a
          href={`https://nvd.nist.gov/vuln/detail/${entry.cveID}`}
          target="_blank"
          rel="noopener noreferrer"
          className={sharedStyles.cveId}>
          {entry.cveID}
        </a>
        <div className={styles.badgeGroup}>
          {ransomware && (
            <span
              className={styles.ransomwareBadge}
              title="Confirmed use in ransomware campaigns">
              ☣ Ransomware
            </span>
          )}
          <UrgencyBadge urgency={urgency} />
        </div>
      </div>

      <p className={sharedStyles.date}>
        Added {added.toLocaleDateString(undefined, {year: 'numeric', month: 'short', day: 'numeric'})}
      </p>
      <p className={styles.vendorProduct}>
        {entry.vendorProject} — {entry.product}
      </p>
      <p className={styles.vulnName}>{entry.vulnerabilityName}</p>
      <p className={sharedStyles.description}>{entry.shortDescription}</p>

      <div className={styles.metaRow}>
        <DueBadge entry={entry} />
      </div>

      {entry.requiredAction && (
        <p className={styles.requiredAction}>
          <strong>Required action: </strong>
          {entry.requiredAction}
        </p>
      )}

      {refs.length > 0 && (
        <div className={sharedStyles.githubRefs}>
          {refs.map((url) => {
            let label = url;
            try {
              const u = new URL(url);
              label = `↗ ${u.hostname}${u.pathname}`;
            } catch {
              // malformed URL in the source data — fall back to raw string
            }
            return (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className={sharedStyles.githubRef}>
                {label}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

function GithubExploits({exploits}) {
  if (exploits.status === 'idle') return null;

  return (
    <div className={sharedStyles.exploitsSection}>
      <h3 className={sharedStyles.exploitsHeading}>
        Public exploits/PoCs on GitHub{exploits.cveId ? ` for ${exploits.cveId}` : ''}
      </h3>

      {exploits.status === 'loading' && (
        <p className={sharedStyles.exploitsNote}>Searching GitHub…</p>
      )}

      {exploits.status === 'error' && (
        <p className={sharedStyles.exploitsNote}>
          Couldn't search GitHub right now.{' '}
          <a
            href={`https://github.com/search?q=${encodeURIComponent(exploits.cveId)}&type=repositories`}
            target="_blank"
            rel="noopener noreferrer">
            Search on GitHub →
          </a>
        </p>
      )}

      {exploits.status === 'ready' && exploits.repos.length === 0 && (
        <p className={sharedStyles.exploitsNote}>
          No public GitHub repos mention this CVE yet — check back later, or{' '}
          <a
            href={`https://github.com/search?q=${encodeURIComponent(exploits.cveId)}&type=repositories`}
            target="_blank"
            rel="noopener noreferrer">
            search manually →
          </a>
        </p>
      )}

      {exploits.status === 'ready' && exploits.repos.length > 0 && (
        <div className={sharedStyles.exploitsList}>
          {exploits.repos.map((repo) => (
            <a
              key={repo.url}
              href={repo.url}
              target="_blank"
              rel="noopener noreferrer"
              className={sharedStyles.exploitRow}>
              <span className={sharedStyles.exploitStars}>★ {repo.stars}</span>
              <span className={sharedStyles.exploitBody}>
                <span className={sharedStyles.exploitName}>{repo.name}</span>
                {repo.description && (
                  <span className={sharedStyles.exploitDescription}>{repo.description}</span>
                )}
              </span>
              {repo.language && <span className={sharedStyles.exploitLang}>{repo.language}</span>}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CisaKevTracker() {
  const [query, setQuery] = useState('');
  const [ransomwareOnly, setRansomwareOnly] = useState(false);
  const [dueStatus, setDueStatus] = useState('ANY');
  const [mode, setMode] = useState('radar'); // 'radar' | 'search'
  const [catalog, setCatalog] = useState(null);
  const [state, setState] = useState({status: 'loading', results: []});
  const [exploits, setExploits] = useState({status: 'idle', repos: [], cveId: null});

  async function loadCatalog() {
    setState({status: 'loading', results: []});
    try {
      const cat = await fetchKevCatalog();
      setCatalog(cat);
      setState({status: 'ready', results: getRecent(cat, {days: DEFAULT_RECENT_DAYS})});
    } catch {
      setState({status: 'error', results: []});
    }
  }

  useEffect(() => {
    loadCatalog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasActiveFilters = ransomwareOnly || dueStatus !== 'ANY';

  function handleSearch(e) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed && !hasActiveFilters) return; // nothing to actually search for
    if (!catalog) return; // catalog hasn't loaded (or failed) yet

    setMode('search');
    setExploits({status: 'idle', repos: [], cveId: null});

    const exactCveId = trimmed && isCveId(trimmed) ? trimmed.trim().toUpperCase() : null;
    const results = exactCveId
      ? getByExactCveId(catalog, exactCveId)
      : filterCatalog(catalog, {keyword: trimmed, ransomwareOnly, dueStatus});

    setState({status: 'ready', results});

    // Only for an exact single-CVE lookup, same reasoning as CVE Radar:
    // searching GitHub per result in a broad list would multiply API calls.
    if (exactCveId && results.length > 0) {
      setExploits({status: 'loading', repos: [], cveId: exactCveId});
      fetchGithubExploits(exactCveId)
        .then((repos) => setExploits({status: 'ready', repos, cveId: exactCveId}))
        .catch(() => setExploits({status: 'error', repos: [], cveId: exactCveId}));
    }
  }

  function backToRadar() {
    setMode('radar');
    setQuery('');
    setRansomwareOnly(false);
    setDueStatus('ANY');
    setExploits({status: 'idle', repos: [], cveId: null});
    if (catalog) {
      setState({status: 'ready', results: getRecent(catalog, {days: DEFAULT_RECENT_DAYS})});
    } else {
      loadCatalog();
    }
  }

  const catalogStats = catalog ? getCatalogStats(catalog) : null;

  return (
    <div>
      {catalogStats && (
        <dl className={styles.statsBar}>
          <div className={styles.statItem}>
            <dt>{catalogStats.total.toLocaleString()}</dt>
            <dd>total in KEV catalog</dd>
          </div>
          <div className={styles.statItem} data-tone="danger">
            <dt>{catalogStats.ransomwareCount.toLocaleString()}</dt>
            <dd>tied to ransomware campaigns</dd>
          </div>
          <div className={styles.statItem} data-tone="danger">
            <dt>{catalogStats.overdueCount.toLocaleString()}</dt>
            <dd>past their remediation deadline</dd>
          </div>
          <div className={styles.statItem} data-tone="amber">
            <dt>{catalogStats.dueSoonCount.toLocaleString()}</dt>
            <dd>due within 7 days</dd>
          </div>
        </dl>
      )}

      {state.status === 'ready' && state.results.length > 0 && mode === 'radar' && (
        <KevScope entries={state.results} />
      )}

      <form className={sharedStyles.searchBar} onSubmit={handleSearch}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="CVE-2024-24919, a vendor, or a product name..."
          className={sharedStyles.searchInput}
          aria-label="Search the KEV catalog by CVE ID, vendor, or product"
        />
        <button type="submit" className={sharedStyles.searchButton}>
          Search
        </button>
        {mode === 'search' && (
          <button type="button" className={sharedStyles.backButton} onClick={backToRadar}>
            ← Back to radar
          </button>
        )}
      </form>

      <div className={sharedStyles.filterRow}>
        <label className={sharedStyles.filterField}>
          <span className={sharedStyles.filterLabel}>Ransomware use</span>
          <select
            value={ransomwareOnly ? 'YES' : 'ANY'}
            onChange={(e) => setRansomwareOnly(e.target.value === 'YES')}
            className={sharedStyles.filterSelect}
            aria-label="Filter by known ransomware use">
            <option value="ANY">Any</option>
            <option value="YES">Known ransomware use only</option>
          </select>
        </label>

        <label className={sharedStyles.filterField}>
          <span className={sharedStyles.filterLabel}>Remediation status</span>
          <select
            value={dueStatus}
            onChange={(e) => setDueStatus(e.target.value)}
            className={sharedStyles.filterSelect}
            aria-label="Filter by remediation deadline status">
            <option value="ANY">Any status</option>
            {DUE_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        {hasActiveFilters && (
          <button
            type="button"
            className={sharedStyles.clearFiltersButton}
            onClick={() => {
              setRansomwareOnly(false);
              setDueStatus('ANY');
            }}>
            Clear filters
          </button>
        )}
      </div>

      {state.status === 'loading' && (
        <div className={sharedStyles.grid}>
          {Array.from({length: 4}).map((_, i) => (
            <div key={i} className={sharedStyles.skeletonCard} aria-hidden="true" />
          ))}
        </div>
      )}

      {state.status === 'error' && (
        <div className={sharedStyles.emptyState}>
          <p className={sharedStyles.emptyStateTitle}>Couldn't load the KEV catalog right now.</p>
          <p className={sharedStyles.emptyStateBody}>
            This pulls from CISA's official GitHub mirror of the Known Exploited Vulnerabilities
            catalog, which can occasionally be unreachable. Try again in a moment, or check the
            source directly.
          </p>
          <a
            className={sharedStyles.emptyStateLink}
            href="https://www.cisa.gov/known-exploited-vulnerabilities-catalog"
            target="_blank"
            rel="noopener noreferrer">
            View on cisa.gov →
          </a>
        </div>
      )}

      {state.status === 'ready' && state.results.length === 0 && (
        <div className={sharedStyles.emptyState}>
          <p className={sharedStyles.emptyStateTitle}>No results found.</p>
          <p className={sharedStyles.emptyStateBody}>
            Try a CVE ID (e.g. CVE-2024-24919), a vendor or product name, or loosen the
            ransomware/remediation filters.
          </p>
        </div>
      )}

      {state.status === 'ready' && state.results.length > 0 && (
        <div className={sharedStyles.grid}>
          {state.results.map((entry) => (
            <KevCard key={entry.cveID} entry={entry} />
          ))}
        </div>
      )}

      <GithubExploits exploits={exploits} />
    </div>
  );
}
