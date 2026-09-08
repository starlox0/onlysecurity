import React from 'react';
import {formatBounty} from './findings';
import styles from './styles.module.css';

export default function PayGapOfTheDay({gap}) {
  if (!gap) return null;
  const multiplier = gap.high.bounty / gap.low.bounty;

  return (
    <div className={styles.payGapCard}>
      <div className={styles.payGapHeader}>
        <span className={styles.payGapEyebrow}>Pay gap of the day</span>
        <span className={styles.payGapMultiplier}>{multiplier.toFixed(1)}× apart</span>
      </div>
      <p className={styles.payGapIntro}>
        Two <strong>{gap.weakness}</strong> reports, same vulnerability type, very different
        payouts.
      </p>
      <div className={styles.payGapRow}>
        <a
          href={gap.low.url}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.payGapEntry}>
          <span className={styles.payGapAmount} data-tone="low">
            {formatBounty(gap.low.bounty)}
          </span>
          <span className={styles.payGapTitle}>{gap.low.title}</span>
          <span className={styles.payGapProgram}>{gap.low.program}</span>
        </a>
        <span className={styles.payGapVs}>vs</span>
        <a
          href={gap.high.url}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.payGapEntry}>
          <span className={styles.payGapAmount} data-tone="high">
            {formatBounty(gap.high.bounty)}
          </span>
          <span className={styles.payGapTitle}>{gap.high.title}</span>
          <span className={styles.payGapProgram}>{gap.high.program}</span>
        </a>
      </div>
    </div>
  );
}
