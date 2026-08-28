export function fuzzyScore(query, target) {
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  if (q.length === 0) return 0;

  let qi = 0;
  let score = 0;
  let lastMatchIndex = -1;

  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      const gap = lastMatchIndex === -1 ? ti : ti - lastMatchIndex - 1;
      score += gap;
      lastMatchIndex = ti;
      qi++;
    }
  }

  if (qi < q.length) return null; // not every query char was found, in order
  return score;
}

export function fuzzySearch(query, items, {limit = 8, keys = ['title', 'description']} = {}) {
  if (!query.trim()) return items.slice(0, limit);

  const scored = items
    .map((item) => {
      const best = keys.reduce((min, key) => {
        const s = fuzzyScore(query, item[key] || '');
        if (s === null) return min;
        return min === null ? s : Math.min(min, s);
      }, null);
      return best === null ? null : {item, score: best};
    })
    .filter(Boolean)
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map((r) => r.item);

  return scored;
}
