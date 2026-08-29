// Primary path: a small Cloudflare Worker (owned, not a shared public
// service) that forwards requests to NVD with the real API key attached
// and returns them with open CORS headers — tried first since it's far
// more reliable than public proxies.
const WORKER_URL = 'https://onlysecurity-cve-proxy.randomt3ster.workers.dev';

const BASE_URL = 'https://services.nvd.nist.gov/rest/json/cves/2.0';

// Fallback path if the Worker is ever unreachable: a couple of free
// public CORS proxies. These are individually flaky (rate limits,
// occasional outages/522s), so we try more than one, each with a short
// timeout. corsproxy.io is deliberately excluded — its free tier is now
// restricted to localhost/development only.
const FALLBACK_PROXIES = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
];
const REQUEST_TIMEOUT_MS = 8000;

const CVE_ID_PATTERN = /^CVE-\d{4}-\d{4,}$/i;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

export function isCveId(input) {
  return CVE_ID_PATTERN.test(input.trim());
}

// A curated subset of CWE categories worth offering in a dropdown — full
// CWE has 900+ entries, most of which nobody's searching for by name.
export const VULN_TYPES = [
  {label: 'SQL Injection', cweId: 'CWE-89'},
  {label: 'Cross-Site Scripting (XSS)', cweId: 'CWE-79'},
  {label: 'Cross-Site Request Forgery (CSRF)', cweId: 'CWE-352'},
  {label: 'Path Traversal', cweId: 'CWE-22'},
  {label: 'Server-Side Request Forgery (SSRF)', cweId: 'CWE-918'},
  {label: 'OS Command Injection', cweId: 'CWE-78'},
  {label: 'Code Injection', cweId: 'CWE-94'},
  {label: 'Buffer Overflow', cweId: 'CWE-120'},
  {label: 'Use After Free', cweId: 'CWE-416'},
  {label: 'Insecure Deserialization', cweId: 'CWE-502'},
  {label: 'XML External Entities (XXE)', cweId: 'CWE-611'},
  {label: 'Improper Authentication', cweId: 'CWE-287'},
  {label: 'Broken Access Control', cweId: 'CWE-284'},
  {label: 'Privilege Escalation', cweId: 'CWE-269'},
  {label: 'Information Exposure', cweId: 'CWE-200'},
  {label: 'Denial of Service', cweId: 'CWE-400'},
  {label: 'Race Condition', cweId: 'CWE-362'},
  {label: 'Hardcoded Credentials', cweId: 'CWE-798'},
  {label: 'Improper Input Validation', cweId: 'CWE-20'},
  {label: 'Missing Authorization', cweId: 'CWE-862'},
];

export const SEVERITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

// Recent years worth offering — CVEs from further back are rarely what
// someone's browsing a "radar" for.
export function recentYears(count = 12) {
  const current = new Date().getUTCFullYear();
  return Array.from({length: count}, (_, i) => current - i);
}

// Splits a calendar year into consecutive windows no longer than 100 days
// (a safety margin under NVD's hard 120-day cap on any date-range query),
// so a full year can be fetched as a handful of sequential requests and
// merged, instead of one request NVD would reject outright.
function yearDateChunks(year) {
  const MAX_CHUNK_DAYS = 100;
  const yearStart = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
  const yearEnd = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
  const chunks = [];
  let chunkStart = yearStart;
  while (chunkStart <= yearEnd) {
    const proposedEnd = new Date(chunkStart.getTime() + MAX_CHUNK_DAYS * 24 * 60 * 60 * 1000);
    const chunkEnd = proposedEnd > yearEnd ? yearEnd : proposedEnd;
    chunks.push([chunkStart, chunkEnd]);
    chunkStart = new Date(chunkEnd.getTime() + 1);
  }
  return chunks;
}

