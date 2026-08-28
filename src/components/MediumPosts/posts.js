// Posts from https://starlox.medium.com/
// Medium has no public, CORS-friendly API for client-side fetching, so this
// list is maintained by hand. Add a new entry at the top whenever you
// publish — title, date, excerpt, image, and link all come straight from
// the Medium post.
const mediumPosts = [
  {
    title: 'How I Found a Chain of Critical Vulnerabilities in a Public Platform\u2019s GraphQL API',
    excerpt:
      'A chain of GraphQL vulnerabilities discovered while testing a public application, walked through end to end.',
    date: 'Jun 22, 2026',
    image: 'https://miro.medium.com/v2/resize:fill:640:428/1*Tr85zAGrnv2G1e-UE_hycw.jpeg',
    url: 'https://starlox.medium.com/how-i-found-a-chain-of-critical-vulnerabilities-in-a-public-platforms-graphql-api-1093c85b2b0f',
  },
  {
    title: 'Who Needs Admin Rights When You\u2019ve Got Bugs?',
    excerpt: 'A business-logic vulnerability that let low-privilege actions produce admin-level outcomes.',
    date: 'Sep 18, 2025',
    image: 'https://miro.medium.com/v2/resize:fill:640:428/1*-8aKkA-FP-luyDPUEpBHdg.jpeg',
    url: 'https://starlox.medium.com/who-needs-admin-rights-when-youve-got-bugs-ee71611b8bae',
  },
  {
    title: 'Exploit the Game Blindly: With Blind XSS',
    excerpt: 'How a blind XSS payload was used to exfiltrate sensitive information from an internal admin panel.',
    date: 'Aug 18, 2025',
    image: 'https://miro.medium.com/v2/resize:fill:640:428/1*LwwwGN3k0kJqsGsVuvW_kA.jpeg',
    url: 'https://starlox.medium.com/exploit-the-game-blindly-with-blind-xss-1f82479dfbc4',
  },
  {
    title: 'How One Header Broke Next.js Auth \u2014 CVE-2025-29927',
    excerpt:
      'How injecting the x-middleware-subrequest header lets attackers bypass middleware-based authorization checks entirely.',
    date: 'Apr 6, 2025',
    image: 'https://miro.medium.com/v2/resize:fill:640:428/1*_wHRLh1Sxg6_UNGd3Nu1Jg.jpeg',
    url: 'https://starlox.medium.com/how-one-header-broke-next-js-auth-cve-2025-29927-c8b714be45bb',
  },
  {
    title: 'Hacking the Cloud \ud83c\udf29 : Unveiling Secrets in AWS CTF Challenges',
    excerpt: 'A hands-on walkthrough of cloud pentesting scenarios from TryHackMe\u2019s Hackfinity Battle Encore CTF.',
    date: 'Mar 28, 2025',
    image: 'https://miro.medium.com/v2/da:true/resize:fill:640:428/0*XyI36djJpaCvTNV6',
    url: 'https://starlox.medium.com/hacking-the-cloud-unveiling-secrets-in-aws-ctf-challenges-5edc9259688c',
  },
  {
    title: 'Hacking with SSRF: A Deep Dive into Server-Side Request Forgery',
    excerpt: 'What SSRF is, how it\u2019s exploited, and how to bypass common restrictions to reach internal services.',
    date: 'Mar 12, 2025',
    image: 'https://miro.medium.com/v2/resize:fill:640:428/1*lG_j_H7zxsSPoo2E2Rw_-g.png',
    url: 'https://starlox.medium.com/hacking-with-ssrf-a-deep-dive-into-server-side-request-forgery-e42d9011f672',
  },
  {
    title: 'HackTheBox: Instant Writeup',
    excerpt: 'A full writeup of the HackTheBox "Instant" machine, including APK pentesting along the way.',
    date: 'Mar 1, 2025',
    image: 'https://miro.medium.com/v2/resize:fill:640:428/1*Or5NlUiHGKiKJYYhK9O4mA.jpeg',
    url: 'https://starlox.medium.com/hackthebox-instant-writeup-80d38da06704',
  },
  {
    title: 'XXE: When XML Becomes Your Worst Nightmare',
    excerpt: 'A practical look at XML External Entity (XXE) vulnerabilities and how they\u2019re exploited.',
    date: 'Feb 25, 2025',
    image: 'https://miro.medium.com/v2/resize:fill:640:428/1*upmtd7vGS3R9tfV-vZ_cbQ.jpeg',
    url: 'https://starlox.medium.com/xxe-when-xml-becomes-your-worst-nightmare-291452531da2',
  },
  {
    title: 'Easy-Peasy Printer Exploitation: PRET Framework',
    excerpt: 'Exploring printer exploitation techniques using the PRET (Printer Exploitation Toolkit) framework.',
    date: 'Feb 4, 2025',
    image: 'https://miro.medium.com/v2/resize:fill:640:428/1*YUtEgfhLMiloGsg-5AYABA.png',
    url: 'https://starlox.medium.com/easy-peasy-printer-exploitation-pret-framework-23fd6772eac4',
  },
  {
    title: 'Win the Race | Exploiting Race Condition Vulnerability',
    excerpt: 'An introduction to race condition vulnerabilities and how they\u2019re identified and exploited.',
    date: 'Jan 1, 2025',
    image: 'https://miro.medium.com/v2/resize:fill:640:428/1*162o6Wcbq40K_2OCy_H64g.jpeg',
    url: 'https://starlox.medium.com/win-the-race-exploiting-race-condition-vulnerability-21ba7297f039',
  },
];

export default mediumPosts;
