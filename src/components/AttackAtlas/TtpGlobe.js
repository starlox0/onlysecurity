import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {EDITIONS, THEMES, getEdition} from './data';
import {getRelatedAttackIds} from './ttpLinks';
import {fetchAttackMatrix, getTechniqueById} from '../MitreMatrix/matrix';
import MitreDetailPanel from '../MitreMatrix/MitreDetailPanel';
import TechniqueModal from './TechniqueModal';
import styles from './styles.module.css';

const TRACKS = [
  {id: 'web', label: 'Web', icon: '🌐'},
  {id: 'api', label: 'API', icon: '🔌'},
  {id: 'mobile', label: 'Mobile', icon: '📱'},
  {id: 'smart-contract', label: 'Other (Smart Contract)', icon: '⛓️'},
];

function editionKeysForTrack(track) {
  return Object.entries(EDITIONS)
    .filter(([, ed]) => ed.track === track)
    .sort((a, b) => a[1].year - b[1].year)
    .map(([key]) => key);
}

function latestEditionForTrack(track) {
  const keys = editionKeysForTrack(track);
  return keys[keys.length - 1];
}

// Evenly distributes N points on a unit sphere (the standard "Fibonacci
// sphere" construction) — every OWASP/API/Mobile/Smart-Contract edition
// has exactly 10 categories, so this always places 10 nodes with even
// visual spacing, no matter which track is selected.
function fibonacciSphere(n) {
  const points = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = goldenAngle * i;
    points.push({x: Math.cos(theta) * radiusAtY, y, z: Math.sin(theta) * radiusAtY});
  }
  return points;
}

function rotatePoint({x, y, z}, yaw, pitch) {
  // Rotate around Y axis (yaw)
  const x1 = x * Math.cos(yaw) + z * Math.sin(yaw);
  const z1 = -x * Math.sin(yaw) + z * Math.cos(yaw);
  // Rotate around X axis (pitch)
  const y2 = y * Math.cos(pitch) - z1 * Math.sin(pitch);
  const z2 = y * Math.sin(pitch) + z1 * Math.cos(pitch);
  return {x: x1, y: y2, z: z2};
}

