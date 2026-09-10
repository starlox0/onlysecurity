import React, {useEffect, useRef} from 'react';
import {getTechniqueForLabel} from './techniques';
import styles from './styles.module.css';

export default function TechniqueModal({label, onClose}) {
  const dialogRef = useRef(null);
  const technique = label ? getTechniqueForLabel(label) : null;

  useEffect(() => {
    if (!label) return undefined;
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    dialogRef.current?.focus();
    return () => document.removeEventListener('keydown', handleKey);
  }, [label, onClose]);

  if (!label) return null;

  return (
    <div className={styles.modalOverlay} onMouseDown={onClose}>
      <div
        ref={dialogRef}
        className={styles.modalPanel}
        role="dialog"
        aria-modal="true"
        aria-label={technique ? technique.title : label}
        tabIndex={-1}
        onMouseDown={(e) => e.stopPropagation()}>
        <button type="button" className={styles.modalClose} onClick={onClose} aria-label="Close">
          ✕
        </button>

        {!technique ? (
          <div className={styles.modalBody}>
            <h2 className={styles.modalTitle}>{label}</h2>
            <p className={styles.modalFallback}>
              A detailed write-up for this specific technique isn't ready yet — check back soon.
            </p>
          </div>
        ) : (
          <div className={styles.modalBody}>
            <span className={styles.modalEyebrow}>Attack technique</span>
            <h2 className={styles.modalTitle}>{technique.title}</h2>
            <p className={styles.modalSummary}>{technique.summary}</p>

            <section className={styles.modalSection}>
              <h3 className={styles.modalSectionTitle}>How it works</h3>
              <ol className={styles.flowList}>
                {technique.howItWorks.map((step, i) => (
                  <li key={i} className={styles.flowStep}>
                    <span className={styles.flowStepNumber}>{i + 1}</span>
                    <span className={styles.flowStepText}>{step}</span>
                  </li>
                ))}
              </ol>
            </section>

            <section className={styles.modalSection}>
              <h3 className={styles.modalSectionTitle}>Types &amp; variants</h3>
              <div className={styles.typeGrid}>
                {technique.types.map((t) => (
                  <div key={t.name} className={styles.typeCard}>
                    <p className={styles.typeName}>{t.name}</p>
                    <p className={styles.typeDescription}>{t.description}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className={styles.modalSection}>
              <h3 className={styles.modalSectionTitle}>How to defend against it</h3>
              <ul className={styles.defenseList}>
                {technique.defenses.map((d) => (
                  <li key={d} className={styles.defenseItem}>
                    {d}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
