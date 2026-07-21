import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';

import Heading from '@theme/Heading';
import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={styles.heroBanner}>
      <div className="container">
        <div className={styles.terminal}>
          <div className={styles.terminalBar}>
            <span className={clsx(styles.dot, styles.dotRed)} />
            <span className={clsx(styles.dot, styles.dotAmber)} />
            <span className={clsx(styles.dot, styles.dotGreen)} />
            <span className={styles.terminalPath}>root@onlysecurity:~$</span>
          </div>

          <div className={styles.terminalBody}>
            <div className={styles.advisoryRow}>
              <span className={styles.advisoryId}>OS-ADV-2026-0001</span>
              <span className={styles.statusPill}>OPEN · PUBLIC DISCLOSURE</span>
            </div>

            <Heading as="h1" className={styles.heroTitle}>
              {siteConfig.title}
            </Heading>
            <p className={styles.heroTagline}>{siteConfig.tagline}</p>
            <p className={styles.heroBody}>
              No paywalls, no gatekeeping. Read the docs, break things in a lab,
              then push a pull request with what you learned along the way.
            </p>

            <div className={styles.buttons}>
              <Link className={clsx('button', styles.primaryButton)} to="/docs/intro">
                Start Learning →
              </Link>
              <Link
                className={clsx('button', styles.secondaryButton)}
                to="https://github.com/starlox0/onlysecurity">
                View Source
              </Link>
            </div>

            <p className={styles.terminalPrompt}>
              <span className={styles.terminalCmd}>cat README.md</span>
              <span className={styles.cursor} aria-hidden="true" />
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description="An open-source hub for learning security — and sharing what you know.">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
