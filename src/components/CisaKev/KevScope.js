import React from 'react';
import {getUrgency} from './kev';
// Reuses CveRadar's radar-scope styling so both tools read as one visual
// language — only the data driving the blips differs (due-date/ransomware
// urgency here, instead of CVSS severity).
import styles from '../CveRadar/RadarScope.module.css';

function urgencyRadiusPercent(urgency) {
  switch (urgency) {
    case 'CRITICAL':
      return 10;
    case 'HIGH':
      return 22;
    case 'MEDIUM':
      return 33;
    default:
      return 44;
  }
}

// A small, stable hash so each entry always lands at the same angle across
// re-renders — reads more like a real scattered radar picture than a tidy
// clock face.
function hashAngle(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) % 360;
  }
  return hash;
}

export default function KevScope({entries}) {
  const blips = entries.slice(0, 20).map((entry) => {
    const urgency = getUrgency(entry);
    const radius = urgencyRadiusPercent(urgency);
    const angleDeg = hashAngle(entry.cveID);
    const angleRad = (angleDeg * Math.PI) / 180;
    const x = 50 + radius * Math.cos(angleRad);
    const y = 50 + radius * Math.sin(angleRad);
    return {id: entry.cveID, urgency, x, y};
  });

  return (
    <div
      className={styles.scope}
      role="img"
      aria-label={`Radar view of ${entries.length} known-exploited vulnerabilities`}>
      <div className={styles.ring} data-ring="1" />
      <div className={styles.ring} data-ring="2" />
      <div className={styles.ring} data-ring="3" />
      <div className={styles.crosshairV} />
      <div className={styles.crosshairH} />
      <div className={styles.sweep} />
      {blips.map((blip) => (
        <a
          key={blip.id}
          href={`https://nvd.nist.gov/vuln/detail/${blip.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.blip}
          data-severity={blip.urgency}
          style={{left: `${blip.x}%`, top: `${blip.y}%`}}
          title={blip.id}>
          <span className={styles.blipPulse} />
        </a>
      ))}
      <div className={styles.center} />
    </div>
  );
}
