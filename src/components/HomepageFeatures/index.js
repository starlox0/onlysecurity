import React from 'react';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'Fundamentals',
    tag: 'START HERE',
    description: 'The CIA triad, threat modeling, and how to read a CVE — the concepts everything else builds on.',
    to: '/docs/intro',
  },
  {
    title: 'Web Security',
    tag: 'METHODOLOGY',
    description: 'Trust boundaries, a practical testing methodology, and the tools you\u2019ll reach for constantly.',
    to: '/docs/category/web-security',
  },
  {
    title: 'OWASP Top 10',
    tag: 'REFERENCE',
    description: 'The industry-standard risk categories, explained with real attack scenarios instead of just definitions.',
    to: '/docs/category/owasp',
  },
  {
    title: 'Network Security',
    tag: 'RECON',
    description: 'OSI layers, segmentation, and the protocols (DNS, SMB, ARP) that show up in every internal engagement.',
    to: '/docs/category/network-security',
  },
  {
    title: 'Bug Bounty',
    tag: 'GETTING STARTED',
    description: 'Program scope, a practical recon workflow, and how to write a report that actually gets triaged fast.',
    to: '/docs/category/bug-bounty',
  },
  {
    title: 'Blog & Write-ups',
    tag: 'READ',
    description: 'Real CTF and bug bounty write-ups \u2014 from the OnlySecurity team and the community.',
    to: '/blog',
  },
];

function Feature({title, tag, description, to}) {
  return (
    <Link to={to} className={styles.card}>
      <span className={styles.tag}>{tag}</span>
      <h3 className={styles.cardTitle}>{title}</h3>
      <p className={styles.cardDescription}>{description}</p>
      <span className={styles.cardLink}>Explore →</span>
    </Link>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className={styles.grid}>
          {FeatureList.map((props) => (
            <Feature key={props.title} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
