import React from 'react';
import AttackAtlas from '@site/src/components/AttackAtlas';
import MitreMatrix from '@site/src/components/MitreMatrix';
import Layout from '@theme/Layout';
import styles from './attack-atlas.module.css';

export default function AttackAtlasPage() {
  return (
    <Layout
      title="Attack Atlas"
      description="An interactive map of web and API attack techniques against every edition of the OWASP Top 10 and API Security Top 10, plus a MITRE ATT&CK matrix explorer.">
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

          <div className={styles.sectionDivider}>
            <span className={styles.sectionEyebrow}>OS-ADV · Live Reference Data</span>
            <h2 className={styles.sectionTitle}>MITRE ATT&amp;CK Matrix Explorer</h2>
            <p className={styles.sectionSubtitle}>
              Every enterprise tactic and technique, pulled directly from MITRE's own public
              data. Techniques with a green marker link straight to a write-up, code example,
              or doc elsewhere on this site — everything else links out to attack.mitre.org.
            </p>
          </div>
          <MitreMatrix />
        </div>
      </div>
    </Layout>
  );
}
