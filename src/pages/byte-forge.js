import React from 'react';
import ByteForge from '@site/src/components/ByteForge';
import Layout from '@theme/Layout';
import styles from './byte-forge.module.css';

export default function ByteForgePage() {
  return (
    <Layout
      title="Byte Forge"
      description="A recipe-based encode/decode/hash workbench: chain operations like Base64, Hex, URL, JWT decode, and hash identification, entirely in your browser.">
      <div className={styles.wrapper}>
        <div className="container">
          <div className={styles.header}>
            <span className={styles.eyebrow}>OS-ADV · Runs Entirely In Your Browser</span>
            <h1 className={styles.title}>Byte Forge</h1>
            <p className={styles.subtitle}>
              Drag operations into a recipe and chain them — decode a JWT, then re-encode it,
              then hash the result, all in one pipeline. Nothing you paste here ever leaves
              your browser: no server, no logging, no network request.
            </p>
          </div>
          <ByteForge />
        </div>
      </div>
    </Layout>
  );
}
