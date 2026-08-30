import React, {useEffect, useRef} from 'react';
import styles from './ResourceModal.module.css';

export default function ResourceModal({resource, onClose}) {
  const lastFocusedRef = useRef(null);
  const closeButtonRef = useRef(null);

  useEffect(() => {
    lastFocusedRef.current = document.activeElement;
    closeButtonRef.current?.focus();
    document.body.style.overflow = 'hidden';

    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
      lastFocusedRef.current?.focus?.();
    };
  }, [onClose]);

  if (!resource) return null;

  let hostname = resource.url;
  try {
    hostname = new URL(resource.url).hostname.replace(/^www\./, '');
  } catch {
    // keep raw url as fallback
  }

  return (
    <div className={styles.overlay} onMouseDown={onClose} role="presentation">
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label={resource.name}
        onMouseDown={(e) => e.stopPropagation()}>
        <button
          ref={closeButtonRef}
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close">
          ×
        </button>

        <div className={styles.badgeRow}>
          <span className={styles.categoryBadge}>{resource.category}</span>
          <span className={styles.levelBadge} data-level={resource.level}>
            {resource.level}
          </span>
          {resource.trending && <span className={styles.trendingBadge}>★ Trending</span>}
        </div>

        <h2 className={styles.title}>{resource.name}</h2>
        <p className={styles.hostname}>{hostname}</p>
        <p className={styles.description}>{resource.description}</p>

        
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.visitButton}>
          Visit platform ↗
        </a>
      </div>
    </div>
  );
}
