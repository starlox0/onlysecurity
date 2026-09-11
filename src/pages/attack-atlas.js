import React, {useEffect, useState} from 'react';
import AttackAtlas from '@site/src/components/AttackAtlas';
import TtpGlobe from '@site/src/components/AttackAtlas/TtpGlobe';
import MitreMatrix from '@site/src/components/MitreMatrix';
import Layout from '@theme/Layout';
import styles from './attack-atlas.module.css';

const SECTIONS = [
  {id: 'owasp-wheel', icon: '🎯', label: 'OWASP Wheel'},
  {id: 'ttp-globe', icon: '🌐', label: 'TTP Globe'},
  {id: 'mitre-matrix', icon: '🗺️', label: 'ATT&CK Matrix'},
];

function SectionNav() {
  const [active, setActive] = useState('owasp-wheel');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      {rootMargin: '-40% 0px -55% 0px'},
    );
    for (const s of SECTIONS) {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <nav className={styles.sectionNav} aria-label="Jump to section">
      {SECTIONS.map((s) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          className={styles.sectionNavLink}
          data-active={active === s.id}>
          <span aria-hidden="true">{s.icon}</span> {s.label}
        </a>
      ))}
    </nav>
  );
}

export default function AttackAtlasPage() {
  return (
    <Layout
      title="Attack Atlas"
      description="An interactive map of web and API attack techniques against every edition of the OWASP Top 10 and API Security Top 10, a TTP globe, and a MITRE ATT&CK matrix explorer.">
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

          <SectionNav />

          <section id="owasp-wheel" className={styles.section}>
            <AttackAtlas />
          </section>

          <section id="ttp-globe" className={styles.section}>
            <div className={styles.sectionDivider}>
              <span className={styles.sectionEyebrow}>OS-ADV · Derived From This Site's Own Data</span>
              <h2 className={styles.sectionTitle}>🌐 TTP Globe</h2>
              <p className={styles.sectionSubtitle}>
                Drag to rotate. Pick Web, API, Mobile, or Smart Contract, then click a node to
                see which real MITRE ATT&amp;CK techniques (TTPs) are actually connected to
                that category — every link here is derived from the same mapping data used
                elsewhere on this page, not invented separately.
              </p>
            </div>
            <TtpGlobe />
          </section>

          <section id="mitre-matrix" className={styles.section}>
            <div className={styles.sectionDivider}>
              <span className={styles.sectionEyebrow}>OS-ADV · Live Reference Data</span>
              <h2 className={styles.sectionTitle}>🗺️ MITRE ATT&amp;CK Matrix Explorer</h2>
              <p className={styles.sectionSubtitle}>
                Every enterprise tactic and technique, pulled directly from MITRE's own public
                data. Techniques with a green marker link straight to a write-up, code example,
                or doc elsewhere on this site — everything else links out to attack.mitre.org.
              </p>
            </div>
            <MitreMatrix />
          </section>
        </div>
      </div>
    </Layout>
  );
}
