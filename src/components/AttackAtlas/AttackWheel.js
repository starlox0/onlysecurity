import React from 'react';
import {THEMES} from './data';
import styles from './styles.module.css';

const GAP_DEG = 3;
const OUTER_R = 170;
const INNER_R = 88;
const CENTER = 200;

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad)};
}

// A closed path for one donut wedge (an annulus slice), used instead of a
// full pie so the wheel reads as a "dial" rather than a plain pie chart —
// visually consistent with the ring-based radar already used in CVE
// Radar/KEV Tracker elsewhere on this site.
function donutSegmentPath(cx, cy, outerR, innerR, startAngle, endAngle) {
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  const outerStart = polarToCartesian(cx, cy, outerR, startAngle);
  const outerEnd = polarToCartesian(cx, cy, outerR, endAngle);
  const innerEnd = polarToCartesian(cx, cy, innerR, endAngle);
  const innerStart = polarToCartesian(cx, cy, innerR, startAngle);
  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ');
}

export default function AttackWheel({categories, activeCode, onSelect, centerLabel}) {
  const step = 360 / categories.length;

  return (
    <svg viewBox="0 0 400 400" className={styles.wheel} role="img" aria-label={`Wheel diagram of ${categories.length} categories`}>
      {categories.map((cat, i) => {
        const start = i * step + GAP_DEG / 2;
        const end = (i + 1) * step - GAP_DEG / 2;
        const mid = (start + end) / 2;
        const labelPos = polarToCartesian(CENTER, CENTER, (OUTER_R + INNER_R) / 2, mid);
        const isActive = cat.code === activeCode;
        const theme = THEMES[cat.theme];

        return (
          <g key={cat.code}>
            <path
              d={donutSegmentPath(CENTER, CENTER, OUTER_R, INNER_R, start, end)}
              className={styles.wedge}
              data-color={theme.color}
              data-active={isActive}
              onClick={() => onSelect(cat.code)}
              role="button"
              tabIndex={0}
              aria-label={`${cat.code}: ${cat.name}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(cat.code);
                }
              }}
            />
            <text
              x={labelPos.x}
              y={labelPos.y}
              className={styles.wedgeLabel}
              data-active={isActive}
              textAnchor="middle"
              dominantBaseline="middle"
              pointerEvents="none">
              {cat.code}
            </text>
          </g>
        );
      })}
      <circle cx={CENTER} cy={CENTER} r={INNER_R - 4} className={styles.wheelCenter} />
      <text x={CENTER} y={CENTER - 8} textAnchor="middle" className={styles.wheelCenterLabel}>
        {centerLabel}
      </text>
      <text x={CENTER} y={CENTER + 14} textAnchor="middle" className={styles.wheelCenterHint}>
        tap a slice
      </text>
    </svg>
  );
}