// Combined search: optional free-text keyword, optional CWE vulnerability
// type, optional CVSS v3 severity, and either the recent-14-days window
// (default) or a full specific year (transparently chunked under the
// hood). Any subset of these can be empty/unset.
export async function fetchFiltered({keyword, year, severity, cweId, limit = 24} = {}) {
  const baseFilters = {};
  if (keyword && keyword.trim()) baseFilters.keywordSearch = keyword.trim();
  if (severity && severity !== 'ANY') baseFilters.cvssV3Severity = severity;
  if (cweId && cweId !== 'ANY') baseFilters.cweId = cweId;

  const windows =
    year && year !== 'RECENT'
      ? yearDateChunks(Number(year))
      : [[new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), new Date()]];

  const all = [];
  for (const [start, end] of windows) {
    const params = new URLSearchParams({
      ...baseFilters,
      pubStartDate: start.toISOString(),
      pubEndDate: end.toISOString(),
      resultsPerPage: '20',
    });
    // eslint-disable-next-line no-await-in-loop -- intentionally sequential to stay rate-limit-friendly
    const data = await nvdFetch(params);
    all.push(...(data.vulnerabilities || []).map((v) => v.cve));
  }

  const seen = new Set();
  return all
    .filter((cve) => {
      if (seen.has(cve.id)) return false;
      seen.add(cve.id);
      return true;
    })
    .sort((a, b) => new Date(b.published) - new Date(a.published))
    .slice(0, limit);
}

function cacheKeyFor(params) {
  return `os-cve-radar-v1:${params.toString()}`;
}

function readCache(key) {
  try {
    const cached = sessionStorage.getItem(key);
    if (!cached) return null;
    const {timestamp, data} = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_TTL_MS) return null;
    return data;
  } catch {
    return null;
  }
}

function writeCache(key, data) {
  try {
    sessionStorage.setItem(key, JSON.stringify({timestamp: Date.now(), data}));
  } catch {
    // ignore quota errors
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

async function nvdFetch(params) {
  const key = cacheKeyFor(params);
  const cached = readCache(key);
  if (cached) return cached;

  const targetUrl = `${BASE_URL}?${params.toString()}`;
  let lastError = new Error('No source configured');

  if (WORKER_URL) {
    try {
      const res = await fetchWithTimeout(`${WORKER_URL}?${params.toString()}`, REQUEST_TIMEOUT_MS);
      if (!res.ok) throw new Error(`worker responded ${res.status}`);
      const data = await res.json();
      writeCache(key, data);
      return data;
    } catch (err) {
      lastError = err;
      // fall through to public proxies below
    }
  }

  for (const buildProxyUrl of FALLBACK_PROXIES) {
    try {
      const res = await fetchWithTimeout(buildProxyUrl(targetUrl), REQUEST_TIMEOUT_MS);
      if (!res.ok) throw new Error(`proxy responded ${res.status}`);
      const data = await res.json();
      writeCache(key, data);
      return data;
    } catch (err) {
      lastError = err;
      // try the next proxy in the list
    }
  }
  throw lastError;
}

export async function fetchRecentCves({days = 14, limit = 15} = {}) {
  const end = new Date();
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
  const params = new URLSearchParams({
    pubStartDate: start.toISOString(),
    pubEndDate: end.toISOString(),
    resultsPerPage: String(Math.min(limit, 20)),
  });
  const data = await nvdFetch(params);
  return (data.vulnerabilities || [])
    .map((v) => v.cve)
    .sort((a, b) => new Date(b.published) - new Date(a.published));
}

export async function fetchByCveId(id) {
  const params = new URLSearchParams({cveId: id.trim().toUpperCase()});
  const data = await nvdFetch(params);
  return (data.vulnerabilities || []).map((v) => v.cve);
}

export async function fetchByKeyword(keyword, {limit = 12} = {}) {
  const params = new URLSearchParams({
    keywordSearch: keyword.trim(),
    resultsPerPage: String(Math.min(limit, 20)),
  });
  const data = await nvdFetch(params);
  return (data.vulnerabilities || [])
    .map((v) => v.cve)
    .sort((a, b) => new Date(b.published) - new Date(a.published));
}

// Pulls the best available CVSS score/severity, preferring newer metric
// versions, since not every CVE has been scored under all of them.
export function getSeverity(cve) {
  const metrics = cve.metrics || {};
  const entry =
    metrics.cvssMetricV31?.[0] || metrics.cvssMetricV30?.[0] || metrics.cvssMetricV2?.[0];
  if (!entry) return {score: null, severity: 'UNSCORED'};
  return {
    score: entry.cvssData?.baseScore ?? null,
    severity: entry.baseSeverity || entry.cvssData?.baseSeverity || 'UNSCORED',
  };
}

export function getDescription(cve) {
  const desc = (cve.descriptions || []).find((d) => d.lang === 'en');
  return desc ? desc.value : 'No description available.';
}

// Any reference pointing at github.com — often a PoC, advisory, or the
// researcher's own repo/profile, which is frequently how credit is given
// in place of (or alongside) a real name.
export function getGithubRefs(cve) {
  return (cve.references || []).filter((r) => /github\.com/i.test(r.url)).slice(0, 3);
}
