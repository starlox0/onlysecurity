# OnlySecurity

**OnlySecurity** is a cybersecurity-focused knowledge base and blog maintained by **Starlox**, featuring write-ups, security research, vulnerability analysis, bug bounty tips, and penetration testing methodologies for security enthusiasts and professionals.

🌐 **Live Site:** [starlox0.github.io/onlysecurity](https://starlox0.github.io/onlysecurity/)

[![Website](https://img.shields.io/website?url=https%3A%2F%2Fstarlox0.github.io%2Fonlysecurity%2F)](https://starlox0.github.io/onlysecurity/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](#license)
[![Made with Docusaurus](https://img.shields.io/badge/Made%20with-Docusaurus-3ECC5F?logo=docusaurus)](https://docusaurus.io/)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Local Development](#local-development)
- [Build & Preview](#build--preview)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Author](#author)
- [License](#license)

---

## Features

- Cybersecurity blogs and in-depth research articles
- Penetration testing methodologies and walkthroughs
- Bug bounty tips, notes, and write-ups
- Vulnerability analysis and remediation guidance
- Resources spanning Web, API, Mobile, and Network Security
- Built on Docusaurus for fast performance and easy content maintenance

## Tech Stack

| Layer         | Technology              |
| ------------- | ------------------------ |
| Framework     | Docusaurus               |
| UI            | React                    |
| Content       | Markdown / MDX           |
| Hosting       | GitHub Pages             |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- npm (bundled with Node.js) or another package manager of your choice

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/starlox0/onlysecurity.git
cd onlysecurity
npm install
```

---

## Local Development

Start the development server:

```bash
npm run start
```

The site will be available at `http://localhost:3000`. Most changes are reflected live without needing to restart the server.

---

## Build & Preview

Generate a production build:

```bash
npm run build
```

Static files are output to the `build/` directory. To preview the production build locally:

```bash
npm run serve
```

---

## Deployment

The site deploys to GitHub Pages via the `gh-pages` branch.

**Using SSH:**

```bash
USE_SSH=true npm run deploy
```

**Using HTTPS:**

```bash
GIT_USER=<your-github-username> npm run deploy
```

---

## Contributing

Contributions are welcome. To propose a change or add new content:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-writeup`)
3. Commit your changes
4. Open a pull request

Please keep write-ups factual, properly sourced, and free of any content that could facilitate real-world harm.

---

## Author

**Subhankar Paul** ([@starlox0](https://github.com/starlox0))

- Website: [starlox0.github.io/onlysecurity](https://starlox0.github.io/onlysecurity/)
- Blog: [starlox.medium.com](https://starlox.medium.com/)

---

## License

This project is licensed under the [MIT License](LICENSE) unless stated otherwise.
