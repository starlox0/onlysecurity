// CISA's own feed (cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json)
// has no CORS headers and is known to rate-limit direct browser requests —
// several community projects mirror it on GitHub for exactly that reason.
// We use CISA's *own* official GitHub mirror as the primary source (announced
// at github.com/cisagov/kev-data), since raw.githubusercontent.com serves
// files with open CORS and no proxy/worker is needed the way CveRadar needs
// one for NVD.
const KEV_URL =
  'https://raw.githubusercontent.com/cisagov/kev-data/develop/known_exploited_vulnerabilities.json';

// Independent community mirrors as a fallback, in case the primary is ever
// unreachable. Each re-mirrors the same CISA feed on its own schedule.
const FALLBACK_URLS = [
  'https://raw.githubusercontent.com/aboutcode-org/aboutcode-mirror-kev/main/known_exploited_vulnerabilities.json',
  'https://raw.githubusercontent.com/BenjiTrapp/cisa-known-vuln-scraper/main/cisa-kev.json',
];

const REQUEST_TIMEOUT_MS = 10000;
const CACHE_KEY = 'os-kev-catalog-v1';
// KEV updates a few times a week on weekday business hours, not by the
// minute — an hour-long cache is plenty fresh and saves re-pulling a ~1.5MB
// file on every page visit.
const CACHE_TTL_MS = 60 * 60 * 1000;

const CVE_ID_PATTERN = /^CVE-\d{4}-\d{4,}$/i;

export function isCveId(input) {
  return CVE_ID_PATTERN.test(input.trim());
}

function readCache() {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    const {timestamp, data} = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_TTL_MS) return null;
    return data;
  } catch {
    return null;
  }
}

function writeCache(data) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({timestamp: Date.now(), data}));
  } catch {
    // ignore quota errors — the catalog is ~1.5MB and sessionStorage quotas
    // vary, so just skip caching rather than throw
  }
}

async function fetchWithTimeout(url, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, {signal: controller.signal});
  } finally {
    clearTimeout(timer);
  }
}

// Fetches and normalizes the full KEV catalog, trying the primary mirror
// first and falling back to community mirrors in order. Cached in
// sessionStorage since the whole catalog is one request worth reusing across
// searches within the same tab.
export async function fetchKevCatalog() {
  const cached = readCache();
  if (cached) return cached;

  const urls = [KEV_URL, ...FALLBACK_URLS];
  let lastError = new Error('No source configured');

  for (const url of urls) {
    try {
      // eslint-disable-next-line no-await-in-loop -- intentionally sequential fallback chain
      const res = await fetchWithTimeout(url, REQUEST_TIMEOUT_MS);
      if (!res.ok) throw new Error(`responded ${res.status}`);
      // eslint-disable-next-line no-await-in-loop
      const data = await res.json();
      const vulnerabilities = data.vulnerabilities || [];
      const catalog = {
        vulnerabilities,
        count: data.count ?? vulnerabilities.length,
        catalogVersion: data.catalogVersion || null,
        dateReleased: data.dateReleased || null,
      };
      writeCache(catalog);
      return catalog;
    } catch (err) {
      lastError = err;
      // try the next mirror
    }
  }
  throw lastError;
}

// CISA gives every entry a remediation deadline (dueDate). Bucketing by how
// close that deadline is doubles as the "how urgent is this" signal KEV
// doesn't otherwise score numerically the way NVD does with CVSS.
export function getDueStatus(entry, now = new Date()) {
  if (!entry.dueDate) return {status: 'NONE', daysUntilDue: null};
  const due = new Date(`${entry.dueDate}T23:59:59Z`);
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
  if (diffDays < 0) return {status: 'OVERDUE', daysUntilDue: diffDays};
  if (diffDays <= 7) return {status: 'DUE_SOON', daysUntilDue: diffDays};
  return {status: 'ON_TRACK', daysUntilDue: diffDays};
}

export function isRansomware(entry) {
  return (entry.knownRansomwareCampaignUse || '').toLowerCase() === 'known';
}

// Maps a KEV entry onto the same four urgency buckets CveRadar uses for
// CVSS severity (CRITICAL/HIGH/MEDIUM/LOW), so the two radars read the same
// way at a glance: confirmed ransomware use *and* overdue reads as
// CRITICAL, either alone as HIGH, due within a week as MEDIUM, everything
// else as LOW.
export function getUrgency(entry) {
  const {status} = getDueStatus(entry);
  const ransomware = isRansomware(entry);
  if (ransomware && status === 'OVERDUE') return 'CRITICAL';
  if (ransomware || status === 'OVERDUE') return 'HIGH';
  if (status === 'DUE_SOON') return 'MEDIUM';
  return 'LOW';
}

export function sortByDateAddedDesc(list) {
  return [...list].sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
}

export function getRecent(catalog, {days = 14, limit = 15} = {}) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const recent = catalog.vulnerabilities.filter(
    (v) => new Date(v.dateAdded).getTime() >= cutoff,
  );
  return sortByDateAddedDesc(recent).slice(0, limit);
}

// Combined search: optional free-text keyword (matches CVE ID, vendor,
// product, or vulnerability name), optional ransomware-only flag, optional
// due-status filter. Any subset can be left unset. Runs entirely against
// the already-fetched catalog in memory — no extra network calls.
export function filterCatalog(
  catalog,
  {keyword, ransomwareOnly, dueStatus, limit = 24} = {},
) {
  let results = catalog.vulnerabilities;

  if (keyword && keyword.trim()) {
    const q = keyword.trim().toLowerCase();
    results = results.filter(
      (v) =>
        v.cveID.toLowerCase().includes(q) ||
        (v.vendorProject || '').toLowerCase().includes(q) ||
        (v.product || '').toLowerCase().includes(q) ||
        (v.vulnerabilityName || '').toLowerCase().includes(q),
    );
  }

  if (ransomwareOnly) {
    results = results.filter(isRansomware);
  }

  if (dueStatus && dueStatus !== 'ANY') {
    results = results.filter((v) => getDueStatus(v).status === dueStatus);
  }

  return sortByDateAddedDesc(results).slice(0, limit);
}

export function getByExactCveId(catalog, id) {
  const upper = id.trim().toUpperCase();
  return catalog.vulnerabilities.filter((v) => v.cveID.toUpperCase() === upper);
}

export function getCatalogStats(catalog) {
  const vulns = catalog.vulnerabilities;
  return {
    total: vulns.length,
    ransomwareCount: vulns.filter(isRansomware).length,
    overdueCount: vulns.filter((v) => getDueStatus(v).status === 'OVERDUE').length,
    dueSoonCount: vulns.filter((v) => getDueStatus(v).status === 'DUE_SOON').length,
  };
}

// CISA packs the "notes" field with semicolon-separated reference URLs
// (advisories, vendor bulletins, the NVD page) rather than a structured
// references array the way NVD does — pull them out the same way CveRadar
// surfaces its GitHub references.
export function getReferenceLinks(entry, max = 3) {
  if (!entry.notes) return [];
  const urls = entry.notes.match(/https?:\/\/[^\s;]+/g) || [];
  return urls.slice(0, max);
}
