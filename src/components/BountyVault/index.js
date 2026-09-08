import React, {useEffect, useMemo, useState} from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {
  fetchFindings,
  groupByVulnType,
  groupBySeverity,
  groupByBountyRange,
  groupByOwasp,
  groupByYear,
  getTopPrograms,
  getPayGapOfTheDay,
  filterReports,
  getStats,
  getSeverityTone,
  formatBounty,
} from './findings';
import ChartPanel from './ChartPanel';
import PayGapOfTheDay from './PayGapOfTheDay';
import styles from './styles.module.css';

const MODES = [
  {id: 'vuln', label: 'By Vulnerability Type'},
  {id: 'severity', label: 'By Severity'},
  {id: 'bounty', label: 'By Bounty Range'},
  {id: 'owasp', label: 'By OWASP Top 10'},
];

const PAGE_SIZE = 30;

function ReportCard({report}) {
  const bounty = formatBounty(report.bounty);
  return (
    <div className={styles.card}>
      <a
        href={report.url}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.cardTitle}>
        {report.title}
      </a>
      <span className={styles.cardMeta}>
        <span className={styles.programTag}>{report.program}</span>
        {report.severity && (
          <span className={styles.severityBadge} data-tone={getSeverityTone(report.severity)}>
            {report.severity}
          </span>
        )}
        {bounty && <span className={styles.bountyTag}>{bounty}</span>}
        {report.cve && (
          <Link
            to={`/cve-radar?tool=cve&q=${encodeURIComponent(report.cve)}`}
            className={styles.cveTag}
            title={`View ${report.cve} in CVE Radar`}>
            {report.cve} ↗
          </Link>
        )}
        <span className={styles.votesTag}>▲ {report.votes}</span>
      </span>
    </div>
  );
}

