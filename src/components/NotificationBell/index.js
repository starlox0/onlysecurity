import React, {useCallback, useEffect, useRef, useState} from 'react';
import Link from '@docusaurus/Link';
import {fetchThreatWire, formatRelativeTime, countUnseen, markAllSeen} from '../ThreatWire/hackernews';
import styles from './styles.module.css';

const PREVIEW_COUNT = 6;

export default function NotificationBell() {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'error'
  const panelRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    fetchThreatWire()
      .then((fetched) => {
        if (cancelled) return;
        setItems(fetched);
        setUnread(countUnseen(fetched));
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => {
      const next = !prev;
      // Opening the panel is the "reading it" moment — clear the badge the
      // same way visiting the full Threat Wire page does.
      if (next && items.length > 0) {
        markAllSeen(items);
        setUnread(0);
      }
      return next;
    });
  }, [items]);

  useEffect(() => {
    if (!isOpen) return undefined;

    function handleClickOutside(e) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        close();
      }
    }
    function handleEscape(e) {
      if (e.key === 'Escape') close();
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, close]);

  // Nothing to show yet (still loading) or the feed failed — stay out of
  // the way rather than showing a broken/empty bell.
  if (status === 'error') return null;

  const preview = items.slice(0, PREVIEW_COUNT);
  const badgeLabel = unread > 9 ? '9+' : String(unread);

  return (
    <div className={styles.wrapper}>
      <button
        ref={buttonRef}
        type="button"
        className={styles.bellButton}
        onClick={toggle}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={unread > 0 ? `Threat Wire notifications, ${unread} unread` : 'Threat Wire notifications'}>
        <span aria-hidden="true">🔔</span>
        {unread > 0 && (
          <span className={styles.badge} aria-hidden="true">
            {badgeLabel}
          </span>
        )}
      </button>

      {isOpen && (
        <div ref={panelRef} className={styles.panel} role="dialog" aria-label="Recent security news">
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>Threat Wire</span>
            <span className={styles.panelSubtitle}>Latest from The Hacker News</span>
          </div>

          {status === 'loading' && <p className={styles.panelNote}>Loading recent stories…</p>}

          {status === 'ready' && preview.length === 0 && (
            <p className={styles.panelNote}>No stories available right now.</p>
          )}

          {status === 'ready' && preview.length > 0 && (
            <ul className={styles.list}>
              {preview.map((item) => (
                <li key={item.guid}>
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.listItem}>
                    <span className={styles.itemTag} data-tone={item.tone}>
                      {item.tag}
                    </span>
                    <span className={styles.itemTitle}>{item.title}</span>
                    <span className={styles.itemTime}>{formatRelativeTime(item.date)}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}

          <Link to="/news" className={styles.viewAll} onClick={close}>
            View all in Threat Wire →
          </Link>
        </div>
      )}
    </div>
  );
}
