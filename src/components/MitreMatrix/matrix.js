// Fetches the static ATT&CK matrix snapshot (see
// scripts/generate-attack-matrix.py) hosted on this same site — same
// same-origin, no-CORS-needed pattern as Bounty Vault's dataset.

export async function fetchAttackMatrix(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`responded ${res.status}`);
  return res.json(); // {generatedAt, sourceModified, tactics, techniques}
}

// Builds { [tacticShortname]: { parents: [...], childrenByParent: Map } }
// so the UI can render each column as parent techniques with their
// sub-techniques nested underneath, in a stable order.
export function groupByTactic(techniques) {
  const parents = techniques.filter((t) => !t.isSubtechnique);
  const subByParent = new Map();
  for (const t of techniques) {
    if (!t.isSubtechnique) continue;
    if (!subByParent.has(t.parentId)) subByParent.set(t.parentId, []);
    subByParent.get(t.parentId).push(t);
  }

  const byTactic = new Map();
  for (const parent of parents) {
    for (const tacticName of parent.tactics) {
      if (!byTactic.has(tacticName)) byTactic.set(tacticName, []);
      byTactic.get(tacticName).push({
        ...parent,
        subtechniques: (subByParent.get(parent.id) || []).slice().sort((a, b) => a.id.localeCompare(b.id)),
      });
    }
  }
  for (const list of byTactic.values()) {
    list.sort((a, b) => a.name.localeCompare(b.name));
  }
  return byTactic;
}

export function searchTechniques(techniques, query) {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  return techniques.filter(
    (t) => t.id.toLowerCase().includes(q) || t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q),
  );
}

export function getTechniqueById(techniques, id) {
  return techniques.find((t) => t.id === id) || null;
}
