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

function hexToBytes(hex) {
  const clean = (hex || '').replace(/[^0-9a-fA-F]/g, '');
  const bytes = new Uint8Array(Math.floor(clean.length / 2));
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(clean.substr(i * 2, 2), 16);
  return bytes;
}

// --- Base32 (RFC 4648) ---------------------------------------------------
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(bytes) {
  let bits = '';
  for (const b of bytes) bits += b.toString(2).padStart(8, '0');
  let out = '';
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5).padEnd(5, '0');
    out += BASE32_ALPHABET[parseInt(chunk, 2)];
  }
  while (out.length % 8 !== 0) out += '=';
  return out;
}

function base32Decode(str) {
  const clean = str.trim().toUpperCase().replace(/=+$/, '');
  let bits = '';
  for (const ch of clean) {
    const val = BASE32_ALPHABET.indexOf(ch);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return new Uint8Array(bytes);
}

// --- Base58 (Bitcoin alphabet) --------------------------------------------
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function base58Encode(bytes) {
  if (bytes.length === 0) return '';
  let num = 0n;
  for (const b of bytes) num = num * 256n + BigInt(b);
  let out = '';
  while (num > 0n) {
    const rem = num % 58n;
    out = BASE58_ALPHABET[Number(rem)] + out;
    num /= 58n;
  }
  // Preserve leading zero bytes as leading '1's, matching the standard scheme.
  for (const b of bytes) {
    if (b === 0) out = '1' + out;
    else break;
  }
  return out || '1';
}

function base58Decode(str) {
  let num = 0n;
  for (const ch of str) {
    const val = BASE58_ALPHABET.indexOf(ch);
    if (val === -1) throw new Error(`Invalid Base58 character: ${ch}`);
    num = num * 58n + BigInt(val);
  }
  let hex = num.toString(16);
  if (hex.length % 2) hex = '0' + hex;
  const bytes = hex === '00' ? [] : Array.from(hexToBytes(hex));
  let leadingOnes = 0;
  for (const ch of str) {
    if (ch === '1') leadingOnes++;
    else break;
  }
  return new Uint8Array([...Array(leadingOnes).fill(0), ...bytes]);
}

// --- Base85 (Ascii85) ------------------------------------------------------
function base85Encode(bytes) {
  let out = '';
  for (let i = 0; i < bytes.length; i += 4) {
    const chunk = bytes.slice(i, i + 4);
    const padLen = 4 - chunk.length;
    const padded = new Uint8Array(4);
    padded.set(chunk);
    let value = (padded[0] * 256 ** 3) + (padded[1] * 256 ** 2) + (padded[2] * 256) + padded[3];
    if (value === 0 && padLen === 0) {
      out += 'z';
      continue;
    }
    const chars = [];
    for (let j = 0; j < 5; j++) {
      chars.unshift(33 + (value % 85));
      value = Math.floor(value / 85);
    }
    out += String.fromCharCode(...chars).slice(0, 5 - padLen);
  }
  return out;
}

function base85Decode(str) {
  const clean = str.replace(/z/g, '!!!!!');
  const bytes = [];
  for (let i = 0; i < clean.length; i += 5) {
    const chunk = clean.slice(i, i + 5);
    const padLen = 5 - chunk.length;
    const padded = chunk.padEnd(5, 'u');
    let value = 0;
    for (const ch of padded) value = value * 85 + (ch.charCodeAt(0) - 33);
    const out4 = [(value >>> 24) & 255, (value >>> 16) & 255, (value >>> 8) & 255, value & 255];
    bytes.push(...out4.slice(0, 4 - padLen));
  }
  return new Uint8Array(bytes);
}

// --- CRC32 (standard zlib/PKZIP polynomial) ---------------------------------
let crc32Table = null;
function getCrc32Table() {
  if (crc32Table) return crc32Table;
  crc32Table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc32Table[n] = c >>> 0;
  }
  return crc32Table;
}
function crc32(bytes) {
  const table = getCrc32Table();
  let crc = 0xffffffff;
  for (const b of bytes) crc = table[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return ((crc ^ 0xffffffff) >>> 0).toString(16).padStart(8, '0');
}

// --- Vigenère --------------------------------------------------------------
function vigenere(input, key, direction) {
  const cleanKey = (key || 'A').replace(/[^a-zA-Z]/g, '') || 'A';
  let ki = 0;
  return input.replace(/[a-zA-Z]/g, (c) => {
    const base = c <= 'Z' ? 65 : 97;
    const keyChar = cleanKey[ki % cleanKey.length].toUpperCase();
    const shift = keyChar.charCodeAt(0) - 65;
    ki++;
    return String.fromCharCode(((c.charCodeAt(0) - base + direction * shift) % 26 + 26) % 26 + base);
  });
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
    id: 'to-base32',
    name: 'To Base32',
    category: 'Encoding',
    description: 'Encode text as Base32 (RFC 4648).',
    args: [],
    run: (input) => base32Encode(strToBytes(input)),
  },
  {
    id: 'from-base32',
    name: 'From Base32',
    category: 'Encoding',
    description: 'Decode a Base32 string back to text.',
    args: [],
    run: (input) => bytesToStr(base32Decode(input)),
  },
  {
    id: 'to-base58',
    name: 'To Base58',
    category: 'Encoding',
    description: 'Encode text as Base58 (Bitcoin alphabet — no 0/O/I/l).',
    args: [],
    run: (input) => base58Encode(strToBytes(input)),
  },
  {
    id: 'from-base58',
    name: 'From Base58',
    category: 'Encoding',
    description: 'Decode a Base58 string back to text.',
    args: [],
    run: (input) => bytesToStr(base58Decode(input.trim())),
  },
  {
    id: 'to-base85',
    name: 'To Base85 (Ascii85)',
    category: 'Encoding',
    description: 'Encode text as Ascii85.',
    args: [],
    run: (input) => base85Encode(strToBytes(input)),
  },
  {
    id: 'from-base85',
    name: 'From Base85 (Ascii85)',
    category: 'Encoding',
    description: 'Decode an Ascii85 string back to text.',
    args: [],
    run: (input) => bytesToStr(base85Decode(input.trim())),
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
    id: 'to-octal',
    name: 'To Octal',
    category: 'Encoding',
    description: 'Encode each byte as octal.',
    args: [],
    run: (input) => Array.from(strToBytes(input)).map((b) => b.toString(8).padStart(3, '0')).join(' '),
  },
  {
    id: 'from-octal',
    name: 'From Octal',
    category: 'Encoding',
    description: 'Decode space-separated octal bytes back to text.',
    args: [],
    run: (input) => {
      const groups = input.trim().split(/\s+/).filter(Boolean);
      return bytesToStr(new Uint8Array(groups.map((g) => parseInt(g, 8))));
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
      // Assigning as innerHTML then reading .value never executes markup —
      // this is a text-only round trip through the DOM's own entity
      // decoder, not an injection point.
      const el = document.createElement('textarea');
      el.innerHTML = input.replace(/&(?!#?\w+;)/g, '&amp;');
      return el.value;
    },
  },
  {
    id: 'escape-unicode',
    name: 'Escape Unicode',
    category: 'Encoding',
    description: 'Escape non-ASCII characters as \\uXXXX sequences.',
    args: [],
    run: (input) =>
      Array.from(input)
        .map((ch) => (ch.codePointAt(0) > 126 ? `\\u${ch.charCodeAt(0).toString(16).padStart(4, '0')}` : ch))
        .join(''),
  },
  {
    id: 'unescape-unicode',
    name: 'Unescape Unicode',
    category: 'Encoding',
    description: 'Convert \\uXXXX sequences back to characters.',
    args: [],
    run: (input) => input.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16))),
  },
  {
    id: 'quoted-printable-encode',
    name: 'Quoted-Printable Encode',
    category: 'Encoding',
    description: 'Encode using the Quoted-Printable scheme (common in email).',
    args: [],
    run: (input) =>
      Array.from(strToBytes(input))
        .map((b) => (b >= 33 && b <= 126 && b !== 61 ? String.fromCharCode(b) : `=${b.toString(16).toUpperCase().padStart(2, '0')}`))
        .join(''),
  },
  {
    id: 'quoted-printable-decode',
    name: 'Quoted-Printable Decode',
    category: 'Encoding',
    description: 'Decode a Quoted-Printable string.',
    args: [],
    run: (input) => {
      const bytes = [];
      for (let i = 0; i < input.length; i++) {
        if (input[i] === '=' && /[0-9a-fA-F]{2}/.test(input.slice(i + 1, i + 3))) {
          bytes.push(parseInt(input.slice(i + 1, i + 3), 16));
          i += 2;
        } else {
          bytes.push(input.charCodeAt(i));
        }
      }
      return bytesToStr(new Uint8Array(bytes));
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
    id: 'swap-endianness',
    name: 'Swap Endianness',
    category: 'Encoding',
    description: 'Reverse byte order within each word of hex input.',
    args: [{id: 'wordSize', label: 'Word size (bytes)', type: 'select', options: [{value: '2', label: '2'}, {value: '4', label: '4'}, {value: '8', label: '8'}], default: '4'}],
    run: (input, args) => {
      const clean = input.replace(/[^0-9a-fA-F]/g, '');
      const wordChars = Number(args.wordSize) * 2;
      let out = '';
      for (let i = 0; i < clean.length; i += wordChars) {
        const word = clean.slice(i, i + wordChars).padEnd(wordChars, '0');
        const pairs = word.match(/.{1,2}/g) || [];
        out += pairs.reverse().join('');
      }
      return out;
    },
  },

  // --- Ciphers ---
  {
    id: 'rot13',
    name: 'ROT13',
    category: 'Ciphers',
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
    category: 'Ciphers',
    description: 'Like ROT13 but shifts all printable ASCII, not just letters.',
    args: [],
    run: (input) =>
      input.replace(/[!-~]/g, (c) => String.fromCharCode(33 + ((c.charCodeAt(0) - 33 + 47) % 94))),
  },
  {
    id: 'atbash',
    name: 'Atbash Cipher',
    category: 'Ciphers',
    description: 'Classic substitution cipher: A↔Z, B↔Y, and so on. Self-reversing.',
    args: [],
    run: (input) =>
      input.replace(/[a-zA-Z]/g, (c) => {
        const base = c <= 'Z' ? 65 : 97;
        return String.fromCharCode(base + (25 - (c.charCodeAt(0) - base)));
      }),
  },
  {
    id: 'vigenere-encode',
    name: 'Vigenère Encode',
    category: 'Ciphers',
    description: 'Classic polyalphabetic cipher using a repeating keyword.',
    args: [{id: 'key', label: 'Key', type: 'text', default: 'KEY'}],
    run: (input, args) => vigenere(input, args.key, 1),
  },
  {
    id: 'vigenere-decode',
    name: 'Vigenère Decode',
    category: 'Ciphers',
    description: 'Reverse a Vigenère-encoded message with the same keyword.',
    args: [{id: 'key', label: 'Key', type: 'text', default: 'KEY'}],
    run: (input, args) => vigenere(input, args.key, -1),
  },
  {
    id: 'xor',
    name: 'XOR',
    category: 'Ciphers',
    description: 'XOR the input against a repeating key.',
    args: [
      {id: 'key', label: 'Key (hex)', type: 'text', default: '0a'},
      {id: 'outputHex', label: 'Output as hex', type: 'checkbox', default: true},
    ],
    run: (input, args) => {
      const keyBytes = hexToBytes(args.key || '00');
      const inBytes = strToBytes(input);
      const out = new Uint8Array(inBytes.length);
      for (let i = 0; i < inBytes.length; i++) out[i] = inBytes[i] ^ keyBytes[i % keyBytes.length];
      return args.outputHex ? bytesToHex(out) : bytesToStr(out);
    },
  },
  {
    id: 'xor-brute-force',
    name: 'XOR Brute Force',
    category: 'Ciphers',
    description: 'Try every single-byte XOR key (0–255) and show the ones that look like readable text.',
    args: [],
    run: (input) => {
      const clean = input.replace(/[^0-9a-fA-F]/g, '');
      const inBytes = hexToBytes(clean.length >= 2 ? clean : bytesToHex(strToBytes(input)));
      const lines = [];
      for (let key = 0; key < 256; key++) {
        const out = new Uint8Array(inBytes.length);
        for (let i = 0; i < inBytes.length; i++) out[i] = inBytes[i] ^ key;
        const text = bytesToStr(out);
        const printable = Array.from(text).filter((c) => c.codePointAt(0) >= 32 && c.codePointAt(0) < 127).length;
        if (text.length > 0 && printable / text.length > 0.9) {
          lines.push(`0x${key.toString(16).padStart(2, '0')}: ${text}`);
        }
      }
      return lines.length > 0 ? lines.join('\n') : 'No single-byte key produced mostly-printable output.';
    },
  },
  {
    id: 'aes-encrypt',
    name: 'AES Encrypt (CBC)',
    category: 'Ciphers',
    description: 'Encrypt with AES-CBC via the browser\'s Web Crypto API. Key and IV are hex.',
    args: [
      {id: 'key', label: 'Key (hex, 32/48/64 chars)', type: 'text', default: ''},
      {id: 'iv', label: 'IV (hex, 32 chars)', type: 'text', default: ''},
    ],
    run: async (input, args) => {
      const keyBytes = hexToBytes(args.key);
      const ivBytes = hexToBytes(args.iv);
      if (ivBytes.length !== 16) throw new Error('IV must be exactly 16 bytes (32 hex chars).');
      const key = await crypto.subtle.importKey('raw', keyBytes, {name: 'AES-CBC'}, false, ['encrypt']);
      const cipherBuf = await crypto.subtle.encrypt({name: 'AES-CBC', iv: ivBytes}, key, strToBytes(input));
      return bytesToHex(new Uint8Array(cipherBuf));
    },
  },
  {
    id: 'aes-decrypt',
    name: 'AES Decrypt (CBC)',
    category: 'Ciphers',
    description: 'Decrypt AES-CBC ciphertext (hex) via the browser\'s Web Crypto API.',
    args: [
      {id: 'key', label: 'Key (hex, 32/48/64 chars)', type: 'text', default: ''},
      {id: 'iv', label: 'IV (hex, 32 chars)', type: 'text', default: ''},
    ],
    run: async (input, args) => {
      const keyBytes = hexToBytes(args.key);
      const ivBytes = hexToBytes(args.iv);
      const cipherBytes = hexToBytes(input.replace(/[^0-9a-fA-F]/g, ''));
      const key = await crypto.subtle.importKey('raw', keyBytes, {name: 'AES-CBC'}, false, ['decrypt']);
      const plainBuf = await crypto.subtle.decrypt({name: 'AES-CBC', iv: ivBytes}, key, cipherBytes);
      return bytesToStr(new Uint8Array(plainBuf));
    },
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
    id: 'crc32',
    name: 'CRC32',
    category: 'Hashing',
    description: 'Compute a CRC-32 checksum (the standard zlib/PKZIP polynomial).',
    args: [],
    run: (input) => crc32(strToBytes(input)),
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
    id: 'sha384',
    name: 'SHA384',
    category: 'Hashing',
    description: 'Compute a SHA-384 digest via the browser\'s Web Crypto API.',
    args: [],
    run: (input) => webCryptoHash('SHA-384', input),
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
    id: 'hmac',
    name: 'HMAC',
    category: 'Hashing',
    description: 'Compute an HMAC of the input with a given key.',
    args: [
      {id: 'key', label: 'Key', type: 'text', default: ''},
      {id: 'hash', label: 'Hash', type: 'select', options: [{value: 'SHA-1', label: 'SHA-1'}, {value: 'SHA-256', label: 'SHA-256'}, {value: 'SHA-384', label: 'SHA-384'}, {value: 'SHA-512', label: 'SHA-512'}], default: 'SHA-256'},
    ],
    run: async (input, args) => {
      const key = await crypto.subtle.importKey('raw', strToBytes(args.key), {name: 'HMAC', hash: args.hash}, false, ['sign']);
      const sigBuf = await crypto.subtle.sign('HMAC', key, strToBytes(input));
      return bytesToHex(new Uint8Array(sigBuf));
    },
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

  // --- Data Format ---
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
    id: 'csv-to-json',
    name: 'CSV to JSON',
    category: 'Data Format',
    description: 'Convert simple CSV (first row = headers) to a JSON array of objects.',
    args: [],
    run: (input) => {
      const rows = input.trim().split('\n').map((line) => line.split(',').map((c) => c.trim()));
      const [headers, ...body] = rows;
      const objs = body.map((row) => Object.fromEntries(headers.map((h, i) => [h, row[i] ?? ''])));
      return JSON.stringify(objs, null, 2);
    },
  },
  {
    id: 'json-to-csv',
    name: 'JSON to CSV',
    category: 'Data Format',
    description: 'Convert a JSON array of flat objects to CSV.',
    args: [],
    run: (input) => {
      const arr = JSON.parse(input);
      if (!Array.isArray(arr) || arr.length === 0) return '';
      const headers = Object.keys(arr[0]);
      const rows = arr.map((obj) => headers.map((h) => String(obj[h] ?? '')).join(','));
      return [headers.join(','), ...rows].join('\n');
    },
  },
  {
    id: 'find-replace',
    name: 'Find / Replace',
    category: 'Data Format',
    description: 'Replace text using a plain string or a regular expression.',
    args: [
      {id: 'find', label: 'Find', type: 'text', default: ''},
      {id: 'replace', label: 'Replace with', type: 'text', default: ''},
      {id: 'regex', label: 'Treat "Find" as regex', type: 'checkbox', default: false},
      {id: 'global', label: 'Replace all occurrences', type: 'checkbox', default: true},
    ],
    run: (input, args) => {
      if (!args.find) return input;
      if (args.regex) {
        return input.replace(new RegExp(args.find, args.global ? 'g' : ''), args.replace);
      }
      return args.global ? input.split(args.find).join(args.replace) : input.replace(args.find, args.replace);
    },
  },
  {
    id: 'filter-lines',
    name: 'Filter Lines',
    category: 'Data Format',
    description: 'Keep or remove lines matching a regular expression.',
    args: [
      {id: 'pattern', label: 'Pattern (regex)', type: 'text', default: ''},
      {id: 'invert', label: 'Remove matching lines instead', type: 'checkbox', default: false},
    ],
    run: (input, args) => {
      if (!args.pattern) return input;
      const re = new RegExp(args.pattern);
      return input.split('\n').filter((line) => re.test(line) !== args.invert).join('\n');
    },
  },
  {
    id: 'sort-lines',
    name: 'Sort Lines',
    category: 'Data Format',
    description: 'Sort lines alphabetically.',
    args: [{id: 'descending', label: 'Descending', type: 'checkbox', default: false}],
    run: (input, args) => {
      const lines = input.split('\n').sort();
      if (args.descending) lines.reverse();
      return lines.join('\n');
    },
  },
  {
    id: 'unique-lines',
    name: 'Unique Lines',
    category: 'Data Format',
    description: 'Remove duplicate lines, keeping the first occurrence.',
    args: [],
    run: (input) => [...new Set(input.split('\n'))].join('\n'),
  },
  {
    id: 'count',
    name: 'Count',
    category: 'Data Format',
    description: 'Count lines, words, or characters in the input.',
    args: [{id: 'unit', label: 'Count', type: 'select', options: [{value: 'lines', label: 'Lines'}, {value: 'words', label: 'Words'}, {value: 'chars', label: 'Characters'}], default: 'lines'}],
    run: (input, args) => {
      if (args.unit === 'lines') return String(input === '' ? 0 : input.split('\n').length);
      if (args.unit === 'words') return String((input.match(/\S+/g) || []).length);
      return String(Array.from(input).length);
    },
  },
  {
    id: 'remove-whitespace',
    name: 'Remove Whitespace',
    category: 'Data Format',
    description: 'Strip spaces, tabs, and/or line breaks.',
    args: [
      {id: 'spaces', label: 'Spaces', type: 'checkbox', default: true},
      {id: 'tabs', label: 'Tabs', type: 'checkbox', default: true},
      {id: 'newlines', label: 'Line breaks', type: 'checkbox', default: false},
    ],
    run: (input, args) => {
      let out = input;
      if (args.spaces) out = out.replace(/ /g, '');
      if (args.tabs) out = out.replace(/\t/g, '');
      if (args.newlines) out = out.replace(/\r?\n/g, '');
      return out;
    },
  },
  {
    id: 'tabs-to-spaces',
    name: 'Tabs to Spaces',
    category: 'Data Format',
    description: 'Replace tab characters with spaces.',
    args: [{id: 'width', label: 'Spaces per tab', type: 'number', default: 4, min: 1, max: 16}],
    run: (input, args) => input.replace(/\t/g, ' '.repeat(Number(args.width) || 4)),
  },
  {
    id: 'text-diff',
    name: 'Text Diff (by line)',
    category: 'Data Format',
    description: 'Compare the input against another block of text, line by line.',
    args: [{id: 'compareTo', label: 'Compare against', type: 'textarea', default: ''}],
    run: (input, args) => {
      const a = input.split('\n');
      const b = (args.compareTo || '').split('\n');
      const max = Math.max(a.length, b.length);
      const lines = [];
      for (let i = 0; i < max; i++) {
        if (a[i] === b[i]) lines.push(`  ${a[i] ?? ''}`);
        else {
          if (a[i] !== undefined) lines.push(`- ${a[i]}`);
          if (b[i] !== undefined) lines.push(`+ ${b[i]}`);
        }
      }
      return lines.join('\n');
    },
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

  // --- Networking ---
  {
    id: 'defang',
    name: 'Defang IP/URL',
    category: 'Networking',
    description: 'Make links and IPs unclickable/unresolvable for safe sharing (http → hxxp, . → [.]).',
    args: [],
    run: (input) => input.replace(/https?/gi, (m) => m.replace(/t/gi, 'x')).replace(/\./g, '[.]'),
  },
  {
    id: 'refang',
    name: 'Refang IP/URL',
    category: 'Networking',
    description: 'Reverse a defanged IP or URL back to its normal, live form.',
    args: [],
    run: (input) => input.replace(/hxxps?/gi, (m) => m.replace(/x/gi, 't')).replace(/\[\.\]/g, '.'),
  },
  {
    id: 'extract-ips',
    name: 'Extract IP Addresses',
    category: 'Networking',
    description: 'Pull all IPv4 addresses out of the input.',
    args: [],
    run: (input) => (input.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g) || []).join('\n') || 'No IPv4 addresses found.',
  },
  {
    id: 'extract-urls',
    name: 'Extract URLs',
    category: 'Networking',
    description: 'Pull all http(s) URLs out of the input.',
    args: [],
    run: (input) => (input.match(/https?:\/\/[^\s"'<>]+/g) || []).join('\n') || 'No URLs found.',
  },
  {
    id: 'extract-emails',
    name: 'Extract Emails',
    category: 'Networking',
    description: 'Pull all email addresses out of the input.',
    args: [],
    run: (input) => (input.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || []).join('\n') || 'No email addresses found.',
  },
  {
    id: 'extract-cves',
    name: 'Extract CVE IDs',
    category: 'Networking',
    description: 'Pull all CVE identifiers out of the input.',
    args: [],
    run: (input) => [...new Set((input.match(/CVE-\d{4}-\d{4,}/gi) || []).map((s) => s.toUpperCase()))].join('\n') || 'No CVE IDs found.',
  },
  {
    id: 'ip-to-decimal',
    name: 'IPv4 to Decimal',
    category: 'Networking',
    description: 'Convert a dotted IPv4 address to its 32-bit decimal form.',
    args: [],
    run: (input) => {
      const parts = input.trim().split('.').map(Number);
      if (parts.length !== 4 || parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)) {
        throw new Error('Not a valid IPv4 address.');
      }
      return String(((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0);
    },
  },
  {
    id: 'decimal-to-ip',
    name: 'Decimal to IPv4',
    category: 'Networking',
    description: 'Convert a 32-bit decimal number to a dotted IPv4 address.',
    args: [],
    run: (input) => {
      const n = Number(input.trim());
      if (!Number.isFinite(n) || n < 0 || n > 4294967295) throw new Error('Not a valid 32-bit number.');
      return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
    },
  },

  // --- Compression ---
  {
    id: 'gzip',
    name: 'Gzip',
    category: 'Compression',
    description: 'Compress the input with gzip, output as Base64.',
    args: [],
    run: async (input) => {
      const stream = new Blob([strToBytes(input)]).stream().pipeThrough(new CompressionStream('gzip'));
      const buf = await new Response(stream).arrayBuffer();
      return btoa(String.fromCharCode(...new Uint8Array(buf)));
    },
  },
  {
    id: 'gunzip',
    name: 'Gunzip',
    category: 'Compression',
    description: 'Decompress Base64-encoded gzip data.',
    args: [],
    run: async (input) => {
      const compressed = Uint8Array.from(atob(input.trim()), (c) => c.charCodeAt(0));
      const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream('gzip'));
      const buf = await new Response(stream).arrayBuffer();
      return bytesToStr(new Uint8Array(buf));
    },
  },

  // --- Utilities ---
  {
    id: 'generate-uuid',
    name: 'Generate UUID v4',
    category: 'Utilities',
    description: 'Generate one or more random UUIDs. Ignores the input.',
    args: [{id: 'count', label: 'How many', type: 'number', default: 1, min: 1, max: 50}],
    run: (input, args) =>
      Array.from({length: Number(args.count) || 1}, () => crypto.randomUUID()).join('\n'),
  },
  {
    id: 'random-hex',
    name: 'Random Hex Bytes',
    category: 'Utilities',
    description: 'Generate cryptographically random bytes as hex. Ignores the input.',
    args: [{id: 'length', label: 'Byte length', type: 'number', default: 16, min: 1, max: 1024}],
    run: (input, args) => bytesToHex(crypto.getRandomValues(new Uint8Array(Number(args.length) || 16))),
  },
  {
    id: 'entropy',
    name: 'Shannon Entropy',
    category: 'Utilities',
    description: 'Measure randomness (0–8 bits/byte). High entropy suggests encryption or compression.',
    args: [],
    run: (input) => {
      const bytes = strToBytes(input);
      if (bytes.length === 0) return '0.00 bits/byte';
      const freq = new Map();
      for (const b of bytes) freq.set(b, (freq.get(b) || 0) + 1);
      let entropyBits = 0;
      for (const count of freq.values()) {
        const p = count / bytes.length;
        entropyBits -= p * Math.log2(p);
      }
      let note = 'low — likely plain text or structured data';
      if (entropyBits > 7.5) note = 'very high — likely encrypted, compressed, or random data';
      else if (entropyBits > 6) note = 'moderately high — could be compressed or encoded';
      return `${entropyBits.toFixed(2)} bits/byte (${note})`;
    },
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
