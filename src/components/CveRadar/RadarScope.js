import React from 'react';
import {getSeverity} from './nvd';
import styles from './RadarScope.module.css';

// Maps severity to how close to center a blip sits — critical threats
// read as "closer," same convention a real radar uses for urgency.
function severityRadiusPercent(severity) {
  switch (severity) {
    case 'CRITICAL':
      return 10;
    case 'HIGH':
      return 22;
    case 'MEDIUM':
      return 33;
    case 'LOW':
      return 44;
    default:
      return 44; // unscored CVEs read as low-urgency on the scope
  }
}

// A small, stable hash so each CVE always lands at the same angle across
// re-renders (not truly random, not evenly spaced either — reads more
// like a real scattered radar picture than a tidy clock face).
function hashAngle(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) % 360;
  }
  return hash;
}

export default function RadarScope({cves}) {
  const blips = cves.slice(0, 20).map((cve) => {
    const {severity} = getSeverity(cve);
    const radius = severityRadiusPercent(severity);
    const angleDeg = hashAngle(cve.id);
    const angleRad = (angleDeg * Math.PI) / 180;
    const x = 50 + radius * Math.cos(angleRad);
    const y = 50 + radius * Math.sin(angleRad);
    return {id: cve.id, severity, x, y};
  });

  return (
    <div className={styles.scope} role="img" aria-label={`Radar view of ${cves.length} tracked CVEs`}>
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
          data-severity={blip.severity}
          style={{left: `${blip.x}%`, top: `${blip.y}%`}}
          title={blip.id}>
          <span className={styles.blipPulse} />
        </a>
      ))}
      <div className={styles.center} />
    </div>
  );
}
