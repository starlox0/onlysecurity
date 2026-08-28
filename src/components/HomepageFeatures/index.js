import React from 'react';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

const entries = [
  {
    name: 'fundamentals',
    tag: 'START HERE',
    size: '4.2K',
    description: 'The CIA triad, threat modeling, and how to read a CVE.',
    to: '/docs/intro',
  },
  {
    name: 'web-security',
    tag: 'METHODOLOGY',
    size: '6.8K',
    description: 'Trust boundaries, a testing methodology, and the tools you\u2019ll reach for constantly.',
    to: '/docs/category/web-security',
  },
  {
    name: 'owasp',
    tag: 'REFERENCE',
    size: '5.4K',
    description: 'The Top 10, explained with real attack scenarios instead of definitions.',
    to: '/docs/category/owasp',
  },
  {
    name: 'network-security',
    tag: 'RECON',
    size: '5.9K',
    description: 'OSI layers, segmentation, and the protocols behind every internal engagement.',
    to: '/docs/category/network-security',
  },
  {
    name: 'bug-bounty',
    tag: 'GETTING STARTED',
    size: '4.6K',
    description: 'Program scope, a recon workflow, and how to write a report that gets triaged fast.',
    to: '/docs/category/bug-bounty',
  },
  {
    name: 'blog',
    tag: 'READ',
    size: '3.1K',
    description: 'Real CTF and bug bounty write-ups \u2014 from the team and the community.',
    to: '/blog',
  },
];

function Entry({name, tag, size, description, to}) {
  return (
    <Link to={to} className={styles.row}>
      <span className={styles.perms}>drwxr-xr-x</span>
      <span className={styles.owner}>os</span>
      <span className={styles.group}>docs</span>
      <span className={styles.size}>{size}</span>
      <span className={styles.tag}>{tag}</span>
      <span className={styles.name}>
        {name}/<span className={styles.arrow}>→</span>
      </span>
      <span className={styles.comment}># {description}</span>
    </Link>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className={styles.terminal}>
          <div className={styles.terminalBar}>
            <span className={styles.dot} data-color="red" />
            <span className={styles.dot} data-color="amber" />
            <span className={styles.dot} data-color="green" />
            <span className={styles.terminalPath}>root@onlysecurity:~$</span>
          </div>
          <div className={styles.terminalBody}>
            <p className={styles.commandLine}>
              <span className={styles.prompt}>$</span> ls -la /docs --sort=priority
            </p>
            <div className={styles.listing} role="list">
              {entries.map((entry) => (
                <Entry key={entry.name} {...entry} />
              ))}
            </div>
            <p className={styles.commandLine}>
              <span className={styles.prompt}>$</span> cd <span className={styles.finalCursor} aria-hidden="true" />
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
