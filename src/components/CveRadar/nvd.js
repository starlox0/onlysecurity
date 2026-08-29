const NVD_API_KEY = 'AB40B533-98CB-4074-88E3-5D5F88089102';
const BASE_URL = 'https://services.nvd.nist.gov/rest/json/cves/2.0';

const PROXIES = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
];
const PROXY_TIMEOUT_MS = 8000;

const CVE_ID_PATTERN = /^CVE-\d{4}-\d{4,}$/i;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

export function isCveId(input) {
  return CVE_ID_PATTERN.test(input.trim());
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
  let lastError = new Error('No proxy configured');

  for (const buildProxyUrl of PROXIES) {
    try {
      const res = await fetchWithTimeout(buildProxyUrl(targetUrl), PROXY_TIMEOUT_MS);
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
