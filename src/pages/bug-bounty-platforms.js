import React from 'react';
import Layout from '@theme/Layout';
import BugBountyPlatforms from '@site/src/components/BugBountyPlatforms';
import styles from './bug-bounty-platforms.module.css';

export default function BugBountyPlatformsPage() {
  return (
    <Layout
      title="Bug Bounty Platforms"
      description="Every known bug bounty and vulnerability disclosure platform, organized by category and A-Z.">
      <div className={styles.wrapper}>
        <div className="container">
          <div className={styles.header}>
            <span className={styles.eyebrow}>Directory</span>
            <h1 className={styles.title}>Bug Bounty Platforms</h1>
            <p className={styles.subtitle}>
              Every known bug bounty, VDP, and crowdsourced security platform — government
              programs, Web3/AI-specific platforms, and general crowdsourced platforms, all in
              one place. Sourced from{' '}
              <a
                href="https://github.com/disclose/bug-bounty-platforms"
                target="_blank"
                rel="noopener noreferrer">
                disclose/bug-bounty-platforms
              </a>
              , an open, community-maintained catalog — corrections belong there, not here.
            </p>
          </div>
          <BugBountyPlatforms />
        </div>
      </div>
    </Layout>
  );
}
