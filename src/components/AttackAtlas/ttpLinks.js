// Every connection the globe draws is *derived*, not hand-authored twice.
// A category's `techniques` labels already resolve to an internal
// Attack Atlas technique (via ALIASES in techniques.js), and separately
// MitreMatrix/mappings.js already says which real ATT&CK IDs point at
// each internal technique. This file just walks that chain in reverse —
// so the globe can never show a connection that isn't backed by the same
// data the rest of the page already uses.
import {ALIASES} from './techniques';
import {MITRE_MAPPINGS} from '../MitreMatrix/mappings';

const REVERSE_MITRE = (() => {
  const map = new Map();
  for (const [attackId, mapping] of Object.entries(MITRE_MAPPINGS)) {
    for (const internalId of mapping.internalTechniques || []) {
      if (!map.has(internalId)) map.set(internalId, []);
      map.get(internalId).push(attackId);
    }
  }
  return map;
})();

export function getRelatedAttackIds(category) {
  const internalIds = new Set();
  for (const label of category.techniques) {
    const internalId = ALIASES[label];
    if (internalId) internalIds.add(internalId);
  }
  const attackIds = new Set();
  for (const internalId of internalIds) {
    for (const attackId of REVERSE_MITRE.get(internalId) || []) {
      attackIds.add(attackId);
    }
  }
  return [...attackIds].sort();
}
