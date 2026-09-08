import React from 'react';
import styles from './styles.module.css';

// A single labeled horizontal bar — deliberately not a real <svg> chart
// library. Every other data panel on this site (CVE Radar, KEV Tracker)
// reads as a terminal readout, so these charts do too: a label, a filled
// bar, a monospace count. No axes, no legends, no chart-library sameness.
function BarRow({label, count, max, tone}) {
  const pct = max > 0 ? Math.max((count / max) * 100, 2) : 0;
  return (
    <div className={styles.barRow}>
      <span className={styles.barLabel} title={label}>
        {label}
      </span>
      <span className={styles.barTrack}>
        <span className={styles.barFill} data-tone={tone} style={{width: `${pct}%`}} />
      </span>
      <span className={styles.barCount}>{count.toLocaleString()}</span>
    </div>
  );
}

export default function ChartPanel({title, rows, toneOf}) {
  const max = rows.reduce((m, r) => Math.max(m, r.count), 0);
  return (
    <div className={styles.chartPanel}>
      <h3 className={styles.chartPanelTitle}>{title}</h3>
      <div className={styles.barList}>
        {rows.map((row) => (
          <BarRow
            key={row.key}
            label={row.label}
            count={row.count}
            max={max}
            tone={toneOf ? toneOf(row.key) : 'neutral'}
          />
        ))}
      </div>
    </div>
  );
}
