import React from 'react';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

const steps = [
  {
    n: '01',
    title: 'Fundamentals',
    blurb: 'CIA triad, threat modeling, reading a CVE.',
    to: '/docs/intro',
  },
  {
    n: '02',
    title: 'Web Security',
    blurb: 'Trust boundaries and a real testing methodology.',
    to: '/docs/category/web-security',
  },
  {
    n: '03',
    title: 'OWASP Top 10',
    blurb: 'The standard risk categories, with real scenarios.',
    to: '/docs/category/owasp',
  },
  {
    n: '04',
    title: 'Network Security',
    blurb: 'Layers, segmentation, and core recon tools.',
    to: '/docs/category/network-security',
  },
  {
    n: '05',
    title: 'Bug Bounty',
    blurb: 'Scope, recon workflow, reports that get triaged.',
    to: '/docs/category/bug-bounty',
  },
];

export default function LearningPath() {
  return (
    <section className={styles.path}>
      <div className="container">
        <div className={styles.sectionHead}>
          <span className={styles.eyebrow}>The path</span>
          <h2 className={styles.sectionTitle}>Six modules. One clear order.</h2>
          <p className={styles.sectionSubtitle}>
            Follow it top to bottom if you're new. Already know the basics?
            Skip straight to what you need.
          </p>
        </div>

        <ol className={styles.chain}>
          {steps.map((step, i) => (
            <li key={step.n} className={styles.step}>
              <Link to={step.to} className={styles.stepCard}>
                <span className={styles.stepNumber}>{step.n}</span>
                <span className={styles.stepTitle}>{step.title}</span>
                <span className={styles.stepBlurb}>{step.blurb}</span>
              </Link>
              {i < steps.length - 1 && <span className={styles.connector} aria-hidden="true" />}
            </li>
          ))}
        </ol>

        <div className={styles.branch}>
          <span className={styles.branchLine} aria-hidden="true" />
          <Link to="/blog" className={styles.branchCard}>
            <span className={styles.branchLabel}>Ongoing</span>
            <span className={styles.stepTitle}>Blog &amp; Write-ups</span>
            <span className={styles.stepBlurb}>
              Not a step — read alongside everything above, updated as new work ships.
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
