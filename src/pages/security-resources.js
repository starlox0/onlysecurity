import React from 'react';
import Layout from '@theme/Layout';
import SecurityResources from '@site/src/components/SecurityResources';
import styles from './security-resources.module.css';

export default function SecurityResourcesPage() {
  return (
    <Layout
      title="Security Resources"
      description="CTF platforms, hands-on practice labs, and open-source security frameworks, organized by category and A-Z.">
      <div className={styles.wrapper}>
        <div className="container">
          <div className={styles.header}>
            <span className={styles.eyebrow}>Directory</span>
            <h1 className={styles.title}>Security Resources</h1>
            <p className={styles.subtitle}>
              CTF platforms, hands-on practice labs (web, cloud, reverse engineering, blue team),
              and genuine open-source security frameworks — no generic course marketplaces, no
              tools, no browser extensions, and no bug bounty platforms (those live on their{' '}
              <a href="/onlysecurity/bug-bounty-platforms">own page</a>).
            </p>
          </div>
          <SecurityResources />
        </div>
      </div>
    </Layout>
  );
}
