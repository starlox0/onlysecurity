import React, {useState} from 'react';
import mediumPosts from './posts';
import styles from './styles.module.css';

const INITIAL_COUNT = 6;

export default function MediumPosts() {
  const [expanded, setExpanded] = useState(false);
  const visiblePosts = expanded ? mediumPosts : mediumPosts.slice(0, INITIAL_COUNT);

  return (
    <div className={styles.wrapper}>
      <div className={styles.grid}>
        {visiblePosts.map((post) => (
          
            key={post.url}
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.card}>
            <div className={styles.imageWrap}>
              <img src={post.image} alt="" loading="lazy" className={styles.image} />
            </div>
            <div className={styles.body}>
              <h3 className={styles.title}>{post.title}</h3>
              <p className={styles.excerpt}>{post.excerpt}</p>
              <span className={styles.readLink}>Read on Medium →</span>
            </div>
          </a>
        ))}
      </div>

      {mediumPosts.length > INITIAL_COUNT && (
        <div className={styles.actions}>
          {!expanded ? (
            <button className={styles.viewAllButton} onClick={() => setExpanded(true)}>
              View more posts
            </button>
          ) : null}
          
            className={styles.viewAllButton}
            href="https://starlox.medium.com/"
            target="_blank"
            rel="noopener noreferrer">
            View all posts on Medium
          </a>
        </div>
      )}
    </div>
  );
}
