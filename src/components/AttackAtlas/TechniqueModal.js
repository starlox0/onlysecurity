import React, {useEffect, useRef} from 'react';
import Link from '@docusaurus/Link';
import {getTechniqueForLabel, getTechniqueById} from './techniques';
import styles from './styles.module.css';

export default function TechniqueModal({label, techniqueId, onClose}) {
  const dialogRef = useRef(null);
  const isOpen = Boolean(label || techniqueId);
  const technique = techniqueId ? getTechniqueById(techniqueId) : label ? getTechniqueForLabel(label) : null;
  const displayTitle = technique ? technique.title : label;

  useEffect(() => {
    if (!isOpen) return undefined;
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    dialogRef.current?.focus();
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onMouseDown={onClose}>
      <div
        ref={dialogRef}
        className={styles.modalPanel}
        role="dialog"
        aria-modal="true"
        aria-label={displayTitle}
        tabIndex={-1}
        onMouseDown={(e) => e.stopPropagation()}>
        <button type="button" className={styles.modalClose} onClick={onClose} aria-label="Close">
          ✕
        </button>

        {!technique ? (
          <div className={styles.modalBody}>
            <h2 className={styles.modalTitle}>{displayTitle}</h2>
            <p className={styles.modalFallback}>
              A detailed write-up for this specific technique isn't ready yet — check back soon.
            </p>
          </div>
        ) : (
          <div className={styles.modalBody}>
            <span className={styles.modalEyebrow}>Attack technique</span>
            <div className={styles.modalTitleRow}>
              <h2 className={styles.modalTitle}>{technique.title}</h2>
              {technique.cwe && (
                <a
                  href={`https://cwe.mitre.org/data/definitions/${technique.cwe.replace('CWE-', '')}.html`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.cweBadge}
                  title="View this weakness on cwe.mitre.org">
                  {technique.cwe}
                </a>
              )}
            </div>
            <p className={styles.modalSummary}>{technique.summary}</p>

            {technique.vaultWeakness && (
              <Link
                to={`/bounty-vault?weakness=${technique.vaultWeakness.map(encodeURIComponent).join(',')}&label=${encodeURIComponent(technique.title)}`}
                className={styles.vaultLink}
                onClick={onClose}>
                See real disclosed reports of this type in Bounty Vault →
              </Link>
            )}

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

            {technique.code && (
              <section className={styles.modalSection}>
                <h3 className={styles.modalSectionTitle}>Vulnerable vs. fixed</h3>
                <div className={styles.codeGrid}>
                  <div className={styles.codeBlock} data-variant="vulnerable">
                    <span className={styles.codeLabel}>✕ Vulnerable</span>
                    <pre className={styles.codePre}>
                      <code>{technique.code.vulnerable}</code>
                    </pre>
                  </div>
                  <div className={styles.codeBlock} data-variant="fixed">
                    <span className={styles.codeLabel}>✓ Fixed</span>
                    <pre className={styles.codePre}>
                      <code>{technique.code.fixed}</code>
                    </pre>
                  </div>
                </div>
              </section>
            )}

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
