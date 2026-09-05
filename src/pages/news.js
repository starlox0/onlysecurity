import React from 'react';
import Layout from '@theme/Layout';
import ThreatWire from '@site/src/components/ThreatWire';
import styles from './news.module.css';

export default function NewsPage() {
  return (
    <Layout
      title="Threat Wire"
      description="Live cybersecurity news pulled from The Hacker News — breaches, vulnerabilities, malware, and incident write-ups as they're published.">
      <div className={styles.wrapper}>
        <div className="container">
          <div className={styles.header}>
            <span className={styles.eyebrow}>OS-ADV · Live Feed · The Hacker News</span>
            <h1 className={styles.title}>Threat Wire</h1>
            <p className={styles.subtitle}>
                Curated in real time from{' '}
                <a href="https://thehackernews.com/" target="_blank" rel="noopener noreferrer">
                  The Hacker News
                </a>{' '}
                — breaches, actively exploited flaws, malware campaigns, and incident
                analysis as they break. Any CVE referenced in a story is automatically
                surfaced for quick cross-reference.
            </p>
          </div>
          <ThreatWire />
        </div>
      </div>
    </Layout>
  );
}
