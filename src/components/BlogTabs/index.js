import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

export default function BlogTabs({activeTab, onChange}) {
  return (
    <div className={styles.tabBar} role="tablist" aria-label="Blog source">
      <button
        role="tab"
        aria-selected={activeTab === 'mine'}
        className={clsx(styles.tab, activeTab === 'mine' && styles.tabActive)}
        onClick={() => onChange('mine')}>
        My Blog
      </button>
      <button
        role="tab"
        aria-selected={activeTab === 'community'}
        className={clsx(styles.tab, activeTab === 'community' && styles.tabActive)}
        onClick={() => onChange('community')}>
        Community
      </button>
    </div>
  );
}