export default function BountyVault() {
  const dataUrl = useBaseUrl('/data/hackerone-findings.json');
  const [state, setState] = useState({status: 'loading', data: null});
  const [mode, setMode] = useState('vuln');
  const [groupKey, setGroupKey] = useState(null);
  const [keyword, setKeyword] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    fetchFindings(dataUrl)
      .then((data) => setState({status: 'ready', data}))
      .catch(() => setState({status: 'error', data: null}));
  }, [dataUrl]);

  function switchMode(nextMode) {
    setMode(nextMode);
    setGroupKey(null);
    setVisibleCount(PAGE_SIZE);
  }

  function selectGroup(key) {
    setGroupKey((prev) => (prev === key ? null : key));
    setVisibleCount(PAGE_SIZE);
  }

  const reports = state.data?.reports || [];
  const owaspNames = state.data?.owaspNames || {};

  const groups = useMemo(() => {
    if (!reports.length) return [];
    if (mode === 'vuln') return groupByVulnType(reports).slice(0, 20);
    if (mode === 'severity') return groupBySeverity(reports);
    if (mode === 'bounty') return groupByBountyRange(reports);
    if (mode === 'owasp') return groupByOwasp(reports, owaspNames);
    return [];
  }, [reports, mode, owaspNames]);

  const filtered = useMemo(
    () => filterReports(reports, {mode, groupKey, keyword}),
    [reports, mode, groupKey, keyword],
  );

  const stats = useMemo(() => getStats(reports), [reports]);
  const visible = filtered.slice(0, visibleCount);

  const chartData = useMemo(() => {
    if (!reports.length) return null;
    return {
      severity: groupBySeverity(reports),
      owasp: groupByOwasp(reports, owaspNames),
      vulnTypes: groupByVulnType(reports).slice(0, 8),
      programs: getTopPrograms(reports, 8),
      years: groupByYear(reports).slice(-10),
    };
  }, [reports, owaspNames]);

  const payGap = useMemo(() => (reports.length ? getPayGapOfTheDay(reports) : null), [reports]);

  return (
    <div>
      {state.status === 'ready' && (
        <>
          <PayGapOfTheDay gap={payGap} />

          <div className={styles.statsBar}>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{stats.total.toLocaleString()}</span>
              <span className={styles.statLabel}>notable disclosed reports</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{stats.critical.toLocaleString()}</span>
              <span className={styles.statLabel}>rated critical</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{stats.withBounty.toLocaleString()}</span>
              <span className={styles.statLabel}>paid a bounty</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{stats.withCve.toLocaleString()}</span>
              <span className={styles.statLabel}>tied to a CVE</span>
            </div>
          </div>
          {state.data?.generatedAt && (
            <p className={styles.generatedNote}>
              Snapshot generated{' '}
              {new Date(state.data.generatedAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
              .
            </p>
          )}

          {chartData && (
            <div className={styles.chartGrid}>
              <ChartPanel
                title="Severity breakdown"
                rows={chartData.severity}
                toneOf={(key) => (key === 'critical' || key === 'high' ? 'danger' : key === 'medium' ? 'amber' : undefined)}
              />
              <ChartPanel title="OWASP Top 10 (2021)" rows={chartData.owasp} />
              <ChartPanel title="Most common vulnerability types" rows={chartData.vulnTypes} />
              <ChartPanel title="Most represented programs" rows={chartData.programs} />
              <ChartPanel title="Disclosures by year" rows={chartData.years} />
            </div>
          )}

          <div className={styles.sectionDivider}>
            <div>
              <h2 className={styles.sectionDividerTitle}>Browse the vault</h2>
              <p className={styles.sectionDividerNote}>
                Pick a lens, then narrow further with a keyword.
              </p>
            </div>
          </div>
        </>
      )}

      <div className={styles.modeTabs} role="tablist" aria-label="Categorize findings by">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={mode === m.id}
            className={styles.modeTab}
            data-active={mode === m.id}
            onClick={() => switchMode(m.id)}>
            {m.label}
          </button>
        ))}
      </div>

      {state.status === 'ready' && groups.length > 0 && (
        <div className={styles.groupRow}>
          {groups.map((group) => (
            <button
              key={group.key}
              type="button"
              className={styles.groupChip}
              data-active={groupKey === group.key}
              onClick={() => selectGroup(group.key)}>
              {group.label}
              <span className={styles.groupChipCount}>{group.count}</span>
            </button>
          ))}
        </div>
      )}

      <form className={styles.searchBar} onSubmit={(e) => e.preventDefault()}>
        <input
          type="text"
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value);
            setVisibleCount(PAGE_SIZE);
          }}
          placeholder="Search by title, program, or CVE..."
          className={styles.searchInput}
          aria-label="Search disclosed reports"
        />
      </form>

      {state.status === 'loading' && (
        <div className={styles.grid}>
          {Array.from({length: 6}).map((_, i) => (
            <div key={i} className={styles.skeletonCard} aria-hidden="true" />
          ))}
        </div>
      )}

      {state.status === 'error' && (
        <div className={styles.emptyState}>
          <p className={styles.emptyStateTitle}>Couldn't load the findings snapshot.</p>
          <p className={styles.emptyStateBody}>
            Try refreshing. If this keeps happening, the static dataset file may be missing —
            check that <code>static/data/hackerone-findings.json</code> was deployed.
          </p>
        </div>
      )}

      {state.status === 'ready' && (
        <>
          <p className={styles.resultCount}>
            {filtered.length.toLocaleString()} report{filtered.length === 1 ? '' : 's'}
            {groupKey ? ' in this category' : ''}
            {keyword.trim() ? ' matching your search' : ''}
          </p>

          {filtered.length === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyStateTitle}>No reports match this filter.</p>
              <p className={styles.emptyStateBody}>Try a different category or search term.</p>
            </div>
          ) : (
            <>
              <div className={styles.grid}>
                {visible.map((report) => (
                  <ReportCard key={report.id} report={report} />
                ))}
              </div>
              {visibleCount < filtered.length && (
                <div className={styles.loadMoreRow}>
                  <button
                    type="button"
                    className={styles.loadMoreButton}
                    onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
                    Show more ({filtered.length - visibleCount} remaining)
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
