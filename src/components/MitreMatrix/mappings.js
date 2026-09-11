// Hand-curated mapping from MITRE ATT&CK technique IDs to content that
// already exists elsewhere on this site — Attack Atlas's own technique
// write-ups (the richest source, so most links point there) and the two
// substantial Linux docs.
//
// This is intentionally NOT exhaustive. The Enterprise matrix has ~700
// techniques covering all of enterprise IT (process injection, firmware,
// cloud infrastructure, network devices...); this site's own content is
// focused on web/API application security. Mapping every technique to
// something here would mean inventing connections that don't really
// exist. Honest, curated coverage of the techniques that genuinely
// overlap is worth more than fake completeness — unmapped techniques
// still show their real MITRE description and a link to attack.mitre.org.
//
// internalTechniques: ids from AttackAtlas/techniques.js — clicking one
// opens the exact same rich write-up (CWE, code, Bounty Vault link) you'd
// get from the Top 10 wheel.
// docs: {title, url} pairs pointing at this site's own documentation.
export const MITRE_MAPPINGS = {
  T1190: {internalTechniques: ['sql-injection', 'xss', 'command-injection', 'ssrf', 'xxe']}, // Exploit Public-Facing Application
  T1210: {internalTechniques: ['vulnerable-components']}, // Exploitation of Remote Services
  T1195: {internalTechniques: ['supply-chain']}, // Supply Chain Compromise
  'T1195.001': {internalTechniques: ['supply-chain']}, // Compromise Software Dependencies and Development Tools
  T1552: {internalTechniques: ['cryptographic-failures', 'improper-credential-usage']}, // Unsecured Credentials
  'T1552.001': {internalTechniques: ['cryptographic-failures']}, // Credentials In Files
  T1078: {internalTechniques: ['credential-stuffing', 'brute-force']}, // Valid Accounts
  'T1078.004': {internalTechniques: ['ssrf']}, // Valid Accounts: Cloud Accounts — commonly reached via SSRF-to-metadata credential theft
  T1110: {internalTechniques: ['brute-force']}, // Brute Force
  'T1110.004': {internalTechniques: ['credential-stuffing']}, // Credential Stuffing
  T1556: {internalTechniques: ['mfa-bypass']}, // Modify Authentication Process
  T1539: {internalTechniques: ['session-attacks', 'xss']}, // Steal Web Session Cookie
  T1548: {internalTechniques: ['privilege-escalation']}, // Abuse Elevation Control Mechanism
  T1068: {internalTechniques: ['privilege-escalation']}, // Exploitation for Privilege Escalation
  T1499: {internalTechniques: ['rate-limiting-dos']}, // Endpoint Denial of Service
  T1498: {internalTechniques: ['rate-limiting-dos']}, // Network Denial of Service
  T1005: {internalTechniques: ['idor', 'mobile-insecure-data-storage']}, // Data from Local System
  T1213: {internalTechniques: ['idor']}, // Data from Information Repositories
  T1602: {internalTechniques: ['security-misconfiguration']}, // Data from Configuration Repository
  T1040: {internalTechniques: ['mobile-insecure-communication', 'cryptographic-failures']}, // Network Sniffing
  T1557: {internalTechniques: ['cors-misconfig', 'mobile-insecure-communication']}, // Adversary-in-the-Middle
  T1505: {internalTechniques: ['insecure-deserialization']}, // Server Software Component
  'T1505.003': {internalTechniques: ['command-injection']}, // Web Shell
  T1059: {internalTechniques: ['command-injection']}, // Command and Scripting Interpreter
  'T1059.004': {docs: [{title: 'History of Linux', url: '/docs/Fundamentals/All%20about%20Linux/History%20of%20Linux'}, {title: 'Intro to Shell and Terminal', url: '/docs/Fundamentals/All%20about%20Linux/Intro%20to%20Shell%20and%20Terminal'}]}, // Unix Shell
  'T1059.007': {internalTechniques: ['xss']}, // JavaScript
  T1600: {internalTechniques: ['cryptographic-failures']}, // Weaken Encryption
  'T1600.001': {internalTechniques: ['cryptographic-failures']}, // Reduce Key Space
  T1027: {internalTechniques: ['code-tampering', 'reverse-engineering']}, // Obfuscated Files or Information
};

export function getMappingForTechnique(id) {
  return MITRE_MAPPINGS[id] || null;
}

export function hasMapping(id) {
  return Boolean(MITRE_MAPPINGS[id]);
}
