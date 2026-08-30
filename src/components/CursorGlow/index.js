import React, {useEffect, useRef} from 'react';
import styles from './styles.module.css';

export default function CursorGlow() {
  const glowRef = useRef(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || !glowRef.current) return;

    let rafId = null;

    function handleMove(e) {
      if (rafId) return; // coalesce to one update per animation frame
      rafId = requestAnimationFrame(() => {
        if (glowRef.current) {
          glowRef.current.style.setProperty('--glow-x', `${e.clientX}px`);
          glowRef.current.style.setProperty('--glow-y', `${e.clientY}px`);
          glowRef.current.style.setProperty('--glow-opacity', '1');
        }
        rafId = null;
      });
    }

    function handleLeave() {
      if (glowRef.current) {
        glowRef.current.style.setProperty('--glow-opacity', '0');
      }
    }

    window.addEventListener('mousemove', handleMove, {passive: true});
    window.addEventListener('mouseleave', handleLeave);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseleave', handleLeave);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return <div ref={glowRef} className={styles.glow} aria-hidden="true" />;
}
