const PUBLICATIONS = [
  {match: 'infosecwriteups.com', name: 'InfoSec Write-ups', followers: '71K'},
  {match: 'medium.com/bugbountywriteup', name: 'InfoSec Write-ups', followers: '71K'},
  {match: 'osintteam.blog', name: 'OSINT Team', followers: '14.4K'},
  {match: 'doublepulsar.com', name: 'DoublePulsar', followers: '9.2K'},
  {match: 'systemweakness.com', name: 'System Weakness', followers: '8.4K'},
];

export function detectPublication(url) {
  if (!url) return null;
  const found = PUBLICATIONS.find((p) => url.includes(p.match));
  return found ? {name: found.name, followers: found.followers} : null;
}

// Reading time from real content length — Medium's RSS `content` field
// usually carries the full article HTML, so this is a genuine estimate,
// not a guess. 200 wpm is the commonly used average adult reading speed.
export function estimateReadingMinutes(html) {
  if (typeof window === 'undefined' || !html) return null;
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const text = doc.body.textContent || '';
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  if (words === 0) return null;
  return Math.max(1, Math.round(words / 200));
}
