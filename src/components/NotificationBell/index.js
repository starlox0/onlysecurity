import React, {useCallback, useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import Link from '@docusaurus/Link';
import {fetchThreatWire, formatRelativeTime, countUnseen, markAllSeen} from '../ThreatWire/hackernews';
import styles from './styles.module.css';

const PREVIEW_COUNT = 6;

export default function NotificationBell() {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'error'
  // Where to draw the portaled panel, in fixed-viewport coordinates —
  // computed from the bell button itself so the panel isn't a descendant
  // of the navbar's `overflow: hidden` (used for its CRT-glitch effect),
  // which would otherwise clip it invisible no matter how correct the
  // open/close state is.
  const [panelPos, setPanelPos] = useState(null);
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

  const computePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setPanelPos({
      top: rect.bottom + 8,
      right: Math.max(8, window.innerWidth - rect.right),
    });
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => {
      const next = !prev;
      if (next) {
        computePosition();
        // Opening the panel is the "reading it" moment — clear the badge
        // the same way visiting the full Threat Wire page does.
        if (items.length > 0) {
          markAllSeen(items);
          setUnread(0);
        }
      }
      return next;
    });
  }, [items, computePosition]);

  // Keep the panel glued to the bell on resize, and just close it on
  // scroll rather than trying to track a moving target.
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
    function handleReposition() {
      computePosition();
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', close, {passive: true});
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', close);
    };
  }, [isOpen, close, computePosition]);

  // Nothing to show yet (still loading) or the feed failed — stay out of
  // the way rather than showing a broken/empty bell.
  if (status === 'error') return null;

  const preview = items.slice(0, PREVIEW_COUNT);
  const badgeLabel = unread > 9 ? '9+' : String(unread);

  const panel =
    isOpen && panelPos && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={panelRef}
            className={styles.panel}
            style={{top: panelPos.top, right: panelPos.right}}
            role="dialog"
            aria-label="Recent security news">
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
          </div>,
          document.body,
        )
      : null;

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
      {panel}
    </div>
  );
}
