import {resolvePath, getNode, getParentAndName, pathString} from './fs';

// Deep-clones only the path being written to, sharing the rest of the tree
// structurally — cheap enough for a filesystem this small, and keeps every
// command a pure function of (fs, cwd, args) -> {fs, cwd, output}.
function cloneAlong(fs, segments) {
  if (segments.length === 0) return {...fs, children: {...fs.children}};
  const clone = {...fs, children: {...fs.children}};
  const [head, ...rest] = segments;
  if (clone.children[head]) {
    clone.children[head] = cloneAlong(clone.children[head], rest);
  }
  return clone;
}

const COMMAND_LIST = [
  'help', 'man', 'pwd', 'ls', 'cd', 'cat', 'echo', 'mkdir', 'touch', 'rm',
  'cp', 'mv', 'grep', 'find', 'whoami', 'hostname', 'date', 'history',
  'clear', 'sudo', 'exit',
];

const MAN_PAGES = {
  ls: 'ls [-la] [path]  — list directory contents',
  cd: 'cd [path]        — change the current directory (try cd, cd .., cd ~)',
  cat: 'cat <file...>    — print file contents',
  echo: 'echo <text> [> file | >> file] — print text, optionally writing/appending to a file',
  pwd: 'pwd              — print the current directory',
  mkdir: 'mkdir <dir>      — create a directory',
  touch: 'touch <file>     — create an empty file',
  rm: 'rm [-r] <path>   — remove a file, or a directory with -r',
  cp: 'cp <src> <dst>   — copy a file',
  mv: 'mv <src> <dst>   — move/rename a file or directory',
  grep: 'grep [-i] <pattern> <file> — print lines matching a pattern',
  find: 'find <path> -name <pattern> — search for files/dirs by name',
  whoami: 'whoami           — print the current user',
  history: 'history          — show recently run commands',
};

// Tokenizes respecting simple "double quoted" segments.
function tokenize(line) {
  const tokens = [];
  const re = /"([^"]*)"|(\S+)/g;
  let m;
  while ((m = re.exec(line)) !== null) {
    tokens.push(m[1] !== undefined ? m[1] : m[2]);
  }
  return tokens;
}

function listDir(node, opts) {
  const names = Object.keys(node.children).sort();
  const visible = opts.all ? names : names.filter((n) => !n.startsWith('.'));
  return visible
    .map((n) => (node.children[n].type === 'dir' ? `${n}/` : n))
    .join(opts.long ? '\n' : '  ');
}

function collectMatches(node, segments, pattern, results) {
  const names = Object.keys(node.children);
  for (const name of names) {
    const child = node.children[name];
    const childPath = [...segments, name];
    if (name.toLowerCase().includes(pattern.toLowerCase())) {
      results.push(pathString(childPath) + (child.type === 'dir' ? '/' : ''));
    }
    if (child.type === 'dir') {
      collectMatches(child, childPath, pattern, results);
    }
  }
}

