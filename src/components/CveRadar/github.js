const CACHE_TTL_MS = 15 * 60 * 1000;

export async function fetchGithubExploits(cveId) {
  const cacheKey = `os-cve-github-exploits-v1:${cveId}`;
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const {timestamp, data} = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_TTL_MS) return data;
    }
  } catch {
    // ignore cache errors, fall through to a fresh fetch
  }

  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(
    cveId,
  )}&sort=stars&order=desc&per_page=10`;

  const res = await fetch(url, {
    headers: {Accept: 'application/vnd.github+json'},
  });
  if (!res.ok) {
    throw new Error(`GitHub search responded ${res.status}`);
  }
  const data = await res.json();
  const repos = (data.items || []).map((item) => ({
    name: item.full_name,
    url: item.html_url,
    description: item.description,
    stars: item.stargazers_count,
    language: item.language,
    updatedAt: item.updated_at,
  }));

  try {
    sessionStorage.setItem(cacheKey, JSON.stringify({timestamp: Date.now(), data: repos}));
  } catch {
    // ignore quota errors
  }
  return repos;
}
