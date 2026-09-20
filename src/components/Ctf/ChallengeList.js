import React, {useMemo} from 'react';
import styles from './styles.module.css';

export default function ChallengeList({challenges, onSelect}) {
  const grouped = useMemo(() => {
    const map = new Map();
    for (const c of challenges) {
      if (!map.has(c.category)) map.set(c.category, []);
      map.get(c.category).push(c);
    }
    return [...map.entries()];
  }, [challenges]);

  if (challenges.length === 0) {
    return <p className={styles.emptyNote}>No challenges available yet.</p>;
  }

  return (
    <div>
      {grouped.map(([category, list]) => (
        <section key={category} className={styles.categorySection}>
          <h2 className={styles.categoryTitle}>{category}</h2>
          <div className={styles.challengeGrid}>
            {list.map((c) => (
              <button
                key={c.id}
                type="button"
                className={styles.challengeCard}
                data-solved={c.solved}
                onClick={() => onSelect(c)}>
                <span className={styles.challengeCardHead}>
                  <span className={styles.challengeCardTitle}>{c.title}</span>
                  {c.solved && <span className={styles.solvedCheck}>✓</span>}
                </span>
                <span className={styles.challengeCardPoints}>{c.points} pts</span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
