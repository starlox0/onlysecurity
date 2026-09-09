import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {OPERATIONS, CATEGORIES, getOperation, defaultArgs} from './operations';
import styles from './styles.module.css';

let nextInstanceId = 1;

const EXAMPLES = [
  {
    label: 'Decode a JWT',
    input:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    recipe: [{opId: 'jwt-decode'}],
  },
  {
    label: 'Base64 → Hex',
    input: 'SGVsbG8sIFdvcmxkIQ==',
    recipe: [{opId: 'from-base64'}, {opId: 'to-hex'}],
  },
  {
    label: 'Hash identification',
    input: '5f4dcc3b5aa765d61d8327deb882cf99',
    recipe: [{opId: 'identify-hash'}],
  },
  {
    label: 'ROT13 a message',
    input: 'Uryyb, guvf vf ebg13!',
    recipe: [{opId: 'rot13'}],
  },
];

function ArgControl({arg, value, onChange}) {
  if (arg.type === 'checkbox') {
    return (
      <label className={styles.argCheckbox}>
        <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
        {arg.label}
      </label>
    );
  }
  if (arg.type === 'select') {
    return (
      <label className={styles.argField}>
        <span>{arg.label}</span>
        <select value={value} onChange={(e) => onChange(e.target.value)} className={styles.argSelect}>
          {arg.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
    );
  }
  if (arg.type === 'number') {
    return (
      <label className={styles.argField}>
        <span>{arg.label}</span>
        <input
          type="number"
          value={value}
          min={arg.min}
          max={arg.max}
          onChange={(e) => onChange(e.target.value)}
          className={styles.argInput}
        />
      </label>
    );
  }
  return (
    <label className={styles.argField}>
      <span>{arg.label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={styles.argInput}
      />
    </label>
  );
}

function RecipeStep({step, index, isFailedStep, onToggle, onRemove, onArgChange, onDragStart, onDragOver, onDrop}) {
  const op = getOperation(step.opId);
  return (
    <div
      className={styles.recipeStep}
      data-enabled={step.enabled}
      data-failed={isFailedStep}
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(index);
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDrop(index);
      }}>
      <div className={styles.recipeStepHead}>
        <span className={styles.dragHandle} aria-hidden="true">⠿</span>
        <span className={styles.recipeStepNumber}>{index + 1}</span>
        <span className={styles.recipeStepName}>{op.name}</span>
        <label className={styles.stepToggle} title={step.enabled ? 'Disable step' : 'Enable step'}>
          <input type="checkbox" checked={step.enabled} onChange={onToggle} />
        </label>
        <button type="button" className={styles.stepRemove} onClick={onRemove} aria-label={`Remove ${op.name}`}>
          ✕
        </button>
      </div>
      {op.args.length > 0 && (
        <div className={styles.argList}>
          {op.args.map((arg) => (
            <ArgControl
              key={arg.id}
              arg={arg}
              value={step.args[arg.id]}
              onChange={(val) => onArgChange(arg.id, val)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function encodeState(input, recipe) {
  const compact = {i: input, r: recipe.map((s) => ({o: s.opId, a: s.args, e: s.enabled}))};
  return btoa(encodeURIComponent(JSON.stringify(compact)));
}

function decodeState(hash) {
  try {
    const compact = JSON.parse(decodeURIComponent(atob(hash)));
    const recipe = (compact.r || [])
      .filter((s) => getOperation(s.o))
      .map((s) => ({instanceId: nextInstanceId++, opId: s.o, args: s.a, enabled: s.e !== false}));
    return {input: compact.i || '', recipe};
  } catch {
    return null;
  }
}

export default function ByteForge() {
  const [input, setInput] = useState('');
  const [recipe, setRecipe] = useState([]);
  const [output, setOutput] = useState('');
  const [bakeStatus, setBakeStatus] = useState('idle'); // idle | running | error
  const [errorInfo, setErrorInfo] = useState(null); // {stepIndex, message}
  const [search, setSearch] = useState('');
  const dragIndex = useRef(null);
  const dragOverIndex = useRef(null);

  // Restore a shared recipe from the URL hash on first load.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash.replace(/^#/, '');
    if (hash) {
      const restored = decodeState(hash);
      if (restored) {
        setInput(restored.input);
        setRecipe(restored.recipe);
      }
    }
  }, []);

  // Keep the URL in sync so the current recipe + input is always shareable.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const timer = setTimeout(() => {
      const encoded = encodeState(input, recipe);
      window.history.replaceState({}, '', `#${encoded}`);
    }, 400);
    return () => clearTimeout(timer);
  }, [input, recipe]);

  const runRecipe = useCallback(async () => {
    setBakeStatus('running');
    setErrorInfo(null);
    let value = input;
    const enabledSteps = recipe.filter((s) => s.enabled);
    for (let i = 0; i < enabledSteps.length; i++) {
      const step = enabledSteps[i];
      const op = getOperation(step.opId);
      try {
        // eslint-disable-next-line no-await-in-loop
        value = await op.run(value, step.args);
      } catch (err) {
        setErrorInfo({stepId: step.instanceId, message: err.message || String(err)});
        setBakeStatus('error');
        setOutput(value);
        return;
      }
    }
    setOutput(value);
    setBakeStatus('idle');
  }, [input, recipe]);

  // Auto-bake: recompute whenever input or the recipe changes.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (recipe.length === 0) {
        setOutput(input);
        setBakeStatus('idle');
        setErrorInfo(null);
      } else {
        runRecipe();
      }
    }, 150);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, recipe]);

  function addOperation(opId) {
    const op = getOperation(opId);
    setRecipe((prev) => [
      ...prev,
      {instanceId: nextInstanceId++, opId, args: defaultArgs(op), enabled: true},
    ]);
  }

  function removeOperation(instanceId) {
    setRecipe((prev) => prev.filter((s) => s.instanceId !== instanceId));
  }

  function toggleOperation(instanceId) {
    setRecipe((prev) => prev.map((s) => (s.instanceId === instanceId ? {...s, enabled: !s.enabled} : s)));
  }

  function updateArgs(instanceId, argId, value) {
    setRecipe((prev) =>
      prev.map((s) => (s.instanceId === instanceId ? {...s, args: {...s.args, [argId]: value}} : s)),
    );
  }

  function moveOperation(from, to) {
    setRecipe((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  function loadExample(example) {
    setInput(example.input);
    setRecipe(
      example.recipe.map((s) => {
        const op = getOperation(s.opId);
        return {instanceId: nextInstanceId++, opId: s.opId, args: defaultArgs(op), enabled: true};
      }),
    );
  }

  function clearRecipe() {
    setRecipe([]);
  }

  async function copyOutput() {
    try {
      await navigator.clipboard.writeText(output);
    } catch {
      // clipboard permissions denied — nothing to do, the user can select manually
    }
  }

  const filteredOps = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return OPERATIONS;
    return OPERATIONS.filter(
      (op) => op.name.toLowerCase().includes(q) || op.description.toLowerCase().includes(q),
    );
  }, [search]);

  const opsByCategory = useMemo(() => {
    const map = new Map();
    for (const cat of CATEGORIES) map.set(cat, []);
    for (const op of filteredOps) {
      if (!map.has(op.category)) map.set(op.category, []);
      map.get(op.category).push(op);
    }
    return [...map.entries()].filter(([, ops]) => ops.length > 0);
  }, [filteredOps]);

  const inputByteLen = useMemo(() => new TextEncoder().encode(input).length, [input]);
  const outputByteLen = useMemo(() => new TextEncoder().encode(output).length, [output]);
  const errorStepId = errorInfo?.stepId;

  return (
    <div className={styles.workbench}>
      {/* --- Operation catalog --- */}
      <div className={styles.catalogPane}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search operations..."
          className={styles.catalogSearch}
          aria-label="Search operations"
        />
        <div className={styles.catalogList}>
          {opsByCategory.map(([category, ops]) => (
            <div key={category} className={styles.catalogCategory}>
              <h3 className={styles.catalogCategoryTitle}>{category}</h3>
              {ops.map((op) => (
                <button
                  key={op.id}
                  type="button"
                  className={styles.catalogItem}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('text/opid', op.id)}
                  onClick={() => addOperation(op.id)}
                  title={op.description}>
                  {op.name}
                  <span className={styles.catalogItemAdd} aria-hidden="true">+</span>
                </button>
              ))}
            </div>
          ))}
          {opsByCategory.length === 0 && <p className={styles.catalogEmpty}>No operations match.</p>}
        </div>
      </div>

      {/* --- Recipe pane --- */}
      <div
        className={styles.recipePane}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          const opId = e.dataTransfer.getData('text/opid');
          if (opId) addOperation(opId);
        }}>
        <div className={styles.recipeHeader}>
          <h3 className={styles.paneTitle}>Recipe</h3>
          {recipe.length > 0 && (
            <button type="button" className={styles.clearRecipeButton} onClick={clearRecipe}>
              Clear
            </button>
          )}
        </div>

        {recipe.length === 0 ? (
          <div className={styles.recipeEmpty}>
            <p>Drag an operation here, or click one to add it.</p>
            <div className={styles.exampleRow}>
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.label}
                  type="button"
                  className={styles.exampleButton}
                  onClick={() => loadExample(ex)}>
                  {ex.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className={styles.recipeList}>
            {recipe.map((step, index) => (
              <RecipeStep
                key={step.instanceId}
                step={step}
                index={index}
                isFailedStep={step.instanceId === errorStepId}
                onToggle={() => toggleOperation(step.instanceId)}
                onRemove={() => removeOperation(step.instanceId)}
                onArgChange={(argId, val) => updateArgs(step.instanceId, argId, val)}
                onDragStart={(i) => { dragIndex.current = i; }}
                onDragOver={(i) => { dragOverIndex.current = i; }}
                onDrop={() => {
                  if (dragIndex.current !== null && dragOverIndex.current !== null) {
                    moveOperation(dragIndex.current, dragOverIndex.current);
                  }
                  dragIndex.current = null;
                  dragOverIndex.current = null;
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* --- Input / Output pane --- */}
      <div className={styles.ioPane}>
        <div className={styles.ioBlock}>
          <div className={styles.ioHeader}>
            <span className={styles.ioLabel}>Input</span>
            <span className={styles.ioMeta}>{inputByteLen.toLocaleString()} bytes</span>
          </div>
          <textarea
            className={styles.ioTextarea}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste or type your data here..."
            spellCheck={false}
          />
        </div>

        <div className={styles.ioBlock}>
          <div className={styles.ioHeader}>
            <span className={styles.ioLabel}>
              Output
              {bakeStatus === 'running' && <span className={styles.bakingDot} aria-hidden="true" />}
            </span>
            <span className={styles.ioMeta}>
              {outputByteLen.toLocaleString()} bytes
              <button type="button" className={styles.copyButton} onClick={copyOutput}>
                Copy
              </button>
            </span>
          </div>
          <textarea
            className={styles.ioTextarea}
            data-error={bakeStatus === 'error'}
            value={output}
            readOnly
            spellCheck={false}
          />
          {errorInfo && (
            <p className={styles.errorNote}>
              Step {recipe.findIndex((s) => s.instanceId === errorInfo.stepId) + 1} failed: {errorInfo.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
