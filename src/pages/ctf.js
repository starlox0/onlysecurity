import React from 'react';
import Layout from '@theme/Layout';
import Ctf from '@site/src/components/Ctf';
import styles from './ctf.module.css';

export default function CtfPage() {
  return (
    <Layout
      title="CTF"
      description="OnlySecurity's own jeopardy-style CTF — crypto, forensics, OSINT, and misc challenges. Register, solve, climb the scoreboard.">
      {/*
        IMPORTANT — do not "clean this up": a plain JSX comment like this
        one is stripped at build time and never reaches the actual HTML,
        so it can't be the flag. The real flag for the "View Source"
        challenge is injected below via dangerouslySetInnerHTML, which
        writes an actual HTML comment node into the rendered page —
        visible via right-click → View Page Source, same as a real
        recon/OSINT find would be.
      */}
      <div dangerouslySetInnerHTML={{__html: '<!-- osctf{view_source_ftw} -->'}} />
      <div className={styles.wrapper}>
        <div className="container">
          <div className={styles.header}>
            <span className={styles.eyebrow}>OS-ADV · Jeopardy CTF</span>
            <h1 className={styles.title}>CTF</h1>
            <p className={styles.subtitle}>
              Register an account, solve challenges across crypto, forensics, OSINT, and misc,
              and climb the scoreboard. Runs on its own backend — see{' '}
              <a href="https://github.com/starlox0/onlysecurity-ctf-backend" target="_blank" rel="noopener noreferrer">
                onlysecurity-ctf-backend
              </a>{' '}
              if you want to see how it works or add your own challenges.
            </p>
          </div>
          <Ctf />
        </div>
      </div>
    </Layout>
  );
}
