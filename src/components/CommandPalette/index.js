import React, {useCallback, useEffect, useRef, useState} from 'react';
import {useHistory} from '@docusaurus/router';
import entries from './data';
import {fuzzySearch} from './fuzzy';
import styles from './styles.module.css';

export default function CommandPalette() {
  const history = useHistory();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const lastFocusedRef = useRef(null);

  const results = fuzzySearch(query, entries);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setActiveIndex(0);
    if (lastFocusedRef.current) {
      lastFocusedRef.current.focus();
    }
  }, []);

  const open = useCallback(() => {
    lastFocusedRef.current = document.activeElement;
    setIsOpen(true);
  }, []);

  const navigateTo = useCallback(
    (item) => {
      if (!item) return;
      if (item.type === 'link') {
        window.open(item.path, '_blank', 'noopener,noreferrer');
      } else {
        history.push(item.path);
      }
      close();
    },
    [history, close],
  );

  // Global shortcut: Cmd/Ctrl+K to open, Escape to close.
  useEffect(() => {
    function handleKeyDown(e) {
      const isMod = e.metaKey || e.ctrlKey;
      if (isMod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => {
          if (prev) return prev; // already open, let it be
          lastFocusedRef.current = document.activeElement;
          return true;
        });
      } else if (e.key === 'Escape' && isOpen) {
        close();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close]);

  // Focus the input and lock body scroll whenever the palette opens.
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  function handleInputKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      navigateTo(results[activeIndex]);
    }
  }

  return (
    <>
      <button
        type="button"
        className={styles.trigger}
        onClick={open}
        aria-label="Open command palette (Cmd+K)">
        <span className={styles.triggerIcon}>⌘</span>
        <span className={styles.triggerText}>K</span>
      </button>

      {isOpen && (
        <div className={styles.overlay} onMouseDown={close} role="presentation">
          <div
            className={styles.panel}
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            onMouseDown={(e) => e.stopPropagation()}>
            <div className={styles.inputRow}>
              <span className={styles.prompt}>$</span>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="jump to a doc, post, or link..."
                className={styles.input}
                aria-label="Search"
              />
              <kbd className={styles.escHint}>esc</kbd>
            </div>

            <ul className={styles.results} role="listbox">
              {results.length === 0 && (
                <li className={styles.empty}>No matches for &ldquo;{query}&rdquo;</li>
              )}
              {results.map((item, i) => (
                <li key={item.path} role="option" aria-selected={i === activeIndex}>
                  <button
                    type="button"
                    className={i === activeIndex ? styles.resultActive : styles.result}
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => navigateTo(item)}>
                    <span className={styles.resultType} data-type={item.type}>
                      {item.type === 'link' ? '↗' : '#'}
                    </span>
                    <span className={styles.resultBody}>
                      <span className={styles.resultTitle}>{item.title}</span>
                      <span className={styles.resultDescription}>{item.description}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}

