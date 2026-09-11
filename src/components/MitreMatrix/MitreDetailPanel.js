import React from 'react';
import Link from '@docusaurus/Link';
import {getMappingForTechnique} from './mappings';
import atlasStyles from '../AttackAtlas/styles.module.css';
import styles from './styles.module.css';

export default function MitreDetailPanel({technique, onClose, onOpenInternal}) {
  if (!technique) return null;
  const mapping = getMappingForTechnique(technique.id);

  return (
    <div className={atlasStyles.modalOverlay} onMouseDown={onClose}>
      <div
        className={atlasStyles.modalPanel}
        role="dialog"
        aria-modal="true"
        aria-label={technique.name}
        onMouseDown={(e) => e.stopPropagation()}>
        <button type="button" className={atlasStyles.modalClose} onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div className={atlasStyles.modalBody}>
          <span className={atlasStyles.modalEyebrow}>MITRE ATT&amp;CK{technique.isSubtechnique ? ' · Sub-technique' : ''}</span>
          <div className={atlasStyles.modalTitleRow}>
            <h2 className={atlasStyles.modalTitle}>{technique.name}</h2>
            <a
              href={`https://attack.mitre.org/techniques/${technique.id.replace('.', '/')}/`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.mitreIdBadge}
              title="View on attack.mitre.org">
              {technique.id}
            </a>
          </div>

          <p className={atlasStyles.modalSummary}>{technique.description}</p>

          <div className={styles.tacticTagRow}>
            {technique.tactics.map((tac) => (
              <span key={tac} className={styles.tacticTag}>
                {tac.replace(/-/g, ' ')}
              </span>
            ))}
          </div>

          {mapping ? (
            <section className={atlasStyles.modalSection}>
              <h3 className={atlasStyles.modalSectionTitle}>Covered on this site</h3>
              {mapping.internalTechniques && (
                <div className={styles.linkChipRow}>
                  {mapping.internalTechniques.map((id) => (
                    <button
                      key={id}
                      type="button"
                      className={styles.linkChip}
                      onClick={() => onOpenInternal(id)}>
                      {id} →
                    </button>
                  ))}
                </div>
              )}
              {mapping.docs && (
                <div className={styles.linkChipRow}>
                  {mapping.docs.map((doc) => (
                    <Link key={doc.url} to={doc.url} className={styles.linkChip} onClick={onClose}>
                      📄 {doc.title} →
                    </Link>
                  ))}
                </div>
              )}
            </section>
          ) : (
            <p className={styles.noMappingNote}>
              This technique isn't covered elsewhere on this site yet — see the full write-up on
              MITRE's own site above.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