export function runCommand(line, state) {
  const {fs, cwd} = state;
  const tokens = tokenize(line.trim());
  if (tokens.length === 0) return {fs, cwd, output: ''};

  const [cmd, ...args] = tokens;

  switch (cmd) {
    case 'help':
      return {
        fs, cwd,
        output:
          'Available commands:\n' +
          COMMAND_LIST.join('  ') +
          '\n\nType "man <command>" for details on any of them.',
      };

    case 'man': {
      const target = args[0];
      if (!target) return {fs, cwd, output: 'usage: man <command>'};
      return {fs, cwd, output: MAN_PAGES[target] || `No manual entry for ${target}`};
    }

    case 'pwd':
      return {fs, cwd, output: pathString(cwd)};

    case 'whoami':
      return {fs, cwd, output: 'learner'};

    case 'hostname':
      return {fs, cwd, output: 'onlysecurity'};

    case 'date':
      return {fs, cwd, output: new Date().toString()};

    case 'clear':
      return {fs, cwd, output: '__CLEAR__'};

    case 'sudo':
      return {
        fs, cwd,
        output: 'learner is not in the sudoers file. This incident will be reported.',
      };

    case 'exit':
      return {fs, cwd, output: "There's no exit — this is a browser tab. Try closing it instead."};

    case 'ls': {
      const flags = args.filter((a) => a.startsWith('-'));
      const pathArg = args.find((a) => !a.startsWith('-'));
      const opts = {
        all: flags.some((f) => f.includes('a')),
        long: flags.some((f) => f.includes('l')),
      };
      const segments = resolvePath(cwd, pathArg || '.');
      const node = getNode(fs, segments);
      if (!node) return {fs, cwd, output: `ls: cannot access '${pathArg}': No such file or directory`};
      if (node.type !== 'dir') return {fs, cwd, output: pathArg || ''};
      if (node.restricted) return {fs, cwd, output: `ls: cannot open directory '${pathArg}': Permission denied`};
      return {fs, cwd, output: listDir(node, opts) || '(empty)'};
    }

    case 'cd': {
      const target = args[0] || '~';
      const segments = resolvePath(cwd, target);
      const node = getNode(fs, segments);
      if (!node) return {fs, cwd, output: `cd: no such file or directory: ${target}`};
      if (node.type !== 'dir') return {fs, cwd, output: `cd: not a directory: ${target}`};
      if (node.restricted) return {fs, cwd, output: `cd: permission denied: ${target}`};
      return {fs, cwd: segments, output: ''};
    }

    case 'cat': {
      if (args.length === 0) return {fs, cwd, output: 'usage: cat <file...>'};
      const outputs = args.map((a) => {
        const segments = resolvePath(cwd, a);
        const node = getNode(fs, segments);
        if (!node) return `cat: ${a}: No such file or directory`;
        if (node.type === 'dir') return `cat: ${a}: Is a directory`;
        return node.content;
      });
      return {fs, cwd, output: outputs.join('\n')};
    }

    case 'mkdir': {
      if (args.length === 0) return {fs, cwd, output: 'usage: mkdir <dir>'};
      const segments = resolvePath(cwd, args[0]);
      const {parentSegments, name} = getParentAndName(segments);
      const parent = getNode(fs, parentSegments);
      if (!parent || parent.type !== 'dir') return {fs, cwd, output: `mkdir: cannot create directory '${args[0]}'`};
      if (parent.children[name]) return {fs, cwd, output: `mkdir: cannot create directory '${args[0]}': File exists`};
      const newFs = cloneAlong(fs, parentSegments);
      getNode(newFs, parentSegments).children[name] = {type: 'dir', children: {}};
      return {fs: newFs, cwd, output: ''};
    }

    case 'touch': {
      if (args.length === 0) return {fs, cwd, output: 'usage: touch <file>'};
      const segments = resolvePath(cwd, args[0]);
      const {parentSegments, name} = getParentAndName(segments);
      const parent = getNode(fs, parentSegments);
      if (!parent || parent.type !== 'dir') return {fs, cwd, output: `touch: cannot touch '${args[0]}'`};
      const newFs = cloneAlong(fs, parentSegments);
      if (!getNode(newFs, parentSegments).children[name]) {
        getNode(newFs, parentSegments).children[name] = {type: 'file', content: ''};
      }
      return {fs: newFs, cwd, output: ''};
    }

    case 'rm': {
      const recursive = args.includes('-r') || args.includes('-rf');
      const target = args.find((a) => !a.startsWith('-'));
      if (!target) return {fs, cwd, output: 'usage: rm [-r] <path>'};
      const segments = resolvePath(cwd, target);
      const node = getNode(fs, segments);
      if (!node) return {fs, cwd, output: `rm: cannot remove '${target}': No such file or directory`};
      if (node.type === 'dir' && !recursive) {
        return {fs, cwd, output: `rm: cannot remove '${target}': Is a directory (use -r)`};
      }
      const {parentSegments, name} = getParentAndName(segments);
      const newFs = cloneAlong(fs, parentSegments);
      delete getNode(newFs, parentSegments).children[name];
      return {fs: newFs, cwd, output: ''};
    }

    case 'cp':
    case 'mv': {
      if (args.length < 2) return {fs, cwd, output: `usage: ${cmd} <src> <dst>`};
      const srcSegments = resolvePath(cwd, args[0]);
      const dstSegments = resolvePath(cwd, args[1]);
      const srcNode = getNode(fs, srcSegments);
      if (!srcNode) return {fs, cwd, output: `${cmd}: cannot stat '${args[0]}': No such file or directory`};
      const {parentSegments: dstParentSegs, name: dstName} = getParentAndName(dstSegments);
      const dstParent = getNode(fs, dstParentSegs);
      if (!dstParent || dstParent.type !== 'dir') {
        return {fs, cwd, output: `${cmd}: cannot create '${args[1]}'`};
      }
      let newFs = cloneAlong(fs, dstParentSegs);
      getNode(newFs, dstParentSegs).children[dstName] = JSON.parse(JSON.stringify(srcNode));
      if (cmd === 'mv') {
        const {parentSegments: srcParentSegs, name: srcName} = getParentAndName(srcSegments);
        newFs = cloneAlong(newFs, srcParentSegs);
        delete getNode(newFs, srcParentSegs).children[srcName];
      }
      return {fs: newFs, cwd, output: ''};
    }

    case 'grep': {
      const ignoreCase = args.includes('-i');
      const rest = args.filter((a) => a !== '-i');
      const [pattern, fileArg] = rest;
      if (!pattern || !fileArg) return {fs, cwd, output: 'usage: grep [-i] <pattern> <file>'};
      const segments = resolvePath(cwd, fileArg);
      const node = getNode(fs, segments);
      if (!node || node.type !== 'file') return {fs, cwd, output: `grep: ${fileArg}: No such file`};
      const lines = node.content.split('\n');
      const test = ignoreCase ? pattern.toLowerCase() : pattern;
      const matches = lines.filter((l) => (ignoreCase ? l.toLowerCase() : l).includes(test));
      return {fs, cwd, output: matches.join('\n') || ''};
    }

    case 'find': {
      const pathArg = args[0] && args[0] !== '-name' ? args[0] : '.';
      const nameIdx = args.indexOf('-name');
      const pattern = nameIdx !== -1 ? args[nameIdx + 1] : null;
      if (!pattern) return {fs, cwd, output: 'usage: find <path> -name <pattern>'};
      const segments = resolvePath(cwd, pathArg);
      const node = getNode(fs, segments);
      if (!node || node.type !== 'dir') return {fs, cwd, output: `find: '${pathArg}': No such directory`};
      const results = [];
      collectMatches(node, segments, pattern.replace(/\*/g, ''), results);
      return {fs, cwd, output: results.join('\n') || ''};
    }

    case 'echo': {
      const redirIdx = args.findIndex((a) => a === '>' || a === '>>');
      if (redirIdx === -1) {
        return {fs, cwd, output: args.join(' ')};
      }
      const text = args.slice(0, redirIdx).join(' ');
      const append = args[redirIdx] === '>>';
      const fileArg = args[redirIdx + 1];
      if (!fileArg) return {fs, cwd, output: 'echo: missing filename after redirect'};
      const segments = resolvePath(cwd, fileArg);
      const {parentSegments, name} = getParentAndName(segments);
      const parent = getNode(fs, parentSegments);
      if (!parent || parent.type !== 'dir') return {fs, cwd, output: `echo: cannot write to '${fileArg}'`};
      const newFs = cloneAlong(fs, parentSegments);
      const existing = getNode(newFs, parentSegments).children[name];
      const prevContent = append && existing && existing.type === 'file' ? existing.content : '';
      getNode(newFs, parentSegments).children[name] = {
        type: 'file',
        content: prevContent + text + '\n',
      };
      return {fs: newFs, cwd, output: ''};
    }

    default:
      return {fs, cwd, output: `${cmd}: command not found. Type "help" for a list of commands.`};
  }
}

export {COMMAND_LIST};
