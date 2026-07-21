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
    image: "img/social-card.png",

    colorMode: {
      defaultMode: "dark",
      respectPrefersColorScheme: true,
    },

    navbar: {
      title: "",

      logo: {
        alt: "OnlySecurity",
        src: "img/profile.png",
        srcDark: "img/profile-dark.png",
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

        {
          type: "dropdown",
          label: "Resources",
          position: "left",
          items: [
            {
              label: "Tools",
              to: "/docs/tools",
            },
            {
              label: "Write-ups",
              to: "/blog/tags/writeup",
            },
            {
              label: "Labs",
              to: "/labs",
            },
          ],
        },

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
              label: "Documentation",
              to: "/docs",
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
            {
              label: "Contribute",
              to: "/docs/contribute",
            },
            {
              label: "Report a Vulnerability",
              to: "/report",
            },
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
