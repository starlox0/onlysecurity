import React, {useEffect, useRef, useState} from 'react';
import {makeInitialFs, pathString, getNode} from './fs';
import {runCommand, COMMAND_LIST} from './commands';
import styles from './styles.module.css';

const HOME = ['home', 'learner'];

function promptFor(cwd) {
  const path = pathString(cwd);
  const short = path === pathString(HOME) ? '~' : path;
  return `learner@onlysecurity:${short}$`;
}

export default function LinuxTerminal() {
  const [fs, setFs] = useState(() => makeInitialFs());
  const [cwd, setCwd] = useState(HOME);
  const [lines, setLines] = useState([
    {kind: 'system', text: 'Practice shell — type "help" to get started. Nothing here is real.'},
  ]);
  const [input, setInput] = useState('');
  const [cmdHistory, setCmdHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(null);

  const inputRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({top: scrollRef.current.scrollHeight});
  }, [lines]);

  function focusInput() {
    inputRef.current?.focus();
  }

  function submit() {
    const line = input;
    const prompt = promptFor(cwd);
    if (line.trim() === '') {
      setLines((prev) => [...prev, {kind: 'input', text: `${prompt} `}]);
      setInput('');
      return;
    }

    const trimmed = line.trim();
    if (trimmed === 'history') {
      const newLines = [...lines, {kind: 'input', text: `${prompt} ${line}`}];
      const historyText = cmdHistory.map((c, i) => `  ${i + 1}  ${c}`).join('\n');
      newLines.push({kind: 'output', text: historyText || '(no history yet)'});
      setLines(newLines);
      setCmdHistory((prev) => [...prev, line]);
      setHistoryIndex(null);
      setInput('');
      return;
    }

    const result = runCommand(line, {fs, cwd});
    const newLines = [...lines, {kind: 'input', text: `${prompt} ${line}`}];

    if (result.output === '__CLEAR__') {
      setLines([]);
    } else {
      if (result.output) newLines.push({kind: 'output', text: result.output});
      setLines(newLines);
    }

    setFs(result.fs);
    setCwd(result.cwd);
    setCmdHistory((prev) => [...prev, line]);
    setHistoryIndex(null);
    setInput('');
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (cmdHistory.length === 0) return;
      const nextIndex = historyIndex === null ? cmdHistory.length - 1 : Math.max(historyIndex - 1, 0);
      setHistoryIndex(nextIndex);
      setInput(cmdHistory[nextIndex]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === null) return;
      const nextIndex = historyIndex + 1;
      if (nextIndex >= cmdHistory.length) {
        setHistoryIndex(null);
        setInput('');
      } else {
        setHistoryIndex(nextIndex);
        setInput(cmdHistory[nextIndex]);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const tokens = input.split(' ');
      const last = tokens[tokens.length - 1] || '';
      let candidates;
      if (tokens.length <= 1) {
        candidates = COMMAND_LIST.filter((c) => c.startsWith(last));
      } else {
        const node = getNode(fs, cwd);
        candidates = node && node.type === 'dir'
          ? Object.keys(node.children).filter((n) => n.startsWith(last))
          : [];
      }
      if (candidates.length === 1) {
        tokens[tokens.length - 1] = candidates[0];
        setInput(tokens.join(' '));
      }
    }
  }

  return (
    <div className={styles.terminal} onClick={focusInput}>
      <div className={styles.terminalBar}>
        <span className={styles.dot} data-color="red" />
        <span className={styles.dot} data-color="amber" />
        <span className={styles.dot} data-color="green" />
        <span className={styles.terminalPath}>practice-shell</span>
      </div>
      <div className={styles.terminalBody} ref={scrollRef}>
        {lines.map((line, i) => (
          <pre
            key={i}
            className={
              line.kind === 'input'
                ? styles.lineInput
                : line.kind === 'system'
                  ? styles.lineSystem
                  : styles.lineOutput
            }>
            {line.text}
          </pre>
        ))}
        <div className={styles.inputRow}>
          <span className={styles.prompt}>{promptFor(cwd)}</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className={styles.input}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck="false"
            aria-label="Practice terminal input"
          />
        </div>
      </div>
    </div>
  );
}
