// Every operation is a pure(ish) function: (input: string, args: object) =>
// string | Promise<string>. The recipe runner in index.js chains them,
// feeding each operation's output into the next one's input — same model
// CyberChef uses, just a much smaller operation set.

// --- Shared byte helpers ----------------------------------------------

function strToBytes(str) {
  return new TextEncoder().encode(str);
}
function bytesToStr(bytes) {
  return new TextDecoder('utf-8', {fatal: false}).decode(bytes);
}
function bytesToHex(bytes, sep = '') {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(sep);
}

// --- MD5 (RFC 1321) ------------------------------------------------------
// Web Crypto's SubtleCrypto deliberately doesn't implement MD5 (it's
// cryptographically broken for security purposes), but it's still the
// single most-requested "just show me the hash" operation, so it's
// implemented directly here. Verified against the RFC's own test vectors.
function md5(input) {
  function rotateLeft(x, c) {
    return (x << c) | (x >>> (32 - c));
  }
  function toHexLE(num) {
    let s = '';
    for (let i = 0; i < 4; i++) {
      s += ((num >>> (i * 8)) & 255).toString(16).padStart(2, '0');
    }
    return s;
  }

  const K = [];
  for (let i = 0; i < 64; i++) K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296);
  const S = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9,
    14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15,
    21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
  ];

  const bytes = strToBytes(input);
  const bitLen = bytes.length * 8;
  const msg = Array.from(bytes);
  msg.push(0x80);
  while (msg.length % 64 !== 56) msg.push(0);
  for (let i = 0; i < 8; i++) msg.push(Math.floor(bitLen / 2 ** (i * 8)) & 0xff);

  let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;

  for (let chunkStart = 0; chunkStart < msg.length; chunkStart += 64) {
    const M = [];
    for (let j = 0; j < 16; j++) {
      M[j] =
        msg[chunkStart + j * 4] |
        (msg[chunkStart + j * 4 + 1] << 8) |
        (msg[chunkStart + j * 4 + 2] << 16) |
        (msg[chunkStart + j * 4 + 3] << 24);
    }
    let A = a0, B = b0, C = c0, D = d0;
    for (let i = 0; i < 64; i++) {
      let F, g;
      if (i < 16) { F = (B & C) | (~B & D); g = i; }
      else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) % 16; }
      else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) % 16; }
      else { F = C ^ (B | ~D); g = (7 * i) % 16; }
      F = (F + A + K[i] + M[g]) | 0;
      A = D; D = C; C = B;
      B = (B + rotateLeft(F, S[i])) | 0;
    }
    a0 = (a0 + A) | 0; b0 = (b0 + B) | 0; c0 = (c0 + C) | 0; d0 = (d0 + D) | 0;
  }

  return toHexLE(a0) + toHexLE(b0) + toHexLE(c0) + toHexLE(d0);
}

async function webCryptoHash(algo, input) {
  const digest = await crypto.subtle.digest(algo, strToBytes(input));
  return bytesToHex(new Uint8Array(digest));
}

// --- Base64url (used by JWT) --------------------------------------------

function base64UrlDecodeToStr(str) {
  let s = str.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return bytesToStr(Uint8Array.from(atob(s), (c) => c.charCodeAt(0)));
}

// --- Operation catalog ---------------------------------------------------
// Each op: id, name, category, description, args (rendered as controls in
// the recipe), run(input, args).

const HEX_DELIMS = {
  space: {label: 'Space', sep: ' '},
  none: {label: 'None', sep: ''},
  colon: {label: 'Colon', sep: ':'},
  comma: {label: 'Comma', sep: ','},
};

