import React from 'react';
import Layout from '@theme/Layout';
import LinuxTerminal from '@site/src/components/LinuxTerminal';
import styles from './practice.module.css';

export default function Practice() {
  return (
    <Layout
      title="Practice Terminal"
      description="A simulated Linux shell to practice real commands, entirely in your browser.">
      <div className={styles.wrapper}>
        <div className="container">
          <div className={styles.header}>
            <span className={styles.eyebrow}>Practice</span>
            <h1 className={styles.title}>A shell to actually practice in</h1>
            <p className={styles.subtitle}>
              This is a real command parser over a fake filesystem — nothing here
              touches an actual system, your device, or a server. Try{' '}
              <code>ls</code>, <code>cat welcome.txt</code>, <code>cd notes</code>,{' '}
              <code>grep</code>, or <code>find</code>. There's something worth finding
              in <code>/var/log</code>.
            </p>
          </div>
          <LinuxTerminal />
        </div>
      </div>
    </Layout>
  );
}
