// Bounty Vault reads a static, periodically-regenerated snapshot hosted on
// this same site (see scripts/generate-hackerone-findings.py) rather than
// live-fetching HackerOne's own ~10,000-report, ~5MB index on every visit.
// Same-origin static asset — no CORS concerns, no third-party rate limits.

export const BOUNTY_RANGES = [
  {id: 'none', label: 'No bounty', test: (b) => !b},
  {id: 'low', label: '$1 – $499', test: (b) => b > 0 && b < 500},
  {id: 'mid', label: '$500 – $1,999', test: (b) => b >= 500 && b < 2000},
  {id: 'high', label: '$2,000 – $4,999', test: (b) => b >= 2000 && b < 5000},
  {id: 'top', label: '$5,000+', test: (b) => b >= 5000},
];

export function getBountyRange(bounty) {
  return BOUNTY_RANGES.find((range) => range.test(bounty)) || BOUNTY_RANGES[0];
}

export function getSeverityTone(severity) {
  switch (severity) {
    case 'critical':
    case 'high':
      return 'danger';
    case 'medium':
      return 'amber';
    default:
      return 'neutral';
  }
}

let cachedFindingsUrl = null;

export async function fetchFindings(url) {
  cachedFindingsUrl = url;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`responded ${res.status}`);
  const data = await res.json();
  return data; // {generatedAt, owaspNames, reports}
}

// --- Grouping (one function per categorization mode) -----------------------

export function groupByField(reports, getKey, getLabel) {
  const counts = new Map();
  for (const report of reports) {
    const key = getKey(report);
    if (!counts.has(key)) counts.set(key, {key, label: getLabel(key, report), count: 0});
    counts.get(key).count += 1;
  }
  return [...counts.values()].sort((a, b) => b.count - a.count);
}

export function groupByVulnType(reports) {
  return groupByField(
    reports,
    (r) => r.weakness || 'Uncategorized',
    (key) => key,
  );
}

const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low', 'none'];
const SEVERITY_LABELS = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  none: 'No severity rating',
};

export function groupBySeverity(reports) {
  const groups = groupByField(
    reports,
    (r) => r.severity || 'none',
    (key) => SEVERITY_LABELS[key] || key,
  );
  return groups.sort((a, b) => SEVERITY_ORDER.indexOf(a.key) - SEVERITY_ORDER.indexOf(b.key));
}

export function groupByBountyRange(reports) {
  const groups = groupByField(
    reports,
    (r) => getBountyRange(r.bounty).id,
    (key) => BOUNTY_RANGES.find((r) => r.id === key)?.label || key,
  );
  const order = BOUNTY_RANGES.map((r) => r.id);
  return groups.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
}

export function groupByOwasp(reports, owaspNames) {
  const groups = groupByField(
    reports,
    (r) => r.owasp || 'OTHER',
    (key) => owaspNames?.[key] || key,
  );
  const order = ['A01', 'A02', 'A03', 'A04', 'A05', 'A06', 'A07', 'A08', 'A09', 'A10', 'OTHER'];
  return groups.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
}

// --- Filtering ---------------------------------------------------------

export function filterReports(reports, {mode, groupKey, keyword}) {
  let results = reports;

  if (groupKey) {
    if (mode === 'vuln') {
      results = results.filter((r) => (r.weakness || 'Uncategorized') === groupKey);
    } else if (mode === 'severity') {
      results = results.filter((r) => (r.severity || 'none') === groupKey);
    } else if (mode === 'bounty') {
      results = results.filter((r) => getBountyRange(r.bounty).id === groupKey);
    } else if (mode === 'owasp') {
      results = results.filter((r) => (r.owasp || 'OTHER') === groupKey);
    }
  }

  if (keyword && keyword.trim()) {
    const q = keyword.trim().toLowerCase();
    results = results.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        (r.program || '').toLowerCase().includes(q) ||
        (r.weakness || '').toLowerCase().includes(q) ||
        (r.cve || '').toLowerCase().includes(q),
    );
  }

  return results.sort((a, b) => (b.votes || 0) - (a.votes || 0));
}

export function groupByYear(reports) {
  const groups = groupByField(
    reports,
    (r) => (r.date ? r.date.slice(0, 4) : 'Unknown'),
    (key) => key,
  );
  return groups.sort((a, b) => a.key.localeCompare(b.key));
}

export function getTopPrograms(reports, limit = 8) {
  return groupByField(
    reports,
    (r) => r.program || 'Unknown',
    (key) => key,
  ).slice(0, limit);
}

export function getStats(reports) {
  const totalBounty = reports.reduce((sum, r) => sum + (r.bounty || 0), 0);
  const withBounty = reports.filter((r) => r.bounty).length;
  const withCve = reports.filter((r) => r.cve).length;
  const critical = reports.filter((r) => r.severity === 'critical').length;
  return {total: reports.length, totalBounty, withBounty, withCve, critical};
}

export function formatBounty(bounty) {
  if (!bounty) return null;
  return `$${bounty.toLocaleString()}`;
}

// "Pay gap of the day" — finds vulnerability-type categories where two
// bountied reports paid wildly different amounts, and rotates through the
// most dramatic ones by day of year (stable across visits on the same day,
// changes the next day) rather than a purely random pick on every load.
export function getPayGapOfTheDay(reports) {
  const bountied = reports.filter((r) => r.bounty > 0);
  const byWeakness = new Map();
  for (const r of bountied) {
    const key = r.weakness || 'Uncategorized';
    if (!byWeakness.has(key)) byWeakness.set(key, []);
    byWeakness.get(key).push(r);
  }

  const candidates = [];
  for (const [weakness, list] of byWeakness) {
    if (list.length < 2) continue;
    const sorted = [...list].sort((a, b) => a.bounty - b.bounty);
    const low = sorted[0];
    const high = sorted[sorted.length - 1];
    const ratio = high.bounty / low.bounty;
    const diff = high.bounty - low.bounty;
    // Only surface gaps that are actually dramatic, not just noise.
    if (ratio < 5 || diff < 500) continue;
    candidates.push({weakness, low, high, ratio});
  }

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => b.ratio - a.ratio);
  const pool = candidates.slice(0, 20);

  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000));

  return pool[dayOfYear % pool.length];
}
