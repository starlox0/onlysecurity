import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'Learn Security, Free & Open',
    Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <>
        Every topic here — fundamentals, tools, write-ups — is free to read and
        open source. Browse the <code>docs</code> and start wherever you are.
      </>
    ),
  },
  {
    title: 'Built by the Community',
    Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <>
        Found a bug, wrote a CTF write-up, or want to explain a concept better?
        Fork the repo and open a pull request — this site grows with every contributor.
      </>
    ),
  },
  {
    title: 'Share What You Know',
    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: (
      <>
        No gatekeeping. Whether you&apos;re just starting out or deep into
        research, your notes and guides can help the next person learn faster.
      </>
    ),
  },
];

function Feature({Svg, title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
