import React from 'react';
import CommandPalette from '@site/src/components/CommandPalette';

// Docusaurus renders whatever is at src/theme/Root.js around the entire
// app, on every page — the supported way to add something global (like a
// command palette) without ejecting or touching the real page layout.
export default function Root({children}) {
  return (
    <>
      {children}
      <CommandPalette />
    </>
  );
}
