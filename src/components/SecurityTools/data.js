// Curated from three community-maintained lists — fabionoth/awesome-cyber-security,
// sbilly/awesome-security, and cyberguideme/Tools — cross-checked against
// each other and supplemented with additional well-known tools researched
// directly, then organized by security domain rather than kept as one
// long alphabetical list.
//
// Images: rather than hosting logos manually, each tool's `githubOrg`
// resolves to that project's real GitHub avatar via GitHub's own public
// endpoint (github.com/{org}.png) — the same mechanism GitHub itself uses
// everywhere. Verified live against each org/user below before shipping.
// Tools without a suitable GitHub org (mostly commercial software) simply
// omit `githubOrg` and fall back to a category icon instead of a broken image.

export const TOOL_CATEGORIES = [
  {
    id: 'network-pentest',
    label: 'Network & Infrastructure Pentesting',
    icon: '🌐',
    aliases: ['network', 'pentest', 'penetration testing', 'infrastructure', 'port scan', 'scanning', 'recon'],
  },
  {
    id: 'web-security',
    label: 'Web Application Security',
    icon: '🕸️',
    aliases: ['web', 'webapp', 'web application', 'appsec', 'injection', 'xss', 'sql injection', 'fuzzing'],
  },
  {
    id: 'active-directory',
    label: 'Active Directory & Windows',
    icon: '🏢',
    aliases: ['ad', 'active directory', 'windows', 'domain', 'kerberos', 'ntlm', 'lateral movement', 'privilege escalation'],
  },
  {
    id: 'cloud-security',
    label: 'Cloud Security',
    icon: '☁️',
    aliases: ['cloud', 'aws', 'azure', 'gcp', 'iam', 's3', 'cloud pentest'],
  },
  {
    id: 'mobile-security',
    label: 'Mobile Security',
    icon: '📱',
    aliases: ['mobile', 'android', 'ios', 'apk', 'app security', 'mobile pentest'],
  },
  {
    id: 'osint',
    label: 'OSINT & Reconnaissance',
    icon: '🔍',
    aliases: ['osint', 'reconnaissance', 'intelligence', 'footprinting', 'subdomain enumeration'],
  },
  {
    id: 'password-cracking',
    label: 'Password Attacks & Cracking',
    icon: '🔑',
    aliases: ['password', 'cracking', 'brute force', 'hash cracking', 'credential attacks', 'wordlist'],
  },
  {
    id: 'wireless',
    label: 'Wireless Security',
    icon: '📡',
    aliases: ['wireless', 'wifi', 'wpa', '802.11', 'wireless pentest'],
  },
  {
    id: 'forensics',
    label: 'Forensics & Incident Response',
    icon: '🧬',
    aliases: ['forensics', 'dfir', 'incident response', 'memory analysis', 'disk forensics', 'ir'],
  },
  {
    id: 'reverse-engineering',
    label: 'Reverse Engineering & Malware Analysis',
    icon: '🧩',
    aliases: ['reverse engineering', 're', 'malware analysis', 'disassembler', 'debugger', 'binary analysis'],
  },
  {
    id: 'exploitation-c2',
    label: 'Exploitation Frameworks & C2',
    icon: '💥',
    aliases: ['exploitation', 'c2', 'command and control', 'post exploitation', 'red team', 'red teaming'],
  },
  {
    id: 'container-security',
    label: 'Container & Kubernetes Security',
    icon: '📦',
    aliases: ['container', 'kubernetes', 'k8s', 'docker'],
  },
  {
    id: 'vuln-scanning',
    label: 'Vulnerability Scanning & Detection',
    icon: '🛰️',
    aliases: ['vulnerability scanning', 'vuln scan', 'siem', 'ids', 'ips', 'monitoring', 'threat detection'],
  },
];

