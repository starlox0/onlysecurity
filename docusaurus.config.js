// @ts-check

import { themes as prismThemes } from "prism-react-renderer";

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "OnlySecurity",
  tagline: "An open-source hub for learning security and sharing knowledge.",
  favicon: "img/favicon.ico",

  future: {
    v4: true,
  },

  // GitHub Pages
  url: "https://starlox0.github.io",
  baseUrl: "/onlysecurity/",

  organizationName: "starlox0",
  projectName: "onlysecurity",

  onBrokenLinks: "throw",

  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.js",
          editUrl:
            "https://github.com/starlox0/onlysecurity/tree/main/",
        },

        blog: {
          showReadingTime: true,

          feedOptions: {
            type: ["rss", "atom"],
            xslt: true,
          },

          editUrl:
            "https://github.com/starlox0/onlysecurity/tree/main/blog/",

          onInlineTags: "warn",
          onInlineAuthors: "warn",
          onUntruncatedBlogPosts: "warn",
        },

        theme: {
          customCss: "./src/css/custom.css",
        },
      },
    ],
  ],

  themeConfig: {
    // social-card.png was never added to static/img — using the file that
    // actually exists so this doesn't 404.
    image: "img/docusaurus-social-card.jpg",

    colorMode: {
      defaultMode: "dark",
      respectPrefersColorScheme: true,
    },

    navbar: {
      title: "OnlySecurity",

      logo: {
        alt: "OnlySecurity",
        src: "img/profile.png",
        // srcDark removed — img/profile-dark.png doesn't exist in
        // static/img, so this was rendering as a broken image in dark mode
        // (the site's default mode). Add that file back and restore
        // srcDark whenever it exists.
        width: 34,
        height: 34,
      },

      items: [
        {
          type: "docSidebar",
          sidebarId: "tutorialSidebar",
          position: "left",
          label: "Docs",
        },

        {
          to: "/blog",
          label: "Blog",
          position: "left",
        },

        // The "Resources" dropdown pointed at /docs/tools, /blog/tags/writeup,
        // and /labs — none of which exist yet, which is what was throwing the
        // build (onBrokenLinks: "throw" fails the build on any dead link).
        // Removed for now rather than left broken. Re-add once each
        // destination page actually exists:
        //   - Tools:     create docs/tools.md, then re-add { label: "Tools", to: "/docs/tools" }
        //   - Write-ups: tag a blog post with `tags: [writeup]`, then re-add { label: "Write-ups", to: "/blog/tags/writeup" }
        //   - Labs:      create src/pages/labs.js (or docs/labs.md), then re-add { label: "Labs", to: "/labs" }

        {
          href: "https://github.com/starlox0/onlysecurity",
          label: "GitHub",
          position: "right",
        },

        {
          type: "search",
          position: "right",
        },
      ],
    },

    footer: {
      style: "dark",

      logo: {
        alt: "OnlySecurity",
        src: "img/profile.png",
        href: "/onlysecurity/",
        width: 60,
        height: 60,
      },

      links: [
        {
          title: "Learn",
          items: [
            {
              label: "Getting Started",
              to: "/docs/intro",
            },
            {
              // There's no page at exactly "/docs" (only /docs/intro and
              // deeper), so this pointed nowhere real. Repointed at an
              // existing page rather than removed.
              label: "Documentation",
              to: "/docs/intro",
            },
          ],
        },

        {
          title: "Community",
          items: [
            {
              label: "GitHub",
              href: "https://github.com/starlox0/onlysecurity",
            },
            // Uncomment when available
            // {
            //   label: "Discord",
            //   href: "https://discord.gg/yourinvite",
            // },
            // {
            //   label: "X",
            //   href: "https://x.com/yourhandle",
            // },
          ],
        },

        {
          title: "More",
          items: [
            {
              label: "Blog",
              to: "/blog",
            },
            // "Contribute" -> /docs/contribute and "Report a Vulnerability"
            // -> /report don't exist yet, so both are commented out rather
            // than left broken. Re-add once those pages exist:
            // {
            //   label: "Contribute",
            //   to: "/docs/contribute",
            // },
            // {
            //   label: "Report a Vulnerability",
            //   to: "/report",
            // },
          ],
        },
      ],

      copyright: `© ${new Date().getFullYear()} OnlySecurity. Built with Docusaurus.`,
    },

    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  },
};

export default config;
