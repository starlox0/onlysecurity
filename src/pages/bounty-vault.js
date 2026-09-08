import React from 'react';
import BountyVault from '@site/src/components/BountyVault';
import Layout from '@theme/Layout';
import styles from './bounty-vault.module.css';

export default function BountyVaultPage() {
  return (
    <Layout
      title="Bounty Vault"
      description="Browse HackerOne's publicly disclosed vulnerability reports, categorized by vulnerability type, severity, bounty range, and OWASP Top 10.">
      <div className={styles.wrapper}>
        <div className="container">
          <div className={styles.header}>
            <span className={styles.eyebrow}>OS-ADV · Curated Snapshot · HackerOne</span>
            <h1 className={styles.title}>Bounty Vault</h1>
            <p className={styles.subtitle}>
              A browsable archive of publicly disclosed reports from{' '}
              <a href="https://hackerone.com/hacktivity" target="_blank" rel="noopener noreferrer">
                HackerOne
              </a>
              's Hacktivity feed — real findings, real bounties, real programs. See the shape
              of the data at a glance below, then dig in by vulnerability type, severity,
              bounty range, or OWASP Top 10.
            </p>
          </div>
          <BountyVault />
          <p className={styles.attribution}>
            Data compiled from HackerOne's public disclosures via the community-maintained{' '}
            <a
              href="https://github.com/ajaysenr/HackerOne-Disclosed-Reports"
              target="_blank"
              rel="noopener noreferrer">
              HackerOne-Disclosed-Reports
            </a>{' '}
            project. This is a periodically-refreshed snapshot, not a live feed, and OWASP Top 10
            categories are a best-effort mapping from each report's weakness type — not an
            official classification.
          </p>
        </div>
      </div>
    </Layout>
  );
}
