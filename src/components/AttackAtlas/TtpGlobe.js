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

function project(point) {
  return {x: 50 + point.x * 42, y: 50 - point.y * 42};
}

// Latitude rings (fixed y, circle in the XZ plane) and longitude meridians
// (fixed angle, arc from pole to pole) traced in unrotated unit-sphere
// space — rotated and projected fresh every frame, same as the category
// nodes, so the wireframe reads as attached to the same rotating surface.
const LATITUDES = [-0.66, -0.33, 0, 0.33, 0.66];
const LONGITUDE_COUNT = 6;
const RING_STEPS = 40;

function buildLatitudeRings() {
  return LATITUDES.map((y) => {
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const pts = [];
    for (let i = 0; i <= RING_STEPS; i++) {
      const a = (i / RING_STEPS) * Math.PI * 2;
      pts.push({x: Math.cos(a) * r, y, z: Math.sin(a) * r});
    }
    return pts;
  });
}

function buildLongitudeMeridians() {
  const meridians = [];
  for (let m = 0; m < LONGITUDE_COUNT; m++) {
    const lon = (m / LONGITUDE_COUNT) * Math.PI * 2;
    const pts = [];
    for (let i = 0; i <= RING_STEPS; i++) {
      const phi = (i / RING_STEPS) * Math.PI - Math.PI / 2; // -90deg..90deg
      const r = Math.cos(phi);
      pts.push({x: Math.cos(lon) * r, y: Math.sin(phi), z: Math.sin(lon) * r});
    }
    meridians.push(pts);
  }
  return meridians;
}

const LATITUDE_RINGS = buildLatitudeRings();
const LONGITUDE_MERIDIANS = buildLongitudeMeridians();
// Only draw a grid segment where both its endpoints face reasonably
// toward the viewer — this is what makes it read as a solid, opaque
// sphere with visible surface lines, rather than a see-through wireframe.
const FRONT_THRESHOLD = -0.05;

function buildGridPaths(yaw, pitch) {
  const paths = [];
  for (const ring of [...LATITUDE_RINGS, ...LONGITUDE_MERIDIANS]) {
    let current = '';
    for (const pt of ring) {
      const rotated = rotatePoint(pt, yaw, pitch);
      if (rotated.z < FRONT_THRESHOLD) {
        if (current) {
          paths.push(current);
          current = '';
        }
        continue;
      }
      const p = project(rotated);
      current += current ? ` L ${p.x} ${p.y}` : `M ${p.x} ${p.y}`;
    }
    if (current) paths.push(current);
  }
  return paths;
}

// A small, stable starfield — generated once (not re-randomized every
// render) using a simple seeded sequence so it doesn't jitter as the
// globe rotates.
function buildStars(count) {
  let seed = 42;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  return Array.from({length: count}, () => ({
    x: rand() * 100,
    y: rand() * 100,
    r: 0.3 + rand() * 0.9,
    o: 0.2 + rand() * 0.6,
  }));
}
const STARS = buildStars(50);

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
      screen: project(rotated),
      depthFactor,
      scale: 0.55 + 0.45 * depthFactor,
      opacity: 0.3 + 0.7 * depthFactor,
      zIndex: Math.round(depthFactor * 100),
    };
  });

  const gridPaths = useMemo(
    () => buildGridPaths(rotation.current.yaw, rotation.current.pitch),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rotation is a ref; the render-forcing tick above is what drives this recompute
    [rotation.current.yaw, rotation.current.pitch, edition.categories.length],
  );

  // Real, derived connections: two categories are linked on the globe
  // only if they genuinely share at least one mapped ATT&CK technique —
  // same underlying data as the detail panel below, not a separate
  // decorative graph.
  const connections = useMemo(() => {
    const ttpSets = edition.categories.map((cat) => new Set(getRelatedAttackIds(cat)));
    const pairs = [];
    for (let i = 0; i < ttpSets.length; i++) {
      for (let j = i + 1; j < ttpSets.length; j++) {
        let shared = 0;
        for (const id of ttpSets[i]) if (ttpSets[j].has(id)) shared++;
        if (shared > 0) pairs.push({a: i, b: j, shared});
      }
    }
    return pairs;
  }, [edition]);

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
          <svg className={styles.globeStarfield} viewBox="0 0 100 100" aria-hidden="true">
            {STARS.map((s, i) => (
              <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="currentColor" opacity={s.o} />
            ))}
          </svg>

          <div className={styles.globeSphere}>
            <svg className={styles.globeGrid} viewBox="0 0 100 100" aria-hidden="true">
              {gridPaths.map((d, i) => (
                <path key={i} d={d} fill="none" stroke="currentColor" strokeWidth="0.3" />
              ))}
              {connections.map(({a, b, shared}) => {
                const nodeA = projectedNodes[a];
                const nodeB = projectedNodes[b];
                const minDepth = Math.min(nodeA.depthFactor, nodeB.depthFactor);
                if (minDepth < 0.32) return null; // hide arcs that dip too far around the back
                const mx = (nodeA.screen.x + nodeB.screen.x) / 2;
                const my = (nodeA.screen.y + nodeB.screen.y) / 2;
                // Push the control point away from center so the arc bows
                // outward, like a lifted great-circle line rather than a
                // flat chord straight through the sphere.
                const away = Math.hypot(mx - 50, my - 50) || 1;
                const bow = 1 + shared * 0.15;
                const cx = 50 + ((mx - 50) / away) * (away + 6 * bow);
                const cy = 50 + ((my - 50) / away) * (away + 6 * bow);
                return (
                  <path
                    key={`${a}-${b}`}
                    d={`M ${nodeA.screen.x} ${nodeA.screen.y} Q ${cx} ${cy} ${nodeB.screen.x} ${nodeB.screen.y}`}
                    fill="none"
                    className={styles.connectionArc}
                    style={{opacity: 0.15 + minDepth * 0.45}}
                  />
                );
              })}
            </svg>

            {projectedNodes
              .slice()
              .sort((a, b) => a.zIndex - b.zIndex)
              .map(({category, screen, scale, opacity, zIndex}) => {
                const theme = THEMES[category.theme];
                return (
                  <button
                    key={category.code}
                    type="button"
                    className={styles.globeNode}
                    data-color={theme.color}
                    data-active={selectedCode === category.code}
                    style={{
                      left: `${screen.x}%`,
                      top: `${screen.y}%`,
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
          </div>

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
