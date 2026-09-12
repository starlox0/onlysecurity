import React, {useState} from 'react';
import Layout from '@theme/Layout';
import SecurityResources from '@site/src/components/SecurityResources';
import SecurityTools from '@site/src/components/SecurityTools';
import styles from './security-resources.module.css';

const TABS = [
  {id: 'resources', label: 'Learning Resources', icon: '📚'},
  {id: 'tools', label: 'Security Tools', icon: '🛠️'},
];

export default function SecurityResourcesPage() {
  const [tab, setTab] = useState('resources');

  return (
    <Layout
      title="Security Resources"
      description="CTF platforms, hands-on practice labs, and open-source security frameworks, plus a directory of real security tools by domain — network, AD, cloud, mobile, and more.">
      <div className={styles.wrapper}>
        <div className="container">
          <div className={styles.header}>
            <span className={styles.eyebrow}>Directory</span>
            <h1 className={styles.title}>Security Resources</h1>
            <p className={styles.subtitle}>
              {tab === 'resources' ? (
                <>
                  CTF platforms, hands-on practice labs across web, cloud, reverse engineering, and
                  blue team, plus the open-source frameworks the industry actually builds on - each
                  one picked because it's genuinely worth your time. Looking for bug bounty programs
                  instead? Those have their{' '}
                  <a href="/onlysecurity/bug-bounty-platforms">own page</a>.
                </>
              ) : (
                <>
                  Real tools professionals actually use, organized by domain. Search "network
                  pentest," "AD," "cloud," or "mobile" to jump straight to a category, or search
                  for a specific tool by name.
                </>
              )}
            </p>

            <div className={styles.tabToggle} role="tablist" aria-label="Choose a directory">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  className={styles.tabButton}
                  data-active={tab === t.id}
                  onClick={() => setTab(t.id)}>
                  <span aria-hidden="true">{t.icon}</span> {t.label}
                </button>
              ))}
            </div>
          </div>

          {tab === 'resources' ? <SecurityResources /> : <SecurityTools />}
        </div>
      </div>
    </Layout>
  );
}