export const TOOLS = [
  // --- Network & Infrastructure Pentesting ---
  {id: 'nmap', name: 'Nmap', category: 'network-pentest', url: 'https://nmap.org/', githubOrg: 'nmap', description: 'The standard network discovery and port-scanning tool — maps hosts, open ports, running services, and OS fingerprints across a network.'},
  {id: 'wireshark', name: 'Wireshark', category: 'network-pentest', url: 'https://www.wireshark.org/', githubOrg: 'wireshark', description: 'The most widely used network protocol analyzer, for capturing and inspecting traffic down to the packet level.'},
  {id: 'masscan', name: 'Masscan', category: 'network-pentest', url: 'https://github.com/robertdavidgraham/masscan', githubOrg: 'robertdavidgraham', description: 'An extremely fast asynchronous port scanner capable of scanning the entire IPv4 address space in minutes.'},
  {id: 'rustscan', name: 'RustScan', category: 'network-pentest', url: 'https://github.com/RustScan/RustScan', githubOrg: 'RustScan', description: 'A modern port scanner that finds open ports fast, then automatically pipes them into Nmap for detailed scanning.'},
  {id: 'netcat', name: 'Netcat', category: 'network-pentest', url: 'http://netcat.sourceforge.net/', description: 'The "Swiss Army knife" of networking — reads and writes raw TCP/UDP connections, used for banner grabbing, port scanning, and shells.'},
  {id: 'tcpdump', name: 'tcpdump', category: 'network-pentest', url: 'https://www.tcpdump.org/', githubOrg: 'the-tcpdump-group', description: 'A command-line packet analyzer for capturing and filtering network traffic directly from a terminal.'},
  {id: 'hping3', name: 'hping3', category: 'network-pentest', url: 'https://github.com/antirez/hping', githubOrg: 'antirez', description: 'A command-line tool for crafting custom TCP/IP packets — used for firewall testing, path MTU discovery, and advanced scanning.'},

  // --- Web Application Security ---
  {id: 'burp-suite', name: 'Burp Suite', category: 'web-security', url: 'https://portswigger.net/burp', githubOrg: 'PortSwigger', description: 'The industry-standard intercepting proxy and toolkit for manual and automated web application security testing.'},
  {id: 'owasp-zap', name: 'OWASP ZAP', category: 'web-security', url: 'https://www.zaproxy.org/', githubOrg: 'zaproxy', description: 'A free, open-source intercepting proxy and scanner for finding vulnerabilities in web applications during development and testing.'},
  {id: 'sqlmap', name: 'sqlmap', category: 'web-security', url: 'https://sqlmap.org/', githubOrg: 'sqlmapproject', description: 'Automates detecting and exploiting SQL injection flaws, including database fingerprinting and data extraction.'},
  {id: 'nikto', name: 'Nikto', category: 'web-security', url: 'https://cirt.net/Nikto2', githubOrg: 'sullo', description: 'A fast web server scanner that checks for thousands of dangerous files, outdated software, and server misconfigurations.'},
  {id: 'ffuf', name: 'ffuf', category: 'web-security', url: 'https://github.com/ffuf/ffuf', githubOrg: 'ffuf', description: 'A fast, flexible web fuzzer for discovering hidden directories, files, parameters, and virtual hosts.'},
  {id: 'gobuster', name: 'Gobuster', category: 'web-security', url: 'https://github.com/OJ/gobuster', githubOrg: 'OJ', description: 'A directory, file, DNS subdomain, and virtual host brute-forcing tool written in Go for speed.'},
  {id: 'nuclei', name: 'Nuclei', category: 'web-security', url: 'https://github.com/projectdiscovery/nuclei', githubOrg: 'projectdiscovery', description: 'A template-based vulnerability scanner that checks web applications and infrastructure against thousands of community-maintained detection templates.'},
  {id: 'wpscan', name: 'WPScan', category: 'web-security', url: 'https://wpscan.com/', githubOrg: 'wpscanteam', description: 'A black-box WordPress vulnerability scanner that identifies outdated plugins, themes, and known WordPress-specific weaknesses.'},

  // --- Active Directory & Windows ---
  {id: 'bloodhound', name: 'BloodHound', category: 'active-directory', url: 'https://bloodhound.specterops.io/', githubOrg: 'SpecterOps', description: 'Maps Active Directory trust relationships as a graph, revealing hidden and unintended attack paths to Domain Admin.'},
  {id: 'mimikatz', name: 'Mimikatz', category: 'active-directory', url: 'https://github.com/gentilkiwi/mimikatz', githubOrg: 'gentilkiwi', description: 'Extracts plaintext passwords, hashes, and Kerberos tickets from Windows memory — the tool that popularized credential-dumping attacks.'},
  {id: 'netexec', name: 'NetExec', category: 'active-directory', url: 'https://github.com/Pennyw0rth/NetExec', githubOrg: 'Pennyw0rth', description: 'A network service exploitation tool (successor to CrackMapExec) for automating credential validation and command execution across Windows networks.'},
  {id: 'impacket', name: 'Impacket', category: 'active-directory', url: 'https://github.com/fortra/impacket', githubOrg: 'fortra', description: 'A collection of Python classes for working with network protocols, underpinning many Windows/AD attack tools (psexec, secretsdump, and more).'},
  {id: 'powerview', name: 'PowerView', category: 'active-directory', url: 'https://github.com/PowerShellMafia/PowerSploit', githubOrg: 'PowerShellMafia', description: 'A PowerShell tool (part of PowerSploit) for situational awareness and enumeration inside a Windows domain.'},
  {id: 'responder', name: 'Responder', category: 'active-directory', url: 'https://github.com/lgandx/Responder', githubOrg: 'lgandx', description: 'Poisons LLMNR, NBT-NS, and mDNS name resolution requests on a network to harvest credentials and hashes.'},
  {id: 'rubeus', name: 'Rubeus', category: 'active-directory', url: 'https://github.com/GhostPack/Rubeus', githubOrg: 'GhostPack', description: 'A C# toolset for raw Kerberos interaction and abuse, including ticket harvesting and Kerberoasting.'},

  // --- Cloud Security ---
  {id: 'scoutsuite', name: 'ScoutSuite', category: 'cloud-security', url: 'https://github.com/nccgroup/ScoutSuite', githubOrg: 'nccgroup', description: 'A multi-cloud security auditing tool that assesses AWS, Azure, and GCP configurations against security best practices.'},
  {id: 'prowler', name: 'Prowler', category: 'cloud-security', url: 'https://prowler.com/', githubOrg: 'prowler-cloud', description: 'An open-source cloud security tool for AWS, Azure, and GCP that runs hundreds of checks for hardening, compliance, and misconfigurations.'},
  {id: 'pacu', name: 'Pacu', category: 'cloud-security', url: 'https://github.com/RhinoSecurityLabs/pacu', githubOrg: 'RhinoSecurityLabs', description: 'An AWS exploitation framework for offensive security testing of cloud environments — privilege escalation, persistence, and data exfiltration modules.'},
  {id: 'cloud-custodian', name: 'Cloud Custodian', category: 'cloud-security', url: 'https://cloudcustodian.io/', githubOrg: 'cloud-custodian', description: 'A rules engine for managing cloud resource security, cost, and compliance across AWS, Azure, and GCP as code.'},
  {id: 'steampipe', name: 'Steampipe', category: 'cloud-security', url: 'https://steampipe.io/', githubOrg: 'turbot', description: 'Queries cloud infrastructure (and hundreds of other services) as SQL tables, making it fast to write custom cloud security audits.'},
  {id: 'cloudmapper', name: 'CloudMapper', category: 'cloud-security', url: 'https://github.com/duo-labs/cloudmapper', githubOrg: 'duo-labs', description: 'Analyzes and visualizes AWS account network configurations to spot exposure and misconfiguration at a glance.'},

  // --- Mobile Security ---
  {id: 'mobsf', name: 'MobSF', category: 'mobile-security', url: 'https://mobsf.github.io/docs/', githubOrg: 'MobSF', description: 'An all-in-one mobile application security testing framework for static and dynamic analysis of Android, iOS, and Windows apps.'},
  {id: 'frida', name: 'Frida', category: 'mobile-security', url: 'https://frida.re/', githubOrg: 'frida', description: 'A dynamic instrumentation toolkit that injects JavaScript into running apps to hook functions and bypass client-side controls at runtime.'},
  {id: 'objection', name: 'Objection', category: 'mobile-security', url: 'https://github.com/sensepost/objection', githubOrg: 'sensepost', description: 'A runtime mobile exploration toolkit built on Frida, requiring no jailbreak/root, for bypassing SSL pinning and root/jailbreak detection.'},
  {id: 'apktool', name: 'Apktool', category: 'mobile-security', url: 'https://apktool.org/', githubOrg: 'iBotPeaches', description: 'Decodes Android APK resources and rebuilds them after modification — a core tool for Android reverse engineering.'},
  {id: 'jadx', name: 'jadx', category: 'mobile-security', url: 'https://github.com/skylot/jadx', githubOrg: 'skylot', description: 'Decompiles Android Dex and APK files back into readable Java source code.'},
  {id: 'drozer', name: 'Drozer', category: 'mobile-security', url: 'https://github.com/WithSecureLabs/drozer', githubOrg: 'WithSecureLabs', description: 'A security assessment framework for Android that lets a tester interact with an app the same way another app or the OS would.'},

  // --- OSINT & Reconnaissance ---
  {id: 'theharvester', name: 'theHarvester', category: 'osint', url: 'https://github.com/laramies/theHarvester', githubOrg: 'laramies', description: 'Gathers emails, subdomains, hosts, and employee names for a target from public search engines and sources.'},
  {id: 'maltego', name: 'Maltego', category: 'osint', url: 'https://www.maltego.com/', description: 'A graphical link-analysis tool for mapping relationships between people, domains, companies, and infrastructure from OSINT data.'},
  {id: 'shodan', name: 'Shodan', category: 'osint', url: 'https://www.shodan.io/', description: 'A search engine for internet-connected devices — finds exposed servers, cameras, and industrial systems by banner and service.'},
  {id: 'recon-ng', name: 'Recon-ng', category: 'osint', url: 'https://github.com/lanmaster53/recon-ng', githubOrg: 'lanmaster53', description: 'A full-featured web reconnaissance framework with a modular, Metasploit-like interface for automating OSINT gathering.'},
  {id: 'spiderfoot', name: 'SpiderFoot', category: 'osint', url: 'https://www.spiderfoot.net/', githubOrg: 'smicallef', description: 'Automates OSINT collection across 200+ data sources, correlating results into a single reconnaissance report.'},
  {id: 'amass', name: 'OWASP Amass', category: 'osint', url: 'https://github.com/owasp-amass/amass', githubOrg: 'owasp-amass', description: 'Performs in-depth subdomain enumeration and external attack-surface mapping by combining OSINT techniques and active recon.'},
  {id: 'sublist3r', name: 'Sublist3r', category: 'osint', url: 'https://github.com/aboul3la/Sublist3r', githubOrg: 'aboul3la', description: 'A fast Python tool for enumerating subdomains of a target domain using search engines and DNS aggregation.'},

  // --- Password Attacks & Cracking ---
  {id: 'hashcat', name: 'Hashcat', category: 'password-cracking', url: 'https://hashcat.net/hashcat/', githubOrg: 'hashcat', description: 'The fastest GPU-accelerated password recovery tool, supporting hundreds of hash algorithms and attack modes.'},
  {id: 'john', name: 'John the Ripper', category: 'password-cracking', url: 'https://www.openwall.com/john/', githubOrg: 'openwall', description: 'A veteran, highly extensible password cracker supporting dozens of hash and cipher types across platforms.'},
  {id: 'hydra', name: 'THC Hydra', category: 'password-cracking', url: 'https://github.com/vanhauser-thc/thc-hydra', githubOrg: 'vanhauser-thc', description: 'A fast online login cracker supporting dozens of protocols — SSH, FTP, HTTP forms, RDP, and more.'},
  {id: 'cewl', name: 'CeWL', category: 'password-cracking', url: 'https://digi.ninja/projects/cewl.php', githubOrg: 'digininja', description: 'Spiders a target website to generate a custom wordlist from the words actually used on it, for more targeted password attacks.'},
  {id: 'medusa', name: 'Medusa', category: 'password-cracking', url: 'https://github.com/jmk-foofus/medusa', githubOrg: 'jmk-foofus', description: 'A speedy, parallel, modular login brute-forcer supporting many remote authentication services.'},

  // --- Wireless Security ---
  {id: 'aircrack-ng', name: 'Aircrack-ng', category: 'wireless', url: 'https://www.aircrack-ng.org/', githubOrg: 'aircrack-ng', description: 'A complete suite for auditing Wi-Fi networks — packet capture, WEP/WPA-PSK key cracking, and traffic injection.'},
  {id: 'kismet', name: 'Kismet', category: 'wireless', url: 'https://www.kismetwireless.net/', githubOrg: 'kismetwireless', description: 'A wireless network detector, sniffer, and intrusion detection system covering Wi-Fi, Bluetooth, and other RF protocols.'},
  {id: 'wifite', name: 'Wifite2', category: 'wireless', url: 'https://github.com/kimocoder/wifite2', githubOrg: 'kimocoder', description: 'Automates auditing multiple wireless networks in sequence using Aircrack-ng, Reaver, and related tools.'},
  {id: 'bettercap', name: 'Bettercap', category: 'wireless', url: 'https://www.bettercap.org/', githubOrg: 'bettercap', description: 'A modular, portable framework for network reconnaissance and man-in-the-middle attacks across Wi-Fi, Bluetooth, and Ethernet.'},
  {id: 'reaver', name: 'Reaver', category: 'wireless', url: 'https://github.com/t6x/reaver-wps-fork-t6x', githubOrg: 't6x', description: 'Performs a brute-force attack against WiFi Protected Setup (WPS) PINs to recover a router\'s WPA/WPA2 passphrase.'},

  // --- Forensics & Incident Response ---
  {id: 'autopsy', name: 'Autopsy', category: 'forensics', url: 'https://www.autopsy.com/', githubOrg: 'sleuthkit', description: 'A graphical digital forensics platform built on The Sleuth Kit, used for disk image and file system investigation.'},
  {id: 'volatility', name: 'Volatility 3', category: 'forensics', url: 'https://github.com/volatilityfoundation/volatility3', githubOrg: 'volatilityfoundation', description: 'The leading open-source memory forensics framework, for extracting artifacts from RAM captures during incident response.'},
  {id: 'yara', name: 'YARA', category: 'forensics', url: 'https://virustotal.github.io/yara/', githubOrg: 'VirusTotal', description: 'A pattern-matching tool for identifying and classifying malware samples based on textual or binary signatures.'},
  {id: 'velociraptor', name: 'Velociraptor', category: 'forensics', url: 'https://docs.velociraptor.app/', githubOrg: 'Velocidex', description: 'An advanced endpoint monitoring and forensic collection platform for hunting and gathering evidence across a fleet of machines.'},
  {id: 'grr', name: 'GRR Rapid Response', category: 'forensics', url: 'https://github.com/google/grr', githubOrg: 'google', description: 'A Google-built incident response framework for remote live forensics across large numbers of systems in parallel.'},

  // --- Reverse Engineering & Malware Analysis ---
  {id: 'ghidra', name: 'Ghidra', category: 'reverse-engineering', url: 'https://ghidra-sre.org/', githubOrg: 'NationalSecurityAgency', description: 'The NSA\'s free software reverse engineering suite, including a disassembler, decompiler, and scripting environment.'},
  {id: 'ida-free', name: 'IDA Free', category: 'reverse-engineering', url: 'https://hex-rays.com/ida-free/', description: 'A free version of the industry-standard IDA disassembler and debugger for analyzing compiled binaries.'},
  {id: 'radare2', name: 'radare2', category: 'reverse-engineering', url: 'https://rada.re/n/', githubOrg: 'radareorg', description: 'An open-source, cross-platform reverse engineering framework combining a disassembler, debugger, and binary analysis toolkit.'},
  {id: 'x64dbg', name: 'x64dbg', category: 'reverse-engineering', url: 'https://x64dbg.com/', githubOrg: 'x64dbg', description: 'An open-source x64/x32 debugger for Windows, popular for malware analysis and exploit development.'},
  {id: 'cutter', name: 'Cutter', category: 'reverse-engineering', url: 'https://cutter.re/', githubOrg: 'rizinorg', description: 'A modern graphical interface for the Rizin reverse engineering framework, making disassembly and decompilation more approachable.'},
  {id: 'cuckoo', name: 'Cuckoo Sandbox', category: 'reverse-engineering', url: 'https://cuckoosandbox.org/', githubOrg: 'cuckoosandbox', description: 'An automated malware analysis sandbox that runs suspicious files in an isolated environment and reports their behavior.'},

  // --- Exploitation Frameworks & C2 ---
  {id: 'metasploit', name: 'Metasploit Framework', category: 'exploitation-c2', url: 'https://www.metasploit.com/', githubOrg: 'rapid7', description: 'The most widely used exploitation framework, bundling exploit code, payloads, and post-exploitation modules in one platform.'},
  {id: 'sliver', name: 'Sliver', category: 'exploitation-c2', url: 'https://github.com/BishopFox/sliver', githubOrg: 'BishopFox', description: 'An open-source, cross-platform adversary emulation and command-and-control framework built as a modern alternative to Cobalt Strike.'},
  {id: 'havoc', name: 'Havoc', category: 'exploitation-c2', url: 'https://github.com/HavocFramework/Havoc', githubOrg: 'HavocFramework', description: 'A modern, modular, open-source command-and-control framework used for red team post-exploitation and adversary simulation.'},
  {id: 'empire', name: 'Empire', category: 'exploitation-c2', url: 'https://github.com/BC-SECURITY/Empire', githubOrg: 'BC-SECURITY', description: 'A post-exploitation and adversary emulation framework covering PowerShell, Python, and C# agents.'},
  {id: 'cobalt-strike', name: 'Cobalt Strike', category: 'exploitation-c2', url: 'https://www.cobaltstrike.com/', description: 'A commercial adversary simulation platform widely used by professional red teams for realistic, long-term engagements.'},

  // --- Container & Kubernetes Security ---
  {id: 'trivy', name: 'Trivy', category: 'container-security', url: 'https://trivy.dev/', githubOrg: 'aquasecurity', description: 'A comprehensive, easy-to-use vulnerability and misconfiguration scanner for container images, filesystems, and IaC.'},
  {id: 'kube-hunter', name: 'kube-hunter', category: 'container-security', url: 'https://github.com/aquasecurity/kube-hunter', githubOrg: 'aquasecurity', description: 'Hunts for security weaknesses in Kubernetes clusters, simulating an attacker probing the cluster from inside or outside.'},
  {id: 'kube-bench', name: 'kube-bench', category: 'container-security', url: 'https://github.com/aquasecurity/kube-bench', githubOrg: 'aquasecurity', description: 'Checks whether Kubernetes clusters are configured according to the CIS Kubernetes Benchmark.'},
  {id: 'falco', name: 'Falco', category: 'container-security', url: 'https://falco.org/', githubOrg: 'falcosecurity', description: 'A cloud-native runtime security tool (now a CNCF project) that detects anomalous behavior in containers and Kubernetes in real time.'},
  {id: 'kubeaudit', name: 'kubeaudit', category: 'container-security', url: 'https://github.com/Shopify/kubeaudit', githubOrg: 'Shopify', description: 'Audits Kubernetes clusters for common security misconfigurations, such as containers running as root or without resource limits.'},

  // --- Vulnerability Scanning & Detection ---
  {id: 'nessus', name: 'Nessus', category: 'vuln-scanning', url: 'https://www.tenable.com/products/nessus', githubOrg: 'tenable', description: 'A widely deployed commercial vulnerability scanner covering thousands of CVEs, misconfigurations, and compliance checks.'},
  {id: 'openvas', name: 'OpenVAS / Greenbone', category: 'vuln-scanning', url: 'https://www.greenbone.net/en/open-source-scanner/', githubOrg: 'greenbone', description: 'A free, actively maintained vulnerability scanning and management solution with a large, regularly updated test feed.'},
  {id: 'wazuh', name: 'Wazuh', category: 'vuln-scanning', url: 'https://wazuh.com/', githubOrg: 'wazuh', description: 'A free, open-source security platform combining SIEM and XDR capabilities — log analysis, intrusion detection, and compliance.'},
  {id: 'suricata', name: 'Suricata', category: 'vuln-scanning', url: 'https://suricata.io/', githubOrg: 'OISF', description: 'A high-performance network IDS/IPS and security monitoring engine, capable of real-time traffic analysis at scale.'},
  {id: 'snort', name: 'Snort', category: 'vuln-scanning', url: 'https://www.snort.org/', githubOrg: 'snort3', description: 'One of the original open-source network intrusion detection and prevention systems, still widely deployed today.'},
];

export function getToolImage(tool) {
  return tool.githubOrg ? `https://github.com/${tool.githubOrg}.png?size=200` : null;
}

export function getCategory(id) {
  return TOOL_CATEGORIES.find((c) => c.id === id);
}
