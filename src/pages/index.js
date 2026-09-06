import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import LearningPath from '@site/src/components/HomepageFeatures';
import mediumPosts from '@site/src/components/MediumPosts/posts';
import styles from './index.module.css';
import CursorGlow from '@site/src/components/CursorGlow';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={styles.heroBanner}>
      <div className="container">
        <div className={styles.heroGrid}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>Open source · Free forever</span>
            <Heading as="h1" className={styles.heroTitle}>
              {siteConfig.title}
            </Heading>
            <p className={styles.heroTagline}>{siteConfig.tagline}</p>
            <p className={styles.heroBody}>
              Real vulnerabilities, real write-ups, real methodology — not a
              paraphrased course. Start at the fundamentals or jump straight
              to the write-ups; either way, nothing here is paywalled.
            </p>

            <div className={styles.buttons}>
              <Link className={clsx('button', styles.primaryButton)} to="/docs/intro">
                Start Learning →
              </Link>
              <Link className={clsx('button', styles.secondaryButton)} to="/blog">
                Read the write-ups
              </Link>
            </div>

            <dl className={styles.trustBar}>
              <div className={styles.trustItem}>
                <dt>6</dt>
                <dd>learning modules</dd>
              </div>
              <div className={styles.trustDivider} />
              <div className={styles.trustItem}>
                <dt>10+</dt>
                <dd>real-world write-ups</dd>
              </div>
              <div className={styles.trustDivider} />
              <div className={styles.trustItem}>
                <dt>100%</dt>
                <dd>free, always</dd>
              </div>
              <div className={styles.trustDivider} />
              <div className={styles.trustItem}>
                <dt>3</dt>
                <dd>live intel feeds</dd>
              </div>
            </dl>
          </div>

          <div className={styles.heroDemo}>
            <div className={styles.demoWindow}>
              <div className={styles.demoBar}>
                <span className={styles.dot} data-color="red" />
                <span className={styles.dot} data-color="amber" />
                <span className={styles.dot} data-color="green" />
                <span className={styles.demoPath}>ssrf-bypass.sh</span>
              </div>
              <pre className={styles.demoBody}>
                <code>
                  <span className={styles.demoPrompt}>$</span> curl -s "http://target/fetch?url=http://127.0.0.1/admin"{'\n'}
                  <span className={styles.demoOut}>{'{"error":"blocked: private range"}'}</span>{'\n\n'}
                  <span className={styles.demoComment}># decimal-encoded IP — same host, different filter path</span>{'\n'}
                  <span className={styles.demoPrompt}>$</span> curl -s "http://target/fetch?url=http://2130706433/admin"{'\n'}
                  <span className={styles.demoOk}>{'{"status":"200 OK"}'}</span>
                  <span className={styles.cursor} aria-hidden="true" />
                </code>
              </pre>
            </div>
            <p className={styles.demoCaption}>
              One of dozens of real bypass techniques covered in{' '}
              <Link to="/docs/category/web-security">Web Security</Link>.
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

const LIVE_TOOLS = [
  {
    icon: '📡',
    title: 'CVE Radar',
    body: 'Search live National Vulnerability Database records by CVE ID, affected product, or researcher — with public GitHub proof-of-concepts surfaced automatically.',
    href: '/cve-radar?tool=cve',
    cta: 'Open CVE Radar',
  },
  {
    icon: '☣',
    title: 'CISA KEV Tracker',
    body: "Vulnerabilities with confirmed, active exploitation — not just a theoretical score. Filter by ransomware association or remediation deadline.",
    href: '/cve-radar?tool=kev',
    cta: 'Open KEV Tracker',
  },
  {
    icon: '🗞️',
    title: 'Threat Wire',
    body: 'Real-time security news pulled from The Hacker News, auto-tagged by category and cross-linked to any CVE a story mentions.',
    href: '/news',
    cta: 'Open Threat Wire',
  },
];

function LiveIntel() {
  return (
    <section className={styles.liveIntel}>
      <div className="container">
        <div className={styles.sectionHead}>
          <span className={styles.eyebrow}>Updated automatically · No login required</span>
          <Heading as="h2" className={styles.sectionTitle}>
            Live security intelligence, not static pages
          </Heading>
          <p className={styles.liveIntelSubtitle}>
            Three tools pulling directly from primary sources — NVD, CISA, and The Hacker
            News — right in the browser. Turn on the 🔔 in the navbar to get notified the
            moment new incidents land.
          </p>
        </div>
        <div className={styles.liveGrid}>
          {LIVE_TOOLS.map((tool) => (
            <Link key={tool.href} to={tool.href} className={styles.liveCard}>
              <div className={styles.liveCardHead}>
                <span className={styles.liveCardIcon} aria-hidden="true">{tool.icon}</span>
                <span className={styles.liveBadge}>
                  <span className={styles.liveDot} aria-hidden="true" />
                  Live
                </span>
              </div>
              <h3 className={styles.liveCardTitle}>{tool.title}</h3>
              <p className={styles.liveCardBody}>{tool.body}</p>
              <span className={styles.liveCardLink}>{tool.cta} →</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function BlogPreview() {
  const posts = mediumPosts.slice(0, 3);
  return (
    <section className={styles.blogPreview}>
      <div className="container">
        <div className={styles.sectionHead}>
          <span className={styles.eyebrow}>From the blog</span>
          <Heading as="h2" className={styles.sectionTitle}>
            Written from real engagements, not textbooks
          </Heading>
        </div>
        <div className={styles.blogGrid}>
          {posts.map((post) => (
            <a
              key={post.url}
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.blogCard}>
              <div className={styles.blogImageWrap}>
                <img src={post.image} alt="" loading="lazy" className={styles.blogImage} />
              </div>
              <div className={styles.blogCardBody}>
                <h3 className={styles.blogCardTitle}>{post.title}</h3>
                <p className={styles.blogCardExcerpt}>{post.excerpt}</p>
                <span className={styles.blogCardLink}>Read on Medium →</span>
              </div>
            </a>
          ))}
        </div>
        <div className={styles.blogPreviewFooter}>
          <Link to="/blog" className={styles.textLink}>
            See all write-ups →
          </Link>
        </div>
      </div>
    </section>
  );
}

function CommunityBand() {
  return (
    <section className={styles.community}>
      <div className="container">
        <div className={styles.communityInner}>
          <div>
            <Heading as="h2" className={styles.communityTitle}>
              Built in the open, on purpose
            </Heading>
            <p className={styles.communityBody}>
              Every doc, every write-up, every line of this site is a public
              commit. Found a gap, a bug, or have a write-up worth sharing?
              Fork it and open a PR — no application, no gatekeeping.
            </p>
          </div>
          <div className={styles.communityButtons}>
            <Link
              className={clsx('button', styles.primaryButton)}
              to="https://github.com/starlox0/onlysecurity">
              View Source
            </Link>
            <Link
              className={clsx('button', styles.secondaryButton)}
              to="https://github.com/starlox0/onlysecurity/blob/main/CONTRIBUTING.md">
              How to Contribute
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description="An open-source hub for learning security — and sharing what you know.">
      <CursorGlow />
      <div className={styles.pageContent}>
        <HomepageHeader />
        <main>
          <LearningPath />
          <LiveIntel />
          <BlogPreview />
          <CommunityBand />
        </main>
      </div>
    </Layout>
  );
}
