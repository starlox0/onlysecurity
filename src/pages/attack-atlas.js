import React from 'react';
import AttackAtlas from '@site/src/components/AttackAtlas';
import Layout from '@theme/Layout';
import styles from './attack-atlas.module.css';

export default function AttackAtlasPage() {
  return (
    <Layout
      title="Attack Atlas"
      description="An interactive map of web and API attack techniques against every edition of the OWASP Top 10 and API Security Top 10.">
      <div className={styles.wrapper}>
        <div className="container">
          <div className={styles.header}>
            <span className={styles.eyebrow}>OS-ADV · Interactive Reference</span>
            <h1 className={styles.title}>Attack Atlas</h1>
            <p className={styles.subtitle}>
              Pick a track and a year to see how OWASP's Top 10 has evolved — and which
              real-world attack techniques fall under each category. Categories, names, and
              years are sourced directly from OWASP; descriptions and technique examples are
              written for this site.
            </p>
          </div>
          <AttackAtlas />
        </div>
      </div>
    </Layout>
  );
}
