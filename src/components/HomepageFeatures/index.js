import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

const FeatureList = [
  {
    hash: '7f3a2c1',
    tag: 'DOCS',
    tagClass: 'tagBlue',
    title: 'Learn security, free and open',
    description:
      'Every topic here — fundamentals, tools, write-ups — is free to read and open source. Browse the docs and start wherever you are.',
  },
  {
    hash: 'b18e04d',
    tag: 'COMMUNITY',
    tagClass: 'tagAmber',
    title: 'Built by the community',
    description:
      'Found a bug, wrote a CTF write-up, or want to explain a concept better? Fork the repo and open a pull request — this site grows with every contributor.',
  },
  {
    hash: 'a9c221f',
    tag: 'YOU',
    tagClass: 'tagGreen',
    title: 'Share what you know',
    description:
      'No gatekeeping. Whether you\'re just starting out or deep into research, your notes and guides can help the next person learn faster.',
  },
];

function Feature({hash, tag, tagClass, title, description}) {
  return (
    <div className={clsx('col col--4', styles.commitCard)}>
      <div className={styles.commitMeta}>
        <span className={styles.hash}>{hash}</span>
        <span className={clsx(styles.tag, styles[tagClass])}>{tag}</span>
      </div>
      <Heading as="h3" className={styles.commitTitle}>
        {title}
      </Heading>
      <p className={styles.commitDesc}>{description}</p>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <p className={styles.logHeader}>$ git log --oneline -3</p>
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
