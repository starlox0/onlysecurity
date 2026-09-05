import React, {useEffect, useMemo, useState} from 'react';
import {fetchThreatWire, formatRelativeTime, markAllSeen} from './hackernews';
import styles from './styles.module.css';

const FILTERS = ['All', 'Ransomware', 'Data Breach', 'Vulnerability', 'Zero-Day', 'Malware', 'Phishing', 'Nation-State'];

function NewsCard({item}) {
  return (
    <a href={item.link} target="_blank" rel="noopener noreferrer" className={styles.card}>
      {item.image && <img src={item.image} alt="" loading="lazy" className={styles.cardImage} />}
      <div className={styles.cardBody}>
        <div className={styles.cardMeta}>
          <span className={styles.tagBadge} data-tone={item.tone}>
            {item.tag}
          </span>
          <span className={styles.timestamp}>{formatRelativeTime(item.date)}</span>
        </div>
        <h3 className={styles.cardTitle}>{item.title}</h3>
        <p className={styles.cardExcerpt}>{item.excerpt}</p>
        {item.cves.length > 0 && (
          <div className={styles.cveRow}>
            {item.cves.map((id) => (
              <span key={id} className={styles.cveChip}>
                {id}
              </span>
            ))}
          </div>
        )}
        <span className={styles.readMore}>Read on The Hacker News →</span>
      </div>
    </a>
  );
}

export default function ThreatWire() {
  const [state, setState] = useState({status: 'loading', items: []});
  const [activeFilter, setActiveFilter] = useState('All');

  async function load() {
    setState({status: 'loading', items: []});
    try {
      const items = await fetchThreatWire();
      setState({status: 'ready', items});
      // Visiting this page is itself "reading the notifications" — clears
      // the bell's unread badge the same way opening the bell does.
      markAllSeen(items);
    } catch {
      setState({status: 'error', items: []});
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (activeFilter === 'All') return state.items;
    return state.items.filter((item) => item.tag === activeFilter);
  }, [state.items, activeFilter]);

  return (
    <div>
      <div className={styles.filterRow}>
        {FILTERS.map((filter) => (
          <button
            key={filter}
            type="button"
            className={styles.filterChip}
            data-active={activeFilter === filter}
            onClick={() => setActiveFilter(filter)}>
            {filter}
          </button>
        ))}
      </div>

      {state.status === 'loading' && (
        <div className={styles.grid}>
          {Array.from({length: 6}).map((_, i) => (
            <div key={i} className={styles.skeletonCard} aria-hidden="true" />
          ))}
        </div>
      )}

      {state.status === 'error' && (
        <div className={styles.emptyState}>
          <p className={styles.emptyStateTitle}>Couldn't load the feed right now.</p>
          <p className={styles.emptyStateBody}>
            This pulls live from The Hacker News' RSS feed via rss2json, which can occasionally
            rate-limit or time out. Try again in a moment, or read it directly at the source.
          </p>
          <a
            className={styles.emptyStateLink}
            href="https://thehackernews.com/"
            target="_blank"
            rel="noopener noreferrer">
            Visit thehackernews.com →
          </a>
        </div>
      )}

      {state.status === 'ready' && filtered.length === 0 && (
        <div className={styles.emptyState}>
          <p className={styles.emptyStateTitle}>No stories in this category right now.</p>
          <p className={styles.emptyStateBody}>Try a different filter, or check back later.</p>
        </div>
      )}

      {state.status === 'ready' && filtered.length > 0 && (
        <div className={styles.grid}>
          {filtered.map((item) => (
            <NewsCard key={item.guid} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