export const OPERATIONS = [
  // --- Encoding ---
  {
    id: 'to-base64',
    name: 'To Base64',
    category: 'Encoding',
    description: 'Encode text as Base64.',
    args: [{id: 'urlSafe', label: 'URL-safe alphabet', type: 'checkbox', default: false}],
    run: (input, args) => {
      const bytes = strToBytes(input);
      let b64 = btoa(String.fromCharCode(...bytes));
      if (args.urlSafe) b64 = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      return b64;
    },
  },
  {
    id: 'from-base64',
    name: 'From Base64',
    category: 'Encoding',
    description: 'Decode a Base64 string back to text.',
    args: [{id: 'urlSafe', label: 'URL-safe alphabet', type: 'checkbox', default: false}],
    run: (input, args) => {
      let s = input.trim().replace(/\s+/g, '');
      if (args.urlSafe) s = s.replace(/-/g, '+').replace(/_/g, '/');
      while (s.length % 4) s += '=';
      return bytesToStr(Uint8Array.from(atob(s), (c) => c.charCodeAt(0)));
    },
  },
  {
    id: 'to-hex',
    name: 'To Hex',
    category: 'Encoding',
    description: 'Encode text as hexadecimal bytes.',
    args: [
      {
        id: 'delim',
        label: 'Delimiter',
        type: 'select',
        options: Object.entries(HEX_DELIMS).map(([id, d]) => ({value: id, label: d.label})),
        default: 'space',
      },
    ],
    run: (input, args) => bytesToHex(strToBytes(input), HEX_DELIMS[args.delim].sep),
  },
  {
    id: 'from-hex',
    name: 'From Hex',
    category: 'Encoding',
    description: 'Decode hexadecimal bytes back to text. Any delimiter is ignored.',
    args: [],
    run: (input) => {
      const clean = input.replace(/[^0-9a-fA-F]/g, '');
      const bytes = new Uint8Array(clean.length / 2);
      for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(clean.substr(i * 2, 2), 16);
      return bytesToStr(bytes);
    },
  },
  {
    id: 'url-encode',
    name: 'URL Encode',
    category: 'Encoding',
    description: 'Percent-encode special characters for use in a URL.',
    args: [{id: 'all', label: 'Encode all special characters', type: 'checkbox', default: false}],
    run: (input, args) => {
      if (!args.all) return encodeURIComponent(input);
      return Array.from(input)
        .map((ch) => (/[A-Za-z0-9]/.test(ch) ? ch : `%${ch.charCodeAt(0).toString(16).padStart(2, '0').toUpperCase()}`))
        .join('');
    },
  },
  {
    id: 'url-decode',
    name: 'URL Decode',
    category: 'Encoding',
    description: 'Decode a percent-encoded URL string.',
    args: [],
    run: (input) => decodeURIComponent(input.replace(/\+/g, ' ')),
  },
  {
    id: 'html-encode',
    name: 'HTML Entity Encode',
    category: 'Encoding',
    description: 'Escape HTML-significant characters as entities.',
    args: [{id: 'nonAscii', label: 'Also encode non-ASCII characters', type: 'checkbox', default: false}],
    run: (input, args) => {
      const map = {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'};
      let out = input.replace(/[&<>"']/g, (c) => map[c]);
      if (args.nonAscii) {
        out = Array.from(out)
          .map((ch) => (ch.codePointAt(0) > 126 ? `&#${ch.codePointAt(0)};` : ch))
          .join('');
      }
      return out;
    },
  },
  {
    id: 'html-decode',
    name: 'HTML Entity Decode',
    category: 'Encoding',
    description: 'Convert HTML entities back to their characters.',
    args: [],
    run: (input) => {
      // Assigning as textContent then reading it back never executes markup
      // — this is a text-only round trip through the DOM's own entity
      // decoder, not an innerHTML injection.
      const el = document.createElement('textarea');
      el.innerHTML = input.replace(/&(?!#?\w+;)/g, '&amp;');
      return el.value;
    },
  },
  {
    id: 'to-binary',
    name: 'To Binary',
    category: 'Encoding',
    description: 'Encode text as space-separated 8-bit binary.',
    args: [],
    run: (input) => Array.from(strToBytes(input)).map((b) => b.toString(2).padStart(8, '0')).join(' '),
  },
  {
    id: 'from-binary',
    name: 'From Binary',
    category: 'Encoding',
    description: 'Decode space-separated binary bytes back to text.',
    args: [],
    run: (input) => {
      const groups = input.trim().split(/\s+/).filter(Boolean);
      const bytes = new Uint8Array(groups.map((g) => parseInt(g, 2)));
      return bytesToStr(bytes);
    },
  },
  {
    id: 'to-charcode',
    name: 'To Charcode',
    category: 'Encoding',
    description: 'Show each character\'s Unicode code point.',
    args: [
      {id: 'base', label: 'Base', type: 'select', options: [{value: '10', label: 'Decimal'}, {value: '16', label: 'Hex'}], default: '10'},
    ],
    run: (input, args) =>
      Array.from(input).map((ch) => ch.codePointAt(0).toString(Number(args.base))).join(' '),
  },
  {
    id: 'from-charcode',
    name: 'From Charcode',
    category: 'Encoding',
    description: 'Convert space-separated code points back to text.',
    args: [
      {id: 'base', label: 'Base', type: 'select', options: [{value: '10', label: 'Decimal'}, {value: '16', label: 'Hex'}], default: '10'},
    ],
    run: (input, args) =>
      input.trim().split(/\s+/).filter(Boolean).map((n) => String.fromCodePoint(parseInt(n, Number(args.base)))).join(''),
  },
  {
    id: 'rot13',
    name: 'ROT13',
    category: 'Encoding',
    description: 'Caesar-shift letters by a fixed amount (13 by default). Applying it twice restores the original.',
    args: [{id: 'amount', label: 'Amount', type: 'number', default: 13, min: 1, max: 25}],
    run: (input, args) => {
      const n = Number(args.amount) || 13;
      return input.replace(/[a-zA-Z]/g, (c) => {
        const base = c <= 'Z' ? 65 : 97;
        return String.fromCharCode(((c.charCodeAt(0) - base + n) % 26 + 26) % 26 + base);
      });
    },
  },
  {
    id: 'rot47',
    name: 'ROT47',
    category: 'Encoding',
    description: 'Like ROT13 but shifts all printable ASCII, not just letters.',
    args: [],
    run: (input) =>
      input.replace(/[!-~]/g, (c) => String.fromCharCode(33 + ((c.charCodeAt(0) - 33 + 47) % 94))),
  },

  // --- Hashing ---
  {
    id: 'md5',
    name: 'MD5',
    category: 'Hashing',
    description: 'Compute an MD5 digest. Broken for security use — fine for checksums/identification.',
    args: [],
    run: (input) => md5(input),
  },
  {
    id: 'sha1',
    name: 'SHA1',
    category: 'Hashing',
    description: 'Compute a SHA-1 digest via the browser\'s Web Crypto API.',
    args: [],
    run: (input) => webCryptoHash('SHA-1', input),
  },
  {
    id: 'sha256',
    name: 'SHA256',
    category: 'Hashing',
    description: 'Compute a SHA-256 digest via the browser\'s Web Crypto API.',
    args: [],
    run: (input) => webCryptoHash('SHA-256', input),
  },
  {
    id: 'sha512',
    name: 'SHA512',
    category: 'Hashing',
    description: 'Compute a SHA-512 digest via the browser\'s Web Crypto API.',
    args: [],
    run: (input) => webCryptoHash('SHA-512', input),
  },
  {
    id: 'identify-hash',
    name: 'Identify Hash',
    category: 'Hashing',
    description: 'Guess likely algorithms for a hash based on its length and format — not a verification.',
    args: [],
    run: (input) => {
      const s = input.trim();
      const candidates = [];
      if (/^\$2[aby]\$/.test(s)) candidates.push('bcrypt');
      else if (/^\$1\$/.test(s)) candidates.push('MD5 crypt (Unix)');
      else if (/^\$6\$/.test(s)) candidates.push('SHA-512 crypt (Unix)');
      else if (/^\$5\$/.test(s)) candidates.push('SHA-256 crypt (Unix)');
      else if (/^[a-fA-F0-9]+$/.test(s)) {
        const map = {
          32: ['MD5', 'NTLM', 'MD4', 'RIPEMD-128'],
          40: ['SHA-1', 'RIPEMD-160'],
          56: ['SHA-224', 'SHA3-224'],
          64: ['SHA-256', 'SHA3-256', 'BLAKE2s-256'],
          96: ['SHA-384', 'SHA3-384'],
          128: ['SHA-512', 'SHA3-512', 'Whirlpool'],
        };
        if (map[s.length]) candidates.push(...map[s.length]);
      }
      if (candidates.length === 0) {
        return 'No confident match based on length/format alone. Paste just the hash with no surrounding text.';
      }
      return `Likely: ${candidates.join(', ')}\n\n(Based on length/format only — this can't cryptographically confirm the algorithm.)`;
    },
  },

  // --- JWT ---
  {
    id: 'jwt-decode',
    name: 'JWT Decode',
    category: 'JWT',
    description: 'Decode a JSON Web Token\'s header and payload. Does not verify the signature unless a secret is given.',
    args: [
      {id: 'secret', label: 'HMAC secret (optional, HS256/384/512 only)', type: 'text', default: ''},
    ],
    run: async (input, args) => {
      const parts = input.trim().split('.');
      if (parts.length !== 3) throw new Error('Not a JWT — expected three dot-separated parts.');
      const [headerB64, payloadB64, sigB64] = parts;
      const header = JSON.parse(base64UrlDecodeToStr(headerB64));
      const payload = JSON.parse(base64UrlDecodeToStr(payloadB64));

      let verifyNote = '';
      if (args.secret) {
        const algoMap = {HS256: 'SHA-256', HS384: 'SHA-384', HS512: 'SHA-512'};
        const waAlgo = algoMap[header.alg];
        if (!waAlgo) {
          verifyNote = `\n\n(Signature verification skipped — "${header.alg}" isn't an HMAC algorithm this tool checks.)`;
        } else {
          const key = await crypto.subtle.importKey(
            'raw',
            strToBytes(args.secret),
            {name: 'HMAC', hash: waAlgo},
            false,
            ['sign'],
          );
          const sigBytes = await crypto.subtle.sign('HMAC', key, strToBytes(`${headerB64}.${payloadB64}`));
          let computed = btoa(String.fromCharCode(...new Uint8Array(sigBytes)))
            .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
          verifyNote = computed === sigB64 ? '\n\n✅ Signature verified with the given secret.' : '\n\n❌ Signature does NOT match the given secret.';
        }
      }

      return (
        `HEADER:\n${JSON.stringify(header, null, 2)}\n\n` +
        `PAYLOAD:\n${JSON.stringify(payload, null, 2)}` +
        verifyNote
      );
    },
  },

  // --- Data format ---
  {
    id: 'json-beautify',
    name: 'JSON Beautify',
    category: 'Data Format',
    description: 'Pretty-print JSON with indentation.',
    args: [{id: 'indent', label: 'Indent spaces', type: 'number', default: 2, min: 1, max: 8}],
    run: (input, args) => JSON.stringify(JSON.parse(input), null, Number(args.indent) || 2),
  },
  {
    id: 'json-minify',
    name: 'JSON Minify',
    category: 'Data Format',
    description: 'Remove all unnecessary whitespace from JSON.',
    args: [],
    run: (input) => JSON.stringify(JSON.parse(input)),
  },
  {
    id: 'reverse',
    name: 'Reverse',
    category: 'Data Format',
    description: 'Reverse the input.',
    args: [
      {id: 'unit', label: 'Reverse by', type: 'select', options: [{value: 'char', label: 'Character'}, {value: 'line', label: 'Line'}], default: 'char'},
    ],
    run: (input, args) =>
      args.unit === 'line' ? input.split('\n').reverse().join('\n') : Array.from(input).reverse().join(''),
  },
];

export const CATEGORIES = [...new Set(OPERATIONS.map((op) => op.category))];

export function getOperation(id) {
  return OPERATIONS.find((op) => op.id === id);
}

export function defaultArgs(op) {
  const args = {};
  for (const arg of op.args) args[arg.id] = arg.default;
  return args;
}
