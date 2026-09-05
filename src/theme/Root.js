import React from 'react';
import CommandPalette from '@site/src/components/CommandPalette';

// Docusaurus renders whatever is at src/theme/Root.js around the entire
// app, on every page — the supported way to add something global (like a
// command palette) without ejecting or touching the real page layout.
// The notification bell lives in the navbar instead (see
// src/theme/NavbarItem/ComponentTypes.js), not here.
export default function Root({children}) {
  return (
    <>
      {children}
      <CommandPalette />
    </>
  );
}
