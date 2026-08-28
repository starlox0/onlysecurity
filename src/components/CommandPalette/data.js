// Hand-maintained search index, same pattern as MediumPosts/posts.js —
// add an entry here any time you add a doc page, category, or link worth
// jumping to directly.
const entries = [
  {
    title: 'Fundamentals',
    description: 'CIA triad, threat modeling, reading a CVE.',
    path: '/docs/intro',
    type: 'doc',
  },
  {
    title: 'Web Security',
    description: 'Trust boundaries and a real testing methodology.',
    path: '/docs/category/web-security',
    type: 'doc',
  },
  {
    title: 'OWASP Top 10',
    description: 'The standard risk categories, with real scenarios.',
    path: '/docs/category/owasp',
    type: 'doc',
  },
  {
    title: 'Network Security',
    description: 'Layers, segmentation, and core recon tools.',
    path: '/docs/category/network-security',
    type: 'doc',
  },
  {
    title: 'Bug Bounty',
    description: 'Scope, recon workflow, reports that get triaged.',
    path: '/docs/category/bug-bounty',
    type: 'doc',
  },
  {
    title: 'Blog & Write-ups',
    description: 'Your posts and a live community feed.',
    path: '/blog',
    type: 'doc',
  },
  {
    title: 'View Source',
    description: 'The full repo on GitHub.',
    path: 'https://github.com/starlox0/onlysecurity',
    type: 'link',
  },
  {
    title: 'Contributing Guide',
    description: 'How to add a doc page or write-up.',
    path: 'https://github.com/starlox0/onlysecurity/blob/main/CONTRIBUTING.md',
    type: 'link',
  },
];

export default entries;
