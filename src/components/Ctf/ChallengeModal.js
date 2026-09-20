import React, {useState} from 'react';
import {submitFlag} from './api';
import styles from './styles.module.css';

export default function ChallengeModal({challenge, onClose, onSolved}) {
  const [flag, setFlag] = useState('');
  const [status, setStatus] = useState({state: 'idle', message: null, tone: null});

  async function handleSubmit(e) {
    e.preventDefault();
    if (!flag.trim()) return;
    setStatus({state: 'loading', message: null, tone: null});
    try {
      const result = await submitFlag(challenge.id, flag);
      if (result.correct) {
        setStatus({
          state: 'idle',
          message: result.alreadySolved ? 'Already solved — nice work earlier!' : `Correct! +${result.points} points.`,
          tone: 'success',
        });
        if (!result.alreadySolved) onSolved(challenge.id);
      } else {
        setStatus({state: 'idle', message: 'Not quite — try again.', tone: 'error'});
      }
    } catch (err) {
      setStatus({state: 'idle', message: err.message, tone: 'error'});
    }
  }

  return (
    <div className={styles.modalOverlay} onMouseDown={onClose}>
      <div className={styles.modalPanel} role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
        <button type="button" className={styles.modalClose} onClick={onClose} aria-label="Close">
          ✕
        </button>

        <span className={styles.modalCategory}>{challenge.category}</span>
        <h2 className={styles.modalTitle}>{challenge.title}</h2>
        <span className={styles.modalPoints}>{challenge.points} points</span>

        <p className={styles.modalDescription}>{challenge.description}</p>

        {challenge.file_url && (
          <a href={challenge.file_url} target="_blank" rel="noopener noreferrer" className={styles.modalFileLink}>
            📎 Download challenge file
          </a>
        )}

        {challenge.solved ? (
          <p className={styles.modalSolvedNote}>✓ You've already solved this one.</p>
        ) : (
          <form onSubmit={handleSubmit} className={styles.flagForm}>
            <input
              type="text"
              value={flag}
              onChange={(e) => setFlag(e.target.value)}
              placeholder="osctf{...}"
              className={styles.flagInput}
              autoComplete="off"
              spellCheck={false}
            />
            <button type="submit" className={styles.flagSubmit} disabled={status.state === 'loading'}>
              {status.state === 'loading' ? '...' : 'Submit'}
            </button>
          </form>
        )}

        {status.message && <p className={styles.flagStatus} data-tone={status.tone}>{status.message}</p>}
      </div>
    </div>
  );
}
