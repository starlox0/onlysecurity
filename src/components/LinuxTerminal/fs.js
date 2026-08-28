export function makeInitialFs() {
  return {
    type: 'dir',
    children: {
      home: {
        type: 'dir',
        children: {
          learner: {
            type: 'dir',
            children: {
              'welcome.txt': {
                type: 'file',
                content:
                  'Welcome to the OnlySecurity practice shell.\n\n' +
                  'This is a real command parser over a fake filesystem — nothing\n' +
                  'here touches an actual system, so there is nothing to break.\n\n' +
                  'Try: ls, cat welcome.txt, cd notes, pwd, whoami, help\n',
              },
              notes: {
                type: 'dir',
                children: {
                  'todo.txt': {
                    type: 'file',
                    content: '- practice grep\n- practice find\n- check /var/log for something\n',
                  },
                },
              },
            },
          },
        },
      },
      etc: {
        type: 'dir',
        children: {
          passwd: {
            type: 'file',
            content:
              'root:x:0:0:root:/root:/bin/bash\n' +
              'learner:x:1000:1000:learner:/home/learner:/bin/bash\n',
          },
          hostname: {type: 'file', content: 'onlysecurity\n'},
        },
      },
      var: {
        type: 'dir',
        children: {
          log: {
            type: 'dir',
            children: {
              'auth.log': {
                type: 'file',
                content:
                  'Jan 01 00:00:01 onlysecurity sshd[1021]: Accepted password for learner from 10.0.0.4\n' +
                  'Jan 01 00:00:02 onlysecurity sshd[1021]: pam_unix(sshd:session): session opened\n' +
                  'Jan 01 00:04:12 onlysecurity note: FLAG{ls_and_grep_are_your_friends}\n' +
                  'Jan 01 00:09:47 onlysecurity sshd[1021]: pam_unix(sshd:session): session closed\n',
              },
            },
          },
        },
      },
      tmp: {type: 'dir', children: {}},
      root: {type: 'dir', children: {}, restricted: true},
    },
  };
}

export function splitPath(path) {
  return path.split('/').filter(Boolean);
}

// Resolves a possibly-relative path against a cwd (array of segments) into
// a clean absolute array of segments, handling `.`, `..`, `~`, and `/`.
export function resolvePath(cwdSegments, input) {
  if (!input || input === '.') return [...cwdSegments];
  if (input === '~') return ['home', 'learner'];

  const startSegments = input.startsWith('/')
    ? []
    : input.startsWith('~/')
      ? ['home', 'learner']
      : [...cwdSegments];
  const rest = input.startsWith('~/') ? input.slice(2) : input;

  const parts = splitPath(rest);
  const result = [...startSegments];
  for (const part of parts) {
    if (part === '.') continue;
    if (part === '..') {
      if (result.length > 0) result.pop();
    } else {
      result.push(part);
    }
  }
  return result;
}

export function getNode(fs, segments) {
  let node = fs;
  for (const seg of segments) {
    if (node.type !== 'dir' || !node.children[seg]) return null;
    node = node.children[seg];
  }
  return node;
}

export function getParentAndName(segments) {
  return {
    parentSegments: segments.slice(0, -1),
    name: segments[segments.length - 1],
  };
}

export function pathString(segments) {
  return '/' + segments.join('/');
}
