import React from 'react';
import styles from './styles.module.css';

export default function PostCard({post, isSaved, onToggleSave}) {
  return (
    <div className={styles.card}>
      <a href={post.link} target="_blank" rel="noopener noreferrer" className={styles.cardLink}>
        <div className={styles.imageWrap}>
          {post.image ? (
            <img src={post.image} alt="" loading="lazy" className={styles.image} />
          ) : (
            <div className={styles.imagePlaceholder} />
          )}
        </div>
        <div className={styles.body}>
          <div className={styles.badgeRow}>
            {post.publication && (
              <span className={styles.pubBadge} title={`${post.publication.followers} followers`}>
                {post.publication.name}
              </span>
            )}
            {post.readingMinutes && (
              <span className={styles.readingBadge}>{post.readingMinutes} min read</span>
            )}
          </div>
          <h3 className={styles.title}>{post.title}</h3>
          <p className={styles.excerpt}>{post.excerpt}</p>
          <span className={styles.meta}>
            {post.author ? `${post.author} · ` : ''}Read on Medium →
          </span>
        </div>
      </a>
      <button
        type="button"
        className={styles.saveButton}
        data-saved={isSaved}
        onClick={onToggleSave}
        aria-label={isSaved ? 'Remove from saved' : 'Save for later'}>
        {isSaved ? '★' : '☆'}
      </button>
    </div>
  );
}