export default function TtpGlobe() {
  const dataUrl = useBaseUrl('/data/attack-matrix.json');
  const [attackData, setAttackData] = useState(null);
  const [track, setTrack] = useState('web');
  const [editionKey, setEditionKey] = useState('web2025');
  const [selectedCode, setSelectedCode] = useState(null);
  const [openMitreId, setOpenMitreId] = useState(null);
  const [openInternalId, setOpenInternalId] = useState(null);

  const rotation = useRef({yaw: 0.4, pitch: -0.25});
  const [, forceRender] = useState(0);
  const containerRef = useRef(null);
  const dragState = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    fetchAttackMatrix(dataUrl).then(setAttackData).catch(() => setAttackData(null));
  }, [dataUrl]);

  // Slow continuous auto-rotation, paused while dragging, skipped entirely
  // if the visitor prefers reduced motion (a fixed, still angle instead).
  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return undefined;

    function tick() {
      if (!dragState.current) {
        rotation.current.yaw += 0.0025;
        forceRender((n) => n + 1);
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const handlePointerDown = useCallback((e) => {
    dragState.current = {startX: e.clientX, startY: e.clientY, startYaw: rotation.current.yaw, startPitch: rotation.current.pitch};
  }, []);

  const handlePointerMove = useCallback((e) => {
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    rotation.current.yaw = dragState.current.startYaw + dx * 0.01;
    rotation.current.pitch = Math.max(-1.3, Math.min(1.3, dragState.current.startPitch - dy * 0.01));
    forceRender((n) => n + 1);
  }, []);

  const handlePointerUp = useCallback(() => {
    dragState.current = null;
  }, []);

  function switchTrack(nextTrack) {
    setTrack(nextTrack);
    const latest = latestEditionForTrack(nextTrack);
    setEditionKey(latest);
    setSelectedCode(null);
  }

  const edition = getEdition(editionKey);
  const yearKeys = useMemo(() => editionKeysForTrack(track), [track]);

  const nodePositions = useMemo(() => fibonacciSphere(edition.categories.length), [edition.categories.length]);

  const projectedNodes = edition.categories.map((cat, i) => {
    const rotated = rotatePoint(nodePositions[i], rotation.current.yaw, rotation.current.pitch);
    const depthFactor = (rotated.z + 1) / 2; // 0 (back) .. 1 (front)
    return {
      category: cat,
      x: rotated.x,
      y: rotated.y,
      depthFactor,
      scale: 0.55 + 0.45 * depthFactor,
      opacity: 0.3 + 0.7 * depthFactor,
      zIndex: Math.round(depthFactor * 100),
    };
  });

  const selectedCategory = selectedCode ? edition.categories.find((c) => c.code === selectedCode) : null;
  const relatedTtps = selectedCategory ? getRelatedAttackIds(selectedCategory) : [];

  const selectedMitreTechnique =
    openMitreId && attackData ? getTechniqueById(attackData.techniques, openMitreId) : null;

  return (
    <div>
      <div className={styles.globeTrackTabs} role="tablist" aria-label="Choose a category to map">
        {TRACKS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={styles.globeTrackTab}
            data-active={track === t.id}
            onClick={() => switchTrack(t.id)}>
            <span aria-hidden="true">{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {yearKeys.length > 1 && (
        <div className={styles.globeYearTabs}>
          {yearKeys.map((key) => (
            <button
              key={key}
              type="button"
              className={styles.globeYearTab}
              data-active={key === editionKey}
              onClick={() => {
                setEditionKey(key);
                setSelectedCode(null);
              }}>
              {getEdition(key).year}
            </button>
          ))}
        </div>
      )}

      <div className={styles.globeLayout}>
        <div
          ref={containerRef}
          className={styles.globeContainer}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}>
          <div className={styles.globeSphereOutline} />
          {projectedNodes
            .slice()
            .sort((a, b) => a.zIndex - b.zIndex)
            .map(({category, x, y, scale, opacity, zIndex}) => {
              const theme = THEMES[category.theme];
              return (
                <button
                  key={category.code}
                  type="button"
                  className={styles.globeNode}
                  data-color={theme.color}
                  data-active={selectedCode === category.code}
                  style={{
                    left: `${50 + x * 42}%`,
                    top: `${50 - y * 42}%`,
                    transform: `translate(-50%, -50%) scale(${scale})`,
                    opacity,
                    zIndex,
                  }}
                  onClick={() => setSelectedCode(category.code)}
                  title={category.name}>
                  {category.code}
                </button>
              );
            })}
          <p className={styles.globeHint}>Drag to rotate</p>
        </div>

        <div className={styles.globeDetail}>
          {!selectedCategory ? (
            <p className={styles.globeDetailEmpty}>
              Click a node to see its real, mapped MITRE ATT&amp;CK techniques (TTPs).
            </p>
          ) : (
            <>
              <h3 className={styles.globeDetailTitle}>
                {selectedCategory.code}: {selectedCategory.name}
              </h3>
              <p className={styles.globeDetailDescription}>{selectedCategory.description}</p>
              <p className={styles.techniqueLabel}>Mapped ATT&amp;CK techniques (TTPs)</p>
              {relatedTtps.length === 0 ? (
                <p className={styles.globeNoTtps}>
                  {track === 'smart-contract'
                    ? "MITRE ATT&CK's Enterprise matrix doesn't model blockchain/smart-contract-specific attacks, so there's no direct TTP mapping here."
                    : 'No ATT&CK technique is directly mapped to this category yet.'}
                </p>
              ) : (
                <div className={styles.techniqueList}>
                  {relatedTtps.map((id) => (
                    <button key={id} type="button" className={styles.techniqueChip} onClick={() => setOpenMitreId(id)}>
                      {id} →
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <MitreDetailPanel
        technique={selectedMitreTechnique}
        onClose={() => setOpenMitreId(null)}
        onOpenInternal={(id) => {
          setOpenMitreId(null);
          setOpenInternalId(id);
        }}
      />
      <TechniqueModal techniqueId={openInternalId} onClose={() => setOpenInternalId(null)} />
    </div>
  );
}
