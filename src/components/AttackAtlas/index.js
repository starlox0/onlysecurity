import React, {useMemo, useState} from 'react';
import {EDITIONS, THEMES, getEdition} from './data';
import AttackWheel from './AttackWheel';
import TechniqueModal from './TechniqueModal';
import styles from './styles.module.css';

const TRACKS = [
  {id: 'web', label: 'Web Application'},
  {id: 'api', label: 'API Security'},
  {id: 'mobile', label: 'Mobile'},
  {id: 'smart-contract', label: 'Smart Contract'},
];

function editionKeysForTrack(track) {
  return Object.entries(EDITIONS)
    .filter(([, ed]) => ed.track === track)
    .sort((a, b) => a[1].year - b[1].year)
    .map(([key]) => key);
}

export default function AttackAtlas() {
  const [track, setTrack] = useState('web');
  const [editionKey, setEditionKey] = useState('web2025');
  const [activeCode, setActiveCode] = useState('A01');
  const [openTechnique, setOpenTechnique] = useState(null);

  const edition = getEdition(editionKey);
  const yearKeys = useMemo(() => editionKeysForTrack(track), [track]);

  function switchTrack(nextTrack) {
    setTrack(nextTrack);
    const keys = editionKeysForTrack(nextTrack);
    const latest = keys[keys.length - 1];
    setEditionKey(latest);
    setActiveCode(getEdition(latest).categories[0].code);
  }

  function switchEdition(key) {
    setEditionKey(key);
    setActiveCode(getEdition(key).categories[0].code);
  }

  const activeCategory = edition.categories.find((c) => c.code === activeCode) || edition.categories[0];

  return (
    <div>
      <div className={styles.trackTabs} role="tablist" aria-label="Choose a track">
        {TRACKS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={styles.trackTab}
            data-active={track === t.id}
            onClick={() => switchTrack(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className={styles.yearTabs}>
        {yearKeys.map((key) => (
          <button
            key={key}
            type="button"
            className={styles.yearTab}
            data-active={key === editionKey}
            onClick={() => switchEdition(key)}>
            {getEdition(key).label} — {getEdition(key).year}
          </button>
        ))}
      </div>

      <div className={styles.layout}>
        <div className={styles.wheelColumn}>
          <AttackWheel
            categories={edition.categories}
            activeCode={activeCode}
            onSelect={setActiveCode}
            centerLabel={String(edition.year)}
          />
          <div className={styles.legend}>
            {Object.entries(THEMES).map(([key, theme]) => (
              <span key={key} className={styles.legendItem}>
                <span className={styles.legendSwatch} data-color={theme.color} />
                {theme.label}
              </span>
            ))}
          </div>
        </div>

        <div className={styles.detailList}>
          {edition.categories.map((cat) => {
            const isActive = cat.code === activeCode;
            const theme = THEMES[cat.theme];
            return (
              <div
                key={cat.code}
                className={styles.detailCard}
                data-active={isActive}
                onClick={() => setActiveCode(cat.code)}>
                <div className={styles.detailCardHead}>
                  <span className={styles.detailCode} data-color={theme.color}>
                    {cat.code}
                  </span>
                  <span className={styles.detailName}>{cat.name}</span>
                </div>
                {isActive && (
                  <div className={styles.detailBody}>
                    <p className={styles.detailDescription}>{cat.description}</p>
                    {cat.changeNote && <p className={styles.changeNote}>📌 {cat.changeNote}</p>}
                    <p className={styles.techniqueLabel}>Attack techniques in this category</p>
                    <div className={styles.techniqueList}>
                      {cat.techniques.map((t) => (
                        <button
                          key={t}
                          type="button"
                          className={styles.techniqueChip}
                          onClick={() => setOpenTechnique(t)}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <TechniqueModal label={openTechnique} onClose={() => setOpenTechnique(null)} />
    </div>
  );
}
